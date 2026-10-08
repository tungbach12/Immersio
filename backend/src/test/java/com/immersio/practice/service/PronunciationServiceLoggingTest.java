package com.immersio.practice.service;

import com.immersio.practice.api.dto.CreatePronunciationLogRequest;
import com.immersio.practice.api.dto.PronunciationLogDto;
import com.immersio.practice.domain.UserPronunciationLog;
import com.immersio.practice.repository.UserPronunciationLogRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Regression tests for the vocabulary-lab 500.
 *
 * <p>A payload missing {@code phrase}/{@code transcript} used to reach a NOT NULL
 * column and surface as "Internal server error". The lab UI sends the word under
 * different names, so the client must normalise rather than crash.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PronunciationService logging")
class PronunciationServiceLoggingTest {

    @Mock private UserPronunciationLogRepository repo;
    @Mock private PracticeLlmClient llmClient;
    @InjectMocks private PronunciationService service;

    private static UserPronunciationLog echo(UserPronunciationLog in) {
        return in;
    }

    @Test
    @DisplayName("a well-formed request persists phrase and transcript verbatim")
    void persistsWellFormedRequest() {
        UUID userId = UUID.randomUUID();
        when(repo.save(any())).thenAnswer(inv -> echo(inv.getArgument(0)));

        PronunciationLogDto dto = service.logPronunciation(
                userId, new CreatePronunciationLogRequest("journey", "journey", 82));

        assertThat(dto.phrase()).isEqualTo("journey");
        assertThat(dto.transcript()).isEqualTo("journey");
        assertThat(dto.score()).isEqualTo(82);
    }

    @Test
    @DisplayName("a payload using the SPA's targetWord/score shape still persists")
    void acceptsTargetWordShape() {
        // The SPA vocal lab posts {targetWord, score, ...}; Jackson leaves `phrase`
        // and `transcript` null, which previously blew up on insert.
        UUID userId = UUID.randomUUID();
        when(repo.save(any())).thenAnswer(inv -> echo(inv.getArgument(0)));

        PronunciationLogDto dto = service.logPronunciation(
                userId, new CreatePronunciationLogRequest(null, null, 82));

        ArgumentCaptor<UserPronunciationLog> captor = ArgumentCaptor.forClass(UserPronunciationLog.class);
        org.mockito.Mockito.verify(repo).save(captor.capture());
        UserPronunciationLog saved = captor.getValue();

        assertThat(saved.getPhrase()).as("phrase must never be null (NOT NULL column)").isNotBlank();
        assertThat(saved.getTranscript()).as("transcript must never be null (NOT NULL column)").isNotBlank();
        assertThat(dto.score()).isEqualTo(82);
    }

    @Test
    @DisplayName("score is clamped into 0..100 so a bad client cannot poison analytics")
    void clampsScore() {
        UUID userId = UUID.randomUUID();
        when(repo.save(any())).thenAnswer(inv -> echo(inv.getArgument(0)));

        assertThat(service.logPronunciation(
                userId, new CreatePronunciationLogRequest("a", "a", 4200)).score()).isEqualTo(100);
        assertThat(service.logPronunciation(
                userId, new CreatePronunciationLogRequest("a", "a", -50)).score()).isZero();
    }
}