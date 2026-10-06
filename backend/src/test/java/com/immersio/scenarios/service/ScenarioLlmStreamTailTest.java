package com.immersio.scenarios.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Reproduces the 9Router response-shape problem: /v1/chat/completions returns the
 * completion JSON followed by a trailing SSE terminator ("data: [DONE]"), even for
 * non-streaming requests. Jackson's readTree is strict about trailing tokens, so
 * parsing silently fails and every JSON feature degrades to its fallback.
 */
class ScenarioLlmStreamTailTest {

    private static final String BODY =
            "{\"id\":\"gen-1\",\"model\":\"immersio\",\"choices\":[{\"index\":0,\"message\":"
            + "{\"role\":\"assistant\",\"content\":\"{\\\"corrected\\\":\\\"I had a cat\\\","
            + "\\\"explanation\\\":\\\"Perfect!\\\"}\"}}]}";

    @Test
    @DisplayName("tolerates the SSE trailing terminator Jackson would otherwise be fed")
    void toleratesTrailingSseTerminator() throws Exception {
        String withTail = BODY + "data: [DONE]\n\n";

        // readTree(String) ignores trailing tokens, so this alone is not fatal — the
        // extraction is defensive: it also handles a leading 'data: ' prefix, which
        // Jackson DOES reject (see the next test).
        assertThat(ScenarioLlmClient.firstChoiceContent(withTail)).contains("I had a cat");
    }

    @Test
    @DisplayName("leading 'data: ' framing is rejected by raw Jackson but handled by the client")
    void leadingDataPrefixWouldBreakRawJackson() throws Exception {
        String framed = "data: " + BODY + "\ndata: [DONE]\n\n";

        assertThatThrownBy(() ->
                new com.fasterxml.jackson.databind.ObjectMapper().readTree(framed))
                .isInstanceOf(Exception.class);

        assertThat(ScenarioLlmClient.firstChoiceContent(framed)).contains("I had a cat");
    }
}
