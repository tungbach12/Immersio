package com.immersio.scenarios.service;

import com.immersio.flashcards.api.dto.AddCardDto;
import com.immersio.scenarios.api.dto.ChatInputRequest;
import com.immersio.scenarios.api.dto.ChatOutputResponse;
import com.immersio.scenarios.api.dto.CorrectionResultDto;
import com.immersio.scenarios.api.dto.FinishSessionResponse;
import com.immersio.scenarios.api.dto.GenerateFlashcardsRequest;
import com.immersio.scenarios.api.dto.ScenarioContextDto;
import com.immersio.scenarios.domain.Scenario;
import com.immersio.scenarios.domain.ScenarioSession;
import com.immersio.scenarios.domain.SessionMessage;
import com.immersio.scenarios.repository.ScenarioItemRepository;
import com.immersio.scenarios.repository.ScenarioRepository;
import com.immersio.scenarios.repository.ScenarioSessionRepository;
import com.immersio.scenarios.repository.SessionMessageRepository;
import com.immersio.shared.exception.ConflictException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for the .NET-parity AI behaviours of {@link ScenarioService}:
 * concurrent grammar + chat, emotion tag extraction, correction suppression for correct
 * utterances, LLM-driven finish feedback and flashcard generation, and the guard rails
 * (finished sessions raise 409 conflicts).
 */
class ScenarioServiceTest {

    private ScenarioRepository scenarios;
    private ScenarioItemRepository items;
    private ScenarioSessionRepository sessions;
    private SessionMessageRepository messages;
    private ScenarioLlmClient llm;
    private ScenarioService service;

    private final UUID userId = UUID.randomUUID();
    private final UUID sessionId = UUID.randomUUID();
    private final UUID scenarioId = UUID.randomUUID();

    private Scenario scenario;
    private ScenarioSession session;

