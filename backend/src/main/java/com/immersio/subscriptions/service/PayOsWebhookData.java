package com.immersio.subscriptions.service;

/**
 * Verified PayOS webhook payload (port of .NET {@code PayOsWebhookData}).
 *
 * <p>{@code code} is the transaction code carried in the webhook {@code data.code} field —
 * {@code "00"} means the payment succeeded.</p>
 */
public record PayOsWebhookData(long orderCode, String code, long amount, String description) {
}
