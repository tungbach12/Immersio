package com.immersio.practice.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * HTTP client for the Azure Speech REST APIs used by the Practice module:
 * text-to-speech (SSML → MP3) and pronunciation assessment (short-form STT
 * with the {@code Pronunciation-Assessment} header). Endpoint derivation and
 * SSML generation mirror the legacy .NET PracticeController/PronunciationService.
 *
 * <p>Configuration (all optional, graceful empty defaults):</p>
 * <ul>
 *   <li>{@code azure.speech.api-key} — subscription key; empty means "not configured"</li>
 *   <li>{@code azure.speech.region} — Azure region, default {@code centralindia}</li>
 *   <li>{@code azure.speech.endpoint} — optional custom endpoint base override</li>
 * </ul>
 */
@Service
public class AzureSpeechClient {

    static final String DEFAULT_REGION = "centralindia";
    static final String DEFAULT_VOICE = "en-US-JennyNeural";
    static final String TTS_OUTPUT_FORMAT = "audio-16khz-64kbitrate-mono-mp3";
    static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(5);
    static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(20);

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final String apiKey;
    private final String region;
    private final String customEndpoint;
    private final HttpClient http;

    public AzureSpeechClient(
            @Value("${azure.speech.api-key:}") String apiKey,
            @Value("${azure.speech.region:centralindia}") String region,
            @Value("${azure.speech.endpoint:}") String customEndpoint) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.region = (region == null || region.isBlank()) ? DEFAULT_REGION : region.trim();
        this.customEndpoint = customEndpoint == null ? "" : customEndpoint.trim();
        this.http = HttpClient.newBuilder().connectTimeout(CONNECT_TIMEOUT).build();
    }

    /** True when a real (non-placeholder) Azure key is configured. */
    public boolean isConfigured() {
        return !apiKey.isBlank() && !apiKey.contains("YOUR_AZURE");
    }

    /**
     * Synthesizes speech for the given SSML content and returns MP3 bytes.
     *
     * @throws AzureSpeechException when Azure answers with a non-2xx status
     * @throws IOException if the request fails
     * @throws InterruptedException if the thread is interrupted
     */
    public byte[] synthesizeSpeech(String text, String voice, String style, Double styleDegree)
            throws IOException, InterruptedException {
        String ssml = buildSsml(text, voice, style, styleDegree);
        HttpRequest request = HttpRequest.newBuilder(URI.create(resolveTtsEndpoint(region, customEndpoint)))
                .timeout(REQUEST_TIMEOUT)
                .header("Ocp-Apim-Subscription-Key", apiKey)
                .header("User-Agent", "Immersio")
                .header("X-Microsoft-OutputFormat", TTS_OUTPUT_FORMAT)
                .header("Content-Type", "application/ssml+xml")
                .POST(HttpRequest.BodyPublishers.ofString(ssml, StandardCharsets.UTF_8))
                .build();
        HttpResponse<byte[]> response = http.send(request, HttpResponse.BodyHandlers.ofByteArray());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new AzureSpeechException(response.statusCode(),
                    new String(response.body() == null ? new byte[0] : response.body(), StandardCharsets.UTF_8));
        }
        return response.body();
    }

    /**
     * Runs Azure's pronunciation assessment against the uploaded audio and
     * returns the raw JSON response body (parsed by
     * {@link PronunciationAssessmentParser}).
     *
     * @throws AzureSpeechException when Azure answers with a non-2xx status
     * @throws IOException if the request fails
     * @throws InterruptedException if the thread is interrupted
     */
    public String assessPronunciation(byte[] audioBytes, String targetPhrase)
            throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder(URI.create(resolveSttEndpoint(region, customEndpoint)))
                .timeout(REQUEST_TIMEOUT)
                .header("Ocp-Apim-Subscription-Key", apiKey)
                .header("Pronunciation-Assessment", buildAssessmentParams(targetPhrase))
                .header("Content-Type", "audio/wav; codecs=audio/pcm; samplerate=16000")
                .POST(HttpRequest.BodyPublishers.ofByteArray(audioBytes))
                .build();
        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new AzureSpeechException(response.statusCode(),
                    response.body() == null ? "" : response.body());
        }
        return response.body();
    }

    // ------------------------------------------------------------------
    // Endpoint derivation (identical rules to the legacy backend)
    // ------------------------------------------------------------------

    static String resolveTtsEndpoint(String region, String customEndpoint) {
        String custom = customEndpoint == null ? "" : customEndpoint.trim();
        if (!custom.isEmpty() && !custom.contains("api.cognitive.microsoft.com")) {
            return withTrailingSlash(custom) + "cognitiveservices/v1";
        }
        return "https://" + region + ".tts.speech.microsoft.com/cognitiveservices/v1";
    }

    static String resolveSttEndpoint(String region, String customEndpoint) {
        String custom = customEndpoint == null ? "" : customEndpoint.trim();
        if (!custom.isEmpty() && !custom.contains("api.cognitive.microsoft.com")) {
            return withTrailingSlash(custom)
                    + "speech/recognition/conversation/cognitiveservices/v1?language=en-US";
        }
        return "https://" + region
                + ".stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US";
    }

    private static String withTrailingSlash(String base) {
        return base.endsWith("/") ? base : base + "/";
    }

    // ------------------------------------------------------------------
    // SSML / assessment parameter building
    // ------------------------------------------------------------------

    /** Derives the SSML {@code xml:lang} from a voice name (first 5 chars). */
    static String voiceLanguage(String voice) {
        if (voice != null && voice.length() >= 5) {
            String candidate = voice.substring(0, 5);
            if (candidate.contains("-")) {
                return candidate;
            }
        }
        return "en-US";
    }

    static String buildSsml(String text, String voice, String style, Double styleDegree) {
        String resolvedVoice = (voice == null || voice.isBlank()) ? DEFAULT_VOICE : voice.trim();
        String language = voiceLanguage(resolvedVoice);
        String escapedText = escapeXml(text);

        String voiceContent;
        if (style != null && !style.isBlank()) {
            double degree = (styleDegree == null || styleDegree == 0.0) ? 1.0 : styleDegree;
            degree = Math.min(2.0, Math.max(0.01, degree));
            voiceContent = "<mstts:express-as style=\"" + escapeXml(style)
                    + "\" styledegree=\"" + formatDegree(degree) + "\">"
                    + escapedText + "</mstts:express-as>";
        } else {
            voiceContent = escapedText;
        }

        return "<speak version='1.0'"
                + " xmlns='http://www.w3.org/2001/10/synthesis'"
                + " xmlns:mstts='http://www.w3.org/2001/mstts'"
                + " xml:lang='" + language + "'><voice name='" + escapeXml(resolvedVoice) + "'>"
                + voiceContent + "</voice></speak>";
    }

    /** Base64-encoded pronunciation assessment params, as Azure requires. */
    static String buildAssessmentParams(String targetPhrase) throws JsonProcessingException {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("ReferenceText", targetPhrase == null ? "" : targetPhrase);
        params.put("GradingSystem", "HundredMark");
        params.put("Granularity", "Phoneme");
        params.put("Dimension", "Comprehensive");
        byte[] json = MAPPER.writeValueAsString(params).getBytes(StandardCharsets.UTF_8);
        return Base64.getEncoder().encodeToString(json);
    }

    /** Same escape set as .NET {@code SecurityElement.Escape}. */
    static String escapeXml(String value) {
        if (value == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder(value.length() + 16);
        for (char c : value.toCharArray()) {
            switch (c) {
                case '&' -> sb.append("&amp;");
                case '<' -> sb.append("&lt;");
                case '>' -> sb.append("&gt;");
                case '"' -> sb.append("&quot;");
                case '\'' -> sb.append("&apos;");
                default -> sb.append(c);
            }
        }
        return sb.toString();
    }

    private static String formatDegree(double degree) {
        return BigDecimal.valueOf(degree).stripTrailingZeros().toPlainString();
    }
}
