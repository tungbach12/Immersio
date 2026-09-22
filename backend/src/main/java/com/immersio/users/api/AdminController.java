package com.immersio.users.api;

import com.immersio.shared.dto.ApiResponse;
import com.immersio.users.api.dto.AdminDashboardStatsDto;
import com.immersio.users.api.dto.UpdateSubscriptionRequest;
import com.immersio.users.api.dto.UserDto;
import com.immersio.users.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/stats")
    public ApiResponse<AdminDashboardStatsDto> stats() {
        return ApiResponse.successResult(adminService.getStats());
    }

    @GetMapping("/users")
    public ApiResponse<List<UserDto>> users() {
        return ApiResponse.successResult(adminService.getUsers());
    }

    @PostMapping("/users/{userId}/subscription")
    public ApiResponse<UserDto> updateSubscription(@PathVariable UUID userId,
                                                   @Valid @RequestBody UpdateSubscriptionRequest request) {
        return ApiResponse.successResult(adminService.updateUserSubscription(userId, request.tier(), request.durationDays()));
    }

    @PostMapping("/users/{userId}/ban")
    public ApiResponse<Void> banUser(@PathVariable UUID userId) {
        adminService.banUser(userId);
        return ApiResponse.successResult(null, "User banned successfully");
    }

    @GetMapping("/ai-tuning")
    public ApiResponse<Map<String, String>> getSettings() {
        return ApiResponse.successResult(adminService.getSettings());
    }

    @PostMapping("/ai-tuning")
    public ApiResponse<Map<String, String>> saveSettings(@RequestBody Map<String, String> settings) {
        return ApiResponse.successResult(adminService.saveSettings(settings));
    }
}
