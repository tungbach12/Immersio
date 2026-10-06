package com.immersio.scenarios.service;

import com.immersio.flashcards.api.dto.AddCardDto;
import com.immersio.scenarios.api.dto.CorrectionResultDto;
import com.immersio.scenarios.api.dto.ScenarioContextDto;
import com.immersio.scenarios.api.dto.SessionMessageDto;
import com.immersio.users.domain.SystemSetting;
import com.immersio.users.repository.SystemSettingRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Pure-logic JUnit 5 tests for {@link ScenarioLlmClient}:
 * <ul>
 *   <li>30-second configuration caching and cache-stamp freshness</li>
 *   <li>Per-feature reasoning-effort key mapping and generic fallback</li>
 *   <li>Endpoint-to-API-key resolution with production provider routing</li>
 *   <li>Diagnostics logging and fallback degradation when the database is unreachable</li>
 *   <li>Spoken grammar JSON parsing and lenient 'Perfect!' fallback handling</li>
 *   <li>Polymorphic flashcard JSON parsing (vocab, grammar, sentence) with .NET fallbacks</li>
 *   <li>Request body building including reasoning-effort and thinking disabled flags</li>
 *   <li>Markdown code fence stripping and prompt construction parity</li>
 * </ul>
 */
class ScenarioLlmClientTest {

    // ------------------------------------------------------------------
    // Cache freshness
    // ------------------------------------------------------------------

    @Nested
    @DisplayName("Cache freshness")
    class CacheFreshness {

        @Test
        void freshlyCreatedStampIsWithinTtl() {
            Instant now = Instant.now();
            Instant stamp = now.minusSeconds(10);
            assertThat(ScenarioLlmClient.isFresh(stamp, now, Duration.ofSeconds(30))).isTrue();
        }

        @Test
        void stampBeyondTtlIsExpired() {
            Instant now = Instant.now();
            Instant stamp = now.minusSeconds(31);
            assertThat(ScenarioLlmClient.isFresh(stamp, now, Duration.ofSeconds(30))).isFalse();
        }

        @Test
        void nullStampIsNeverFresh() {
            assertThat(ScenarioLlmClient.isFresh(null, Instant.now(), Duration.ofSeconds(30))).isFalse();
        }
    }

    // ------------------------------------------------------------------
    // Key and model resolution
    // ------------------------------------------------------------------

    @Nested
    @DisplayName("Single 9Router API key resolution")
    class ApiKeyResolution {

        private final SystemSettingRepository repo = Mockito.mock(SystemSettingRepository.class);
        private final ScenarioLlmClient client = new ScenarioLlmClient(
                repo,
                "nine-router-key-123",
                ScenarioLlmClient.DEFAULT_MODEL,
                ScenarioLlmClient.DEFAULT_ENDPOINT);

        @Test
        void alwaysReturnsSingleKeyRegardlessOfEndpoint() {
            assertThat(client.resolveApiKey("https://integrate.api.nvidia.com/v1/chat/completions"))
                    .isEqualTo("nine-router-key-123");
            assertThat(client.resolveApiKey("https://api.groq.com/openai/v1/chat/completions"))
                    .isEqualTo("nine-router-key-123");
            assertThat(client.resolveApiKey("https://9routerhelios.duckdns.org/v1/chat/completions"))
                    .isEqualTo("nine-router-key-123");
            assertThat(client.resolveApiKey(""))
                    .isEqualTo("nine-router-key-123");
            assertThat(client.resolveApiKey(null))
                    .isEqualTo("nine-router-key-123");
        }

        @Test
        void mapsFeatureKeysToExpectedReasoningEffortSetting() {
            assertThat(ScenarioLlmClient.effortSettingKey("ModelChat")).isEqualTo("ReasoningEffortChat");
            assertThat(ScenarioLlmClient.effortSettingKey("ModelGrammar")).isEqualTo("ReasoningEffortGrammar");
            assertThat(ScenarioLlmClient.effortSettingKey("ModelFeedback")).isEqualTo("ReasoningEffortFeedback");
            assertThat(ScenarioLlmClient.effortSettingKey("ModelFlashcard")).isEqualTo("ReasoningEffortFlashcard");
            assertThat(ScenarioLlmClient.effortSettingKey("ModelPhrase")).isEqualTo("ReasoningEffortPhrase");
            assertThat(ScenarioLlmClient.effortSettingKey("Unknown")).isEqualTo("ReasoningEffortChat");
        }
    }

    // ------------------------------------------------------------------
    // SystemSettings lookup & fallback
    // ------------------------------------------------------------------

