package com.immersio.scenarios.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.immersio.flashcards.api.dto.AddCardDto;
import com.immersio.scenarios.api.dto.ChatInputRequest;
import com.immersio.scenarios.api.dto.ChatOutputResponse;
import com.immersio.scenarios.api.dto.CorrectionResultDto;
import com.immersio.scenarios.api.dto.CreateScenarioDto;
import com.immersio.scenarios.api.dto.CreateScenarioItemDto;
import com.immersio.scenarios.api.dto.FinishSessionResponse;
import com.immersio.scenarios.api.dto.GenerateFlashcardsRequest;
import com.immersio.scenarios.api.dto.ScenarioContextDto;
import com.immersio.scenarios.api.dto.ScenarioDto;
import com.immersio.scenarios.api.dto.ScenarioItemDto;
import com.immersio.scenarios.api.dto.StartSessionRequest;
import com.immersio.scenarios.api.dto.StartSessionResponse;
import com.immersio.scenarios.api.dto.SessionMessageDto;
import com.immersio.scenarios.domain.Scenario;
import com.immersio.scenarios.domain.ScenarioItem;
import com.immersio.scenarios.domain.ScenarioSession;
import com.immersio.scenarios.domain.SessionMessage;
import com.immersio.scenarios.repository.ScenarioItemRepository;
import com.immersio.scenarios.repository.ScenarioRepository;
import com.immersio.scenarios.repository.ScenarioSessionRepository;
import com.immersio.scenarios.repository.SessionMessageRepository;
import com.immersio.shared.exception.ConflictException;
import com.immersio.shared.exception.ResourceNotFoundException;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Scenarios module — Java port of the .NET {@code Immersio.Application.Services.ScenarioService}
 * AI behaviours: concurrent grammar + character reply on chat, LLM session feedback and flashcard
 * suggestions on finish, and LLM-driven custom flashcard decks.
 */
@Service
public class ScenarioService {

    private static final Logger log = LoggerFactory.getLogger(ScenarioService.class);

    /** Session language chosen at start time (.NET {@code SessionLanguages} parity). */
    private static final ConcurrentHashMap<UUID, String> SESSION_LANGUAGES = new ConcurrentHashMap<>();

    static final List<String> DEFAULT_EMOTIONS = List.of("idle", "happy", "angry");
    static final Pattern EMOTION_TAG = Pattern.compile("\\[EMOTION:\\s*([^\\]]+)\\]", Pattern.CASE_INSENSITIVE);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    /** Reply state after extracting the optional {@code [EMOTION: x]} prefix. */
    record EmotionReply(String reply, String emotion) {
    }

    private final ScenarioRepository scenarios;
    private final ScenarioItemRepository items;
    private final ScenarioSessionRepository sessions;
    private final SessionMessageRepository messages;
    private final ScenarioLlmClient llm;
    /** Grammar analysis and character reply run concurrently — independent HTTP calls. */
    private final ExecutorService llmExecutor;

    public ScenarioService(ScenarioRepository s, ScenarioItemRepository i, ScenarioSessionRepository ss,
                           SessionMessageRepository m, ScenarioLlmClient l) {
        scenarios = s;
        items = i;
        sessions = ss;
        messages = m;
        llm = l;
        llmExecutor = Executors.newCachedThreadPool(runnable -> {
            Thread thread = new Thread(runnable, "scenario-llm");
            thread.setDaemon(true);
            return thread;
        });
    }

    @PreDestroy
    public void shutdownExecutor() {
        llmExecutor.shutdownNow();
    }

    // ------------------------------------------------------------------
    // Queries
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<ScenarioDto> getScenarios() {
        return scenarios.findByDeletedFalseOrderByTitleAsc().stream().map(this::dto).toList();
    }

