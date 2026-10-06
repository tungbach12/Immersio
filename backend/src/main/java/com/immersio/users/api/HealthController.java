package com.immersio.users.api;

import com.immersio.shared.dto.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Liveness/readiness endpoint for deploys and probes. Replaces the .NET
 * `/api/health` route documented in DEPLOYMENT.md (nginx proxies /api/* here).
 */
@RestController
public class HealthController {

    @GetMapping("/api/health")
    public ApiResponse<Map<String, Object>> health() {
        return ApiResponse.successResult(Map.of(
                "status", "UP",
                "service", "immersio-backend",
                "timestamp", Instant.now().toString()));
    }
}
