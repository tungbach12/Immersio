package com.immersio.users.api.dto;

public record AdminDashboardStatsDto(long totalUsers, long activeSubscriptions, long totalRevenueVnd,
                                     long totalScenarios, long totalCards) {}
