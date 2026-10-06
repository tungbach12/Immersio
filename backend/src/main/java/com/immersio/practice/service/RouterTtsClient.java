package com.immersio.practice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.Locale;
import java.util.Map;

/**
 * TTS client for the 9Router {@code POST /v1/audio/speech} endpoint
 * (OpenAI-compatible speech shape: {@code {model, input}} → raw audio bytes).
 *
 * <p>Voice names are the Microsoft Neural voice IDs the frontend already sends
 * (e.g. {@code en-US-JennyNeural}), prefixed with {@code edge-tts/} — 9Router's
 * no-auth Edge TTS adapter speaks the same voice catalog, so no frontend change
 * is needed. Expressive style/styleDegree are dropped: Edge TTS has no
 * equivalent of Azure's {@code mstts:express-as}.</p>
 *
 * <p>Configuration (graceful empty defaults):</p>
 * <ul>
 *   <li>{@code nine-router.base-url} — default {@code https://9routerhelios.duckdns.org/v1}</li>
 *   <li>{@code nine-router.api-key} — sent as {@code Authorization: *** when set</li>
 * </ul>
 */
@Service
public class RouterTtsClient {

    static final String DEFAULT_BASE_URL = "https://9routerhelios.duckdns.org/v1";
    static final String AUDIO_SPEECH_PATH = "/audio/speech";
    static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(5);
    static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(30);

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final String apiKey;
    private final String baseUrl;
    private final HttpClient http;

    public RouterTtsClient(
            @Value("${nine-router.base-url:https://9routerhelios.duckdns.org/v1}") String baseUrl,
            @Value("${nine-router.api-key:${NINE_ROUTER_API_KEY:}}") String apiKey) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        String trimmedBase = baseUrl == null ? "" : baseUrl.trim();
        this.baseUrl = trimmedBase.replaceAll("/+$", "");
        this.http = HttpClient.newBuilder().connectTimeout(CONNECT_TIMEOUT).build();
    }

    /** True when a 9Router API key is configured. */
    public boolean isConfigured() {
        return !apiKey.isBlank();
    }

    /**
     * Synthesizes speech and returns the raw audio bytes.
     *
     * @throws RouterTtsException when 9Router answers with a non-2xx status
     * @throws IOException if the request fails
     * @throws InterruptedException if the thread is interrupted
     */
    public byte[] synthesize(String text, String voice, String language)
            throws IOException, InterruptedException {
        if (baseUrl.isEmpty()) {
            throw new IOException("9Router endpoint is not configured.");
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", ttsModelFor(voice, language));
        body.put("input", text == null ? "" : text);

        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(baseUrl + AUDIO_SPEECH_PATH))
                .timeout(REQUEST_TIMEOUT)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(MAPPER.writeValueAsString(body), StandardCharsets.UTF_8));
        if (!apiKey.isEmpty()) {
            builder.header("Authorization", "Bearer " + apiKey);
        }

        HttpResponse<byte[]> response = http.send(builder.build(), HttpResponse.BodyHandlers.ofByteArray());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            String detail = response.body() == null ? "" : new String(response.body(), StandardCharsets.UTF_8);
            throw new RouterTtsException(response.statusCode(), detail);
        }
        return response.body();
    }

    /** Maps an explicit voice name to its 9Router model id. */
    static String ttsModel(String voice) {
        return "edge-tts/" + voice.trim();
    }

    /** Resolves the 9Router TTS model, defaulting by language when voice is blank. */
    static String ttsModelFor(String voice, String language) {
        if (voice != null && !voice.isBlank()) {
            return ttsModel(voice);
        }
        return "edge-tts/" + defaultVoice(language);
    }

    /** Locale-appropriate Neural voice per language (matches Azure catalog names). */
    static String defaultVoice(String language) {
        String lang = language == null ? "" : language.toLowerCase(Locale.ROOT);
        if (lang.contains("japanese") || lang.equals("ja") || lang.contains("ja-jp")) {
            return "ja-JP-NanamiNeural";
        }
        if (lang.contains("vietnamese") || lang.equals("vi") || lang.contains("vi-vn")) {
            return "vi-VN-HoaiMyNeural";
        }
        if (lang.contains("chinese") || lang.equals("zh") || lang.contains("zh-cn")) {
            return "zh-CN-XiaoxiaoNeural";
        }
        if (lang.contains("french") || lang.equals("fr") || lang.contains("fr-fr")) {
            return "fr-FR-DeniseNeural";
        }
        return "en-US-JennyNeural";
    }
}