    @BeforeEach
    void setUp() {
        scenarios = mock(ScenarioRepository.class);
        items = mock(ScenarioItemRepository.class);
        sessions = mock(ScenarioSessionRepository.class);
        messages = mock(SessionMessageRepository.class);
        llm = mock(ScenarioLlmClient.class);
        service = new ScenarioService(scenarios, items, sessions, messages, llm);

        scenario = new Scenario(
                "Ordering Coffee", "English", "Beginner", "Travel",
                "Practice ordering coffee.", "10 mins",
                "/img.png", "You are Shinji the barista.", "Hi there!", "/avatar.png");
        session = new ScenarioSession(userId, scenarioId);

        when(sessions.findByIdAndUserId(sessionId, userId)).thenReturn(Optional.of(session));
        when(scenarios.findByIdAndDeletedFalse(scenarioId)).thenReturn(Optional.of(scenario));
        when(sessions.save(any(ScenarioSession.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(messages.save(any(SessionMessage.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(messages.findBySessionIdOrderBySentAtAsc(sessionId)).thenReturn(new ArrayList<>());
    }

    // ------------------------------------------------------------------
    // Chat: grammar correction + emotion extraction
    // ------------------------------------------------------------------

    @Test
    @DisplayName("sendMessage surfaces a correction when the utterance was really wrong")
    void sendMessageReturnsCorrectionForWrongUtterance() {
        when(llm.analyzeGrammar(anyString(), anyString()))
                .thenReturn(new CorrectionResultDto("I am going to the market", "Thì sai: nên dùng 'I am going'."));
        when(llm.generateChatResponse(anyString(), anyString(), anyList(), anyString(), anyList()))
                .thenReturn("Sure, the market is two blocks away.");

        ChatOutputResponse response = service.sendMessage(userId, sessionId, new ChatInputRequest("I is go to market"));

        assertThat(response.reply()).isEqualTo("Sure, the market is two blocks away.");
        assertThat(response.emotion()).isEqualTo("idle");
        assertThat(response.correction()).isNotNull();
        assertThat(response.correction().corrected()).isEqualTo("I am going to the market");
        assertThat(response.correction().explanation()).isEqualTo("Thì sai: nên dùng 'I am going'.");
        assertThat(response.message()).isNotNull();
        assertThat(response.message().senderRole()).isEqualTo("assistant");
    }

    @Test
    @DisplayName("sendMessage suppresses the correction when the utterance was correct or 'Perfect!' was returned")
    void sendMessageSuppressesCorrectionWhenUtteranceIsCorrect() {
        when(llm.analyzeGrammar(anyString(), anyString()))
                .thenReturn(new CorrectionResultDto("I would like a coffee please", "Perfect!"));
        when(llm.generateChatResponse(anyString(), anyString(), anyList(), anyString(), anyList()))
                .thenReturn("One latte coming right up!");

        ChatOutputResponse response = service.sendMessage(userId, sessionId,
                new ChatInputRequest("I would like a coffee please"));

        assertThat(response.correction()).isNull();
        assertThat(response.reply()).isEqualTo("One latte coming right up!");
    }

    @Test
    @DisplayName("sendMessage strips the [EMOTION: x] prefix and reports the emotion")
    void sendMessageExtractsEmotionTagFromReply() {
        when(llm.analyzeGrammar(anyString(), anyString()))
                .thenReturn(new CorrectionResultDto("Perfect sentence", "Perfect!"));
        when(llm.generateChatResponse(anyString(), anyString(), anyList(), anyString(), anyList()))
                .thenReturn("[EMOTION: happy] That sounds great!");

        ChatOutputResponse response = service.sendMessage(userId, sessionId,
                new ChatInputRequest("Perfect sentence"));

        assertThat(response.emotion()).isEqualTo("happy");
        assertThat(response.reply()).isEqualTo("That sounds great!");
    }

    @Test
    @DisplayName("sendMessage degrades to idle when the model invents an emotion outside the scenario")
    void sendMessageDegradesUnknownEmotionToIdle() {
        when(llm.analyzeGrammar(anyString(), anyString()))
                .thenReturn(new CorrectionResultDto("ok", "Perfect!"));
        when(llm.generateChatResponse(anyString(), anyString(), anyList(), anyString(), anyList()))
                .thenReturn("[EMOTION: sarcastic] Sure.");

        ChatOutputResponse response = service.sendMessage(userId, sessionId,
                new ChatInputRequest("ok"));

        assertThat(response.emotion()).isEqualTo("idle");
        assertThat(response.reply()).isEqualTo("Sure.");
    }

    @Test
    @DisplayName("sendMessage passes the scenario context prompt and scenario language to the LLM")
    void sendMessageUsesScenarioContextAndLanguage() {
        when(llm.analyzeGrammar(anyString(), anyString())).thenReturn(new CorrectionResultDto("hi", "Perfect!"));
        when(llm.generateChatResponse(anyString(), anyString(), anyList(), anyString(), anyList()))
                .thenReturn("Hello!");

        service.sendMessage(userId, sessionId, new ChatInputRequest("hi"));

        verify(llm).generateChatResponse(
                eq("You are Shinji the barista."),
                eq("English"),
                anyList(),
                eq("hi"),
                anyList());
        verify(llm).analyzeGrammar(eq("hi"), eq("English"));
    }

    @Test
    @DisplayName("sendMessage raises 409 when the session is already finished")
    void sendMessageRejectsFinishedSession() {
        session.finish("Great work!");
        assertThatThrownBy(() -> service.sendMessage(userId, sessionId,
                new ChatInputRequest("hello")))
                .isInstanceOf(ConflictException.class);
    }

    // ------------------------------------------------------------------
    // Finish: LLM feedback + flashcards
    // ------------------------------------------------------------------

    @Test
    @DisplayName("completeSession persists LLM feedback and returns suggested flashcards")
    void completeSessionUsesLlmFeedbackAndFlashcards() {
        when(llm.generateSessionFeedback(anyString(), anyList()))
                .thenReturn("You did great today! Focus on past tense next time.");
        when(llm.generateFlashcards(anyList(), anyString(), any(ScenarioContextDto.class)))
                .thenReturn(List.of(
                        new AddCardDto("meticulous", "Rất cẩn thận", "Definition: careful", "vocab"),
                        new AddCardDto("I went to school", "Diễn tả quá khứ đơn", "Usage: past simple", "grammar")));

        FinishSessionResponse response = service.completeSession(userId, sessionId);

        assertThat(response.feedback()).isEqualTo("You did great today! Focus on past tense next time.");
        assertThat(response.suggestedFlashcards()).hasSize(2);
        assertThat(response.sessionId()).isEqualTo(sessionId);
        assertThat(response.isFinished()).isTrue();

        assertThat(session.isFinished()).isTrue();
        assertThat(session.getFeedback()).isEqualTo("You did great today! Focus on past tense next time.");
        verify(llm).generateSessionFeedback(eq("You are Shinji the barista."), anyList());
        verify(llm).generateFlashcards(anyList(), eq("English"), any(ScenarioContextDto.class));
    }

    @Test
    @DisplayName("completeSession raises 409 when already completed")
    void completeSessionRejectsSecondCompletion() {
        session.finish("Already done");
        assertThatThrownBy(() -> service.completeSession(userId, sessionId))
                .isInstanceOf(ConflictException.class);
    }

    // ------------------------------------------------------------------
    // Custom flashcards
    // ------------------------------------------------------------------

    @Test
    @DisplayName("generateCustomFlashcards forwards selected categories to the LLM and returns its deck")
    void generateCustomFlashcardsForwardsOptions() {
        when(llm.generateCustomFlashcards(anyList(), anyString(), anyList(), any(ScenarioContextDto.class)))
                .thenReturn(List.of(new AddCardDto("take into account", "cân nhắc", "Sentence: take into account", "sentence")));

        List<AddCardDto> cards = service.generateCustomFlashcards(userId, sessionId,
                new GenerateFlashcardsRequest("grammar, vocabulary", List.of("grammar", "vocabulary")));

        assertThat(cards).hasSize(1);
        assertThat(cards.get(0).front()).isEqualTo("take into account");
        verify(llm).generateCustomFlashcards(anyList(), eq("English"), eq(List.of("grammar", "vocabulary")),
                any(ScenarioContextDto.class));
    }

    @Test
    @DisplayName("generateCustomFlashcards falls back to parsing deckName when options are absent")
    void generateCustomFlashcardsFallsBackToDeckName() {
        when(llm.generateCustomFlashcards(anyList(), anyString(), anyList(), any(ScenarioContextDto.class)))
                .thenReturn(List.of());

        service.generateCustomFlashcards(userId, sessionId,
                new GenerateFlashcardsRequest("grammar, improvement", null));

        verify(llm).generateCustomFlashcards(anyList(), eq("English"),
                eq(List.of("grammar", "improvement")), any(ScenarioContextDto.class));
    }

    // ------------------------------------------------------------------
    // Pure helpers
    // ------------------------------------------------------------------

    @Test
    @DisplayName("parseValidEmotions lowercases keys and falls back to the default trio")
    void parsesValidEmotions() {
        assertThat(ScenarioService.parseValidEmotions("{\"happy\":\"a.gif\",\"Angry\":\"b.gif\",\"IDLE\":\"c.gif\"}"))
                .containsExactly("happy", "angry", "idle");
        assertThat(ScenarioService.parseValidEmotions(null)).containsExactly("idle", "happy", "angry");
        assertThat(ScenarioService.parseValidEmotions("")).containsExactly("idle", "happy", "angry");
        assertThat(ScenarioService.parseValidEmotions("not json")).containsExactly("idle", "happy", "angry");
        assertThat(ScenarioService.parseValidEmotions("{}")).containsExactly("idle", "happy", "angry");
        assertThat(ScenarioService.parseValidEmotions("[]")).containsExactly("idle", "happy", "angry");
    }

    @Test
    @DisplayName("parseEmotionTag handles known, unknown, missing and empty-after-strip cases")
    void parsesEmotionTags() {
        List<String> emotions = List.of("idle", "happy", "angry");

        ScenarioService.EmotionReply known =
                ScenarioService.parseEmotionTag("[EMOTION: happy] Chào bạn!", emotions);
        assertThat(known.reply()).isEqualTo("Chào bạn!");
        assertThat(known.emotion()).isEqualTo("happy");

        ScenarioService.EmotionReply caseInsensitive =
                ScenarioService.parseEmotionTag("[emotion: Angry] Go away.", emotions);
        assertThat(caseInsensitive.reply()).isEqualTo("Go away.");
        assertThat(caseInsensitive.emotion()).isEqualTo("angry");

        ScenarioService.EmotionReply unknown =
                ScenarioService.parseEmotionTag("[EMOTION: sarcastic] Sure.", emotions);
        assertThat(unknown.reply()).isEqualTo("Sure.");
        assertThat(unknown.emotion()).isEqualTo("idle");

        ScenarioService.EmotionReply noTag = ScenarioService.parseEmotionTag("Plain reply", emotions);
        assertThat(noTag.reply()).isEqualTo("Plain reply");
        assertThat(noTag.emotion()).isEqualTo("idle");

        ScenarioService.EmotionReply leadingPunctuation =
                ScenarioService.parseEmotionTag("[EMOTION: happy]: Chào!", emotions);
        assertThat(leadingPunctuation.reply()).isEqualTo("Chào!");
        assertThat(leadingPunctuation.emotion()).isEqualTo("happy");

        ScenarioService.EmotionReply onlyTag = ScenarioService.parseEmotionTag("[EMOTION: happy]", emotions);
        assertThat(onlyTag.reply()).isEqualTo("[EMOTION: happy]");
        assertThat(onlyTag.emotion()).isEqualTo("happy");
    }

    @Test
    @DisplayName("isCorrectCorrection matches the .NET verdict rules")
    void isCorrectCorrectionRules() {
        assertThat(ScenarioService.isCorrectCorrection(
                new CorrectionResultDto("Hello there", "Lỗi gì đó."), "hello there")).isTrue();
        assertThat(ScenarioService.isCorrectCorrection(
                new CorrectionResultDto("Bonjour", "Perfect!"), "Salut")).isTrue();
        assertThat(ScenarioService.isCorrectCorrection(
                new CorrectionResultDto("I am going", "Thì sai."), "I is go")).isFalse();
        assertThat(ScenarioService.isCorrectCorrection(null, "anything")).isTrue();
    }

    @Test
    @DisplayName("normalizeLanguage keeps the request language and falls back to the scenario one")
    void normalizesLanguage() {
        assertThat(ScenarioService.normalizeLanguage(null, "English")).isEqualTo("English");
        assertThat(ScenarioService.normalizeLanguage("   ", "English")).isEqualTo("English");
        assertThat(ScenarioService.normalizeLanguage("Japanese", "English")).isEqualTo("Japanese");
    }

    @Test
    @DisplayName("normalizeFlashcardOptions trims, drops blanks and falls back to deckName")
    void normalizesFlashcardOptions() {
        assertThat(ScenarioService.normalizeFlashcardOptions(
                new GenerateFlashcardsRequest(null, List.of(" grammar ", "", "vocabulary"))))
                .containsExactly("grammar", "vocabulary");
        assertThat(ScenarioService.normalizeFlashcardOptions(
                new GenerateFlashcardsRequest("grammar, improvement", null)))
                .containsExactly("grammar", "improvement");
        assertThat(ScenarioService.normalizeFlashcardOptions(
                new GenerateFlashcardsRequest(null, null))).isEmpty();
        assertThat(ScenarioService.normalizeFlashcardOptions(null)).isEmpty();
    }

    @Test
    @DisplayName("translationContextPrompt matches the .NET translator prompt")
    void buildsTranslationContextPrompt() {
        String prompt = ScenarioLlmClient.translationContextPrompt("Japanese", "Hello there!");
        assertThat(prompt).contains("You are a professional language translator.");
        assertThat(prompt).contains("into Japanese.");
        assertThat(prompt).contains("\"Hello there!\"");
    }
}