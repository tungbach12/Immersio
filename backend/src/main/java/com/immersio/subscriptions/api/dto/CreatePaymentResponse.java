package com.immersio.subscriptions.api.dto;

/** Port of .NET {@code CreatePaymentResponse}: the hosted PayOS checkout URL the SPA redirects to. */
public record CreatePaymentResponse(String paymentUrl) {
}
