package com.immersio.users.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record UpdateSubscriptionRequest(@NotBlank String tier, @Min(0) int durationDays) {}
