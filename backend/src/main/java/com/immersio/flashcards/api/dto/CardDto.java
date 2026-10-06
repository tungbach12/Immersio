package com.immersio.flashcards.api.dto;
import java.time.Instant; import java.util.UUID;
public record CardDto(UUID id, UUID deckId, String front, String back, String explanation, String tag, int repetitions, double easinessFactor, int intervalDays, Instant nextReviewDate, Instant lastReviewedAt) {}