    @Nested
    @DisplayName("SystemSettings lookup and fallback")
    class SystemSettingsLookup {

        @Test
        void readsConfigFromRepositoryAndResolvesApiKey() {
            SystemSettingRepository repo = Mockito.mock(SystemSettingRepository.class);
            when(repo.findByKey("ModelChat")).thenReturn(Optional.of(new SystemSetting("ModelChat", "custom-model")));
            when(repo.findByKey("LlmEndpoint")).thenReturn(Optional.of(new SystemSetting("LlmEndpoint", "https://integrate.api.nvidia.com/v1/chat/completions")));
            when(repo.findByKey("ReasoningEffortChat")).thenReturn(Optional.of(new SystemSetting("ReasoningEffortChat", "medium")));

            ScenarioLlmClient client = new ScenarioLlmClient(
                    repo, "nine-router-key",
                    ScenarioLlmClient.DEFAULT_MODEL, ScenarioLlmClient.DEFAULT_ENDPOINT);

            ScenarioLlmClient.ResolvedConfig resolved = client.resolve("ModelChat");
            assertThat(resolved.model()).isEqualTo("custom-model");
            assertThat(resolved.endpoint()).isEqualTo("https://integrate.api.nvidia.com/v1/chat/completions");
            assertThat(resolved.apiKey()).isEqualTo("nine-router-key");
            assertThat(resolved.reasoningEffort()).isEqualTo("medium");
        }

        @Test
        void fallsBackToGenericReasoningEffortWhenSpecificIsMissing() {
            SystemSettingRepository repo = Mockito.mock(SystemSettingRepository.class);
            when(repo.findByKey("ModelGrammar")).thenReturn(Optional.of(new SystemSetting("ModelGrammar", "g-model")));
            when(repo.findByKey("LlmEndpoint")).thenReturn(Optional.of(new SystemSetting("LlmEndpoint", "https://api.groq.com/openai/v1/chat/completions")));
            when(repo.findByKey("ReasoningEffortGrammar")).thenReturn(Optional.empty());
            when(repo.findByKey("ReasoningEffort")).thenReturn(Optional.of(new SystemSetting("ReasoningEffort", "low")));

            ScenarioLlmClient client = new ScenarioLlmClient(
                    repo, "nine-router-key",
                    ScenarioLlmClient.DEFAULT_MODEL, ScenarioLlmClient.DEFAULT_ENDPOINT);

            ScenarioLlmClient.ResolvedConfig resolved = client.resolve("ModelGrammar");
            assertThat(resolved.model()).isEqualTo("g-model");
            assertThat(resolved.reasoningEffort()).isEqualTo("low");
            assertThat(resolved.apiKey()).isEqualTo("nine-router-key");
        }

        @Test
        void fallsBackGracefullyWhenRepositoryThrows() {
            SystemSettingRepository repo = Mockito.mock(SystemSettingRepository.class);
            when(repo.findByKey(Mockito.anyString())).thenThrow(new RuntimeException("DB down"));

            ScenarioLlmClient client = new ScenarioLlmClient(
                    repo, "nine-router-fallback",
                    "immersio",
                    "https://9routerhelios.duckdns.org/v1/chat/completions");

            ScenarioLlmClient.ResolvedConfig resolved = client.resolve("ModelChat");
            assertThat(resolved.model()).isEqualTo("immersio");
            assertThat(resolved.endpoint()).isEqualTo("https://9routerhelios.duckdns.org/v1/chat/completions");
            assertThat(resolved.apiKey()).isEqualTo("nine-router-fallback");
            assertThat(resolved.reasoningEffort()).isEqualTo("none");
        }

        @Test
        void reusesCachedSnapshotWithinTtlWithoutTouchingRepositoryAgain() {
            SystemSettingRepository repo = Mockito.mock(SystemSettingRepository.class);
            when(repo.findByKey("ModelFeedback")).thenReturn(Optional.of(new SystemSetting("ModelFeedback", "model-v1")));
            when(repo.findByKey("LlmEndpoint")).thenReturn(Optional.of(new SystemSetting("LlmEndpoint", "https://api.groq.com/openai/v1/chat/completions")));
            when(repo.findByKey("ReasoningEffortFeedback")).thenReturn(Optional.of(new SystemSetting("ReasoningEffortFeedback", "none")));

            ScenarioLlmClient client = new ScenarioLlmClient(
                    repo, "nine-router-key",
                    ScenarioLlmClient.DEFAULT_MODEL, ScenarioLlmClient.DEFAULT_ENDPOINT);

            ScenarioLlmClient.ResolvedConfig first = client.resolve("ModelFeedback");
            ScenarioLlmClient.ResolvedConfig second = client.resolve("ModelFeedback");

            assertThat(first.model()).isEqualTo("model-v1");
            assertThat(second.model()).isEqualTo("model-v1");
            Mockito.verify(repo, Mockito.times(1)).findByKey("ModelFeedback");
        }
    }

