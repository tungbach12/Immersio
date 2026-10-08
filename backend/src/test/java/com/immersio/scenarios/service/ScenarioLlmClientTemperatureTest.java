package com.immersio.scenarios.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Regression tests for the flashcard 400.
 *
 * <p>{@code temperature: 0.2} was fine against the old kilo-auto upstream, but the
 * models now in the {@code immersio} combo only accept 0, 0.6 or 1. The upstream
 * answered {@code invalid temperature} with HTTP 400, and
 * {@code generateFlashcards} swallowed it into an empty list — so the UI silently
 * showed zero cards.
 */
@DisplayName("ScenarioLlmClient request temperature")
class ScenarioLlmClientTemperatureTest {

    private static final List<Double> ALLOWED = List.of(0.0, 0.6, 1.0);

    @Test
    @DisplayName("the temperature sent for flashcards is one the combo's models accept")
    void flashcardTemperatureIsSupported() {
        Map<String, Object> body = ScenarioLlmClient.buildRequestBody(
                "immersio",
                List.of(Map.of("role", "system", "content", "x")),
                ScenarioLlmClient.FLASHCARD_TEMPERATURE, "high", 0, true);

        assertThat(body.get("temperature"))
                .as("upstream rejects anything outside %s", ALLOWED)
                .isEqualTo(0.6);
    }

    @Test
    @DisplayName("grammar, chat and feedback temperatures are also model-legal")
    void allFeatureTemperaturesAreSupported() {
        for (double temperature : List.of(
                ScenarioLlmClient.FLASHCARD_TEMPERATURE,
                ScenarioLlmClient.GRAMMAR_TEMPERATURE,
                ScenarioLlmClient.CHAT_TEMPERATURE,
                ScenarioLlmClient.FEEDBACK_TEMPERATURE)) {
            assertThat(ALLOWED).as("temperature %s", temperature).contains(temperature);
        }
    }

    @Test
    @DisplayName("the flashcard prompt still asks for the 'flashcards' key the parser reads")
    void promptRequestsFlashcardsKey() {
        String prompt = ScenarioLlmClient.flashcardSystemPrompt("English", null);

        assertThat(prompt).contains("flashcards");
        assertThat(prompt).as("keep the polymorphic type contract the parser relies on")
                .contains("vocab").contains("grammar").contains("sentence");
    }
}