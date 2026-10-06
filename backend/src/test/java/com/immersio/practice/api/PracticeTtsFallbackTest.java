package com.immersio.practice.api;

import com.immersio.practice.api.dto.TtsRequest;
import com.immersio.practice.service.AzureSpeechClient;
import com.immersio.practice.service.PronunciationService;
import com.immersio.practice.service.RouterTtsClient;
import com.immersio.practice.service.RouterTtsException;
import com.immersio.shared.security.JwtTokenProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * TDD: /tts must fall back to Azure when 9Router is configured but FAILS,
 * not only when the 9Router key is missing.
 */
class PracticeTtsFallbackTest {

    private final PronunciationService service = mock(PronunciationService.class);
    private final AzureSpeechClient azure = mock(AzureSpeechClient.class);
    private final RouterTtsClient routerTts = mock(RouterTtsClient.class);
    private final JwtTokenProvider jwt = mock(JwtTokenProvider.class);

    private PracticeController controller() {
        return new PracticeController(service, azure, routerTts, jwt);
    }

    @Test
    @DisplayName("uses 9Router when it succeeds (no Azure call)")
    void prefersRouterWhenHealthy() throws Exception {
        when(routerTts.isConfigured()).thenReturn(true);
        when(azure.isConfigured()).thenReturn(true);
        when(routerTts.synthesize(any(), any(), any())).thenReturn(new byte[]{1, 2, 3});

        ResponseEntity<?> response = controller().tts(new TtsRequest("hi", "en-US-JennyNeural", null, null));

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo(new byte[]{1, 2, 3});
        verify(azure, never()).synthesizeSpeech(any(), any(), any(), any());
    }

    @Test
    @DisplayName("falls back to Azure when 9Router fails and Azure is configured")
    void fallsBackToAzureOnRouterFailure() throws Exception {
        when(routerTts.isConfigured()).thenReturn(true);
        when(azure.isConfigured()).thenReturn(true);
        when(routerTts.synthesize(any(), any(), any()))
                .thenThrow(new RouterTtsException(502, "upstream down"));
        when(azure.synthesizeSpeech(any(), any(), any(), any())).thenReturn(new byte[]{9, 9});

        ResponseEntity<?> response = controller().tts(new TtsRequest("hi", "en-US-JennyNeural", "chat", 1.0));

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo(new byte[]{9, 9});
    }

    @Test
    @DisplayName("surfaces the 9Router error when it fails and Azure is NOT configured")
    void surfacesRouterErrorWhenNoAzureFallback() throws Exception {
        when(routerTts.isConfigured()).thenReturn(true);
        when(azure.isConfigured()).thenReturn(false);
        when(routerTts.synthesize(any(), any(), any()))
                .thenThrow(new RouterTtsException(502, "upstream down"));

        ResponseEntity<?> response = controller().tts(new TtsRequest("hi", "en-US-JennyNeural", null, null));

        assertThat(response.getStatusCode().value()).isEqualTo(502);
        verify(azure, never()).synthesizeSpeech(any(), any(), any(), any());
    }

    @Test
    @DisplayName("uses Azure directly when 9Router has no key")
    void usesAzureWhenRouterUnconfigured() throws Exception {
        when(routerTts.isConfigured()).thenReturn(false);
        when(azure.isConfigured()).thenReturn(true);
        when(azure.synthesizeSpeech(any(), any(), any(), any())).thenReturn(new byte[]{7});

        ResponseEntity<?> response = controller().tts(new TtsRequest("hi", "en-US-JennyNeural", null, null));

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo(new byte[]{7});
        verify(routerTts, never()).synthesize(any(), any(), any());
    }

    @Test
    @DisplayName("400 when neither provider is configured")
    void badRequestWhenNothingConfigured() {
        when(routerTts.isConfigured()).thenReturn(false);
        when(azure.isConfigured()).thenReturn(false);

        ResponseEntity<?> response = controller().tts(new TtsRequest("hi", "en-US-JennyNeural", null, null));

        assertThat(response.getStatusCode().value()).isEqualTo(400);
    }
}
