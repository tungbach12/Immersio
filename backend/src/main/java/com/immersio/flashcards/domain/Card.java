package com.immersio.flashcards.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Entity
@Table(name = "\"Cards\"")
public class Card {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "\"Id\"", nullable = false) private UUID id;
    @Column(name = "\"DeckId\"", nullable = false, insertable = false, updatable = false) private UUID deckId;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "\"DeckId\"", nullable = false) private Deck deck;
    @Column(name = "\"Front\"", nullable = false, length = 1000) private String front;
    @Column(name = "\"Back\"", nullable = false, length = 2000) private String back;
    @Column(name = "\"Explanation\"", length = 4000) private String explanation;
    @Column(name = "\"Tag\"", length = 100) private String tag;
    @Column(name = "\"Repetitions\"", nullable = false) private int repetitions;
    @Column(name = "\"EasinessFactor\"", nullable = false) private double easinessFactor = 2.5;
    @Column(name = "\"IntervalDays\"", nullable = false) private int intervalDays;
    @Column(name = "\"NextReviewDate\"", nullable = false) private Instant nextReviewDate = Instant.now();
    @Column(name = "\"LastReviewedAt\"") private Instant lastReviewedAt;
    @Column(name = "\"CreatedAt\"", nullable = false) private Instant createdAt = Instant.now();
    @Column(name = "\"IsDeleted\"", nullable = false) private boolean isDeleted;
    protected Card() {}
    public Card(Deck deck, String front, String back, String explanation, String tag) {
        this.deck = deck; this.front = front; this.back = back; this.explanation = explanation; this.tag = tag;
    }
    public UUID getId() { return id; } public UUID getDeckId() { return deckId; } public Deck getDeck() { return deck; }
    public String getFront() { return front; } public String getBack() { return back; } public String getExplanation() { return explanation; }
    public String getTag() { return tag; } public int getRepetitions() { return repetitions; } public double getEasinessFactor() { return easinessFactor; }
    public int getIntervalDays() { return intervalDays; } public Instant getNextReviewDate() { return nextReviewDate; }
    public Instant getLastReviewedAt() { return lastReviewedAt; } public Instant getCreatedAt() { return createdAt; } public boolean isDeleted() { return isDeleted; }
    public void review(int quality) {
        if (quality < 0 || quality > 5) throw new IllegalArgumentException("Quality must be between 0 and 5.");
        easinessFactor = Math.max(1.3, easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
        if (quality < 3) { repetitions = 0; intervalDays = 1; }
        else { repetitions++; intervalDays = repetitions == 1 ? 1 : repetitions == 2 ? 6 : (int) Math.round(intervalDays * easinessFactor); }
        lastReviewedAt = Instant.now(); nextReviewDate = lastReviewedAt.plus(intervalDays, ChronoUnit.DAYS);
    }
    public void delete() { isDeleted = true; }
}
