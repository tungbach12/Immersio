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
@Table(name = "\"PasswordResetCodes\"")
public class PasswordResetCode {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "\"Id\"", nullable = false)
    private UUID id;

    @Column(name = "\"Email\"", nullable = false, length = 256)
    private String email;

    @Column(name = "\"CodeHash\"", nullable = false, columnDefinition = "TEXT")
    private String codeHash;

    @Column(name = "\"ExpiresAt\"", nullable = false)
    private Instant expiresAt;

    @Column(name = "\"CreatedAt\"", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "\"UsedAt\"")
    private Instant usedAt;

    @Column(name = "\"AttemptCount\"", nullable = false)
    private int attemptCount;

    protected PasswordResetCode() {
    }

    public PasswordResetCode(String email, String codeHash, Instant expiresAt) {
        this.email = email;
        this.codeHash = codeHash;
        this.expiresAt = expiresAt;
    }

    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public String getCodeHash() { return codeHash; }
    public Instant getExpiresAt() { return expiresAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUsedAt() { return usedAt; }
    public int getAttemptCount() { return attemptCount; }
    public boolean isExpired() { return !Instant.now().isBefore(expiresAt); }
    public boolean isUsed() { return usedAt != null; }
    public boolean isActive() { return !isUsed() && !isExpired(); }

    public void markUsed() { usedAt = Instant.now(); }
    public void registerAttempt() { attemptCount++; }
}
