package com.immersio.practice.service;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pure-logic tests for endpoint derivation, SSML generation and the
 * pronunciation assessment header — all ported from the legacy .NET code.
 */
class AzureSpeechClientTest {

    // ------------------------------------------------------------------
    // Configuration
    // ------------------------------------------------------------------

    @Test
    void treatsMissingOrPlaceholderKeyAsUnconfigured() {
        assertThat(new AzureSpeechClient("", "centralindia", "").isConfigured()).isFalse();
        assertThat(new AzureSpeechClient(null, "centralindia", "").isConfigured()).isFalse();
        assertThat(new AzureSpeechClient("  ", "centralindia", "").isConfigured()).isFalse();
        assertThat(new AzureSpeechClient("YOUR_AZURE_SPEECH_KEY", "centralindia", "").isConfigured()).isFalse();
        assertThat(new AzureSpeechClient("real-key-123", "centralindia", "").isConfigured()).isTrue();
    }

    // ------------------------------------------------------------------
    // Endpoints
    // ------------------------------------------------------------------

    @Test
    void buildsDefaultTtsEndpointFromRegion() {
        assertThat(AzureSpeechClient.resolveTtsEndpoint("centralindia", ""))
                .isEqualTo("https://centralindia.tts.speech.microsoft.com/cognitiveservices/v1");
        assertThat(AzureSpeechClient.resolveTtsEndpoint("centralindia", null))
                .isEqualTo("https://centralindia.tts.speech.microsoft.com/cognitiveservices/v1");
    }

    @Test
    void buildsCustomTtsEndpointWithoutDoubleSlash() {
        assertThat(AzureSpeechClient.resolveTtsEndpoint("westus", "https://proxy.example.com"))
                .isEqualTo("https://proxy.example.com/cognitiveservices/v1");
        assertThat(AzureSpeechClient.resolveTtsEndpoint("westus", "https://proxy.example.com/"))
                .isEqualTo("https://proxy.example.com/cognitiveservices/v1");
    }

    @Test
    void ignoresCustomEndpointWhenItPointsAtCognitiveServices() {
        assertThat(AzureSpeechClient.resolveTtsEndpoint("westus", "https://westus.api.cognitive.microsoft.com"))
                .isEqualTo("https://westus.tts.speech.microsoft.com/cognitiveservices/v1");
        assertThat(AzureSpeechClient.resolveSttEndpoint("westus", "https://westus.api.cognitive.microsoft.com/path"))
                .isEqualTo("https://westus.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US");
    }

    @Test
    void buildsSttEndpointWithLanguageParameter() {
        assertThat(AzureSpeechClient.resolveSttEndpoint("centralindia", ""))
                .isEqualTo("https://centralindia.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US");
        assertThat(AzureSpeechClient.resolveSttEndpoint("westus", "https://speech.example.org"))
                .isEqualTo("https://speech.example.org/speech/recognition/conversation/cognitiveservices/v1?language=en-US");
    }

    // ------------------------------------------------------------------
    // SSML
    // ------------------------------------------------------------------

    @Test
    void derivesLanguageFromVoiceName() {
        assertThat(AzureSpeechClient.voiceLanguage("en-US-JennyNeural")).isEqualTo("en-US");
        assertThat(AzureSpeechClient.voiceLanguage("vi-VN-HoaiMyNeural")).isEqualTo("vi-VN");
        assertThat(AzureSpeechClient.voiceLanguage("abcdef")).isEqualTo("en-US");
        assertThat(AzureSpeechClient.voiceLanguage("ab")).isEqualTo("en-US");
        assertThat(AzureSpeechClient.voiceLanguage(null)).isEqualTo("en-US");
    }

    @Test
    void buildsPlainSsmlWithDefaultVoiceAndEscapedText() {
        String ssml = AzureSpeechClient.buildSsml("Tom & Jerry <3", null, null, null);

        assertThat(ssml).contains("xml:lang='en-US'");
        assertThat(ssml).contains("<voice name='en-US-JennyNeural'>");
        assertThat(ssml).contains("Tom &amp; Jerry &lt;3");
        assertThat(ssml).doesNotContain("mstts:express-as");
        assertThat(ssml).startsWith("<speak version='1.0'");
    }

    @Test
    void buildsStyledSsmlWithClampedStyleDegree() {
        String ssml = AzureSpeechClient.buildSsml("Hi", "vi-VN-HoaiMyNeural", "cheerful", 1.5);

        assertThat(ssml).contains("xml:lang='vi-VN'");
        assertThat(ssml).contains("<voice name='vi-VN-HoaiMyNeural'>");
        assertThat(ssml).contains("<mstts:express-as style=\"cheerful\" styledegree=\"1.5\">Hi</mstts:express-as>");
    }

    @Test
    void clampsAndDefaultsStyleDegreeLikeNet() {
        assertThat(AzureSpeechClient.buildSsml("x", null, "friendly", null))
                .contains("styledegree=\"1\"");
        assertThat(AzureSpeechClient.buildSsml("x", null, "friendly", 0.0))
                .contains("styledegree=\"1\"");
        assertThat(AzureSpeechClient.buildSsml("x", null, "friendly", 3.5))
                .contains("styledegree=\"2\"");
        assertThat(AzureSpeechClient.buildSsml("x", null, "friendly", 0.001))
                .contains("styledegree=\"0.01\"");
        assertThat(AzureSpeechClient.buildSsml("x", null, "friendly", -4.0))
                .contains("styledegree=\"0.01\"");
    }

    @Test
    void escapesXmlSpecialCharacters() {
        assertThat(AzureSpeechClient.escapeXml("a & b < c > d \" e ' f"))
                .isEqualTo("a &amp; b &lt; c &gt; d &quot; e &apos; f");
        assertThat(AzureSpeechClient.escapeXml(null)).isEmpty();
    }

    // ------------------------------------------------------------------
    // Pronunciation assessment header
    // ------------------------------------------------------------------

    @Test
    void buildsBase64AssessmentParams() throws Exception {
        String encoded = AzureSpeechClient.buildAssessmentParams("Say \"hi\" & bye");
        String json = new String(Base64.getDecoder().decode(encoded), StandardCharsets.UTF_8);

        assertThat(json).contains("\"ReferenceText\":\"Say \\\"hi\\\" & bye\"");
        assertThat(json).contains("\"GradingSystem\":\"HundredMark\"");
        assertThat(json).contains("\"Granularity\":\"Phoneme\"");
        assertThat(json).contains("\"Dimension\":\"Comprehensive\"");
    }
}