    // ------------------------------------------------------------------
    // Request body building
    // ------------------------------------------------------------------

    @Nested
    @DisplayName("Request body construction")
    class RequestBodyBuilding {

        @Test
        void includesReasoningEffortWhenSpecifiedAndNotNone() {
            Map<String, Object> body = ScenarioLlmClient.buildRequestBody(
                    "custom-model", List.of(Map.of("role", "user", "content", "hi")),
                    0.7, "high", 1024, false);

            assertThat(body.get("model")).isEqualTo("custom-model");
            assertThat(body.get("temperature")).isEqualTo(0.7);
            assertThat(body.get("max_tokens")).isEqualTo(1024);
            assertThat(body.get("reasoning_effort")).isEqualTo("high");
            assertThat(body).doesNotContainKey("thinking");
            assertThat(body).doesNotContainKey("response_format");
        }

        @Test
        void disablesThinkingWhenReasoningEffortIsNoneOrBlank() {
            for (String effort : new String[]{"none", "", "   ", null}) {
                Map<String, Object> body = ScenarioLlmClient.buildRequestBody(
                        "fast-model", List.of(), 0.2, effort, 0, true);

                assertThat(body).doesNotContainKey("reasoning_effort");
                assertThat(body).doesNotContainKey("max_tokens");
                assertThat(body.get("thinking")).isEqualTo(Map.of("type", "disabled"));
                assertThat(body.get("response_format")).isEqualTo(Map.of("type", "json_object"));
            }
        }
    }

    // ------------------------------------------------------------------
    // Grammar content parsing
    // ------------------------------------------------------------------

    @Nested
    @DisplayName("Grammar JSON parsing")
    class GrammarParsing {

        @Test
        void parsesValidGrammarJson() {
            String json = """
                    {"corrected":"I have a cat","explanation":"Dùng 'have' thay vì 'has' với chủ ngữ 'I'."}
                    """;
            CorrectionResultDto result = ScenarioLlmClient.parseGrammarContent(json, "I has a cat");
            assertThat(result.corrected()).isEqualTo("I have a cat");
            assertThat(result.explanation()).isEqualTo("Dùng 'have' thay vì 'has' với chủ ngữ 'I'.");
        }

        @Test
        void fallsBackToOriginalMessageWhenPayloadIsGarbageOrNull() {
            for (String content : new String[]{null, "", "   ", "not json", "{}"}) {
                CorrectionResultDto result = ScenarioLlmClient.parseGrammarContent(content, "original text");
                assertThat(result.corrected()).isEqualTo("original text");
                assertThat(result.explanation()).isEqualTo("Perfect!");
            }
        }
    }

    // ------------------------------------------------------------------
    // Flashcard parsing
    // ------------------------------------------------------------------

    @Nested
    @DisplayName("Flashcards JSON parsing")
    class FlashcardsParsing {

        @Test
        void parsesPolymorphicFlashcards() {
            String json = """
                    {
                      "flashcards": [
                        {
                          "type": "vocab",
                          "content": {
                            "word": "meticulous",
                            "meaning": "Rất cẩn thận",
                            "definition_en": "Very careful and precise"
                          }
                        },
                        {
                          "type": "grammar",
                          "content": {
                            "title": "Past Simple",
                            "usage": "Action completed in the past"
                          }
                        },
                        {
                          "type": "sentence",
                          "content": {
                            "full_sentence": "Take into account all factors.",
                            "translation": "Cân nhắc tất cả các yếu tố."
                          }
                        }
                      ]
                    }
                    """;

            List<AddCardDto> cards = ScenarioLlmClient.parseFlashcards(json);
            assertThat(cards).hasSize(3);

            AddCardDto vocab = cards.get(0);
            assertThat(vocab.front()).isEqualTo("meticulous");
            assertThat(vocab.back()).isEqualTo("Rất cẩn thận");
            assertThat(vocab.explanation()).isEqualTo("Definition: Very careful and precise\nWord: meticulous");
            assertThat(vocab.tag()).isEqualTo("vocab");

            AddCardDto grammar = cards.get(1);
            assertThat(grammar.front()).isEqualTo("Past Simple");
            assertThat(grammar.back()).isEqualTo("Action completed in the past");
            assertThat(grammar.explanation()).isEqualTo("Usage: Action completed in the past");
            assertThat(grammar.tag()).isEqualTo("grammar");

            AddCardDto sentence = cards.get(2);
            assertThat(sentence.front()).isEqualTo("Take into account all factors.");
            assertThat(sentence.back()).isEqualTo("Cân nhắc tất cả các yếu tố.");
            assertThat(sentence.explanation()).isEqualTo("Sentence: Take into account all factors.");
            assertThat(sentence.tag()).isEqualTo("sentence");
        }

