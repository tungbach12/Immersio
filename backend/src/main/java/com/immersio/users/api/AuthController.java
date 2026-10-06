package com.immersio.users.api;

import com.immersio.shared.dto.ApiResponse;
import com.immersio.shared.security.JwtTokenProvider;
import com.immersio.users.api.dto.AuthResponse;
import com.immersio.users.api.dto.ForgotPasswordRequest;
import com.immersio.users.api.dto.GoogleAuthRequest;
import com.immersio.users.api.dto.LoginRequest;
import com.immersio.users.api.dto.RefreshTokenRequest;
import com.immersio.users.api.dto.RegisterRequest;
import com.immersio.users.api.dto.ResetPasswordRequest;
import com.immersio.users.api.dto.UpdateAvatarRequest;
import com.immersio.users.api.dto.UpdateSettingsRequest;
import com.immersio.users.api.dto.UserDto;
import com.immersio.users.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final String BEARER_PREFIX = "Bearer ";

    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthController(AuthService authService, JwtTokenProvider jwtTokenProvider) {
        this.authService = authService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.successResult(authService.register(request), "User registered successfully");
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.successResult(authService.login(request), "Login successful");
    }

    @PostMapping("/google")
    public ApiResponse<AuthResponse> loginWithGoogle(@Valid @RequestBody GoogleAuthRequest request) {
        return ApiResponse.successResult(authService.loginWithGoogle(request), "Login successful");
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ApiResponse.successResult(authService.refreshToken(request.refreshToken()), "Token refreshed");
    }

    @PostMapping("/revoke")
    public ApiResponse<Void> revoke(@Valid @RequestBody RefreshTokenRequest request) {
        authService.revokeToken(request.refreshToken());
        return ApiResponse.successResult(null, "Token revoked");
    }

    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.email());
        return ApiResponse.successResult(null, "Reset instructions processed");
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ApiResponse.successResult(null, "Password reset successfully");
    }

    @GetMapping("/me")
    public ApiResponse<UserDto> me(@RequestHeader("Authorization") String authHeader) {
        return ApiResponse.successResult(authService.getMe(userId(authHeader)));
    }

    @PostMapping("/settings")
    public ApiResponse<UserDto> updateSettings(@RequestHeader("Authorization") String authHeader,
                                               @RequestBody UpdateSettingsRequest request) {
        return ApiResponse.successResult(authService.updateSettings(userId(authHeader), request));
    }

    @PatchMapping("/me/avatar")
    public ApiResponse<UserDto> updateAvatar(@RequestHeader("Authorization") String authHeader,
                                             @RequestBody UpdateAvatarRequest request) {
        return ApiResponse.successResult(authService.updateAvatar(userId(authHeader), request.profilePictureUrl()));
    }

    @DeleteMapping("/me")
    public ApiResponse<Void> deleteAccount(@RequestHeader("Authorization") String authHeader) {
        authService.deleteAccount(userId(authHeader));
        return ApiResponse.successResult(null, "Account deleted");
    }

    private UUID userId(String authHeader) {
        String token = authHeader.startsWith(BEARER_PREFIX)
                ? authHeader.substring(BEARER_PREFIX.length()).trim() : authHeader;
        return jwtTokenProvider.extractUserId(token);
    }
}
