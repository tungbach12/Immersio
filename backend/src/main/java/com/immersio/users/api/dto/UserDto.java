package com.immersio.users.api.dto;

import com.immersio.users.domain.User;

import java.time.Instant;
import java.util.UUID;

public record UserDto(UUID id, String username, String email, String role, String subscriptionTier,
                      Instant subscriptionExpiresAt, int streakCount, int experiencePoints,
                      double learningHours, String currentLanguageLevel, boolean notifEmail,
                      boolean notifPush, boolean notifStreak, boolean notifTips, boolean isPublic,
                      String profilePictureUrl, Instant createdAt) {
    public static UserDto from(User user) {
        return new UserDto(user.getId(), user.getUsername(), user.getEmail(), user.getRole(),
                user.getActiveSubscriptionTier(), user.getSubscriptionExpiresAt(), user.getStreakCount(),
                user.getExperiencePoints(), user.getLearningHours(), user.getCurrentLanguageLevel(),
                user.isNotifEmail(), user.isNotifPush(), user.isNotifStreak(), user.isNotifTips(),
                user.isPublic(), user.getProfilePictureUrl(), user.getCreatedAt());
    }
}
