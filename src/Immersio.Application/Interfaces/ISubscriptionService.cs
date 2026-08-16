using Immersio.Application.DTOs.Payment;

namespace Immersio.Application.Interfaces
{
    public interface ISubscriptionService
    {
        Task<string> CreatePaymentUrlAsync(Guid userId, string tier, string billingCycle, string? overrideReturnUrl = null, string? overrideCancelUrl = null, CancellationToken cancellationToken = default);

        Task<PaymentReturnResult> HandlePaymentReturnAsync(long orderCode, CancellationToken cancellationToken = default);

        // Verifies and processes an incoming PayOS webhook/IPN notification.
        // Returns true when handled (idempotent for repeats/unknown orders).
        Task<bool> HandlePayOsWebhookAsync(string rawBody, CancellationToken cancellationToken = default);
    }
}
