package com.immersio.subscriptions.api.dto; public record PaymentReturnResult(boolean success, String message, String tier, String billingCycle, Long amount) {}
