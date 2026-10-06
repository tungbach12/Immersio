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
@Table(name = "\"Users\"")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "\"Id\"", nullable = false)
    private UUID id;

    @Column(name = "\"Username\"", nullable = false, unique = true, length = 100)
    private String username;

    @Column(name = "\"Email\"", nullable = false, unique = true, length = 256)
    private String email;

    @Column(name = "\"PasswordHash\"", nullable = false, columnDefinition = "TEXT")
    private String passwordHash;

    @Column(name = "\"Role\"", nullable = false)
    private String role = "Student";

    @Column(name = "\"SubscriptionTier\"", nullable = false, length = 50)
    private String subscriptionTier = "Basic";

    @Column(name = "\"SubscriptionExpiresAt\"")
    private Instant subscriptionExpiresAt;

    @Column(name = "\"StreakCount\"", nullable = false)
    private int streakCount;

    @Column(name = "\"ExperiencePoints\"", nullable = false)
    private int experiencePoints;

    @Column(name = "\"LearningHours\"", nullable = false)
    private double learningHours;

    @Column(name = "\"CurrentLanguageLevel\"", nullable = false, length = 100)
    private String currentLanguageLevel = "Unassigned";

    @Column(name = "\"NotifEmail\"", nullable = false)
    private boolean notifEmail = true;

    @Column(name = "\"NotifPush\"", nullable = false)
    private boolean notifPush = true;

    @Column(name = "\"NotifStreak\"", nullable = false)
    private boolean notifStreak = true;

    @Column(name = "\"NotifTips\"", nullable = false)
    private boolean notifTips = true;

    @Column(name = "\"IsPublic\"", nullable = false)
    private boolean isPublic = true;

    @Column(name = "\"ProfilePictureUrl\"", columnDefinition = "TEXT")
    private String profilePictureUrl;

    @Column(name = "\"CreatedAt\"", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "\"UpdatedAt\"")
    private Instant updatedAt;

    @Column(name = "\"IsDeleted\"", nullable = false)
    private boolean isDeleted;

    protected User() {
    }

    public User(String username, String email, String passwordHash) {
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
    }

    public UUID getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public String getRole() { return role; }
    public String getSubscriptionTier() { return subscriptionTier; }
    public Instant getSubscriptionExpiresAt() { return subscriptionExpiresAt; }
    public int getStreakCount() { return streakCount; }
    public int getExperiencePoints() { return experiencePoints; }
    public double getLearningHours() { return learningHours; }
    public String getCurrentLanguageLevel() { return currentLanguageLevel; }
    public boolean isNotifEmail() { return notifEmail; }
    public boolean isNotifPush() { return notifPush; }
    public boolean isNotifStreak() { return notifStreak; }
    public boolean isNotifTips() { return notifTips; }
    public boolean isPublic() { return isPublic; }
    public String getProfilePictureUrl() { return profilePictureUrl; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public boolean isDeleted() { return isDeleted; }

    public String getActiveSubscriptionTier() {
        return subscriptionExpiresAt == null || subscriptionExpiresAt.isAfter(Instant.now())
                ? subscriptionTier
                : "Basic";
    }

    public void anonymize() {
        String idPart = id == null ? UUID.randomUUID().toString().replace("-", "") : id.toString().replace("-", "");
        username = "Deleted User " + idPart.substring(0, Math.min(12, idPart.length()));
        email = "deleted_" + idPart + "@deleted.invalid";
        passwordHash = "";
        profilePictureUrl = null;
        isPublic = false;
        notifEmail = false;
        notifPush = false;
        notifStreak = false;
        notifTips = false;
        isDeleted = true;
        touch();
    }

    public void softDelete() {
        isDeleted = true;
        touch();
    }

    public void restore() {
        isDeleted = false;
        touch();
    }

    public void updateSubscription(String tier, Instant expiresAt) {
        if (tier == null || tier.isBlank()) return;
        subscriptionTier = tier;
        subscriptionExpiresAt = expiresAt;
        touch();
    }

    public void setRole(String role) {
        if (role == null || role.isBlank()) return;
        this.role = role;
        touch();
    }

    public void addExperience(int experience) {
        if (experience < 0) return;
        experiencePoints += experience;
        touch();
    }

    public void incrementStreak() {
        streakCount++;
        touch();
    }

    public void addLearningHours(double hours) {
        if (hours < 0) return;
        learningHours += hours;
        touch();
    }

    public void updateNotificationSettings(boolean email, boolean push, boolean streak, boolean tips) {
        notifEmail = email;
        notifPush = push;
        notifStreak = streak;
        notifTips = tips;
        touch();
    }

    public void updateSettings(boolean email, boolean push, boolean streak, boolean tips, boolean publicProfile) {
        updateNotificationSettings(email, push, streak, tips);
        isPublic = publicProfile;
        touch();
    }

    public void updateProfilePicture(String url) {
        profilePictureUrl = url;
        touch();
    }

    /** Port of .NET User.SetLanguageLevel (called after CEFR analysis). */
    public void setLanguageLevel(String level) {
        if (level == null || level.isBlank()) return;
        currentLanguageLevel = level;
        touch();
    }

    public void resetPassword(String newPasswordHash) {
        if (newPasswordHash == null || newPasswordHash.isBlank()) return;
        passwordHash = newPasswordHash;
        touch();
    }

    private void touch() {
        updatedAt = Instant.now();
    }
}
