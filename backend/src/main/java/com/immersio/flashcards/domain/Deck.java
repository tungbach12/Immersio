package com.immersio.flashcards.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "\"Decks\"")
public class Deck {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "\"Id\"", nullable = false) private UUID id;
    @Column(name = "\"Name\"", nullable = false, length = 150) private String name;
    @Column(name = "\"UserId\"", nullable = false) private UUID userId;
    @Column(name = "\"CreatedAt\"", nullable = false) private Instant createdAt = Instant.now();
    @Column(name = "\"IsDeleted\"", nullable = false) private boolean isDeleted;
    @OneToMany(mappedBy = "deck", fetch = FetchType.LAZY) private List<Card> cards = new ArrayList<>();
    protected Deck() {}
    public Deck(String name, UUID userId) { this.name = name; this.userId = userId; }
    public UUID getId() { return id; } public String getName() { return name; } public UUID getUserId() { return userId; }
    public Instant getCreatedAt() { return createdAt; } public boolean isDeleted() { return isDeleted; } public List<Card> getCards() { return cards; }
    public void rename(String name) { if (name != null && !name.isBlank()) this.name = name.trim(); }
    public void delete() { isDeleted = true; }
}