        @Test
        void stripsMarkdownFencesAroundFlashcardsJson() {
            String fenced = """
                    ```json
                    {"flashcards":[{"type":"vocab","content":{"word":"apple","meaning":"quả táo"}}]}
                    ```
                    """;
            List<AddCardDto> cards = ScenarioLlmClient.parseFlashcards(fenced);
            assertThat(cards).hasSize(1);
            assertThat(cards.get(0).front()).isEqualTo("apple");
            assertThat(cards.get(0).back()).isEqualTo("quả táo");
        }

        @Test
        void appliesReviewFallbackWhenFieldsAreEmpty() {
            String json = """
                    {"flashcards":[{"type":"vocab","content":{}}]}
                    """;
            List<AddCardDto> cards = ScenarioLlmClient.parseFlashcards(json);
            assertThat(cards).hasSize(1);
            assertThat(cards.get(0).front()).isEqualTo("Review");
            assertThat(cards.get(0).back()).isEqualTo("Review");
        }

        @Test
        void returnsEmptyListOnGarbageOrMissingArray() {
            assertThat(ScenarioLlmClient.parseFlashcards(null)).isEmpty();
            assertThat(ScenarioLlmClient.parseFlashcards("")).isEmpty();
            assertThat(ScenarioLlmClient.parseFlashcards("not json")).isEmpty();
            assertThat(ScenarioLlmClient.parseFlashcards("{\"flashcards\": \"not an array\"}")).isEmpty();
        }
    }

    // ------------------------------------------------------------------
    // Prompts and history helpers
    // ------------------------------------------------------------------

    @Nested
    @DisplayName("Prompts and history formatting")
    class PromptsAndHistory {

        @Test
        void formatsHistoryText() {
            List<SessionMessageDto> history = List.of(
                    new SessionMessageDto(null, null, "user", "Hello", null, null, null),
                    new SessionMessageDto(null, null, "assistant", "Hi there!", null, null, null));
            assertThat(ScenarioLlmClient.historyText(history))
                    .isEqualTo("user: Hello\nassistant: Hi there!");
        }

        @Test
        void determinesWhetherToAppendCurrentMessage() {
            List<SessionMessageDto> empty = List.of();
            assertThat(ScenarioLlmClient.shouldAppendCurrentMessage(empty, "hello")).isTrue();

            List<SessionMessageDto> endingWithAssistant = List.of(
                    new SessionMessageDto(null, null, "assistant", "How are you?", null, null, null));
            assertThat(ScenarioLlmClient.shouldAppendCurrentMessage(endingWithAssistant, "good")).isTrue();

            List<SessionMessageDto> endingWithSameUser = List.of(
                    new SessionMessageDto(null, null, "user", "I want a coffee", null, null, null));
            assertThat(ScenarioLlmClient.shouldAppendCurrentMessage(endingWithSameUser, "I want a coffee")).isFalse();

            assertThat(ScenarioLlmClient.shouldAppendCurrentMessage(endingWithSameUser, "Different text")).isTrue();
        }

        @Test
        void buildsChatSystemPromptWithEmotions() {
            String prompt = ScenarioLlmClient.chatSystemPrompt("You are Shinji", "Japanese", List.of("happy", "idle"));
            assertThat(prompt).contains("You must write your ENTIRE reply in Japanese.");
            assertThat(prompt).contains("SCENARIO CONTEXT:\nYou are Shinji");
            assertThat(prompt).contains("[EMOTION: <emotion_name>]");
            assertThat(prompt).contains("'happy', 'idle'");
        }

        @Test
        void buildsFlashcardSystemPromptAnchoredToScenarioContext() {
            ScenarioContextDto ctx = new ScenarioContextDto(
                    "Ordering Coffee", "Beginner", "Travel",
                    "Order a latte", "Shinji the barista");
            String prompt = ScenarioLlmClient.flashcardSystemPrompt("Japanese", ctx);
            assertThat(prompt).contains("- Title: Ordering Coffee");
            assertThat(prompt).contains("- Category: Travel");
            assertThat(prompt).contains("- CEFR level: Beginner");
            assertThat(prompt).contains("\"japanese\", \"vocab\"");
        }
    }
}
