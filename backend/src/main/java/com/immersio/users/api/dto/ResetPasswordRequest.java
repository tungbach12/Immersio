package com.immersio.users.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Reset-password payload (POST /api/auth/reset-password).
 *
 * <p>The deployed SPA sends {@code {"email", "otp", "newPassword"}} (the legacy
 * .NET {@code Otp} property); other clients may send {@code "code"} — both are
 * accepted via {@link #resolvedCode()}. A missing code is rejected with 401
 * "Mã OTP không hợp lệ hoặc đã hết hạn." by the service (the .NET behaviour),
 * not by bean validation.</p>
 */
public record ResetPasswordRequest(@NotBlank @Email String email, String code, String otp,
                                   @NotBlank String newPassword) {

    /** Whichever OTP property the client actually populated. */
    public String resolvedCode() {
        if (otp != null && !otp.isBlank()) return otp.trim();
        if (code != null && !code.isBlank()) return code.trim();
        return "";
    }
}
