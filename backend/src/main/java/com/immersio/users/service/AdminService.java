package com.immersio.users.service;

import com.immersio.shared.exception.ResourceNotFoundException;
import com.immersio.users.api.dto.AdminDashboardStatsDto;
import com.immersio.users.api.dto.UserDto;
import com.immersio.users.domain.SystemSetting;
import com.immersio.users.domain.User;
import com.immersio.users.repository.SystemSettingRepository;
import com.immersio.users.repository.UserRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AdminService {
    private final UserRepository userRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final JdbcTemplate jdbcTemplate;

    public AdminService(UserRepository userRepository, SystemSettingRepository systemSettingRepository,
                        JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.systemSettingRepository = systemSettingRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public AdminDashboardStatsDto getStats() {
        long scenarios = count("select count(*) from \"Scenarios\" where \"IsDeleted\" = false");
        long cards = count("select count(*) from \"Cards\" where \"IsDeleted\" = false");
        long revenue = count("select coalesce(sum(\"Amount\"), 0) from \"PaymentTransactions\" where \"Status\" = 'Paid'");
        return new AdminDashboardStatsDto(userRepository.countByIsDeletedFalse(),
                userRepository.countActiveSubscriptions(Instant.now()), revenue, scenarios, cards);
    }

    @Transactional(readOnly = true)
    public List<UserDto> getUsers() {
        return userRepository.findAllByIsDeletedFalse().stream().map(UserDto::from).toList();
    }

    @Transactional
    public UserDto updateUserSubscription(UUID userId, String tier, int days) {
        User user = findUser(userId);
        user.updateSubscription(tier, days == 0 ? null : Instant.now().plus(days, ChronoUnit.DAYS));
        return UserDto.from(userRepository.save(user));
    }

    @Transactional
    public void banUser(UUID userId) {
        User user = findUser(userId);
        user.softDelete();
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public Map<String, String> getSettings() {
        Map<String, String> settings = new LinkedHashMap<>();
        systemSettingRepository.findAll().forEach(setting -> settings.put(setting.getKey(), setting.getValue()));
        return settings;
    }

    @Transactional
    public Map<String, String> saveSettings(Map<String, String> settings) {
        settings.forEach((key, value) -> systemSettingRepository.findByKey(key)
                .ifPresentOrElse(setting -> setting.update(value),
                        () -> systemSettingRepository.save(new SystemSetting(key, value))));
        return getSettings();
    }

    private User findUser(UUID id) {
        return userRepository.findById(id).filter(user -> !user.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
    }

    private long count(String sql) { return jdbcTemplate.queryForObject(sql, Long.class); }
}
