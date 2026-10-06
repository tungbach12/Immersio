package com.immersio.scenarios.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.immersio.flashcards.api.dto.AddCardDto;
import com.immersio.scenarios.api.dto.CorrectionResultDto;
import com.immersio.scenarios.api.dto.ScenarioContextDto;
import com.immersio.scenarios.api.dto.SessionMessageDto;
import com.immersio.users.domain.SystemSetting;
import com.immersio.users.repository.SystemSettingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Scenarios module AI client — the Java port of the .NET {@code Immersio.Infrastructure.Services.LlmService}.
 *
 * <p>Configuration resolution mirrors .NET exactly:</p>
 * <ul>
 *   <li>Per-feature model configuration is read from the {@code SystemSettings} table
 *       ({@code ModelChat}, {@code ModelGrammar}, {@code ModelFeedback}, {@code ModelFlashcard}
 *       plus the shared {@code LlmEndpoint} and per-feature {@code ReasoningEffort*} keys) and
 *       cached for 30 seconds so concurrent grammar + chat calls never stampede the table.</li>
 *   <li>The API key is derived from the resolved endpoint: NVIDIA → {@code nvidia.api-key},
 *       StepFun → {@code stepfun.api-key}, opencode.ai → {@code opencode.api-key}, anything
 *       else → {@code groq.api-key} (same precedence as .NET).</li>
 *   <li>When the settings table cannot be read the client falls back to
 *       {@code llm.fallback-model} / {@code llm.fallback-endpoint} and the NVIDIA key —
 *       defaults identical to the .NET constants.</li>
 *   <li>Every resolution emits the {@code [AI DIAGNOSTICS]} console block .NET logged.</li>
 * </ul>
 *
 * <p>Property resolution order for keys (all graceful, empty defaults):
 * {@code nvidia.api-key} → {@code Nvidia__ApiKey} (production .env) → {@code NVIDIA_API_KEY}.</p>
 */
@Service
public class ScenarioLlmClient {

    private static final Logger log = LoggerFactory.getLogger(ScenarioLlmClient.class);

    // .NET LlmService constants — kept identical so fallback behaviour matches production.
    static final String DEFAULT_MODEL = "meta/llama-4-maverick-17b-128e-instruct";
    static final String DEFAULT_ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";

    /** .NET {@code ConfigCacheTtl} — short-lived snapshot of the SystemSettings rows. */
    static final Duration CONFIG_CACHE_TTL = Duration.ofSeconds(30);
    static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(10);
    /** .NET {@code HttpClient} default timeout. */
    static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(100);

    static final String SETTING_ENDPOINT = "LlmEndpoint";
    static final String SETTING_GENERIC_EFFORT = "ReasoningEffort";

    static final String MODEL_KEY_CHAT = "ModelChat";
    static final String MODEL_KEY_GRAMMAR = "ModelGrammar";
    static final String MODEL_KEY_FEEDBACK = "ModelFeedback";
    static final String MODEL_KEY_FLASHCARD = "ModelFlashcard";
    static final String MODEL_KEY_PHRASE = "ModelPhrase";

    static final String CORRECTION_EXPLANATION_DEFAULT = "Perfect!";
    static final String CHAT_NO_CONTENT_REPLY = "I am sorry, I couldn't understand that.";
    static final String CHAT_FAILURE_REPLY =
            "I am sorry, I am having trouble connecting to my mind right now. Please try again in a moment.";
    static final String FEEDBACK_NO_CONTENT_REPLY = "Great job practicing today!";
    static final String FEEDBACK_FAILURE_REPLY =
            "Great job practicing today! I'm currently unable to generate detailed feedback, but keep up the good work!";

    static final String FEEDBACK_SYSTEM_PROMPT = """
            Analyze the conversation and provide encouraging feedback (2-3 paragraphs) for a language learner. Highlight strengths and areas for improvement. Speak directly to the student.""";

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final DateTimeFormatter DIAGNOSTIC_TIME = DateTimeFormatter.ofPattern("HH:mm:ss");

    /** The {@code (model, endpoint, reasoning effort)} triplet read from {@code SystemSettings}. */
    record ModelConfig(String model, String endpoint, String reasoningEffort) {
    }

    /** Config snapshot plus the API key resolved from its endpoint. */
    record ResolvedConfig(String model, String endpoint, String apiKey, String reasoningEffort) {
    }

    private final SystemSettingRepository systemSettings;
    private final Map<String, String> apiKeys;
    private final String fallbackModel;
    private final String fallbackEndpoint;
    private final HttpClient http;

    private final Object configLock = new Object();
    private final Map<String, ModelConfig> configCache = new HashMap<>();
    private final Map<String, Instant> configStamp = new HashMap<>();

