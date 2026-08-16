using Immersio.Application.Common;
using Immersio.Application.DTOs.Payment;
using Immersio.Application.Interfaces;
using Immersio.Domain.Entities;
using Immersio.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Immersio.Application.Services
{
    public class SubscriptionService : ISubscriptionService
    {
        private readonly IApplicationDbContext _context;
        private readonly IPayOsService _payOsService;
        private readonly IEmailService _emailService;

        public SubscriptionService(
            IApplicationDbContext context,
            IPayOsService payOsService,
            IEmailService emailService)
        {
            _context = context;
            _payOsService = payOsService;
            _emailService = emailService;
        }

        public async Task<string> CreatePaymentUrlAsync(Guid userId, string tier, string billingCycle, string? overrideReturnUrl = null, string? overrideCancelUrl = null, CancellationToken cancellationToken = default)
        {
            var normalizedTier = NormalizeTier(tier);
            var normalizedCycle = NormalizeCycle(billingCycle);

            var amount = GetAmount(normalizedTier, normalizedCycle);
            if (amount <= 0)
                throw new ConflictException($"Gói '{tier}' không hợp lệ để thanh toán.");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            if (user is null)
                throw new NotFoundException("User", userId);

            // Idempotency guard (2026-08-16): prevent duplicate payment links from
            // double-clicks / refresh. If the user already holds an active
            // subscription for the same tier that isn't about to expire, refuse to
            // create another transaction instead of silently duplicating rows.
            if (user.SubscriptionExpiresAt is { } expires
                && expires > DateTime.UtcNow.AddDays(1)
                && string.Equals(user.SubscriptionTier, normalizedTier, StringComparison.OrdinalIgnoreCase))
            {
                throw new ConflictException(
                    "Bạn đã có gói hoạt động còn hiệu lực. Vui lòng đợi hết hạn hoặc chọn gói khác.");
            }

            // PayOS orderCode must be a unique number.
            var orderCode = DateTimeOffset.UtcNow.ToUnixTimeSeconds() * 1000 + Random.Shared.Next(0, 1000);

            var transaction = new PaymentTransaction(orderCode.ToString(), userId, normalizedTier, normalizedCycle, amount);
            _context.PaymentTransactions.Add(transaction);
            await _context.SaveChangesAsync(cancellationToken);

            // PayOS description is limited to 25 characters.
            var description = $"IMMERSIO {normalizedTier}";

            return await _payOsService.CreatePaymentLinkAsync(orderCode, (int)amount, description, overrideReturnUrl, overrideCancelUrl, cancellationToken);
        }

        public async Task<PaymentReturnResult> HandlePaymentReturnAsync(long orderCode, CancellationToken cancellationToken = default)
        {
            var transaction = await _context.PaymentTransactions
                .FirstOrDefaultAsync(t => t.TxnRef == orderCode.ToString(), cancellationToken);

            if (transaction is null)
                return new PaymentReturnResult(false, "Không tìm thấy đơn hàng.", null, null, 0);

            // Idempotent: already processed.
            if (transaction.IsPaid)
                return new PaymentReturnResult(true, "Giao dịch đã được xác nhận trước đó.", transaction.Tier, transaction.BillingCycle, transaction.Amount);

            // Verify the authoritative status directly from PayOS (never trust the return query).
            var status = await _payOsService.GetPaymentStatusAsync(orderCode, cancellationToken);

            if (status.Status != "PAID")
            {
                if (status.Status is "CANCELLED" or "EXPIRED")
                {
                    transaction.MarkFailed(status.Status);
                    await _context.SaveChangesAsync(cancellationToken);
                }
                var message = status.Status == "PENDING"
                    ? "Chưa nhận được thanh toán. Vui lòng hoàn tất chuyển khoản."
                    : "Thanh toán không thành công hoặc đã bị hủy.";
                return new PaymentReturnResult(false, message, transaction.Tier, transaction.BillingCycle, transaction.Amount);
            }

            if (status.AmountPaid < transaction.Amount)
                return new PaymentReturnResult(false, "Số tiền thanh toán chưa đủ.", transaction.Tier, transaction.BillingCycle, transaction.Amount);

            await CompletePaidTransactionAsync(transaction, orderCode.ToString(), status.Status, cancellationToken);

            return new PaymentReturnResult(true, "Thanh toán thành công.", transaction.Tier, transaction.BillingCycle, transaction.Amount);
        }

        /// <summary>
        /// Handles an incoming PayOS webhook/IPN notification. This is the reliable
        /// path that marks a transaction Paid even when the user never returns to the
        /// returnUrl (closes the tab), which previously left valid payments stuck as
        /// Pending until an admin approved them manually.
        /// </summary>
        public async Task<bool> HandlePayOsWebhookAsync(string rawBody, CancellationToken cancellationToken = default)
        {
            var data = await _payOsService.VerifyWebhookAsync(rawBody, cancellationToken);

            var transaction = await _context.PaymentTransactions
                .FirstOrDefaultAsync(t => t.TxnRef == data.OrderCode.ToString(), cancellationToken);

            if (transaction is null)
                return false; // Unknown order — PayOS retries don't need a failure here.

            // Idempotent: already processed.
            if (transaction.IsPaid)
                return true;

            // PayOS webhook signals a successful payment with transaction code "00".
            if (!string.Equals(data.Status, "00", StringComparison.Ordinal))
                return true; // Not a payment success notification; nothing to do.

            if (data.Amount < transaction.Amount)
                return true; // Underpaid — leave Pending, return response says it's not marked paid.

            await CompletePaidTransactionAsync(transaction, data.OrderCode.ToString(), data.Status, cancellationToken);
            return true;
        }

        private async Task CompletePaidTransactionAsync(
            PaymentTransaction transaction,
            string vnpTransactionNo,
            string responseCode,
            CancellationToken cancellationToken)
        {
            transaction.MarkPaid(vnpTransactionNo, responseCode);

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == transaction.UserId, cancellationToken);
            if (user is not null)
            {
                var expiresAt = string.Equals(transaction.BillingCycle, "yearly", StringComparison.OrdinalIgnoreCase)
                    ? DateTime.UtcNow.AddYears(1)
                    : DateTime.UtcNow.AddDays(30);

                user.UpdateSubscription(transaction.Tier, expiresAt);
                await _context.SaveChangesAsync(cancellationToken);

                var receipt = EmailTemplates.PaymentConfirmation(user.Username, transaction.Tier, transaction.BillingCycle, expiresAt);
                await TrySendEmailAsync(user.Email, receipt, cancellationToken);
            }
            else
            {
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        private static long GetAmount(string tier, string billingCycle)
        {
            var monthly = tier switch
            {
                "Plus" => 69_000L,
                "Premium" => 199_000L,
                _ => 0L
            };
            if (monthly == 0L)
                return 0L;

            return string.Equals(billingCycle, "yearly", StringComparison.OrdinalIgnoreCase)
                ? (long)Math.Round(monthly * 12 * 0.8)
                : monthly;
        }

        private static string NormalizeTier(string tier)
        {
            if (string.IsNullOrWhiteSpace(tier)) return string.Empty;
            return string.Equals(tier, "Plus", StringComparison.OrdinalIgnoreCase) ? "Plus"
                : string.Equals(tier, "Premium", StringComparison.OrdinalIgnoreCase) ? "Premium"
                : tier;
        }

        private static string NormalizeCycle(string billingCycle) =>
            string.Equals(billingCycle, "yearly", StringComparison.OrdinalIgnoreCase) ? "yearly" : "monthly";

        private async Task TrySendEmailAsync(string toEmail, EmailTemplates.EmailContent content, CancellationToken cancellationToken)
        {
            try
            {
                await _emailService.SendEmailAsync(toEmail, content.Subject, content.HtmlBody, cancellationToken);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Email] Failed to send '{content.Subject}' to {toEmail}: {ex.Message}");
            }
        }
    }
}
