package com.immersio.users.service;

import com.immersio.users.api.dto.AdminDashboardStatsDto;
import com.immersio.users.repository.SystemSettingRepository;
import com.immersio.users.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * The admin dashboard's two charts (learner growth, daily conversations) were
 * left unbacked by the .NET -> Java migration: the Java {@code /stats} endpoint
 * never returned {@code growthData} / {@code sessionData}, so Recharts rendered
 * empty. These tests pin the series the charts consume.
 */
class AdminServiceGrowthDataTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final SystemSettingRepository systemSettingRepository = mock(SystemSettingRepository.class);

    /** Mirrors AdminService.CHART_WINDOW_DAYS so the mock matches the real bind argument. */
    private static final int CHART_WINDOW_DAYS = 30;

    private AdminService serviceReturning(List<Map<String, Object>> rows) {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        // growthData()/sessionData() call the (sql, args...) overload
        when(jdbc.queryForList(anyString(), eq(CHART_WINDOW_DAYS))).thenReturn(rows);
        // the scalar counters (scenarios/cards/revenue) go through queryForObject
        when(jdbc.queryForObject(anyString(), eq(Long.class))).thenReturn(0L);
        return new AdminService(userRepository, systemSettingRepository, jdbc);
    }

    private static Map<String, Object> row(String label, long value) {
        return Map.of("day", label, "total", value);
    }

    @Test
    void growthDataIsBuiltFromUserSignupsPerDay() {
        AdminService service = serviceReturning(List.of(
                row("2026-10-09", 3L),
                row("2026-10-10", 5L)));

        AdminDashboardStatsDto stats = service.getStats();

        assertThat(stats.growthData()).isNotNull();
        assertThat(stats.growthData()).hasSize(2);
        assertThat(stats.growthData().get(0).name()).isEqualTo("2026-10-09");
        assertThat(stats.growthData().get(0).users()).isEqualTo(3L);
        assertThat(stats.growthData().get(1).users()).isEqualTo(5L);
    }

    @Test
    void sessionDataIsBuiltFromScenarioSessionsPerDay() {
        AdminService service = serviceReturning(List.of(
                row("2026-10-09", 2L),
                row("2026-10-10", 7L)));

        AdminDashboardStatsDto stats = service.getStats();

        assertThat(stats.sessionData()).isNotNull();
        assertThat(stats.sessionData()).hasSize(2);
        assertThat(stats.sessionData().get(0).name()).isEqualTo("2026-10-09");
        assertThat(stats.sessionData().get(0).sessions()).isEqualTo(2L);
        assertThat(stats.sessionData().get(1).sessions()).isEqualTo(7L);
    }

    @Test
    void emptySeriesAreEmptyListsNotNull() {
        AdminService service = serviceReturning(List.of());

        AdminDashboardStatsDto stats = service.getStats();

        assertThat(stats.growthData()).isEmpty();
        assertThat(stats.sessionData()).isEmpty();
    }

    @Test
    void statsStillCarryTheScalarCounters() {
        when(userRepository.countByIsDeletedFalse()).thenReturn(128L);
        when(userRepository.countActiveSubscriptions(org.mockito.ArgumentMatchers.any())).thenReturn(17L);
        AdminService service = serviceReturning(List.of());

        AdminDashboardStatsDto stats = service.getStats();

        assertThat(stats.totalUsers()).isEqualTo(128L);
        assertThat(stats.activeSubscriptions()).isEqualTo(17L);
    }
}