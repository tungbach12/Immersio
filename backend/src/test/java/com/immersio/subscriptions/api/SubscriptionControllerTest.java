package com.immersio.subscriptions.api;

import com.immersio.shared.exception.ConflictException;
import com.immersio.shared.exception.GlobalExceptionHandler;
import com.immersio.shared.security.JwtTokenProvider;
import com.immersio.subscriptions.api.dto.CreatePaymentRequest;
import com.immersio.subscriptions.api.dto.CreatePaymentResponse;
import com.immersio.subscriptions.api.dto.PaymentReturnResult;
import com.immersio.subscriptions.service.SubscriptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.http.converter.json.JacksonJsonHttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.UUID;

import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * HTTP contract tests for the payment endpoints — the envelope shapes are exactly what
 * {@code immersioFe/src/services/subscription.ts} parses.
 */
class SubscriptionControllerTest {

    private static final UUID USER_ID = UUID.fromString("6f0a5f9e-1111-2222-3333-444455556666");
    private static final long ORDER_CODE = 1726100000001L;

    private SubscriptionService subscriptionService;
    private JwtTokenProvider jwtTokenProvider;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        subscriptionService = mock(SubscriptionService.class);
        jwtTokenProvider = mock(JwtTokenProvider.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new SubscriptionController(subscriptionService, jwtTokenProvider))
                .setControllerAdvice(new GlobalExceptionHandler())
                // String first so the webhook body stays the raw JSON payload.
                .setMessageConverters(new StringHttpMessageConverter(), new JacksonJsonHttpMessageConverter())
                .build();
    }

    @Test
    void payOsReturnReturnsSuccessEnvelope() throws Exception {
        when(subscriptionService.handlePaymentReturn(ORDER_CODE))
                .thenReturn(new PaymentReturnResult(true, "Thanh toán thành công.", "Plus", "monthly", 69_000L));

        mockMvc.perform(get("/api/subscription/payos-return").param("orderCode", String.valueOf(ORDER_CODE)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.success").value(true))
                .andExpect(jsonPath("$.data.message").value("Thanh toán thành công."))
                .andExpect(jsonPath("$.data.tier").value("Plus"))
                .andExpect(jsonPath("$.data.billingCycle").value("monthly"))
                .andExpect(jsonPath("$.data.amount").value(69_000));
    }

    @Test
    void payOsReturnReturns400FailureEnvelopeForUnknownOrder() throws Exception {
        when(subscriptionService.handlePaymentReturn(ORDER_CODE))
                .thenReturn(new PaymentReturnResult(false, "Không tìm thấy đơn hàng.", null, null, 0L));

        mockMvc.perform(get("/api/subscription/payos-return").param("orderCode", String.valueOf(ORDER_CODE)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Không tìm thấy đơn hàng."))
                .andExpect(jsonPath("$.data").value(nullValue()));
    }

    @Test
    void payOsWebhookAcknowledgesInvalidPayloadWith200() throws Exception {
        when(subscriptionService.handlePayOsWebhook(any()))
                .thenThrow(new IllegalStateException("PayOS webhook signature mismatch."));

        mockMvc.perform(post("/api/subscription/payos-webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"data\":{\"orderCode\":1},\"signature\":\"bad\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid webhook payload."));
    }

    @Test
    void payOsWebhookAcknowledgesValidPayloadAndForwardsRawBody() throws Exception {
        String rawBody = "{\"code\":\"00\",\"data\":{\"orderCode\":1},\"signature\":\"sig\"}";
        when(subscriptionService.handlePayOsWebhook(any())).thenReturn(true);

        mockMvc.perform(post("/api/subscription/payos-webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(rawBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value("OK"));

        verify(subscriptionService).handlePayOsWebhook(rawBody);
    }

    @Test
    void createPaymentReturnsCheckoutUrlOnly() throws Exception {
        when(jwtTokenProvider.extractUserId("token-1")).thenReturn(USER_ID);
        when(subscriptionService.createPaymentUrl(eq(USER_ID), any(CreatePaymentRequest.class)))
                .thenReturn(new CreatePaymentResponse("https://pay.payos.vn/web/abc"));

        mockMvc.perform(post("/api/subscription/create-payment")
                        .header("Authorization", "Bearer token-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tier\":\"Plus\",\"billingCycle\":\"monthly\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.paymentUrl").value("https://pay.payos.vn/web/abc"))
                .andExpect(jsonPath("$.data.txnRef").doesNotExist());
    }

    @Test
    void createPaymentMapsConflictTo409Envelope() throws Exception {
        when(jwtTokenProvider.extractUserId("token-1")).thenReturn(USER_ID);
        when(subscriptionService.createPaymentUrl(eq(USER_ID), any(CreatePaymentRequest.class)))
                .thenThrow(new ConflictException("Bạn đã có gói hoạt động còn hiệu lực. Vui lòng đợi hết hạn hoặc chọn gói khác."));

        mockMvc.perform(post("/api/subscription/create-payment")
                        .header("Authorization", "Bearer token-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tier\":\"Plus\",\"billingCycle\":\"monthly\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message")
                        .value("Bạn đã có gói hoạt động còn hiệu lực. Vui lòng đợi hết hạn hoặc chọn gói khác."));
    }
}
