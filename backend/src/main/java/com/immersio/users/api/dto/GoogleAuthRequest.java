package com.immersio.users.api.dto;

/**
 * Request payload for POST /api/auth/google.
 *
 * <p>The deployed SPA sends {@code {"credential": "..."}} (matching the legacy
 * .NET {@code GoogleLoginRequest.Credential}); newer builds send
 * {@code {"idToken": "..."}} — both are accepted. An empty payload is rejected
 * with 401 by {@link com.immersio.users.service.GoogleTokenVerifier} (the .NET
 * behaviour), not by bean validation.</p>
 */
public record GoogleAuthRequest(String idToken, String credential) {

    /** Whichever property the client actually populated. */
    public String resolvedToken() {
        if (credential != null && !credential.isBlank()) return credential.trim();
        if (idToken != null && !idToken.isBlank()) return idToken.trim();
        return "";
    }
}
