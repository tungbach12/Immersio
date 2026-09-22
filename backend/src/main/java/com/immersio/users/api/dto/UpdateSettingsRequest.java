package com.immersio.users.api.dto;

public record UpdateSettingsRequest(Boolean notifEmail, Boolean notifPush, Boolean notifStreak,
                                    Boolean notifTips, Boolean isPublic) {}
