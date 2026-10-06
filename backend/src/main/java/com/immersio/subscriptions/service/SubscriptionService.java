package com.immersio.subscriptions.service;

import com.immersio.shared.email.EmailService;
import com.immersio.shared.email.EmailTemplates;
import com.immersio.shared.exception.ConflictException;
import com.immersio.shared.exception.ResourceNotFoundException;
import com.immersio.subscriptions.api.dto.CreatePaymentRequest;
import com.immersio.subscriptions.api.dto.CreatePaymentResponse;
import com.immersio.subscriptions.api.dto.PaymentReturnResult;
import com.immersio.subscriptions.api.dto.UpgradeSubscriptionRequest;
import com.immersio.subscriptions.domain.PaymentTransaction;
import com.immersio.subscriptions.repository.PaymentTransactionRepository;
import com.immersio.users.domain.User;
import com.immersio.users.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Subscription/payment flows — port of the .NET {@code Immersio.Application.Services.SubscriptionService}.
 *
 * <p>Pricing (server-side, the client never supplies an amount):</p>
 * <ul>
 *   <li>Plus: 69.000đ/month, Premium: 199.000đ/month</li>
 *   <li>yearly: monthly &times; 12 &times; 0.8, rounded</li>
 * </ul>
 *
 * <p>Completed payments send the legacy HTML receipt via {@link EmailService} (fire-and-forget —
 * delivery failures never fail the payment flow, mirroring .NET {@code TrySendEmailAsync}).</p>
 */
@Service
public class SubscriptionService {

    private final PaymentTransactionRepository payments;
    private final UserRepository users;
    private final PayOsService payOs;
    private final EmailService emailService;

    public SubscriptionService(PaymentTransactionRepository payments, UserRepository users, PayOsService payOs,
                               EmailService emailService) {
        this.payments = payments;
        this.users = users;
        this.payOs = payOs;
        this.emailService = emailService;
    }

    /**
     * Creates a pending transaction and returns the real PayOS hosted-checkout URL.
     *
     * <p>Deliberately not transactional: the Pending row must be committed before the PayOS call so a
     * gateway failure still leaves a visible (and admin-approvable) transaction, exactly like the
     * legacy backend whose {@code SaveChangesAsync} committed before {@code CreatePaymentLinkAsync}.</p>
     */
    public CreatePaymentResponse createPaymentUrl(UUID userId, CreatePaymentRequest request) {
        String tier = normalizeTier(request.tier());
        String billingCycle = normalizeCycle(request.billingCycle());

        long amount = getAmount(tier, billingCycle);
        if (amount <= 0) {
            throw new ConflictException("Gói '" + request.tier() + "' không hợp lệ để thanh toán.");
        }

        User user = users.findById(userId).orElseThrow(
                () -> new ResourceNotFoundException("User with key '" + userId + "' was not found."));

        // Idempotency guard: if the user already holds an active subscription for the same tier that
        // isn't about to expire, refuse to create another transaction instead of duplicating rows.
        Instant expiresAt = user.getSubscriptionExpiresAt();
        if (expiresAt != null
                && expiresAt.isAfter(Instant.now().plus(1, ChronoUnit.DAYS))
                && tier.equalsIgnoreCase(user.getSubscriptionTier())) {
            throw new ConflictException(
                    "Bạn đã có gói hoạt động còn hiệu lực. Vui lòng đợi hết hạn hoặc chọn gói khác.");
        }

        // PayOS orderCode must be a unique number.
        long orderCode = Instant.now().getEpochSecond() * 1000 + ThreadLocalRandom.current().nextInt(1000);
        payments.save(new PaymentTransaction(String.valueOf(orderCode), userId, tier, billingCycle, amount));

        // PayOS description is limited to 25 characters.
        String description = "IMMERSIO " + tier;
        String paymentUrl = payOs.createPaymentLink(orderCode, (int) amount, description,
                request.returnUrl(), request.cancelUrl());
        return new CreatePaymentResponse(paymentUrl);
    }

