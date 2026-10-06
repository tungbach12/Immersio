package com.immersio.subscriptions.service;

import com.immersio.shared.email.EmailService;
import com.immersio.shared.exception.ConflictException;
import com.immersio.shared.exception.ResourceNotFoundException;
import com.immersio.subscriptions.api.dto.CreatePaymentRequest;
import com.immersio.subscriptions.api.dto.CreatePaymentResponse;
import com.immersio.subscriptions.api.dto.PaymentReturnResult;
import com.immersio.subscriptions.domain.PaymentTransaction;
import com.immersio.subscriptions.repository.PaymentTransactionRepository;
import com.immersio.users.domain.User;
import com.immersio.users.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Behavioural tests for the ported payment flows — every message and status mirrors the .NET
 * {@code Immersio.Application.Services.SubscriptionService}.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SubscriptionServiceTest {

    private static final UUID USER_ID = UUID.fromString("6f0a5f9e-1111-2222-3333-444455556666");
    private static final long ORDER_CODE = 1726100000001L;
    private static final String TXN_REF = String.valueOf(ORDER_CODE);

    @Mock
    private PaymentTransactionRepository payments;

    @Mock
    private UserRepository users;

    @Mock
    private PayOsService payOs;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private SubscriptionService service;

    // ---------------------------------------------------------------- create-payment

    @Test
    void createPaymentUrlRejectsUnknownTierWithLegacyMessage() {
        assertThatThrownBy(() -> service.createPaymentUrl(USER_ID,
                new CreatePaymentRequest("Basic", "monthly", null, null)))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Gói 'Basic' không hợp lệ để thanh toán.");
        verify(payments, never()).save(any(PaymentTransaction.class));
    }

    @Test
    void createPaymentUrlFailsWhenUserMissing() {
        when(users.findById(USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.createPaymentUrl(USER_ID,
                new CreatePaymentRequest("Plus", "monthly", null, null)))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User with key '" + USER_ID + "' was not found.");
    }

    @Test
    void createPaymentUrlRejectsDuplicateActiveSubscription() {
        User user = new User("alice", "alice@example.com", "hash");
        user.updateSubscription("Plus", Instant.now().plus(7, ChronoUnit.DAYS));
        when(users.findById(USER_ID)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> service.createPaymentUrl(USER_ID,
                new CreatePaymentRequest("plus", "monthly", null, null)))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Bạn đã có gói hoạt động còn hiệu lực. Vui lòng đợi hết hạn hoặc chọn gói khác.");
        verify(payments, never()).save(any(PaymentTransaction.class));
    }

    @Test
    void createPaymentUrlStoresPendingRowAndReturnsPayOsCheckoutUrl() {
        when(users.findById(USER_ID)).thenReturn(Optional.of(new User("alice", "alice@example.com", "hash")));
        when(payOs.createPaymentLink(anyLong(), eq(69_000), eq("IMMERSIO Plus"), isNull(), isNull()))
                .thenReturn("https://pay.payos.vn/web/abc");

        CreatePaymentResponse response = service.createPaymentUrl(USER_ID,
                new CreatePaymentRequest("plus", "monthly", null, null));

        assertThat(response.paymentUrl()).isEqualTo("https://pay.payos.vn/web/abc");

        ArgumentCaptor<PaymentTransaction> saved = ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(payments).save(saved.capture());
        PaymentTransaction transaction = saved.getValue();
        assertThat(transaction.getTier()).isEqualTo("Plus");
        assertThat(transaction.getBillingCycle()).isEqualTo("monthly");
        assertThat(transaction.getAmount()).isEqualTo(69_000L);
        assertThat(transaction.getStatus()).isEqualTo("Pending");
        assertThat(transaction.getUserId()).isEqualTo(USER_ID);
        assertThat(transaction.getTxnRef()).matches("\\d{10,}");

        ArgumentCaptor<Long> orderCode = ArgumentCaptor.forClass(Long.class);
        verify(payOs).createPaymentLink(orderCode.capture(), eq(69_000), eq("IMMERSIO Plus"),
                isNull(), isNull());
        assertThat(orderCode.getValue()).isEqualTo(Long.parseLong(transaction.getTxnRef()));
    }

    @Test
    void createPaymentUrlComputesYearlyDiscountPrices() {
        when(users.findById(USER_ID)).thenReturn(Optional.of(new User("alice", "alice@example.com", "hash")));
        when(payOs.createPaymentLink(anyLong(), anyInt(), anyString(), isNull(), isNull()))
                .thenReturn("https://pay.payos.vn/web/y");

        service.createPaymentUrl(USER_ID, new CreatePaymentRequest("Plus", "yearly", null, null));
        service.createPaymentUrl(USER_ID, new CreatePaymentRequest("Premium", "yearly", null, null));

        ArgumentCaptor<PaymentTransaction> saved = ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(payments, org.mockito.Mockito.times(2)).save(saved.capture());
        assertThat(saved.getAllValues().get(0).getAmount()).isEqualTo(662_400L);   // 69.000 × 12 × 0.8
        assertThat(saved.getAllValues().get(1).getAmount()).isEqualTo(1_910_400L);  // 199.000 × 12 × 0.8
    }

    // ---------------------------------------------------------------- payos-return

    @Test
    void paymentReturnReportsUnknownOrder() {
        when(payments.findByTxnRef(TXN_REF)).thenReturn(Optional.empty());

        PaymentReturnResult result = service.handlePaymentReturn(ORDER_CODE);

        assertThat(result.success()).isFalse();
        assertThat(result.message()).isEqualTo("Không tìm thấy đơn hàng.");
        assertThat(result.tier()).isNull();
        assertThat(result.billingCycle()).isNull();
        assertThat(result.amount()).isZero();
        verify(payOs, never()).getPaymentStatus(anyLong());
    }

    @Test
    void paymentReturnIsIdempotentForPaidTransaction() {
        PaymentTransaction paid = pendingTransaction();
        paid.markPaid(TXN_REF, "PAID");
        when(payments.findByTxnRef(TXN_REF)).thenReturn(Optional.of(paid));

        PaymentReturnResult result = service.handlePaymentReturn(ORDER_CODE);

        assertThat(result.success()).isTrue();
        assertThat(result.message()).isEqualTo("Giao dịch đã được xác nhận trước đó.");
        assertThat(result.tier()).isEqualTo("Plus");
        assertThat(result.amount()).isEqualTo(69_000L);
        verify(payOs, never()).getPaymentStatus(anyLong());
    }

    @Test
    void paymentReturnKeepsPendingWhenGatewayStillPending() {
        PaymentTransaction transaction = pendingTransaction();
        when(payments.findByTxnRef(TXN_REF)).thenReturn(Optional.of(transaction));
        when(payOs.getPaymentStatus(ORDER_CODE)).thenReturn(new PayOsPaymentStatus("PENDING", 0));

        PaymentReturnResult result = service.handlePaymentReturn(ORDER_CODE);

        assertThat(result.success()).isFalse();
        assertThat(result.message()).isEqualTo("Chưa nhận được thanh toán. Vui lòng hoàn tất chuyển khoản.");
        assertThat(transaction.getStatus()).isEqualTo("Pending");
        assertThat(result.amount()).isEqualTo(69_000L);
    }

    @Test
    void paymentReturnMarksFailedWhenCancelled() {
        PaymentTransaction transaction = pendingTransaction();
        when(payments.findByTxnRef(TXN_REF)).thenReturn(Optional.of(transaction));
        when(payOs.getPaymentStatus(ORDER_CODE)).thenReturn(new PayOsPaymentStatus("CANCELLED", 0));

        PaymentReturnResult result = service.handlePaymentReturn(ORDER_CODE);

        assertThat(result.success()).isFalse();
        assertThat(result.message()).isEqualTo("Thanh toán không thành công hoặc đã bị hủy.");
        assertThat(transaction.getStatus()).isEqualTo("Failed");
        assertThat(transaction.getResponseCode()).isEqualTo("CANCELLED");
    }

    @Test
    void paymentReturnMarksFailedWhenExpired() {
        PaymentTransaction transaction = pendingTransaction();
        when(payments.findByTxnRef(TXN_REF)).thenReturn(Optional.of(transaction));
        when(payOs.getPaymentStatus(ORDER_CODE)).thenReturn(new PayOsPaymentStatus("EXPIRED", 0));

        PaymentReturnResult result = service.handlePaymentReturn(ORDER_CODE);

        assertThat(result.success()).isFalse();
        assertThat(transaction.getStatus()).isEqualTo("Failed");
        assertThat(transaction.getResponseCode()).isEqualTo("EXPIRED");
    }

    @Test
    void paymentReturnRejectsUnderpayment() {
        PaymentTransaction transaction = pendingTransaction();
        when(payments.findByTxnRef(TXN_REF)).thenReturn(Optional.of(transaction));
        when(payOs.getPaymentStatus(ORDER_CODE)).thenReturn(new PayOsPaymentStatus("PAID", 60_000L));

        PaymentReturnResult result = service.handlePaymentReturn(ORDER_CODE);

        assertThat(result.success()).isFalse();
        assertThat(result.message()).isEqualTo("Số tiền thanh toán chưa đủ.");
        assertThat(transaction.getStatus()).isEqualTo("Pending");
        verify(users, never()).findById(any(UUID.class));
    }

    @Test
    void paymentReturnCompletesPaidTransactionAndActivatesSubscription() {
        PaymentTransaction transaction = pendingTransaction();
        User user = new User("alice", "alice@example.com", "hash");
        when(payments.findByTxnRef(TXN_REF)).thenReturn(Optional.of(transaction));
        when(payOs.getPaymentStatus(ORDER_CODE)).thenReturn(new PayOsPaymentStatus("PAID", 69_000L));
        when(users.findById(USER_ID)).thenReturn(Optional.of(user));

        PaymentReturnResult result = service.handlePaymentReturn(ORDER_CODE);

        assertThat(result.success()).isTrue();
        assertThat(result.message()).isEqualTo("Thanh toán thành công.");
        assertThat(transaction.isPaid()).isTrue();
        assertThat(transaction.getVnpTransactionNo()).isEqualTo(TXN_REF);
        assertThat(transaction.getResponseCode()).isEqualTo("PAID");
        assertThat(transaction.getPaidAt()).isNotNull();

        assertThat(user.getSubscriptionTier()).isEqualTo("Plus");
        assertThat(user.getSubscriptionExpiresAt())
                .isBetween(Instant.now().plus(30, ChronoUnit.DAYS).minus(5, ChronoUnit.MINUTES),
                        Instant.now().plus(30, ChronoUnit.DAYS).plus(5, ChronoUnit.MINUTES));
    }

    // ---------------------------------------------------------------- payos-webhook

    @Test
    void webhookIgnoresUnknownOrder() {
        when(payOs.verifyWebhook(any()))
                .thenReturn(new PayOsWebhookData(999L, "00", 69_000L, "IMMERSIO Plus"));
        when(payments.findByTxnRef("999")).thenReturn(Optional.empty());

        assertThat(service.handlePayOsWebhook("{\"data\":{}}")).isFalse();
        verify(users, never()).findById(any(UUID.class));
    }

    @Test
    void webhookIsIdempotentForPaidTransaction() {
        PaymentTransaction paid = pendingTransaction();
        paid.markPaid(TXN_REF, "00");
        when(payOs.verifyWebhook(any())).thenReturn(new PayOsWebhookData(ORDER_CODE, "00", 69_000L, "IMMERSIO Plus"));
        when(payments.findByTxnRef(TXN_REF)).thenReturn(Optional.of(paid));

        assertThat(service.handlePayOsWebhook("{\"data\":{}}")).isTrue();
        verify(users, never()).findById(any(UUID.class));
    }

    @Test
    void webhookIgnoresNonSuccessTransactionCode() {
        PaymentTransaction transaction = pendingTransaction();
        when(payOs.verifyWebhook(any())).thenReturn(new PayOsWebhookData(ORDER_CODE, "01", 69_000L, "IMMERSIO Plus"));
        when(payments.findByTxnRef(TXN_REF)).thenReturn(Optional.of(transaction));

        assertThat(service.handlePayOsWebhook("{\"data\":{}}")).isTrue();
        assertThat(transaction.getStatus()).isEqualTo("Pending");
    }

    @Test
    void webhookIgnoresUnderpayment() {
        PaymentTransaction transaction = pendingTransaction();
        when(payOs.verifyWebhook(any())).thenReturn(new PayOsWebhookData(ORDER_CODE, "00", 1_000L, "IMMERSIO Plus"));
        when(payments.findByTxnRef(TXN_REF)).thenReturn(Optional.of(transaction));

        assertThat(service.handlePayOsWebhook("{\"data\":{}}")).isTrue();
        assertThat(transaction.getStatus()).isEqualTo("Pending");
        verify(users, never()).findById(any(UUID.class));
    }

    @Test
    void webhookCompletesPaidTransactionAndActivatesYearlySubscription() {
        PaymentTransaction transaction = new PaymentTransaction(TXN_REF, USER_ID, "Premium", "yearly", 1_910_400L);
        User user = new User("alice", "alice@example.com", "hash");
        when(payOs.verifyWebhook(any())).thenReturn(
                new PayOsWebhookData(ORDER_CODE, "00", 1_910_400L, "IMMERSIO Premium"));
        when(payments.findByTxnRef(TXN_REF)).thenReturn(Optional.of(transaction));
        when(users.findById(USER_ID)).thenReturn(Optional.of(user));

        assertThat(service.handlePayOsWebhook("{\"data\":{}}")).isTrue();

        assertThat(transaction.isPaid()).isTrue();
        assertThat(transaction.getVnpTransactionNo()).isEqualTo(TXN_REF);
        assertThat(transaction.getResponseCode()).isEqualTo("00");
        assertThat(user.getSubscriptionTier()).isEqualTo("Premium");
        assertThat(user.getSubscriptionExpiresAt())
                .isBetween(Instant.now().plus(365, ChronoUnit.DAYS).minus(5, ChronoUnit.MINUTES),
                        Instant.now().plus(365, ChronoUnit.DAYS).plus(5, ChronoUnit.MINUTES));
    }

    @Test
    void webhookPassesRawBodyToSignatureVerification() {
        String rawBody = "{\"code\":\"00\",\"data\":{\"orderCode\":1},\"signature\":\"abc\"}";
        when(payOs.verifyWebhook(any())).thenReturn(new PayOsWebhookData(999L, "00", 1L, "x"));
        when(payments.findByTxnRef("999")).thenReturn(Optional.empty());

        service.handlePayOsWebhook(rawBody);

        verify(payOs).verifyWebhook(rawBody);
    }

    private static PaymentTransaction pendingTransaction() {
        return new PaymentTransaction(TXN_REF, USER_ID, "Plus", "monthly", 69_000L);
    }
}
