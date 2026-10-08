package com.immersio.users.api;

import com.immersio.shared.exception.UnauthorizedException;
import com.immersio.shared.security.JwtTokenProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.lang.reflect.Method;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Regression tests for the /api/auth/me 500.
 *
 * <p>{@code /api/auth/**} is {@code permitAll}, so Spring's 401 entry point never
 * runs for these endpoints. {@code AuthController.userId} then dereferenced a null
 * Authorization header and every token-less call to a self-service auth route blew
 * up as "Internal server error" instead of answering 401.
 */
@DisplayName("AuthController.userId token handling")
class AuthControllerUserIdTest {

    /** Mirrors the controller's token extraction contract. */
    private static UUID userId(String authHeader) throws Exception {
        Method method = AuthController.class.getDeclaredMethod("userId", String.class);
        method.setAccessible(true);
        try {
            return (UUID) method.invoke(newStub(), authHeader);
        } catch (java.lang.reflect.InvocationTargetException ex) {
            // Unwrap so assertions see the real exception, not the reflection wrapper.
            throw (Exception) ex.getCause();
        }
    }

    private static JwtTokenProvider provider;

    private static JwtTokenProvider provider() throws Exception {
        if (provider == null) {
            JwtTokenProvider p = new JwtTokenProvider();
            ReflectionTestUtils.setField(p, "secret",
                    "test-secret-key-that-is-at-least-32-bytes-long!!");
            // Without @Value injection this stays 0 and every token is born expired.
            ReflectionTestUtils.setField(p, "expirationMinutes", 15L);
            provider = p;
        }
        return provider;
    }

    private static Object newStub() throws Exception {
        // The controller needs a working provider to validate the happy-path token.
        return AuthController.class.getDeclaredConstructor(
                com.immersio.users.service.AuthService.class, JwtTokenProvider.class)
                .newInstance(null, provider());
    }

    @Test
    @DisplayName("a valid bearer token resolves to its user id")
    void validTokenResolves() throws Exception {
        UUID userId = UUID.randomUUID();
        String token = provider().generateToken(userId, "probe@immersio.local", "Student");

        assertThat(userId("Bearer " + token)).isEqualTo(userId);
    }

    @Test
    @DisplayName("a missing Authorization header raises Unauthorized (401), not a 500")
    void missingHeaderIsUnauthorized() {
        assertThatThrownBy(() -> userId(null))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    @DisplayName("a blank Authorization header raises Unauthorized (401), not a 500")
    void blankHeaderIsUnauthorized() {
        assertThatThrownBy(() -> userId("   "))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    @DisplayName("a malformed token raises Unauthorized (401), not a 500")
    void malformedTokenIsUnauthorized() {
        assertThatThrownBy(() -> userId("Bearer garbage"))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    @DisplayName("UnauthorizedException carries a client-safe message")
    void unauthorizedCarriesMessage() {
        assertThat(new UnauthorizedException("Authentication required.").getMessage())
                .isEqualTo("Authentication required.");
    }
}