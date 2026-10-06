package com.immersio.subscriptions.api.dto;

/** Port of .NET {@code CreatePaymentRequest}: tier + cycle only — prices are decided server-side. */
public record CreatePaymentRequest(String tier, String billingCycle, String returnUrl, String cancelUrl) {
}
