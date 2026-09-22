package com.immersio.flashcards.api.dto;
import java.time.Instant; import java.util.UUID;
public record DeckDto(UUID id, String name, int totalCards, int dueCardsCount, Instant createdAt) {}
