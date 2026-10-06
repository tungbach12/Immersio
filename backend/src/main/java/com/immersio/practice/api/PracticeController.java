package com.immersio.practice.api;

import com.immersio.practice.api.dto.CefrAnalysisDto;
import com.immersio.practice.api.dto.CreatePronunciationLogRequest;
import com.immersio.practice.api.dto.DictionaryEntryDto;
import com.immersio.practice.api.dto.DictionaryLookupRequest;
import com.immersio.practice.api.dto.GeneratePhraseRequest;
import com.immersio.practice.api.dto.GeneratedPhraseDto;
import com.immersio.practice.api.dto.PronunciationAssessmentDto;
import com.immersio.practice.api.dto.PronunciationLogDto;
import com.immersio.practice.api.dto.TtsRequest;
import com.immersio.practice.service.AzureSpeechClient;
import com.immersio.practice.service.AzureSpeechException;
import com.immersio.practice.service.PronunciationService;
import com.immersio.practice.service.RouterTtsClient;
import com.immersio.practice.service.RouterTtsException;
import com.immersio.shared.dto.ApiResponse;
import com.immersio.shared.exception.DomainException;
import com.immersio.shared.exception.UnauthorizedException;
import com.immersio.shared.security.JwtTokenProvider;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * REST API for the Practice module. Contract notes vs the legacy .NET
 * controller: {@code /tts} returns raw {@code audio/mpeg} bytes on success
 * (the frontend requests a blob); every JSON endpoint is wrapped in
 * {@link ApiResponse}. Validation failures map to 400/401 envelope failures
 * via {@code DomainException}/{@code UnauthorizedException}.
 */
@RestController
@RequestMapping("/api/practice")
public class PracticeController {

    private final PronunciationService service;
    private final AzureSpeechClient azure;
    private final RouterTtsClient routerTts;
    private final JwtTokenProvider jwt;

    public PracticeController(PronunciationService service, AzureSpeechClient azure,
                              RouterTtsClient routerTts, JwtTokenProvider jwt) {
        this.service = service;
        this.azure = azure;
        this.routerTts = routerTts;
        this.jwt = jwt;
    }

    @PostMapping("/pronunciation-log")
    public ApiResponse<PronunciationLogDto> log(@RequestHeader("Authorization") String authorization,
                                                @RequestBody CreatePronunciationLogRequest request) {
        return ApiResponse.successResult(service.logPronunciation(user(authorization), request));
    }

    @GetMapping("/pronunciation-history")
    public ApiResponse<List<PronunciationLogDto>> history(@RequestHeader("Authorization") String authorization) {
        return ApiResponse.successResult(service.getUserLogs(user(authorization)));
    }

    @GetMapping("/cefr-analysis")
    public ApiResponse<CefrAnalysisDto> cefr(@RequestHeader("Authorization") String authorization) {
        return ApiResponse.successResult(service.analyzeCefrLevel(user(authorization)));
    }

    @PostMapping(value = "/assess-pronunciation", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<PronunciationAssessmentDto> assess(
            @RequestHeader("Authorization") String authorization,
            @RequestParam(name = "audio", required = false) MultipartFile audio,
            @RequestParam(name = "phrase", required = false) String phrase) throws IOException {
        UUID userId = user(authorization);
        if (audio == null || audio.isEmpty()) {
            throw new DomainException("No audio file was uploaded.");
        }
        if (phrase == null || phrase.isBlank()) {
            throw new DomainException("Target phrase is required.");
        }
        return ApiResponse.successResult(service.assessPronunciation(userId, audio.getBytes(), phrase));
    }

    @PostMapping("/tts")
    public ResponseEntity<?> tts(@RequestBody TtsRequest request) {
        if (request == null || request.text() == null || request.text().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.failureResult("Text parameter is required."));
        }
        if (!azure.isConfigured() && !routerTts.isConfigured()) {
            return ResponseEntity.badRequest().body(ApiResponse.failureResult(
                    "TTS is not configured. Set nine-router.api-key (NINE_ROUTER_API_KEY) or azure.speech.api-key."));
        }
        try {
            byte[] audio = routerTts.isConfigured()
                    ? routerTts.synthesize(request.text(), request.voice(), null)
                    : azure.synthesizeSpeech(
                            request.text(), request.voice(), request.style(), request.styleDegree());
            return ResponseEntity.ok().contentType(MediaType.valueOf("audio/mpeg")).body(audio);
        } catch (RouterTtsException ex) {
            return ResponseEntity.status(ex.getStatusCode())
                    .body(ApiResponse.failureResult("9Router TTS error: " + ex.getDetail()));
        } catch (AzureSpeechException ex) {
            return ResponseEntity.status(ex.getStatusCode())
                    .body(ApiResponse.failureResult("Azure TTS error: " + ex.getDetail()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.failureResult("TTS Synthesis failed: " + ex.getMessage()));
        }
    }

    @PostMapping("/generate-phrase")
    public ApiResponse<GeneratedPhraseDto> phrase(@RequestBody GeneratePhraseRequest request) {
        if (request == null) {
            throw new DomainException("Request body is required.");
        }
        return ApiResponse.successResult(service.generatePhrase(request));
    }

    @PostMapping("/dictionary-lookup")
    public ApiResponse<DictionaryEntryDto> dictionary(@RequestBody DictionaryLookupRequest request) {
        if (request == null || request.word() == null || request.word().isBlank()) {
            throw new DomainException("Word parameter is required.");
        }
        return ApiResponse.successResult(service.lookupWord(request));
    }

    private UUID user(String authorization) {
        try {
            return jwt.extractUserId(authorization == null ? "" : authorization.replace("Bearer ", ""));
        } catch (RuntimeException ex) {
            throw new UnauthorizedException("Invalid user identity.", ex);
        }
    }
}
