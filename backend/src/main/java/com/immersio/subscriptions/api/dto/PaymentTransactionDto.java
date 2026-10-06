package com.immersio.subscriptions.api.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Port of .NET {@code PaymentTransactionDto} (admin transaction list / approve result).
 * Field names are the exact JSON contract of {@code immersioFe/src/services/admin.ts}.
 */
public record PaymentTransactionDto(
        UUID id,
        String txnRef,
        UUID userId,
        String username,
        String email,
        String tier,
        String billingCycle,
        long amount,
        String status,
        Instant createdAt,
        Instant paidAt) {
}
