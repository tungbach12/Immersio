package com.immersio.scenarios.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pins the real upstream flashcard shapes the 'immersio' combo returns.
 *
 * <p>Production returned zero cards even though the model emitted valid JSON, so these
 * fixtures lock in the fence-stripping and the three polymorphic card types end to end.
 */
@DisplayName("parseFlashcards against real upstream payloads")
class ParseFlashcardsRealPayloadTest {

    @Test
    @DisplayName("parses a fence-wrapped response with all three card types")
    void parsesFenceWrappedPolymorphicResponse() {
        String content = """
                ```json
                {
                  "flashcards": [
                    {
                      "type": "vocab",
                      "meta": { "tags": ["english", "vocab"] },
                      "content": {
                        "word": "platform",
                        "part_of_speech": "n",
                        "phonetic": "/ˈplæt.fɔːrm/",
                        "meaning": "sân ga",
                        "definition_en": "The raised area beside a railway track."
                      }
                    },
                    {
                      "type": "grammar",
                      "meta": { "tags": ["english", "grammar"] },
                      "content": {
                        "title": "Past Simple",
                        "usage": "Describes a finished action at a definite time in the past.",
                        "signal_words": ["yesterday"]
                      }
                    },
                    {
                      "type": "sentence",
                      "meta": { "tags": ["english", "collocation"] },
                      "content": {
                        "full_sentence": "I want to buy a ticket to Shinjuku.",
                        "translation": "Tôi muốn mua vé đi Shinjuku.",
                        "target_phrase": "a ticket to + place",
                        "cloze_sentence": "I want to {{c1::buy}} a ticket."
                      }
                    }
                  ]
                }
                ```""";

        List<com.immersio.flashcards.api.dto.AddCardDto> cards =
                ScenarioLlmClient.parseFlashcards(content);

        assertThat(cards).hasSize(3);
        assertThat(cards.get(0).front()).isEqualTo("platform");
        assertThat(cards.get(0).back()).isEqualTo("sân ga");
        assertThat(cards.get(1).front()).isEqualTo("Past Simple");
        assertThat(cards.get(2).front()).contains("Shinjuku");
    }

    @Test
    @DisplayName("keeps cards when the response carries a leading SSE 'data: ' frame")
    void toleratesDataFrame() {
        String content = "data: " + """
                {"flashcards":[{"type":"vocab","content":{"word":"ticket","meaning":"vé"}}]}
                """ + "\ndata: [DONE]\n\n";

        assertThat(ScenarioLlmClient.parseFlashcards(content))
                .as("9Router framing must not lose cards")
                .hasSize(1);
    }

    @Test
    @DisplayName("a prose refusal yields no cards rather than junk")
    void proseRefusalYieldsNoCards() {
        assertThat(ScenarioLlmClient.parseFlashcards("I'm sorry, I can't help with that.")).isEmpty();
    }
}