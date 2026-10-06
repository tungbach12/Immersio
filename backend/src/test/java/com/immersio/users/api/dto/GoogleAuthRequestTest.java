package com.immersio.users.api.dto;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Guards the request-shape compatibility with the DEPLOYED SPA:
 * loginWithGoogle sends {"credential"} (legacy .NET contract), other builds
 * send {"idToken"}. A regression here re-breaks Google login with 400
 * "Validation failed".
 */
class GoogleAuthRequestTest {

    @Test
    void acceptsDeployedSpaCredentialShape() {
        GoogleAuthRequest request = new GoogleAuthRequest(null, "ya29.a0-token");
        assertThat(request.resolvedToken()).isEqualTo("ya29.a0-token");
    }

    @Test
    void acceptsIdTokenShape() {
        GoogleAuthRequest request = new GoogleAuthRequest("ya29.a0-token", null);
        assertThat(request.resolvedToken()).isEqualTo("ya29.a0-token");
    }

    @Test
    void prefersCredentialWhenBothPresent() {
        GoogleAuthRequest request = new GoogleAuthRequest("from-id-token", "from-credential");
        assertThat(request.resolvedToken()).isEqualTo("from-credential");
    }

    @Test
    void jacksonBindsDeployedSpaJson() throws Exception {
        ObjectMapper mapper = new ObjectMapper()
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        GoogleAuthRequest request = mapper.readValue("{\"credential\":\"ya29.x\"}", GoogleAuthRequest.class);
        assertThat(request.resolvedToken()).isEqualTo("ya29.x");
        GoogleAuthRequest empty = mapper.readValue("{}", GoogleAuthRequest.class);
        assertThat(empty.resolvedToken()).isEmpty();
    }

    @Test
    void emptyPayloadResolvesToEmptyString_for_401_not_400() {
        assertThat(new GoogleAuthRequest(null, null).resolvedToken()).isEmpty();
        assertThat(new GoogleAuthRequest("   ", "").resolvedToken()).isEmpty();
    }
}
