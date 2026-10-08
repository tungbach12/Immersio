package com.immersio.practice.service;

import com.immersio.practice.api.dto.CefrAnalysisDto;
import com.immersio.practice.api.dto.CreatePronunciationLogRequest;
import com.immersio.practice.api.dto.DictionaryEntryDto;
import com.immersio.practice.api.dto.DictionaryLookupRequest;
import com.immersio.practice.api.dto.GeneratePhraseRequest;
import com.immersio.practice.api.dto.GeneratedPhraseDto;
import com.immersio.practice.api.dto.PronunciationAssessmentDto;
import com.immersio.practice.api.dto.PronunciationLogDto;
import com.immersio.practice.api.dto.SkillScoreDto;
import com.immersio.practice.domain.UserPronunciationLog;
import com.immersio.practice.repository.UserPronunciationLogRepository;
import com.immersio.users.domain.User;
import com.immersio.users.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Practice module domain service: pronunciation logging/history, CEFR
 * analysis, Azure-backed pronunciation assessment and delegation of the AI
 * dictionary/phrase features to {@link PracticeLlmClient}.
 */
@Service
public class PronunciationService {

    /** Matches the Phrase/Transcript column width (length=2000) in UserPronunciationLog. */
    private static final int MAX_TEXT_LENGTH = 2000;

    private final UserPronunciationLogRepository repo;
    private final UserRepository users;
    private final AzureSpeechClient azure;
    private final PracticeLlmClient llm;

    public PronunciationService(UserPronunciationLogRepository repo,
                                UserRepository users,
                                AzureSpeechClient azure,
                                PracticeLlmClient llm) {
        this.repo = repo;
        this.users = users;
        this.azure = azure;
        this.llm = llm;
    }

    // ------------------------------------------------------------------
    // Logging / history / CEFR (unchanged behaviour from the Java stub)
    // ------------------------------------------------------------------

    public PronunciationLogDto logPronunciation(UUID userId, CreatePronunciationLogRequest request) {
        // Phrase/Transcript are NOT NULL columns. Clients post varying shapes (the SPA
        // vocal lab sends `targetWord`, older builds send `phrase`/`transcript`), so
        // normalise here instead of letting a null bubble up as a 500.
        String phrase = orUnknown(request.phrase(), request.transcript());
        String transcript = orUnknown(request.transcript(), request.phrase());
        UserPronunciationLog saved = repo.save(new UserPronunciationLog(
                userId, truncate(phrase), truncate(transcript),
                Math.max(0, Math.min(100, request.score()))));
        return toLogDto(saved);
    }

    /** First non-blank candidate, else a non-blank placeholder (the columns are NOT NULL). */
    private static String orUnknown(String... candidates) {
        for (String candidate : candidates) {
            if (candidate != null && !candidate.isBlank()) {
                return candidate;
            }
        }
        return "unknown";
    }

    /** Trims to the column width so an over-long utterance cannot fail the insert. */
    private static String truncate(String value) {
        String safe = value == null ? "unknown" : value;
        return safe.length() <= MAX_TEXT_LENGTH ? safe : safe.substring(0, MAX_TEXT_LENGTH);
    }

    public List<PronunciationLogDto> getUserLogs(UUID userId) {
        return repo.findAllByUserIdOrderByPracticedAtDesc(userId).stream()
                .map(this::toLogDto)
                .toList();
    }

    public CefrAnalysisDto analyzeCefrLevel(UUID userId) {
        List<UserPronunciationLog> logs = repo.findAllByUserIdOrderByPracticedAtDesc(userId);
        int score = (int) Math.round(logs.stream()
                .mapToInt(UserPronunciationLog::getScore)
                .average()
                .orElse(0));
        String level = score >= 90 ? "C1"
                : score >= 75 ? "B2"
                : score >= 60 ? "B1"
                : score >= 40 ? "A2"
                : "A1";
        return new CefrAnalysisDto(level, score, "blue",
                "Keep practicing your pronunciation.",
                List.of(new SkillScoreDto("pronunciation", score, "Pronunciation accuracy")),
                List.of("Practice speaking every day."));
    }