    public ScenarioLlmClient(
            SystemSettingRepository systemSettings,
            @Value("${nvidia.api-key:${Nvidia__ApiKey:${NVIDIA_API_KEY:}}}") String nvidiaApiKey,
            @Value("${groq.api-key:${Groq__ApiKey:${GROQ_API_KEY:}}}") String groqApiKey,
            @Value("${stepfun.api-key:${StepFun__ApiKey:${STEPFUN_API_KEY:}}}") String stepFunApiKey,
            @Value("${opencode.api-key:${OpenCode__ApiKey:${OPENCODE_API_KEY:}}}") String openCodeApiKey,
            @Value("${llm.fallback-model:" + DEFAULT_MODEL + "}") String fallbackModel,
            @Value("${llm.fallback-endpoint:" + DEFAULT_ENDPOINT + "}") String fallbackEndpoint) {
        this.systemSettings = systemSettings;
        this.apiKeys = Map.of(
                "nvidia", trimToEmpty(nvidiaApiKey),
                "stepfun", trimToEmpty(stepFunApiKey),
                "opencode", trimToEmpty(openCodeApiKey),
                "groq", trimToEmpty(groqApiKey));
        this.fallbackModel = trimToEmpty(fallbackModel).isEmpty() ? DEFAULT_MODEL : trimToEmpty(fallbackModel);
        this.fallbackEndpoint = trimToEmpty(fallbackEndpoint).isEmpty() ? DEFAULT_ENDPOINT : trimToEmpty(fallbackEndpoint);
        this.http = HttpClient.newBuilder().connectTimeout(CONNECT_TIMEOUT).build();
    }

    // ------------------------------------------------------------------
    // Public operations (mirrors the .NET ILLMService surface used by scenarios)
    // ------------------------------------------------------------------

    /** .NET {@code GenerateChatResponseAsync} — roleplay character reply with optional emotion tag. */
    public String generateChatResponse(String contextPrompt, String targetLanguage,
                                        List<SessionMessageDto> history, String userMessage,
                                        List<String> allowedEmotions) {
        ResolvedConfig config = resolve(MODEL_KEY_CHAT);
        String systemPrompt = chatSystemPrompt(contextPrompt, targetLanguage, allowedEmotions);

        List<Map<String, String>> payload = new ArrayList<>();
        payload.add(entry("system", systemPrompt));
        for (SessionMessageDto message : nullSafeList(history)) {
            String role = "user".equals(message.senderRole()) ? "user" : "assistant";
            payload.add(entry(role, nullSafe(message.text())));
        }
        if (shouldAppendCurrentMessage(history, userMessage)) {
            payload.add(entry("user", nullSafe(userMessage)));
        }

        Map<String, Object> body = buildRequestBody(config.model(), payload, 0.7, config.reasoningEffort(), 1024, false);
        try {
            String content = postChat(config, body, "GenerateChatResponseAsync");
            return content != null ? content : CHAT_NO_CONTENT_REPLY;
        } catch (Exception ex) {
            log.debug("Failed to generate chat response: {}", ex.getMessage());
            return CHAT_FAILURE_REPLY;
        }
    }

    /** .NET {@code AnalyzeGrammarAsync} — lenient spoken-speech grammar evaluation. */
    public CorrectionResultDto analyzeGrammar(String userMessage, String targetLanguage) {
        String message = nullSafe(userMessage);
        ResolvedConfig config = resolve(MODEL_KEY_GRAMMAR);
        Map<String, Object> body = buildRequestBody(config.model(), List.of(
                        entry("system", grammarSystemPrompt(targetLanguage)),
                        entry("user", message)),
                0.2, config.reasoningEffort(), 0, true);
        try {
            String content = postChat(config, body, "AnalyzeGrammarAsync");
            if (content != null && !content.isBlank()) {
                return parseGrammarContent(content, message);
            }
        } catch (Exception ex) {
            log.debug("Grammar analysis failed: {}", ex.getMessage());
        }
        return new CorrectionResultDto(message, CORRECTION_EXPLANATION_DEFAULT);
    }

    /** .NET {@code GenerateSessionFeedbackAsync} — free-form encouragement for the finished session. */
    public String generateSessionFeedback(String contextPrompt, List<SessionMessageDto> history) {
        ResolvedConfig config = resolve(MODEL_KEY_FEEDBACK);
        Map<String, Object> body = buildRequestBody(config.model(), List.of(
                        entry("system", FEEDBACK_SYSTEM_PROMPT),
                        entry("user", feedbackUserPrompt(contextPrompt, history))),
                0.7, config.reasoningEffort(), 0, false);
        try {
            String content = postChat(config, body, "GenerateSessionFeedbackAsync");
            return content != null ? content : FEEDBACK_NO_CONTENT_REPLY;
        } catch (Exception ex) {
            log.debug("Failed to generate session feedback: {}", ex.getMessage());
            return FEEDBACK_FAILURE_REPLY;
        }
    }

    /** .NET {@code GenerateFlashcardsAsync} — suggested deck candidates built at session finish. */
    public List<AddCardDto> generateFlashcards(List<SessionMessageDto> history, String targetLanguage,
                                               ScenarioContextDto scenario) {
        ResolvedConfig config = resolve(MODEL_KEY_FLASHCARD);
        Map<String, Object> body = buildRequestBody(config.model(), List.of(
                        entry("system", flashcardSystemPrompt(targetLanguage, scenario)),
                        entry("user", historyText(history))),
                0.2, config.reasoningEffort(), 0, true);
        try {
            return parseFlashcards(postChat(config, body, "GenerateFlashcardsAsync"));
        } catch (Exception ex) {
            log.debug("Flashcard extraction failed: {}", ex.getMessage());
            return List.of();
        }
    }

