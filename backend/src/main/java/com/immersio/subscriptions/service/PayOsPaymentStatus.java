package com.immersio.subscriptions.service;

/** Authoritative payment status returned by the PayOS query API (port of .NET {@code PayOsPaymentStatus}). */
public record PayOsPaymentStatus(String status, long amountPaid) {
}
