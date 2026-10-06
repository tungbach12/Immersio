package com.immersio.practice.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * TDD RED: pure voice-mapping logic for {@code RouterTtsClient}.
 */
class RouterTtsClientTest {

    @Test
    @DisplayName("passes through Azure-style Neural voice names to edge-tts")
    void mapsAzureVoiceToEdgeTtsModel() {
        assertThat(RouterTtsClient.ttsModel("en-US-JennyNeural"))
                .isEqualTo("edge-tts/en-US-JennyNeural");
        assertThat(RouterTtsClient.ttsModel("vi-VN-HoaiMyNeural"))
                .isEqualTo("edge-tts/vi-VN-HoaiMyNeural");
    }

    @Test
    @DisplayName("falls back to locale-appropriate default voices when blank")
    void defaultsVoiceByLanguageWhenBlank() {
        assertThat(RouterTtsClient.ttsModelFor("", "Japanese")).isEqualTo("edge-tts/ja-JP-NanamiNeural");
        assertThat(RouterTtsClient.ttsModelFor(null, "English")).isEqualTo("edge-tts/en-US-JennyNeural");
        assertThat(RouterTtsClient.ttsModelFor("  ", "Vietnamese")).isEqualTo("edge-tts/vi-VN-HoaiMyNeural");
    }

    @Test
    @DisplayName("trims whitespace from explicit voice names")
    void trimsExplicitVoice() {
        assertThat(RouterTtsClient.ttsModel("  en-US-JennyNeural  ")).isEqualTo("edge-tts/en-US-JennyNeural");
    }
}