    /** .NET {@code GenerateCustomFlashcardsAsync} — user-selected category deck. */
    public List<AddCardDto> generateCustomFlashcards(List<SessionMessageDto> history, String targetLanguage,
                                                     List<String> options, ScenarioContextDto scenario) {
        ResolvedConfig config = resolve(MODEL_KEY_FLASHCARD);
        Map<String, Object> body = buildRequestBody(config.model(), List.of(
                        entry("system", customFlashcardSystemPrompt(targetLanguage, options, scenario)),
                        entry("user", historyText(history))),
                0.2, config.reasoningEffort(), 0, true);
        try {
            return parseFlashcards(postChat(config, body, "GenerateCustomFlashcardsAsync"));
        } catch (Exception ex) {
            log.debug("Flashcard extraction failed: {}", ex.getMessage());
            return List.of();
        }
    }

    // ------------------------------------------------------------------
    // SystemSettings-backed configuration (30s cache + diagnostics + fallback)
    // ------------------------------------------------------------------

    /**
     * Resolves the model/endpoint/key/effort quartet for a feature key. Concurrent callers
     * coalesce on the same snapshot (config reads happen under one lock — .NET used a
     * SemaphoreSlim for the same reason), snapshots expire after {@link #CONFIG_CACHE_TTL}.
     * Any failure degrades to the configured fallback instead of failing the request.
     */
    ResolvedConfig resolve(String modelKey) {
        try {
            ModelConfig snapshot;
            synchronized (configLock) {
                ModelConfig cached = configCache.get(modelKey);
                Instant stamp = configStamp.get(modelKey);
                if (cached != null && isFresh(stamp, Instant.now(), CONFIG_CACHE_TTL)) {
                    snapshot = cached;
                } else {
                    snapshot = readModelConfig(modelKey);
                    configCache.put(modelKey, snapshot);
                    configStamp.put(modelKey, Instant.now());
                }
            }
            String apiKey = resolveApiKey(snapshot.endpoint());
            logDiagnostics(modelKey, snapshot);
            return new ResolvedConfig(snapshot.model(), snapshot.endpoint(), apiKey, snapshot.reasoningEffort());
        } catch (Exception ex) {
            log.warn("\n[AI DIAGNOSTICS] Warning: Failed to resolve database AI settings (using fallback). Error: {}\n"
                            + "  -> Fallback Model: {}\n  -> Fallback Server:{}",
                    ex.getMessage(), fallbackModel, fallbackEndpoint);
            return new ResolvedConfig(fallbackModel, fallbackEndpoint, defaultApiKey(), "none");
        }
    }

    /** .NET freshness rule: {@code UtcNow - stamp < ConfigCacheTtl}. */
    static boolean isFresh(Instant stamp, Instant now, Duration ttl) {
        return stamp != null && Duration.between(stamp, now).compareTo(ttl) < 0;
    }

    ModelConfig readModelConfig(String modelKey) {
        String model = settingValue(modelKey).orElse(fallbackModel);
        String endpoint = settingValue(SETTING_ENDPOINT).orElse(fallbackEndpoint);
        return new ModelConfig(model, endpoint, effortValue(modelKey));
    }

    /** Per-feature effort key, falling back to the legacy generic {@code ReasoningEffort} row
     * only when the feature-specific row does not exist (same as .NET's {@code ??} chain). */
    private String effortValue(String modelKey) {
        Optional<SystemSetting> specific = systemSettings.findByKey(effortSettingKey(modelKey));
        Optional<SystemSetting> setting = specific.isPresent()
                ? specific
                : systemSettings.findByKey(SETTING_GENERIC_EFFORT);
        return setting.map(SystemSetting::getValue)
                .filter(value -> value != null && !value.isBlank())
                .orElse("none");
    }

    private Optional<String> settingValue(String key) {
        return systemSettings.findByKey(key)
                .map(SystemSetting::getValue)
                .filter(value -> value != null && !value.isBlank());
    }

    /** .NET {@code modelKey} → reasoning-effort setting key mapping. */
    static String effortSettingKey(String modelKey) {
        if (MODEL_KEY_CHAT.equals(modelKey)) {
            return "ReasoningEffortChat";
        }
        if (MODEL_KEY_GRAMMAR.equals(modelKey)) {
            return "ReasoningEffortGrammar";
        }
        if (MODEL_KEY_FEEDBACK.equals(modelKey)) {
            return "ReasoningEffortFeedback";
        }
        if (MODEL_KEY_FLASHCARD.equals(modelKey)) {
            return "ReasoningEffortFlashcard";
        }
        if (MODEL_KEY_PHRASE.equals(modelKey)) {
            return "ReasoningEffortPhrase";
        }
        return "ReasoningEffortChat";
    }

