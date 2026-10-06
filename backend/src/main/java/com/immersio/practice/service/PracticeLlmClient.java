package com.immersio.practice.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.immersio.practice.api.dto.DictionaryEntryDto;
import com.immersio.practice.api.dto.GeneratedPhraseDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Calls a configurable OpenAI-compatible chat-completions endpoint for the
 * Practice module's AI features (dictionary lookup + phrase generation),
 * replacing the hardcoded fake text of the legacy Java stubs and mirroring
 * the prompt/JSON contracts of the .NET {@code LlmService}.
 *
 * <p>Configuration (graceful empty defaults):</p>
 * <ul>
 *   <li>{@code nine-router.api-key} — 9Router key, sent as {@code Authorization: Bearer} when set</li>
 *   <li>{@code nine-router.base-url} — default {@code https://9routerhelios.duckdns.org/v1}</li>
 *   <li>{@code nine-router.model} — default {@code immersio}</li>
 * </ul>
 * <p>When the endpoint is unreachable or answers with an error, the legacy
 * .NET default entries are returned so the UI keeps working.</p>
 */
@Service
public class PracticeLlmClient {

    static final String DEFAULT_BASE_URL = "https://9routerhelios.duckdns.org/v1";
    static final String DEFAULT_MODEL = "immersio";
    static final String CHAT_COMPLETIONS_PATH = "/chat/completions";
    static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(5);
    /**
     * Dictionary/phrase calls go through the same 9Router combo as the scenario
     * client, which can spend a long time reasoning. 20s was too tight; keep under
     * the 600s nginx proxy_read_timeout on the 9Router host.
     */
    static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(120);

    static final String DEFAULT_TRANSLATION = "Nghĩa của từ.";
    static final String DEFAULT_PHONETIC = "/.../";
    static final String DEFAULT_PART_OF_SPEECH = "noun";
    static final String DEFAULT_DEFINITION = "Definition of the word.";
    static final String DEFAULT_EXAMPLE = "An example sentence.";
    static final String DEFAULT_EXAMPLE_TRANSLATION = "Câu ví dụ.";
    static final String DEFAULT_EXPLANATION = "Một câu nói thông dụng.";

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final String apiKey;
    private final String baseUrl;
    private final String model;
    private final HttpClient http;

    public PracticeLlmClient(
            @Value("${nine-router.api-key:${NINE_ROUTER_API_KEY:}}") String apiKey,
            @Value("${nine-router.base-url:https://9routerhelios.duckdns.org/v1}") String baseUrl,
            @Value("${nine-router.model:immersio}") String model) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        String trimmedBase = baseUrl == null ? "" : baseUrl.trim();
        this.baseUrl = trimmedBase.replaceAll("/+$", "");
        this.model = (model == null || model.isBlank()) ? DEFAULT_MODEL : model.trim();
        this.http = HttpClient.newBuilder().connectTimeout(CONNECT_TIMEOUT).build();
    }

    // ------------------------------------------------------------------
    // Public operations
    // ------------------------------------------------------------------

    public DictionaryEntryDto lookupWord(String word, String targetLanguage) {
        String normalizedWord = word == null ? "" : word.trim();
        String language = (targetLanguage == null || targetLanguage.isBlank())
                ? "English" : targetLanguage.trim();
        try {
            String content = chatCompletion(
                    dictionarySystemPrompt(language),
                    "Lookup details for the word/phrase: " + normalizedWord,
                    0.3);
            return parseDictionaryContent(content, normalizedWord);
        } catch (Exception ex) {
            return parseDictionaryContent(null, normalizedWord);
        }
    }

    public GeneratedPhraseDto generatePhrase(String language, String level, String topic) {
        try {
            String content = chatCompletion(
                    phraseSystemPrompt(language, level, topic),
                    "Generate a phrase for " + language + " (" + level + ") about '" + topic + "'",
                    0.8);
            return parsePhraseContent(content, language);
        } catch (Exception ex) {
            return parsePhraseContent(null, language);
        }
    }

    // ------------------------------------------------------------------
    // HTTP
    // ------------------------------------------------------------------

    String chatCompletion(String systemPrompt, String userPrompt, double temperature)
            throws IOException, InterruptedException {
        if (baseUrl.isEmpty()) {
            throw new IOException("AI endpoint is not configured.");
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userPrompt)));
        body.put("temperature", temperature);
        body.put("stream", false);
        // response_format:json_object is intentionally omitted — the 9Router 'immersio'
        // combo routes to upstreams that reject it (~92% HTTP 400). The system prompt
        // already requests strictly valid JSON and parseDictionaryContent/
        // parsePhraseContent strip markdown fences before parsing.

        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(baseUrl + CHAT_COMPLETIONS_PATH))
                .timeout(REQUEST_TIMEOUT)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(MAPPER.writeValueAsString(body), StandardCharsets.UTF_8));
        if (!apiKey.isEmpty()) {
            builder.header("Authorization", "Bearer " + apiKey);
        }

        HttpResponse<String> response = http.send(builder.build(),
                HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("AI endpoint returned status " + response.statusCode());
        }

        JsonNode root = MAPPER.readTree(response.body());
        JsonNode choices = root.path("choices");
        if (!choices.isArray() || choices.isEmpty()) {
            throw new IOException("AI endpoint returned no choices");
        }
        JsonNode contentNode = choices.get(0).path("message").path("content");
        if (contentNode == null || contentNode.isNull() || !contentNode.isTextual()) {
            throw new IOException("AI endpoint returned no message content");
        }
        return contentNode.asText();
    }

    // ------------------------------------------------------------------
    // Pure response parsing (unit tested)
    // ------------------------------------------------------------------

    /** Parses the LLM's JSON content into a dictionary entry; never fails. */
    public static DictionaryEntryDto parseDictionaryContent(String content, String word) {
        String translation = DEFAULT_TRANSLATION;
        String phonetic = DEFAULT_PHONETIC;
        String partOfSpeech = DEFAULT_PART_OF_SPEECH;
        String definition = DEFAULT_DEFINITION;
        String example = DEFAULT_EXAMPLE;
        String exampleTranslation = DEFAULT_EXAMPLE_TRANSLATION;

        JsonNode root = tryParse(cleanJson(content));
        if (root != null && root.isObject()) {
            translation = textOrDefault(root, "translation", translation);
            phonetic = textOrDefault(root, "phonetic", phonetic);
            partOfSpeech = textOrDefault(root, "partOfSpeech", partOfSpeech);
            definition = textOrDefault(root, "definition", definition);
            example = textOrDefault(root, "example", example);
            exampleTranslation = textOrDefault(root, "exampleTranslation", exampleTranslation);
        }
        return new DictionaryEntryDto(word, translation, phonetic, partOfSpeech, definition,
                example, exampleTranslation);
    }

    /** Parses the LLM's JSON content into a generated phrase; never fails. */
    public static GeneratedPhraseDto parsePhraseContent(String content, String language) {
        String lang = language == null ? "" : language.toLowerCase(Locale.ROOT);
        boolean japanese = lang.contains("ja");
        boolean chinese = lang.contains("zh");
        String defaultPhrase = japanese ? "こんにちは、元気ですか？"
                : chinese ? "你好，你怎么样？"
                : "The quick brown fox jumps over the lazy dog.";
        String defaultTranslation = japanese ? "Xin chào, bạn khỏe không?"
                : chinese ? "Xin chào, bạn thế nào?"
                : "Chú cáo nâu nhanh nhẹn nhảy qua con chó lười biếng.";

        String phrase = defaultPhrase;
        String translation = defaultTranslation;
        String explanation = DEFAULT_EXPLANATION;

        JsonNode root = tryParse(cleanJson(content));
        if (root != null && root.isObject()) {
            phrase = textOrDefault(root, "phrase", phrase);
            translation = textOrDefault(root, "translation", translation);
            explanation = textOrDefault(root, "explanation", explanation);
        }
        return new GeneratedPhraseDto(phrase, translation, explanation);
    }

    /** Strips Markdown code fences the model sometimes wraps around JSON. */
    static String cleanJson(String content) {
        if (content == null || content.isBlank()) {
            return content;
        }
        String trimmed = content.trim();
        if (!trimmed.startsWith("```")) {
            return trimmed;
        }
        StringBuilder sb = new StringBuilder(trimmed.length());
        for (String line : trimmed.split("\n", -1)) {
            if (line.trim().startsWith("```")) {
                continue;
            }
            if (sb.length() > 0) {
                sb.append('\n');
            }
            sb.append(line);
        }
        return sb.toString().trim();
    }

    static String dictionarySystemPrompt(String targetLanguage) {
        return """
                You are an advanced bilingual dictionary service for language learners. Provide a highly detailed and accurate dictionary entry for the queried word/phrase in the target language '%s'.

                INSTRUCTIONS:
                - The output must be strictly in Vietnamese (Tiếng Việt) for the translation and example translation, and English for the definition.
                - Provide the international phonetic alphabet (IPA) representation for the phonetic property.
                - Choose the most common part of speech and definition for the word/phrase.
                - Provide a high-quality example sentence in '%s' demonstrating its typical conversational usage, followed by its Vietnamese translation.

                Return a JSON object with strictly these keys:
                - "word": The exact word/phrase queried.
                - "translation": The standard Vietnamese translation/meaning of the word/phrase.
                - "phonetic": The international phonetic alphabet (IPA) representation (e.g. /haʊ/, /kəˈmit/).
                - "partOfSpeech": The part of speech (e.g. noun, verb, adjective, adverb, phrase, idiom).
                - "definition": A clear, concise English definition of the word/phrase.
                - "example": A natural, common example sentence using the word in %s.
                - "exampleTranslation": The Vietnamese translation of the example sentence.

                The output must be strictly valid JSON. Example:
                {
                  "word": "accomplish",
                  "translation": "hoàn thành, đạt được",
                  "phonetic": "/əˈkʌm.plɪʃ/",
                  "partOfSpeech": "verb",
                  "definition": "To succeed in doing something, especially after a lot of effort.",
                  "example": "We can accomplish anything if we work together.",
                  "exampleTranslation": "Chúng ta có thể đạt được bất cứ điều gì nếu làm việc cùng nhau."
                }""".formatted(targetLanguage, targetLanguage, targetLanguage);
    }

    static String phraseSystemPrompt(String language, String level, String topic) {
        return """
                You are a language teacher creating pronunciation speaking exercises for a language learner.
                Create a single natural and interesting phrase in %s for a learner at the %s difficulty level, focused on the topic/context of '%s'.

                INSTRUCTIONS:
                - The phrase must be completely in %s.
                - It should be natural and common in conversations.
                - The length should match the level: Beginner (1 short simple sentence), Intermediate (1-2 sentences), Advanced (2 sentences or a slightly complex/idiomatic expression).
                - Provide the meaning/translation in Tiếng Việt.
                - Provide a brief grammatical or cultural explanation or vocabulary tip in Tiếng Việt.

                Return a JSON object with strictly these keys:
                - "phrase": The generated phrase in %s.
                - "translation": The Vietnamese translation.
                - "explanation": The brief tip/note in Vietnamese.

                The output must be strictly valid JSON. Example:
                {
                  "phrase": "I'd like to reserve a table for two, please.",
                  "translation": "Tôi muốn đặt trước một bàn cho hai người.",
                  "explanation": "Sử dụng 'I'd like to' là cách lịch sự để đưa ra yêu cầu."
                }""".formatted(language, level, topic, language, language);
    }

    private static JsonNode tryParse(String content) {
        if (content == null || content.isBlank()) {
            return null;
        }
        try {
            return MAPPER.readTree(content);
        } catch (JsonProcessingException ex) {
            return null;
        }
    }

    private static String textOrDefault(JsonNode root, String name, String defaultValue) {
        JsonNode value = root.get(name);
        if (value == null || value.isNull() || !value.isValueNode()) {
            return defaultValue;
        }
        return value.asText();
    }
}