    @Transactional(readOnly = true)
    public ScenarioDto getScenarioById(UUID id) {
        return dto(scenarios.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Scenario not found.")));
    }

    // ------------------------------------------------------------------
    // Sessions
    // ------------------------------------------------------------------

    @Transactional
    public StartSessionResponse startSession(UUID user, StartSessionRequest r) {
        Scenario scenario = scenarios.findByIdAndDeletedFalse(r.scenarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Scenario not found."));

        String language = normalizeLanguage(r.targetLanguage(), scenario.getLanguage());
        String initialMessage = scenario.getInitialMessage();
        if (!language.equalsIgnoreCase(scenario.getLanguage())) {
            try {
                // .NET translates the opening line into the requested practice language.
                initialMessage = llm.generateChatResponse(
                        ScenarioLlmClient.translationContextPrompt(language, scenario.getInitialMessage()),
                        language, List.of(), "Translate", null);
            } catch (Exception ex) {
                log.warn("Initial message translation failed, keeping scenario default: {}", ex.getMessage());
            }
        }

        ScenarioSession session = sessions.save(new ScenarioSession(user, scenario.getId()));
        if (session.getId() != null) {
            SESSION_LANGUAGES.put(session.getId(), language);
        }
        SessionMessage message = messages.save(new SessionMessage(session.getId(), "assistant", initialMessage));
        return new StartSessionResponse(session.getId(), initialMessage, dto(scenario), List.of(md(message)));
    }

    @Transactional
    public ChatOutputResponse sendMessage(UUID user, UUID id, ChatInputRequest r) {
        ScenarioSession session = sessions.findByIdAndUserId(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found."));
        if (session.isFinished()) {
            throw new ConflictException("Cannot send messages to a completed session.");
        }
        Scenario scenario = scenarios.findByIdAndDeletedFalse(session.getScenarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Scenario not found."));

        String message = r.message() == null ? "" : r.message();
        String language = sessionLanguage(id, scenario);
        List<String> validEmotions = parseValidEmotions(scenario.getEmotionsJson());

        // 1. Core evaluation (grammar) and history assembly overlap — .NET ran both LLM calls
        //    with Task.WhenAll because neither touches shared persistence mid-flight.
        CompletableFuture<CorrectionResultDto> correctionTask = CompletableFuture.supplyAsync(
                () -> llm.analyzeGrammar(message, language), llmExecutor);

        // 2. Collect dialogue history for the character prompt (in-memory, no repository access
        //    while LLM calls are in flight).
        List<SessionMessageDto> history = new ArrayList<>(loadHistory(id));
        SessionMessage userMessage = messages.save(new SessionMessage(id, "user", message));
        history.add(md(userMessage));

        // 3. Generate the AI character reply from the contextual roleplay prompt.
        CompletableFuture<String> replyTask = CompletableFuture.supplyAsync(
                () -> llm.generateChatResponse(scenario.getContextPrompt(), language, history, message, validEmotions),
                llmExecutor);

        CorrectionResultDto correction = correctionTask.join();
        String reply = replyTask.join();

        boolean isCorrect = isCorrectCorrection(correction, message);
        userMessage.correct(isCorrect ? null : correction.corrected(),
                isCorrect ? null : correction.explanation());
        messages.save(userMessage);

        EmotionReply parsed = parseEmotionTag(reply, validEmotions);
        SessionMessage modelMessage = messages.save(new SessionMessage(id, "assistant", parsed.reply()));
        return new ChatOutputResponse(parsed.reply(),
                isCorrect ? null : correction, parsed.emotion(), md(modelMessage));
    }

    @Transactional
    public FinishSessionResponse completeSession(UUID user, UUID id) {
        ScenarioSession session = sessions.findByIdAndUserId(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found."));
        if (session.isFinished()) {
            throw new ConflictException("Session is already completed.");
        }
        Scenario scenario = scenarios.findByIdAndDeletedFalse(session.getScenarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Scenario not found."));

        List<SessionMessageDto> history = loadHistory(id);
        String language = sessionLanguage(id, scenario);

        // 1. Comprehensive performance feedback, then 2. suggested flashcard deck candidates —
        //    same sequential order as .NET CompleteSessionAsync.
        String feedback = llm.generateSessionFeedback(scenario.getContextPrompt(), history);
        List<AddCardDto> flashcards = llm.generateFlashcards(history, language, scenarioContext(scenario));

        session.finish(feedback);
        sessions.save(session);
        return new FinishSessionResponse(feedback, flashcards, id, true);
    }

    @Transactional(readOnly = true)
    public List<AddCardDto> generateCustomFlashcards(UUID user, UUID id, GenerateFlashcardsRequest r) {
        ScenarioSession session = sessions.findByIdAndUserId(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found."));
        Scenario scenario = scenarios.findByIdAndDeletedFalse(session.getScenarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Scenario not found."));

        List<SessionMessageDto> history = loadHistory(id);
        return llm.generateCustomFlashcards(history, sessionLanguage(id, scenario),
                normalizeFlashcardOptions(r), scenarioContext(scenario));
    }

    // ------------------------------------------------------------------
    // Admin CRUD
    // ------------------------------------------------------------------

    @Transactional
    public ScenarioDto createScenario(CreateScenarioDto r) {
        return dto(scenarios.save(new Scenario(r.title(), r.language(), r.level(), r.category(), r.description(),
                r.duration(), r.imageUrl(), r.contextPrompt(), r.initialMessage(), r.avatarUrl())));
    }

    @Transactional
    public ScenarioDto updateScenario(UUID id, CreateScenarioDto r) {
        Scenario s = scenarios.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Scenario not found."));
        s.update(r.title(), r.language(), r.level(), r.category(), r.description(),
                r.duration(), r.imageUrl(), r.contextPrompt(), r.initialMessage(), r.avatarUrl());
        return dto(scenarios.save(s));
    }

    @Transactional
    public void deleteScenario(UUID id) {
        Scenario s = scenarios.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Scenario not found."));
        s.delete();
        scenarios.save(s);
    }

    @Transactional
    public ScenarioItemDto addScenarioItem(UUID id, CreateScenarioItemDto r) {
        Scenario s = scenarios.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Scenario not found."));
        return item(items.save(new ScenarioItem(s, r.name(), r.price(), r.imageUrl(), r.icon())));
    }

    public void seedScenarios() {
    }

    // ------------------------------------------------------------------
    // Pure helpers (unit tested)
    // ------------------------------------------------------------------

    /**
     * Session practice language: the language chosen when the session started, falling back to
     * the scenario's own language (same as .NET {@code SessionLanguages.TryGetValue}).
     */
    static String sessionLanguage(UUID sessionId, Scenario scenario) {
        String language = SESSION_LANGUAGES.get(sessionId);
        return language != null ? language : scenario.getLanguage();
    }

    /** .NET {@code string.IsNullOrWhiteSpace(targetLanguage) ? scenario.Language : targetLanguage}. */
    static String normalizeLanguage(String requested, String scenarioLanguage) {
        return requested == null || requested.isBlank() ? scenarioLanguage : requested;
    }

    /**
     * Allowed NPC emotions from the scenario's {@code EmotionsJson} map (keys lower-cased);
     * malformed/empty configuration falls back to the .NET default trio.
     */
    static List<String> parseValidEmotions(String emotionsJson) {
        List<String> emotions = new ArrayList<>();
        if (emotionsJson != null && !emotionsJson.isBlank()) {
            try {
                JsonNode root = MAPPER.readTree(emotionsJson);
                if (root != null && root.isObject()) {
                    root.fieldNames().forEachRemaining(name -> emotions.add(name.toLowerCase(Locale.ROOT)));
                }
            } catch (JsonProcessingException ex) {
                // Ignore JSON parsing errors — mirrors the .NET blanket catch.
            }
        }
        if (emotions.isEmpty()) {
            emotions.addAll(DEFAULT_EMOTIONS);
        }
        return emotions;
    }

    /**
     * Extracts the {@code [EMOTION: x]} prefix the character prompt asks for. Unknown emotions
     * degrade to {@code idle}; the tag is always stripped, and an empty remainder falls back to
     * the untouched reply (identical to .NET).
     */
    static EmotionReply parseEmotionTag(String reply, List<String> validEmotions) {
        String original = reply == null ? "" : reply;
        Matcher matcher = EMOTION_TAG.matcher(original);
        if (!matcher.find()) {
            return new EmotionReply(original, "idle");
        }

        String cleaned = EMOTION_TAG.matcher(original).replaceAll("").trim();
        cleaned = cleaned.replaceFirst("^[\\s:\\-*]+", "").trim();
        if (cleaned.isBlank()) {
            cleaned = original;
        }

        String parsedEmotion = matcher.group(1).trim().toLowerCase(Locale.ROOT);
        String emotion = validEmotions != null && validEmotions.contains(parsedEmotion) ? parsedEmotion : "idle";
        return new EmotionReply(cleaned, emotion);
    }

    /**
     * .NET correction verdict: the text is unchanged (case-insensitive) or the explanation says
     * it is perfect — then no correction is surfaced to the learner.
     */
    static boolean isCorrectCorrection(CorrectionResultDto correction, String userMessage) {
        if (correction == null) {
            return true;
        }
        String corrected = correction.corrected() == null ? "" : correction.corrected().trim();
        String original = userMessage == null ? "" : userMessage.trim();
        if (corrected.equalsIgnoreCase(original)) {
            return true;
        }
        String explanation = correction.explanation();
        return explanation != null && explanation.toLowerCase(Locale.ROOT).contains("perfect");
    }

    /**
     * Flashcard categories requested by the UI ({@code options}), with the comma-separated
     * {@code deckName} the frontend also sends as a fallback source.
     */
    static List<String> normalizeFlashcardOptions(GenerateFlashcardsRequest r) {
        if (r == null) {
            return List.of();
        }
        List<String> options = new ArrayList<>();
        if (r.options() != null) {
            r.options().stream()
                    .filter(option -> option != null && !option.isBlank())
                    .map(String::trim)
                    .forEach(options::add);
        }
        if (options.isEmpty() && r.deckName() != null && !r.deckName().isBlank()) {
            Arrays.stream(r.deckName().split(","))
                    .map(String::trim)
                    .filter(option -> !option.isEmpty())
                    .forEach(options::add);
        }
        return options;
    }

    // ------------------------------------------------------------------
    // Mapping helpers
    // ------------------------------------------------------------------

    private List<SessionMessageDto> loadHistory(UUID sessionId) {
        return messages.findBySessionIdOrderBySentAtAsc(sessionId).stream().map(this::md).toList();
    }

    private ScenarioContextDto scenarioContext(Scenario s) {
        return new ScenarioContextDto(s.getTitle(), s.getLevel(), s.getCategory(), s.getDescription(),
                s.getContextPrompt());
    }

    private ScenarioDto dto(Scenario s) {
        return new ScenarioDto(s.getId(), s.getTitle(), s.getLanguage(), s.getLevel(), s.getCategory(),
                s.getDescription(), s.getRating(), s.getDuration(), s.getImageUrl(), s.getContextPrompt(),
                s.getInitialMessage(), s.getAvatarUrl(), s.isNavigation(), s.getVoiceId(), s.getEmotionsJson(),
                s.getGender(), s.getDefaultEmotion(),
                s.getItems().stream().map(this::item).toList());
    }

    private ScenarioItemDto item(ScenarioItem x) {
        return new ScenarioItemDto(x.getId(), x.getScenarioId(), x.getName(), x.getPrice(), x.getImageUrl(),
                x.getIcon());
    }

    private SessionMessageDto md(SessionMessage x) {
        return new SessionMessageDto(x.getId(), x.getSessionId(), x.getSenderRole(), x.getText(), x.getSentAt(),
                x.getCorrectionText(), x.getCorrectionExplanation());
    }
}