    /** .NET {@code ResolveApiKey}: endpoint substring → provider key, Groq as the catch-all. */
    String resolveApiKey(String endpoint) {
        String target = endpoint == null ? "" : endpoint.toLowerCase(Locale.ROOT);
        if (target.contains("nvidia")) {
            return apiKeys.get("nvidia");
        }
        if (target.contains("stepfun")) {
            return apiKeys.get("stepfun");
        }
        if (target.contains("opencode.ai")) {
            return apiKeys.get("opencode");
        }
        return apiKeys.get("groq");
    }

    /** .NET fallback key: {@code Nvidia:ApiKey ?? Groq:ApiKey ?? ""}. */
    private String defaultApiKey() {
        String nvidia = apiKeys.get("nvidia");
        return nvidia == null || nvidia.isBlank() ? apiKeys.get("groq") : nvidia;
    }

    private void logDiagnostics(String modelKey, ModelConfig config) {
        String reasoning = "none".equals(config.reasoningEffort())
                ? ""
                : "\n  -> Reasoning:      " + config.reasoningEffort();
        log.info("\n[AI DIAGNOSTICS] {} | Triggering AI Service: '{}'\n"
                        + "  -> Active Model:   {}\n  -> Target Server:  {}{}",
                LocalTime.now().format(DIAGNOSTIC_TIME), modelKey, config.model(), config.endpoint(), reasoning);
    }

    // ------------------------------------------------------------------
    // HTTP
    // ------------------------------------------------------------------

