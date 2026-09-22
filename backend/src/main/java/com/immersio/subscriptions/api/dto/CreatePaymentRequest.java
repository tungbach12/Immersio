package com.immersio.subscriptions.api.dto;

public record CreatePaymentRequest(String tier, String billingCycle, Long amount, String returnUrl, String cancelUrl) {
    public long resolvedAmount() {
        if (amount != null) return amount;
        return switch (tier == null ? "" : tier) {
            case "Pro" -> 199000L;
            case "Premium" -> 399000L;
            default -> 99000L;
        };
    }
}