    // ------------------------------------------------------------------
    // AI-backed features (real endpoint, defaults only as failure fallback)
    // ------------------------------------------------------------------

    /** Port of .NET GeneratePhraseAsync defaults (English / Intermediate / General). */
    public GeneratedPhraseDto generatePhrase(GeneratePhraseRequest request) {
        String language = isBlank(request.language()) ? "English" : request.language();
        String level = isBlank(request.level()) ? "Intermediate" : request.level();
        String topic = isBlank(request.topic()) ? "General" : request.topic();
        return llm.generatePhrase(language, level, topic);
    }

    /** Port of .NET DictionaryLookup: validates nothing (controller does), resolves language. */
    public DictionaryEntryDto lookupWord(DictionaryLookupRequest request) {
        String word = request.word() == null ? "" : request.word().trim();
        return llm.lookupWord(word, request.resolvedTargetLanguage());
    }

    // ------------------------------------------------------------------
    // Azure pronunciation assessment
    // ------------------------------------------------------------------

    /**
     * Assesses uploaded audio against the target phrase using Azure Speech,
     * logs the attempt and returns the frontend-facing result.
     *
     * <p>Degrades exactly like the legacy backend: mock scoring while the
     * Azure key is unset, and a logged fallback result when the upstream
     * call fails.</p>
     */
    public PronunciationAssessmentDto assessPronunciation(UUID userId, byte[] audioBytes, String targetPhrase) {
        if (!azure.isConfigured()) {
            PronunciationAssessmentDto mock = PronunciationAssessmentParser.fallback(
                    targetPhrase, targetPhrase, 95,
                    "Perfect accent! (Azure Sandbox Mock Mode - Key not set yet).",
                    index -> ThreadLocalRandom.current().nextInt(85, 100));
            save(userId, targetPhrase, targetPhrase, 95);
            return mock;
        }
        try {
            String azureJson = azure.assessPronunciation(audioBytes, targetPhrase);
            PronunciationAssessmentDto result = PronunciationAssessmentParser.parse(azureJson, targetPhrase);
            save(userId, targetPhrase, result.transcript(), result.score());
            return result;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return fallbackAssessment(userId, targetPhrase);
        } catch (Exception ex) {
            return fallbackAssessment(userId, targetPhrase);
        }
    }

    private PronunciationAssessmentDto fallbackAssessment(UUID userId, String targetPhrase) {
        PronunciationAssessmentDto fallback = PronunciationAssessmentParser.fallback(
                targetPhrase, targetPhrase, 85,
                "Connection failed. Fallback simulation active: Great effort!",
                index -> 90);
        try {
            save(userId, targetPhrase, targetPhrase, 85);
        } catch (Exception ex) {
            // Legacy behaviour: never fail the assessment because logging failed.
        }
        return fallback;
    }

    private void save(UUID userId, String phrase, String transcript, int score) {
        repo.save(new UserPronunciationLog(userId, phrase, transcript, score));
        // .NET parity gamification: +50 XP, +0.1 learning hours, update language level from CEFR
        if (userId != null && users != null) {
            try {
                users.findById(userId).ifPresent(user -> {
                    user.addExperience(50);
                    user.addLearningHours(0.1);
                    CefrAnalysisDto cefr = analyzeCefrLevel(userId);
                    user.setLanguageLevel(cefr.currentLevel());
                    users.save(user);
                });
            } catch (Exception ignored) {
                // Assessment response is the deliverable; gamification failures never fail it
            }
        }
    }

    private PronunciationLogDto toLogDto(UserPronunciationLog log) {
        return new PronunciationLogDto(log.getId(), log.getPhrase(), log.getTranscript(),
                log.getScore(), log.getPracticedAt());
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