    private String postChat(ResolvedConfig config, Map<String, Object> body, String operation)
            throws IOException, InterruptedException {
        HttpRequest.Builder request = HttpRequest.newBuilder(URI.create(config.endpoint()))
                .timeout(REQUEST_TIMEOUT)
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(MAPPER.writeValueAsString(body), StandardCharsets.UTF_8));
        if (config.apiKey() != null && !config.apiKey().isBlank()) {
            request.header("Authorization", "Bearer " + config.apiKey());
        }
        HttpResponse<String> response = http.send(request.build(),
                HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            logError(operation, config.endpoint(), config.model(), response.statusCode(), response.body());
            throw new IOException("AI endpoint returned status " + response.statusCode());
        }
        return firstChoiceContent(response.body());
    }

    /** Content of the first chat-completion choice, or {@code null} when the payload has none. */
    static String firstChoiceContent(String responseBody) throws IOException {
        JsonNode choices = MAPPER.readTree(responseBody).path("choices");
        if (!choices.isArray() || choices.isEmpty()) {
            return null;
        }
        JsonNode content = choices.get(0).path("message").path("content");
        if (content.isNull() || !content.isTextual()) {
            return null;
        }
        return content.asText();
    }

    private static void logError(String operation, String endpoint, String model, int status, String body) {
        log.error("\n==================================================\n"
                        + "[LlmService ERROR - {}]\n"
                        + "Endpoint: {}\n"
                        + "Model: {}\n"
                        + "Status: {}\n"
                        + "Response Body: {}\n"
                        + "==================================================\n",
                operation, endpoint, model, status, body);
    }

    // ------------------------------------------------------------------
    // Request body (identical field semantics to .NET BuildRequestBody)
    // ------------------------------------------------------------------

    static Map<String, Object> buildRequestBody(String model, List<Map<String, String>> messages,
                                                double temperature, String reasoningEffort,
                                                int maxTokens, boolean jsonMode) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("messages", messages);
        body.put("temperature", temperature);
        body.put("stream", false);
        if (maxTokens > 0) {
            body.put("max_tokens", maxTokens);
        }
        if (jsonMode) {
            body.put("response_format", Map.of("type", "json_object"));
        }
        if (reasoningEffort != null && !reasoningEffort.isBlank() && !"none".equals(reasoningEffort)) {
            body.put("reasoning_effort", reasoningEffort);
        } else {
            // Hard-disable model reasoning for fast responses ("none" previously only omitted
            // the field; DeepSeek-family models reason anyway) — same as .NET.
            body.put("thinking", Map.of("type", "disabled"));
        }
        return body;
    }

    // ------------------------------------------------------------------
    // Prompt building
    // ------------------------------------------------------------------

    static String chatSystemPrompt(String contextPrompt, String targetLanguage, List<String> allowedEmotions) {
        String language = nullSafe(targetLanguage);
        StringBuilder prompt = new StringBuilder(
                """
                You are a roleplay character in a language learning app called IMMERSIO.

                RESPONSE LANGUAGE (HARD REQUIREMENT):
                You must write your ENTIRE reply in %s. Never reply in English or any other language, even if the scenario context or conversation history is written in another language. This rule overrides all other instructions.

                SCENARIO CONTEXT:
                %s

                INSTRUCTIONS:
                1. Write your entire reply in %s — never switch to English or another language.
                2. Stay in character at all times.
                3. Keep responses concise (1-3 sentences).
                4. Prioritize natural conversation flow.
                5. Do not break character.""".formatted(language, nullSafe(contextPrompt), language));
        if (allowedEmotions != null && !allowedEmotions.isEmpty()) {
            String emotionsList = allowedEmotions.stream()
                    .map(emotion -> "'" + (emotion == null ? "" : emotion) + "'")
                    .collect(Collectors.joining(", "));
            String firstEmotion = allowedEmotions.get(0) == null ? "happy" : allowedEmotions.get(0);
            prompt.append("\n6. You must choose one of the following emotions that fits your reply best: ")
                    .append(emotionsList)
                    .append(". You MUST start your response with `[EMOTION: <emotion_name>]`.")
                    .append(" For example: `[EMOTION: ").append(firstEmotion)
                    .append("] Hi! How can I help you today?` or similar.");
        }
        prompt.append("\nREMINDER: Your reply must be written entirely in ").append(language).append(".");
        return prompt.toString();
    }

    static String grammarSystemPrompt(String targetLanguage) {
        return """
                You are an expert language teacher and a lenient speech-to-text grammar evaluator for language learners speaking %s.
                Your primary task is to review the user's spoken sentence and determine if it has serious grammatical errors (e.g., incorrect tense, wrong verb conjugation, incorrect word order, or completely inappropriate word choice that distorts the meaning).

                CRITICAL RULES:
                1. STRICT LENIENCY FOR SPOKEN SPEECH: Spoken language is naturally informal and fragmented. NEVER correct minor punctuation, missing commas, periods, capitalization, or apostrophes (e.g., 'im' instead of 'I'm', or lack of question marks). These are NOT grammar errors.
                2. NO OVER-CORRECTION: If the user's sentence is natural, understandable, and commonly used by native speakers in daily conversation (even if simple, colloquial, or using casual slang), you MUST mark it as correct. Do not rephrase it to sound like a formal book.
                3. CORRECTION DIRECTION: If there is a genuine and serious error, correct it to be a natural spoken phrase in %s that preserves the user's original intent. Avoid complex or overly formal vocabulary in the correction.
                4. EXPLANATION: If there is no error, the explanation MUST be exactly 'Perfect!'. If there is an error, write a short, encouraging explanation in Vietnamese (Tiếng Việt) describing the mistake clearly and how to avoid it (keep it under 2 sentences).
                5. Output format: You must return a valid JSON object only, with no markdown wrappers or backticks. Example:
                {
                  "corrected": "(corrected sentence if errors exist, otherwise the exact original input)",
                  "explanation": "(EXACTLY 'Perfect!' if correct, otherwise a short Vietnamese explanation of the error)"
                }""".formatted(targetLanguage, targetLanguage);
    }

    static String feedbackUserPrompt(String contextPrompt, List<SessionMessageDto> history) {
        return "Context: " + nullSafe(contextPrompt) + "\n\nHistory:\n" + historyText(history);
    }

    static String flashcardSystemPrompt(String targetLanguage, ScenarioContextDto scenario) {
        String language = nullSafe(targetLanguage);
        String languageLower = language.toLowerCase(Locale.ROOT);
        ScenarioContextDto ctx = scenario == null
                ? new ScenarioContextDto(null, null, null, null, null)
                : scenario;
        return """
                You are an expert language acquisition assistant. Analyze the conversation history between the language learner (USER) and the AI character (ASSISTANT) in %1$s.

                LESSON CONTEXT (this MUST anchor every flashcard you generate — off-topic cards are forbidden):
                - Title: %2$s
                - Category: %3$s
                - CEFR level: %4$s
                - Objective: %5$s
                - Scene context: %6$s

                Identify between 3 and 15 flashcards that DIRECTLY support this lesson's learning goals.

                CRITICAL RULES:
                1. STAY ON TOPIC: Every flashcard must be relevant to "%7$s" (%8$s). Reject vocabulary, grammar or phrasing that — even if it appears in the dialog — is not useful for someone studying this specific scenario.
                2. SOURCE PRIORITY (in this order):
                   (a) Corrections of the USER's mistakes — highest priority.
                   (b) NEW key vocabulary, collocations, or set phrases that the ASSISTANT (NPC) introduced in this scenario context — these are exactly the items the user is meant to learn by encountering them in dialog. Include them even if the user did not say them.
                   (c) Useful idioms or collocations related to the scenario theme that the user could naturally use next time in this situation.
                   Do NOT invent words that were not in the dialog and NOT relevant to the scenario.
                3. LEVEL-APPROPRIATE: Target CEFR %9$s or one band above. Skip A1/A2 trivia (e.g., 'hello', 'yes', 'no') unless the user made a real error with them.
                4. NO NITPICKY CORRECTIONS: Focus only on significant grammatical errors or unnatural phrasings. Skip pedantic minor things that would feel mechanical.
                5. DYNAMIC CARD COUNT: More cards (up to 15) for longer/richer histories; minimum 3. Do not pad with filler — it is better to return 3 strong on-topic cards than 10 weak off-topic ones.
                6. POLYMORPHIC JSON STRUCTURE: You must categorize every card into one of three exact types ('vocab', 'grammar', 'sentence') and output it adhering strictly to this schema:

                   - TYPE 1: 'vocab' (For vocabulary terms the user struggled with or tried to use)
                     * Schema:
                       {
                         "type": "vocab",
                         "meta": { "tags": ["%10$s", "vocab", "academic"] },
                         "content": {
                           "word": "meticulous",
                           "part_of_speech": "adj",
                           "phonetic": "/məˈtɪk.jə.ləs/",
                           "audio_url": "",
                           "meaning": "Rất cẩn thận, tỉ mỉ, chú ý đến từng chi tiết nhỏ.",
                           "definition_en": "Very careful and precise; showing great attention to detail.",
                           "examples": [
                             { "sentence": "Many hours of meticulous preparation have gone into writing the book.", "translation": "Nhiều giờ chuẩn bị tỉ mỉ đã được dành cho việc viết cuốn sách." }
                           ],
                           "synonyms": ["thorough", "scrupulous", "detailed"],
                           "antonyms": ["careless", "negligent"]
                         }
                       }

                   - TYPE 2: 'grammar' (For sentences containing grammatical errors made by the user)
                     * Schema:
                       {
                         "type": "grammar",
                         "meta": { "tags": ["%11$s", "grammar"] },
                         "content": {
                           "title": "Simple Past vs Present Perfect (Thì Quá khứ đơn)",
                           "formula": [
                             { "form": "Khẳng định", "structure": "S + V2/ed" },
                             { "form": "Phủ định", "structure": "S + did + not + V_inf" }
                           ],
                           "usage": "Diễn tả hành động đã xảy ra và chấm dứt hoàn toàn trong quá khứ.",
                           "signal_words": ["yesterday", "ago", "last year"],
                           "examples": [
                             { "sentence": "I went to school yesterday.", "translation": "Tôi đã đi học ngày hôm qua.", "note": "Dùng động từ bất quy tắc 'went' thay vì 'goes'." }
                           ],
                           "common_mistakes": "Tránh nhầm lẫn với quá khứ đơn khi có mốc thời gian cụ thể (Ví dụ: KHÔNG dùng 'I have seen him yesterday')."
                         }
                       }
                       *Note: In grammar cards, the example sentence in 'content.examples' should be the corrected sentence."

                   - TYPE 3: 'sentence' (For phrasings, idioms, or collocations that the user can improve or study, using Cloze deletion)
                     * Schema:
                       {
                         "type": "sentence",
                         "meta": { "tags": ["%12$s", "collocation"] },
                         "content": {
                           "full_sentence": "We need to take into account all the factors before making a decision.",
                           "cloze_sentence": "We need to {{c1::take into account}} all the factors before making a decision.",
                           "translation": "Chúng ta cần cân nhắc/tính đến tất cả các yếu tố trước khi đưa ra quyết định.",
                           "target_phrase": "take into account",
                           "phrase_meaning": "Cân nhắc, tính đến một yếu tố nào đó khi xem xét một tình huống.",
                           "context_note": "Đồng nghĩa với 'take into consideration'."
                         }
                       }

                Return a JSON object with a "flashcards" key containing an array of objects. Each object must strictly match one of the three structures above.

                The output must be strictly valid JSON. Example:
                {
                  "flashcards": [
                    {
                      "type": "vocab",
                      "meta": { "tags": ["english", "vocab"] },
                      "content": {
                        "word": "meticulous",
                        "part_of_speech": "adj",
                        "phonetic": "/məˈtɪk.jə.ləs/",
                        "audio_url": "",
                        "meaning": "Rất cẩn thận, tỉ mỉ, chú ý đến từng chi tiết nhỏ.",
                        "definition_en": "Very careful and precise; showing great attention to detail.",
                        "examples": [
                          { "sentence": "Many hours of meticulous preparation have gone into writing the book.", "translation": "Nhiều giờ chuẩn bị tỉ mỉ đã được dành cho việc viết cuốn sách." }
                        ],
                        "synonyms": ["thorough", "scrupulous"],
                        "antonyms": ["careless"]
                      }
                    }
                  ]
                }""".formatted(
                language,
                nullSafe(ctx.title()), nullSafe(ctx.category()), nullSafe(ctx.level()),
                nullSafe(ctx.description()), nullSafe(ctx.contextPrompt()),
                nullSafe(ctx.title()), nullSafe(ctx.category()), nullSafe(ctx.level()),
                languageLower, languageLower, languageLower);
    }

    static String customFlashcardSystemPrompt(String targetLanguage, List<String> options,
                                              ScenarioContextDto scenario) {
        String language = nullSafe(targetLanguage);
        String languageLower = language.toLowerCase(Locale.ROOT);
        String optionsCsv = options == null ? "" : String.join(", ", options);
        ScenarioContextDto ctx = scenario == null
                ? new ScenarioContextDto(null, null, null, null, null)
                : scenario;
        return """
                You are an expert language acquisition assistant. Analyze the conversation history between the language learner (USER) and the AI character (ASSISTANT) in %1$s.

                LESSON CONTEXT (must anchor every card; off-topic cards are forbidden):
                - Title: %2$s
                - Category: %3$s
                - CEFR level: %4$s
                - Objective: %5$s
                - Scene context: %6$s

                Generate flashcards covering ONLY these selected categories: [%7$s], anchored to this scenario.

                CRITICAL RULES:
                1. STAY ON TOPIC: Every flashcard must be relevant to "%8$s" (%9$s). Skip dialog material that is off-topic for this scenario.
                2. SOURCE PRIORITY (in this order): (a) corrections of USER mistakes; (b) NEW key vocabulary, collocations, or set phrases the ASSISTANT (NPC) introduced in this scenario context — include them even if the user did not say them, since they are exactly what the user is meant to learn by encountering them; (c) idioms/collocations the user could naturally use next time in this situation. Do NOT invent items that were absent from the dialog and not relevant to the scenario.
                3. LEVEL-APPROPRIATE: Target CEFR %10$s or one band above. Skip trivial A1/A2 items (e.g., 'hello', 'yes', 'no') unless the user made a real error with them.
                4. NO NITPICKY CORRECTIONS: Focus only on significant grammatical errors or unnatural phrasings. Skip pedantic minor issues that feel mechanical.
                5. CATEGORY COMPLIANCE & POLYMORPHIC JSON STRUCTURE: You must categorize every card into one of three exact types ('vocab', 'grammar', 'sentence') and output it adhering strictly to this schema, depending on the requested categories:

                   - If 'grammar' is selected, generate 'grammar' cards (For sentences containing grammatical errors made by the user):
                     * Schema:
                       {
                         "type": "grammar",
                         "meta": { "tags": ["%11$s", "grammar"] },
                         "content": {
                           "title": "Simple Past vs Present Perfect (Thì Quá khứ đơn)",
                           "formula": [
                             { "form": "Khẳng định", "structure": "S + V2/ed" },
                             { "form": "Phủ định", "structure": "S + did + not + V_inf" }
                           ],
                           "usage": "Diễn tả hành động đã xảy ra và chấm dứt hoàn toàn trong quá khứ.",
                           "signal_words": ["yesterday", "ago", "last year"],
                           "examples": [
                             { "sentence": "I went to school yesterday.", "translation": "Tôi đã đi học ngày hôm qua.", "note": "Dùng động từ bất quy tắc 'went' thay vì 'goes'." }
                           ],
                           "common_mistakes": "Tránh nhầm lẫn với quá khứ đơn khi có mốc thời gian cụ thể (Ví dụ: KHÔNG dùng 'I have seen him yesterday')."
                         }
                       }

                   - If 'vocabulary' is selected, generate 'vocab' cards (For vocabulary terms the user struggled with or tried to use):
                     * Schema:
                       {
                         "type": "vocab",
                         "meta": { "tags": ["%12$s", "vocab", "academic"] },
                         "content": {
                           "word": "meticulous",
                           "part_of_speech": "adj",
                           "phonetic": "/məˈtɪk.jə.ləs/",
                           "audio_url": "",
                           "meaning": "Rất cẩn thận, tỉ mỉ, chú ý đến từng chi tiết nhỏ.",
                           "definition_en": "Very careful and precise; showing great attention to detail.",
                           "examples": [
                             { "sentence": "Many hours of meticulous preparation have gone into writing the book.", "translation": "Nhiều giờ chuẩn bị tỉ mỉ đã được dành cho việc viết cuốn sách." }
                           ],
                           "synonyms": ["thorough", "scrupulous", "detailed"],
                           "antonyms": ["careless", "negligent"]
                         }
                       }

                   - If 'improvement' is selected, generate 'sentence' cards (For phrasings, idioms, or collocations that the user can improve or study, using Cloze deletion):
                     * Schema:
                       {
                         "type": "sentence",
                         "meta": { "tags": ["%13$s", "collocation"] },
                         "content": {
                           "full_sentence": "We need to take into account all the factors before making a decision.",
                           "cloze_sentence": "We need to {{c1::take into account}} all the factors before making a decision.",
                           "translation": "Chúng ta cần cân nhắc/tính đến tất cả các yếu tố trước khi đưa ra quyết định.",
                           "target_phrase": "take into account",
                           "phrase_meaning": "Cân nhắc, tính đến một yếu tố nào đó khi xem xét một tình huống.",
                           "context_note": "Đồng nghĩa với 'take into consideration'."
                         }
                       }

                6. NO TRIVIAL CARDS: Do not include basic words (e.g., 'hello', 'yes', 'no', 'good') unless they were corrected.
                7. DYNAMIC CARD COUNT: Generate 3 to 15 cards. Quality over quantity — better to return 3 strong on-topic cards than 10 weak off-topic ones.

                Return a JSON object with a "flashcards" key containing an array of objects. Each object must strictly match one of the three structures above.

                The output must be strictly valid JSON.""".formatted(
                language,
                nullSafe(ctx.title()), nullSafe(ctx.category()), nullSafe(ctx.level()),
                nullSafe(ctx.description()), nullSafe(ctx.contextPrompt()), optionsCsv,
                nullSafe(ctx.title()), nullSafe(ctx.category()), nullSafe(ctx.level()),
                languageLower, languageLower, languageLower);
    }

    /** .NET role-play opening translation prompt used by {@code StartSessionAsync}. */
    static String translationContextPrompt(String language, String initialMessage) {
        return "You are a professional language translator. Translate the following opening roleplay dialog "
                + "sentence of a scenario into " + nullSafe(language) + ". Return ONLY the direct translation, "
                + "with absolutely no other comments, explanations or markdown quotation: \""
                + nullSafe(initialMessage) + "\"";
    }

    /** .NET {@code string.Join("\n", history.Select(m => $"{m.Role}: {m.Text}"))}. */
    static String historyText(List<SessionMessageDto> history) {
        return nullSafeList(history).stream()
                .map(message -> nullSafe(message.senderRole()) + ": " + nullSafe(message.text()))
                .collect(Collectors.joining("\n"));
    }

    /**
     * .NET only appends the current user message when history is empty or its last entry is not
     * already this exact user message.
     */
    static boolean shouldAppendCurrentMessage(List<SessionMessageDto> history, String userMessage) {
        List<SessionMessageDto> messages = nullSafeList(history);
        if (messages.isEmpty()) {
            return true;
        }
        SessionMessageDto last = messages.get(messages.size() - 1);
        return !nullSafe(userMessage).equals(nullSafe(last.text())) || !"user".equals(last.senderRole());
    }

    // ------------------------------------------------------------------
    // Response parsing (pure, unit tested)
    // ------------------------------------------------------------------

    /** .NET grammar extraction — never throws; falls back to the original message + 'Perfect!'. */
    static CorrectionResultDto parseGrammarContent(String content, String originalMessage) {
        String corrected = originalMessage;
        String explanation = CORRECTION_EXPLANATION_DEFAULT;
        JsonNode root = tryParse(content);
        if (root != null && root.isObject()) {
            String correctedValue = textOrNull(root, "corrected");
            if (correctedValue != null) {
                corrected = correctedValue;
            }
            String explanationValue = textOrNull(root, "explanation");
            if (explanationValue != null) {
                explanation = explanationValue;
            }
        }
        return new CorrectionResultDto(corrected, explanation);
    }

    /** .NET flashcard extraction with its 'Review' fallbacks so no card is built from raw JSON. */
    static List<AddCardDto> parseFlashcards(String content) {
        List<AddCardDto> flashcards = new ArrayList<>();
        JsonNode root = tryParse(cleanJson(content));
        if (root == null) {
            return flashcards;
        }
        JsonNode list = root.path("flashcards");
        if (!list.isArray()) {
            return flashcards;
        }
        for (JsonNode item : list) {
            JsonNode typeNode = item.path("type");
            String type = typeNode.isTextual() ? typeNode.asText() : "vocab";

            String front = "";
            String back = "";
            String explanation = "";
            String tag = type;

            if (item.has("content")) {
                JsonNode cardContent = item.path("content");
                if ("vocab".equals(type)) {
                    String word = textOrEmpty(cardContent, "word");
                    String meaning = textOrEmpty(cardContent, "meaning");
                    front = word;
                    back = meaning;
                    explanation = "Definition: " + textOrEmpty(cardContent, "definition_en") + "\nWord: " + word;
                } else if ("grammar".equals(type)) {
                    String title = textOrEmpty(cardContent, "title");
                    String usage = textOrEmpty(cardContent, "usage");
                    front = title;
                    back = usage;
                    explanation = "Usage: " + usage;
                } else if ("sentence".equals(type)) {
                    String full = textOrEmpty(cardContent, "full_sentence");
                    String translation = textOrEmpty(cardContent, "translation");
                    front = full;
                    back = translation;
                    explanation = "Sentence: " + full;
                }
            }

            if (front == null || front.isBlank()) {
                front = back == null || back.isBlank() ? "Review" : back;
            }
            if (back == null || back.isBlank()) {
                back = "Review";
            }
            if (front != null && !front.isBlank()) {
                flashcards.add(new AddCardDto(front, back, explanation, tag));
            }
        }
        return flashcards;
    }

    /** .NET {@code CleanJsonContent} — strips Markdown code fences the model wraps around JSON. */
    static String cleanJson(String content) {
        if (content == null || content.isBlank()) {
            return content;
        }
        String trimmed = content.trim();
        if (!trimmed.startsWith("```")) {
            return trimmed;
        }
        StringBuilder cleaned = new StringBuilder(trimmed.length());
        for (String line : trimmed.split("\n", -1)) {
            if (line.trim().startsWith("```")) {
                continue;
            }
            if (cleaned.length() > 0) {
                cleaned.append('\n');
            }
            cleaned.append(line);
        }
        return cleaned.toString().trim();
    }

    // ------------------------------------------------------------------
    // Small helpers
    // ------------------------------------------------------------------

    private static Map<String, String> entry(String role, String content) {
        Map<String, String> message = new LinkedHashMap<>();
        message.put("role", role);
        message.put("content", content);
        return message;
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

    private static String textOrNull(JsonNode node, String field) {
        JsonNode value = node == null ? null : node.get(field);
        if (value == null || value.isNull() || !value.isValueNode()) {
            return null;
        }
        return value.asText();
    }

    private static String textOrEmpty(JsonNode node, String field) {
        String value = textOrNull(node, field);
        return value == null ? "" : value;
    }

    private static List<SessionMessageDto> nullSafeList(List<SessionMessageDto> history) {
        return history == null ? List.of() : history;
    }

    private static String nullSafe(String value) {
        return value == null ? "" : value;
    }

    private static String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }
}
