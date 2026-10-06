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
@Table(name = "\"SystemSettings\"")
public class SystemSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "\"Id\"", nullable = false)
    private UUID id;

    @Column(name = "\"Key\"", nullable = false, unique = true, columnDefinition = "TEXT")
    private String key;

    @Column(name = "\"Value\"", nullable = false, columnDefinition = "TEXT")
    private String value;

    @Column(name = "\"UpdatedAt\"", nullable = false)
    private Instant updatedAt = Instant.now();

    protected SystemSetting() {
    }

    public SystemSetting(String key, String value) {
        if (key == null || key.isBlank()) throw new IllegalArgumentException("Key cannot be empty.");
        this.key = key;
        this.value = value == null ? "" : value;
    }

    public UUID getId() { return id; }
    public String getKey() { return key; }
    public String getValue() { return value; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void update(String value) {
        this.value = value == null ? "" : value;
        updatedAt = Instant.now();
    }
}
