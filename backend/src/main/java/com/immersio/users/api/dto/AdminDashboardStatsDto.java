package com.immersio.users.api.dto;

import java.util.List;

/**
 * Payload for {@code GET /api/admin/stats}.
 *
 * <p>{@code growthData} / {@code sessionData} back the admin dashboard's two
 * charts. The .NET -> Java migration dropped them, which left both charts
 * rendering empty; they are derived from {@code Users."CreatedAt"} and
 * {@code ScenarioSessions."StartedAt"}.
 */
public record AdminDashboardStatsDto(long totalUsers, long activeSubscriptions, long totalRevenueVnd,
                                     long totalScenarios, long totalCards,
                                     List<GrowthPoint> growthData, List<SessionPoint> sessionData) {

    /** One day of learner signups. */
    public record GrowthPoint(String name, long users) {}

    /** One day of practice sessions. */
    public record SessionPoint(String name, long sessions) {}
}