    /**
     * Handles the browser return from PayOS. The query string is never trusted: the authoritative
     * status is re-queried from PayOS before anything is marked Paid.
     */
    @Transactional
    public PaymentReturnResult handlePaymentReturn(long orderCode) {
        PaymentTransaction transaction = payments.findByTxnRef(String.valueOf(orderCode)).orElse(null);
        if (transaction == null) {
            return new PaymentReturnResult(false, "Không tìm thấy đơn hàng.", null, null, 0L);
        }

        // Idempotent: already processed.
        if (transaction.isPaid()) {
            return new PaymentReturnResult(true, "Giao dịch đã được xác nhận trước đó.",
                    transaction.getTier(), transaction.getBillingCycle(), transaction.getAmount());
        }

        PayOsPaymentStatus status = payOs.getPaymentStatus(orderCode);
        if (!"PAID".equals(status.status())) {
            if ("CANCELLED".equals(status.status()) || "EXPIRED".equals(status.status())) {
                transaction.markFailed(status.status());
                payments.save(transaction);
            }
            String message = "PENDING".equals(status.status())
                    ? "Chưa nhận được thanh toán. Vui lòng hoàn tất chuyển khoản."
                    : "Thanh toán không thành công hoặc đã bị hủy.";
            return new PaymentReturnResult(false, message,
                    transaction.getTier(), transaction.getBillingCycle(), transaction.getAmount());
        }

        if (status.amountPaid() < transaction.getAmount()) {
            return new PaymentReturnResult(false, "Số tiền thanh toán chưa đủ.",
                    transaction.getTier(), transaction.getBillingCycle(), transaction.getAmount());
        }

        completePaidTransaction(transaction, String.valueOf(orderCode), status.status());
        return new PaymentReturnResult(true, "Thanh toán thành công.",
                transaction.getTier(), transaction.getBillingCycle(), transaction.getAmount());
    }

    /**
     * Handles an incoming PayOS webhook/IPN notification — the reliable path that marks a transaction
     * Paid even when the user never returns to the returnUrl. Returns {@code false} only for unknown
     * orders so PayOS stops retrying nothing it cannot deliver.
     *
     * @throws IllegalStateException    missing data/signature or a signature mismatch
     * @throws IllegalArgumentException malformed JSON payload
     */
    @Transactional
    public boolean handlePayOsWebhook(String rawBody) {
        PayOsWebhookData data = payOs.verifyWebhook(rawBody);

        PaymentTransaction transaction = payments.findByTxnRef(String.valueOf(data.orderCode())).orElse(null);
        if (transaction == null) {
            return false; // Unknown order — PayOS retries don't need a failure here.
        }

        // Idempotent: already processed.
        if (transaction.isPaid()) {
            return true;
        }

        // PayOS webhook signals a successful payment with transaction code "00".
        if (!"00".equals(data.code())) {
            return true; // Not a payment success notification; nothing to do.
        }

        if (data.amount() < transaction.getAmount()) {
            return true; // Underpaid — leave Pending.
        }

        completePaidTransaction(transaction, String.valueOf(data.orderCode()), data.code());
        return true;
    }

    @Transactional
    public void upgradeSubscription(UUID userId, UpgradeSubscriptionRequest request) {
        User user = users.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        user.updateSubscription(request.tier(), Instant.now().plus(30, ChronoUnit.DAYS));
    }

    private void completePaidTransaction(PaymentTransaction transaction, String transactionNo, String responseCode) {
        transaction.markPaid(transactionNo, responseCode);
        payments.save(transaction);

        User user = users.findById(transaction.getUserId()).orElse(null);
        if (user == null) {
            return;
        }

        Instant now = Instant.now();
        // Legacy behaviour: yearly = +1 year, monthly = +30 days.
        Instant expiresAt = "yearly".equalsIgnoreCase(transaction.getBillingCycle())
                ? now.atZone(ZoneOffset.UTC).plusYears(1).toInstant()
                : now.plus(30, ChronoUnit.DAYS);
        user.updateSubscription(transaction.getTier(), expiresAt);
        users.save(user);
        // Receipt email (.NET parity) — fire-and-forget, never fails the payment flow
        emailService.sendSafe(user.getEmail(), EmailTemplates.paymentConfirmation(
                user.getUsername(), transaction.getTier(), transaction.getBillingCycle(),
                java.time.LocalDate.ofInstant(expiresAt, ZoneOffset.UTC)));
    }

    private static long getAmount(String tier, String billingCycle) {
        long monthly = switch (tier) {
            case "Plus" -> 69_000L;
            case "Premium" -> 199_000L;
            default -> 0L;
        };
        if (monthly == 0L) {
            return 0L;
        }
        return "yearly".equalsIgnoreCase(billingCycle)
                ? Math.round(monthly * 12 * 0.8)
                : monthly;
    }

    private static String normalizeTier(String tier) {
        if (tier == null || tier.isBlank()) {
            return "";
        }
        if ("Plus".equalsIgnoreCase(tier)) {
            return "Plus";
        }
        if ("Premium".equalsIgnoreCase(tier)) {
            return "Premium";
        }
        return tier;
    }

    private static String normalizeCycle(String billingCycle) {
        return "yearly".equalsIgnoreCase(billingCycle) ? "yearly" : "monthly";
    }
}
