package com.immersio.users.api.dto;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Guards the reset-password request shape against the DEPLOYED SPA contract:
 * it sends {"email","otp","newPassword"} (legacy .NET Otp property). A
 * regression here re-breaks password reset with 400 "Validation failed".
 */
class ResetPasswordRequestTest {

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    @Test
    void bindsDeployedSpaOtpShape() throws Exception {
        ResetPasswordRequest request = MAPPER.readValue(
                "{\"email\":\"a@b.c\",\"otp\":\"123456\",\"newPassword\":\"Secret123!\"}",
                ResetPasswordRequest.class);
        assertThat(request.resolvedCode()).isEqualTo("123456");
        assertThat(request.newPassword()).isEqualTo("Secret123!");
    }

    @Test
    void bindsCodeShape() throws Exception {
        ResetPasswordRequest request = MAPPER.readValue(
                "{\"email\":\"a@b.c\",\"code\":\"654321\",\"newPassword\":\"Secret123!\"}",
                ResetPasswordRequest.class);
        assertThat(request.resolvedCode()).isEqualTo("654321");
    }

    @Test
    void prefersOtpWhenBothPresent() {
        ResetPasswordRequest request = new ResetPasswordRequest("a@b.c", "from-code", "from-otp", "pw");
        assertThat(request.resolvedCode()).isEqualTo("from-otp");
    }

    @Test
    void missingCodeResolvesToEmpty_for_401_not_400() throws Exception {
        ResetPasswordRequest request = MAPPER.readValue(
                "{\"email\":\"a@b.c\",\"newPassword\":\"Secret123!\"}",
                ResetPasswordRequest.class);
        assertThat(request.resolvedCode()).isEmpty();
    }
}
