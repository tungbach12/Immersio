package com.immersio.practice.service;

import com.immersio.practice.api.dto.CreatePronunciationLogRequest;
import com.immersio.practice.api.dto.DictionaryLookupRequest;
import com.immersio.practice.api.dto.GeneratePhraseRequest;
import com.immersio.practice.api.dto.GeneratedPhraseDto;
import com.immersio.practice.api.dto.PronunciationAssessmentDto;
import com.immersio.practice.api.dto.WordAssessmentDto;
import com.immersio.practice.domain.UserPronunciationLog;
import com.immersio.practice.repository.UserPronunciationLogRepository;
import com.immersio.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for the Practice service: Azure assessment success/failure
 * paths (mock and fallback results + logging) and the delegation contracts
 * of the AI-backed dictionary/phrase features.
 */
@ExtendWith(MockitoExtension.class)
class PronunciationServiceTest {

    private static final UUID USER_ID = UUID.fromString("6f9d1c8e-1f2b-4c3d-8e7f-0a1b2c3d4e5f");
    private static final byte[] AUDIO = {1, 2, 3, 4};

    @Mock
    private UserPronunciationLogRepository repo;

    @Mock
    private AzureSpeechClient azure;

    @Mock
    private PracticeLlmClient llm;

    @Mock
    private UserRepository users;

    private PronunciationService service;

    @BeforeEach
    void setUp() {
        service = new PronunciationService(repo, users, azure, llm);
    }

    // ------------------------------------------------------------------
    // assess-pronunciation
    // ------------------------------------------------------------------

    @Test
    void returnsMockScoringAndLogsAttemptWhenAzureIsNotConfigured() {
        when(azure.isConfigured()).thenReturn(false);

        PronunciationAssessmentDto result =
                service.assessPronunciation(USER_ID, AUDIO, "Hello, world!");

        assertThat(result.score()).isEqualTo(95);
        assertThat(result.transcript()).isEqualTo("Hello, world!");
        assertThat(result.message()).contains("Azure Sandbox Mock Mode");
        assertThat(result.words()).hasSize(2);
        for (WordAssessmentDto word : result.words()) {
            assertThat(word.accuracyScore()).isBetween(85, 99);
            assertThat(word.phonemes()).isNotEmpty();
            word.phonemes().forEach(p -> assertThat(p.accuracyScore()).isBetween(85, 99));
        }

        UserPronunciationLog saved = captureSingleSave();
        assertThat(saved.getUserId()).isEqualTo(USER_ID);
        assertThat(saved.getPhrase()).isEqualTo("Hello, world!");
        assertThat(saved.getTranscript()).isEqualTo("Hello, world!");
        assertThat(saved.getScore()).isEqualTo(95);
    }

    @Test
    void returnsFallbackResultAndLogsAttemptWhenAzureCallFails() throws Exception {
        when(azure.isConfigured()).thenReturn(true);
        when(azure.assessPronunciation(any(byte[].class), anyString()))
                .thenThrow(new AzureSpeechException(500, "upstream boom"));

        PronunciationAssessmentDto result =
                service.assessPronunciation(USER_ID, AUDIO, "Hi there");

        assertThat(result.score()).isEqualTo(85);
        assertThat(result.transcript()).isEqualTo("Hi there");
        assertThat(result.message()).isEqualTo("Connection failed. Fallback simulation active: Great effort!");
        assertThat(result.words()).hasSize(2);
        assertThat(result.words()).allSatisfy(word -> {
            assertThat(word.accuracyScore()).isEqualTo(90);
            assertThat(word.errorType()).isEqualTo("None");
        });

        UserPronunciationLog saved = captureSingleSave();
        assertThat(saved.getScore()).isEqualTo(85);
        assertThat(saved.getTranscript()).isEqualTo("Hi there");
    }

    @Test
    void parsesAzureResponseAndLogsRealScoreOnSuccess() throws Exception {
        String azureJson = "{\"RecognitionStatus\":\"Success\",\"DisplayText\":\"Hi there\","
                + "\"NBest\":[{\"PronScore\":88.0,\"Words\":["
                + "{\"Word\":\"Hi\",\"AccuracyScore\":90,\"ErrorType\":\"None\",\"Phonemes\":[{\"Phoneme\":\"h\",\"AccuracyScore\":92}]},"
                + "{\"Word\":\"there\",\"AccuracyScore\":86,\"ErrorType\":\"None\",\"Phonemes\":[]}]}]}";
        when(azure.isConfigured()).thenReturn(true);
        when(azure.assessPronunciation(any(byte[].class), anyString())).thenReturn(azureJson);

        PronunciationAssessmentDto result =
                service.assessPronunciation(USER_ID, AUDIO, "Hi there");

        assertThat(result.transcript()).isEqualTo("Hi there");
        assertThat(result.score()).isEqualTo(88);
        assertThat(result.words()).hasSize(2);
        assertThat(result.words().get(0).accuracyScore()).isEqualTo(90);

        UserPronunciationLog saved = captureSingleSave();
        assertThat(saved.getTranscript()).isEqualTo("Hi there");
        assertThat(saved.getScore()).isEqualTo(88);
    }

    // ------------------------------------------------------------------
    // dictionary-lookup / generate-phrase delegation
    // ------------------------------------------------------------------

    @Test
    void resolvesDictionaryTargetLanguageLikeNetContract() {
        service.lookupWord(new DictionaryLookupRequest("hello", "French", "German"));
        verify(llm).lookupWord("hello", "French");

        service.lookupWord(new DictionaryLookupRequest("hi", null, "German"));
        verify(llm).lookupWord("hi", "German");

        service.lookupWord(new DictionaryLookupRequest("  hey  ", "  ", null));
        verify(llm).lookupWord("hey", "English");
    }

    @Test
    void appliesNetDefaultsForBlankGeneratePhraseFields() {
        service.generatePhrase(new GeneratePhraseRequest(null, null, null));
        verify(llm).generatePhrase("English", "Intermediate", "General");

        service.generatePhrase(new GeneratePhraseRequest("travel", "Beginner", "French"));
        verify(llm).generatePhrase("French", "Beginner", "travel");
    }

    @Test
    void returnsGeneratedPhraseFromClient() {
        GeneratedPhraseDto expected = new GeneratedPhraseDto("A phrase.", "Một câu.", "Mẹo.");
        when(llm.generatePhrase("English", "Intermediate", "General")).thenReturn(expected);

        GeneratedPhraseDto result = service.generatePhrase(new GeneratePhraseRequest(null, null, null));

        assertThat(result).isEqualTo(expected);
    }

    // ------------------------------------------------------------------
    // Existing logging behaviour (unchanged, guarded against regressions)
    // ------------------------------------------------------------------

    @Test
    void clampsLoggedScoresToHundredMarkScale() {
        when(repo.save(any(UserPronunciationLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertThat(service.logPronunciation(USER_ID, new CreatePronunciationLogRequest("p", "t", 150)).score())
                .isEqualTo(100);
        assertThat(service.logPronunciation(USER_ID, new CreatePronunciationLogRequest("p", "t", -3)).score())
                .isZero();
    }

    // ------------------------------------------------------------------

    private UserPronunciationLog captureSingleSave() {
        ArgumentCaptor<UserPronunciationLog> captor = ArgumentCaptor.forClass(UserPronunciationLog.class);
        verify(repo).save(captor.capture());
        return captor.getValue();
    }
}
