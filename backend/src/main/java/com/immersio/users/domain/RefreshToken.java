package com.immersio.users.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "\"RefreshTokens\"")
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "\"Id\"", nullable = false)
    private UUID id;

    @Column(name = "\"Token\"", nullable = false, unique = true, length = 512)
    private String token;

    @Column(name = "\"UserId\"", nullable = false)
    private UUID userId;

    @Column(name = "\"ExpiresAt\"", nullable = false)
    private Instant expiresAt;

    @Column(name = "\"CreatedAt\"", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "\"RevokedAt\"")
    private Instant revokedAt;

    protected RefreshToken() {
    }

    public RefreshToken(String token, UUID userId, Instant expiresAt) {
        this.token = token;
        this.userId = userId;
        this.expiresAt = expiresAt;
    }

    public UUID getId() { return id; }
    public String getToken() { return token; }
    public UUID getUserId() { return userId; }
    public Instant getExpiresAt() { return expiresAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getRevokedAt() { return revokedAt; }
    public boolean isExpired() { return !Instant.now().isBefore(expiresAt); }
    public boolean isRevoked() { return revokedAt != null; }
    public boolean isActive() { return !isRevoked() && !isExpired(); }

    public void revoke() {
        if (revokedAt == null) revokedAt = Instant.now();
    }
}
