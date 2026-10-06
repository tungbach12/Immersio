package com.immersio.subscriptions.api;

import com.immersio.shared.dto.ApiResponse;
import com.immersio.shared.exception.UnauthorizedException;
import com.immersio.shared.security.JwtTokenProvider;
import com.immersio.subscriptions.api.dto.CreatePaymentRequest;
import com.immersio.subscriptions.api.dto.CreatePaymentResponse;
import com.immersio.subscriptions.api.dto.PaymentReturnResult;
import com.immersio.subscriptions.api.dto.UpgradeSubscriptionRequest;
import com.immersio.subscriptions.service.SubscriptionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Subscription endpoints — port of the .NET {@code SubscriptionController}.
 *
 * <p>{@code GET /payos-return} and {@code POST /payos-webhook} are anonymous (see the permit-list in
 * {@code SecurityConfig}): the SPA has no session when the browser lands on the return URL, and PayOS
 * calls the webhook directly.</p>
 */
@RestController
@RequestMapping("/api/subscription")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final JwtTokenProvider jwtTokenProvider;

    public SubscriptionController(SubscriptionService subscriptionService, JwtTokenProvider jwtTokenProvider) {
        this.subscriptionService = subscriptionService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @PostMapping("/upgrade")
    public ApiResponse<Void> upgrade(@RequestHeader("Authorization") String authorization,
                                     @RequestBody UpgradeSubscriptionRequest request) {
        subscriptionService.upgradeSubscription(userId(authorization), request);
        return ApiResponse.successResult(null);
    }

    @PostMapping("/create-payment")
    public ApiResponse<CreatePaymentResponse> createPayment(@RequestHeader("Authorization") String authorization,
                                                            @RequestBody CreatePaymentRequest request) {
        return ApiResponse.successResult(subscriptionService.createPaymentUrl(userId(authorization), request));
    }

    /**
     * Browser return from PayOS. Failures are reported with HTTP 400 + the failure envelope so the SPA
     * can show {@code data.message} exactly like the legacy backend did.
     */
    @GetMapping("/payos-return")
    public ResponseEntity<ApiResponse<PaymentReturnResult>> payOsReturn(@RequestParam("orderCode") long orderCode) {
        PaymentReturnResult result = subscriptionService.handlePaymentReturn(orderCode);
        if (!result.success()) {
            return ResponseEntity.badRequest().body(ApiResponse.failureResult(result.message()));
        }
        return ResponseEntity.ok(ApiResponse.successResult(result));
    }

    /**
     * PayOS webhook/IPN receiver. Always answers 200 so PayOS stops retrying; the service layer
     * verifies the HMAC signature before acting. Invalid signatures/bodies are acknowledged without
     * processing, mirroring the legacy backend.
     */
    @PostMapping("/payos-webhook")
    public ResponseEntity<ApiResponse<String>> payOsWebhook(@RequestBody(required = false) String rawBody) {
        try {
            subscriptionService.handlePayOsWebhook(rawBody);
        } catch (IllegalStateException | IllegalArgumentException ex) {
            // Invalid signature / malformed body: acknowledge without processing.
            return ResponseEntity.ok(ApiResponse.failureResult("Invalid webhook payload."));
        }
        return ResponseEntity.ok(ApiResponse.successResult("OK"));
    }

    private UUID userId(String authorization) {
        if (authorization == null || authorization.isBlank()) {
            throw new UnauthorizedException("Invalid user identity.");
        }
        return jwtTokenProvider.extractUserId(authorization.replace("Bearer ", ""));
    }
}
