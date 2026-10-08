package com.immersio.practice.api.dto;

/**
 * Payload for persisting a pronunciation attempt.
 *
 * <p>Field names match what the SPA sends (and what the legacy .NET DTO exposed):
 * {@code phrase} / {@code transcript} / {@code score}. Any other shape reaches this
 * record as all-nulls and previously produced a 500 instead of a 400.
 */
public record CreatePronunciationLogRequest(String phrase, String transcript, int score) {}