package com.immersio.users.service;

import com.immersio.shared.exception.UnauthorizedException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Map;

/**
 * Validates a Google Identity Services ID token by asking Google's tokeninfo
 * endpoint (server-side signature verification — same trust model as the
 * .NET GoogleJsonWebSignature.ValidateAsync, which also calls Google infra).
 */
@Service
public class GoogleTokenVerifier {

    /** Verified profile extracted from a valid Google ID token. */
    public record GoogleProfile(String email, String name, String picture) {}

    private final RestClient client;
    private final String clientId;

    public GoogleTokenVerifier(@Value("${google.client-id:}") String clientId) {
        this.clientId = clientId == null ? "" : clientId.trim();
        this.client = RestClient.builder().baseUrl("https://oauth2.googleapis.com").build();
    }

    /**
     * @throws UnauthorizedException when the token is invalid, expired, forged,
     *                               or issued for a different client id
     */
    @SuppressWarnings("unchecked")
    public GoogleProfile verify(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new UnauthorizedException("Invalid Google credential.");
        }
        Map<String, Object> info;
        try {
            info = client.get()
                    .uri("/tokeninfo?id_token={token}", idToken)
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientException ex) {
            throw new UnauthorizedException("Google token validation failed.");
        }
        if (info == null) {
            throw new UnauthorizedException("Invalid Google credential.");
        }
        String audience = String.valueOf(info.getOrDefault("aud", ""));
        if (!clientId.isEmpty() && !clientId.equals(audience)) {
            throw new UnauthorizedException("Google token was issued for another client.");
        }
        String email = (String) info.get("email");
        if (email == null || email.isBlank()) {
            throw new UnauthorizedException("Google credential has no email.");
        }
        if (!isTrue(info.get("email_verified"))) {
            throw new UnauthorizedException("Google email is not verified.");
        }
        String name = (String) info.getOrDefault("name", null);
        if (name == null || name.isBlank()) {
            name = (String) info.getOrDefault("given_name", null);
        }
        if (name == null || name.isBlank()) {
            name = "Google User";
        }
        String picture = (String) info.getOrDefault("picture", null);
        return new GoogleProfile(email, name, picture);
    }

    private static boolean isTrue(Object value) {
        if (value instanceof Boolean b) return b;
        return value != null && "true".equalsIgnoreCase(String.valueOf(value));
    }
}
