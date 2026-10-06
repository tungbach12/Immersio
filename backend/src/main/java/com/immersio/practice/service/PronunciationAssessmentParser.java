package com.immersio.practice.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.immersio.practice.api.dto.PhonemeAssessmentDto;
import com.immersio.practice.api.dto.PronunciationAssessmentDto;
import com.immersio.practice.api.dto.WordAssessmentDto;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.function.IntUnaryOperator;

/**
 * Pure mapping logic that turns a raw Azure Speech pronunciation assessment
 * response into the {@link PronunciationAssessmentDto} shape the frontend
 * consumes, plus the mock/fallback builders. Ported 1:1 from the legacy .NET
 * {@code PronunciationService.AssessPronunciationAsync} (JSON parsing,
 * reference/transcript word alignment, omission detection, feedback messages).
 *
 * <p>No I/O here — everything is unit-testable with plain strings.</p>
 */
public final class PronunciationAssessmentParser {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    static final String RECOGNITION_FAILED_MESSAGE =
            "Azure Speech failed to recognize your voice. Please speak clearly.";

    private PronunciationAssessmentParser() {
    }

    /**
     * Parses an Azure STT pronunciation assessment JSON payload.
     *
     * @param azureResponseJson raw response body from Azure
     * @param targetPhrase      reference phrase the user attempted
     * @throws JsonProcessingException when the payload is not valid JSON
     *                                 (caller falls back to the mock result)
     */
    public static PronunciationAssessmentDto parse(String azureResponseJson, String targetPhrase)
            throws JsonProcessingException {
        JsonNode root = MAPPER.readTree(azureResponseJson);

        String recognitionStatus = text(root, "RecognitionStatus");
        if (!"Success".equals(recognitionStatus)) {
            return new PronunciationAssessmentDto("", 0, RECOGNITION_FAILED_MESSAGE, List.of());
        }

        String transcript = text(root, "DisplayText");
        if (transcript == null) {
            transcript = "";
        }

        int score = 0;
        List<WordAssessmentDto> words = List.of();

        JsonNode nBest = field(root, "NBest");
        if (nBest != null && nBest.isArray() && !nBest.isEmpty()) {
            JsonNode best = nBest.get(0);
            score = bestScore(best);
            words = parseWords(best, targetPhrase, transcript);
        }

        return new PronunciationAssessmentDto(transcript, score, messageForScore(score), words);
    }

    /**
     * Builds the degraded result used when Azure is not configured or the
     * upstream call failed (legacy .NET mock paths).
     *
     * @param targetPhrase phrase the user attempted
     * @param transcript   transcript to report (the phrase itself in mock mode)
     * @param score        overall score to report
     * @param message      feedback message to report
     * @param wordScoreFn  produces a per-word/per-phoneme accuracy score
     */
    public static PronunciationAssessmentDto fallback(String targetPhrase, String transcript, int score,
                                                      String message, IntUnaryOperator wordScoreFn) {
        List<WordAssessmentDto> words = new ArrayList<>();
        if (targetPhrase != null) {
            for (String raw : targetPhrase.split(" ", -1)) {
                StringBuilder cleaned = new StringBuilder(raw.length());
                for (char c : raw.toCharArray()) {
                    if (!isPunctuation(c)) {
                        cleaned.append(c);
                    }
                }
                if (cleaned.isEmpty()) {
                    continue;
                }
                String word = cleaned.toString();
                String lowerWord = word.toLowerCase(Locale.ROOT);
                List<PhonemeAssessmentDto> phonemes = new ArrayList<>(lowerWord.length());
                for (int i = 0; i < lowerWord.length(); i++) {
                    phonemes.add(new PhonemeAssessmentDto(String.valueOf(lowerWord.charAt(i)),
                            wordScoreFn.applyAsInt(words.size())));
                }
                words.add(new WordAssessmentDto(word, wordScoreFn.applyAsInt(words.size()), "None", phonemes));
            }
        }
        return new PronunciationAssessmentDto(transcript, score, message, words);
    }

    /** Feedback message for a score — same thresholds as the legacy backend. */
    public static String messageForScore(int score) {
        if (score >= 90) {
            return "Perfect accent! Microsoft AI grades you as elite.";
        }
        if (score >= 70) {
            return "Great pronunciation and flow, keep practicing.";
        }
        if (score >= 40) {
            return "A bit off. Try articulating clearly and speaking louder.";
        }
        return "Speak slowly, enunciate each syllable, and try again.";
    }

    // ------------------------------------------------------------------
    // Azure NBest parsing
    // ------------------------------------------------------------------

    private static int bestScore(JsonNode best) {
        JsonNode pronScore = field(best, "PronScore");
        if (isValue(pronScore)) {
            return round(doubleValue(pronScore));
        }
        JsonNode accuracyScore = field(best, "AccuracyScore");
        if (isValue(accuracyScore)) {
            return round(doubleValue(accuracyScore));
        }
        JsonNode nested = field(best, "PronunciationAssessment");
        if (nested != null) {
            JsonNode nestedPronScore = field(nested, "PronScore");
            if (isValue(nestedPronScore)) {
                return round(doubleValue(nestedPronScore));
            }
        }
        return 0;
    }

    private static List<WordAssessmentDto> parseWords(JsonNode best, String targetPhrase, String transcript) {
        JsonNode wordsNode = field(best, "Words");
        if (wordsNode == null || !wordsNode.isArray()) {
            return List.of();
        }

        List<String> referenceWords = normalizeWords(targetPhrase);
        List<String> transcriptWords = normalizeWords(transcript);
        int lastSpokenRefIndex = alignLastSpokenIndex(referenceWords, transcriptWords);

        List<WordAssessmentDto> words = new ArrayList<>();
        int wordIdx = 0;
        for (JsonNode wordNode : wordsNode) {
            String wordText = text(wordNode, "Word");
            if (wordText == null) {
                wordText = "";
            }

            int accuracy = wordAccuracy(wordNode);
            String errorType = wordErrorType(wordNode);

            // A reference word the user never reached is an omission.
            if (wordIdx > lastSpokenRefIndex) {
                errorType = "Omission";
                accuracy = 0;
            } else if ("Omission".equalsIgnoreCase(errorType)) {
                accuracy = 0;
            }

            List<PhonemeAssessmentDto> phonemes = new ArrayList<>();
            JsonNode phonemesNode = field(wordNode, "Phonemes");
            if (phonemesNode != null && phonemesNode.isArray()) {
                for (JsonNode phonemeNode : phonemesNode) {
                    String symbol = text(phonemeNode, "Phoneme");
                    if (symbol == null) {
                        symbol = "";
                    }
                    int phonemeAccuracy = phonemeAccuracy(phonemeNode);
                    if ("Omission".equalsIgnoreCase(errorType)) {
                        phonemeAccuracy = 0;
                    }
                    if (!symbol.isEmpty()) {
                        phonemes.add(new PhonemeAssessmentDto(symbol, phonemeAccuracy));
                    }
                }
            }

            if (!wordText.isEmpty()) {
                words.add(new WordAssessmentDto(wordText, accuracy, errorType, phonemes));
            }
            wordIdx++;
        }
        return words;
    }

    private static int wordAccuracy(JsonNode wordNode) {
        JsonNode accuracy = field(wordNode, "AccuracyScore");
        if (isValue(accuracy)) {
            return round(doubleValue(accuracy));
        }
        JsonNode nested = field(wordNode, "PronunciationAssessment");
        if (nested != null) {
            JsonNode nestedAccuracy = field(nested, "AccuracyScore");
            if (isValue(nestedAccuracy)) {
                return round(doubleValue(nestedAccuracy));
            }
        }
        return 0;
    }

    private static String wordErrorType(JsonNode wordNode) {
        JsonNode errorType = field(wordNode, "ErrorType");
        if (errorType != null && errorType.isTextual()) {
            return errorType.asText();
        }
        JsonNode nested = field(wordNode, "PronunciationAssessment");
        if (nested != null) {
            JsonNode nestedErrorType = field(nested, "ErrorType");
            if (nestedErrorType != null && nestedErrorType.isTextual()) {
                return nestedErrorType.asText();
            }
        }
        return "None";
    }

    private static int phonemeAccuracy(JsonNode phonemeNode) {
        JsonNode accuracy = field(phonemeNode, "AccuracyScore");
        if (isValue(accuracy)) {
            return round(doubleValue(accuracy));
        }
        JsonNode nested = field(phonemeNode, "PronunciationAssessment");
        if (nested != null) {
            JsonNode nestedAccuracy = field(nested, "AccuracyScore");
            if (isValue(nestedAccuracy)) {
                return round(doubleValue(nestedAccuracy));
            }
        }
        return 0;
    }

    // ------------------------------------------------------------------
    // Word alignment / normalization
    // ------------------------------------------------------------------

    /**
     * Greedy left-to-right alignment of reference words against spoken words.
     * Returns the index of the last reference word that was (fuzzily) spoken;
     * everything after it is reported as an omission. Words match when equal
     * ignoring case, or when the character edit distance is within 2 for words
     * longer than 4 characters (1 otherwise) — same rule as the legacy backend.
     */
    static int alignLastSpokenIndex(List<String> referenceWords, List<String> transcriptWords) {
        int lastSpokenRefIndex = -1;
        int tPointer = 0;
        for (int r = 0; r < referenceWords.size(); r++) {
            for (int t = tPointer; t < transcriptWords.size(); t++) {
                String reference = referenceWords.get(r);
                String spoken = transcriptWords.get(t);
                boolean match = reference.equalsIgnoreCase(spoken)
                        || levenshtein(reference, spoken) <= (reference.length() > 4 ? 2 : 1);
                if (match) {
                    lastSpokenRefIndex = r;
                    tPointer = t + 1;
                    break;
                }
            }
        }
        return lastSpokenRefIndex;
    }

    /**
     * Lowercases, strips punctuation (keeping apostrophes, normalizing the
     * typographic apostrophe) and splits on whitespace.
     */
    static List<String> normalizeWords(String input) {
        if (input == null || input.isBlank()) {
            return List.of();
        }
        StringBuilder cleaned = new StringBuilder(input.length());
        for (char c : input.toCharArray()) {
            if (isPunctuation(c) && c != '\'' && c != '\u2019') {
                cleaned.append(' ');
            } else {
                cleaned.append(c);
            }
        }
        List<String> words = new ArrayList<>();
        for (String w : cleaned.toString().split("\\s+")) {
            if (!w.isEmpty()) {
                words.add(w.toLowerCase(Locale.ROOT).replace('\u2019', '\''));
            }
        }
        return words;
    }

    /** Classic Levenshtein character edit distance. */
    static int levenshtein(String s, String t) {
        int n = s.length();
        int m = t.length();
        if (n == 0) {
            return m;
        }
        if (m == 0) {
            return n;
        }
        int[] prev = new int[m + 1];
        int[] current = new int[m + 1];
        for (int j = 0; j <= m; j++) {
            prev[j] = j;
        }
        for (int i = 1; i <= n; i++) {
            current[0] = i;
            for (int j = 1; j <= m; j++) {
                int cost = s.charAt(i - 1) == t.charAt(j - 1) ? 0 : 1;
                current[j] = Math.min(Math.min(current[j - 1] + 1, prev[j] + 1), prev[j - 1] + cost);
            }
            int[] tmp = prev;
            prev = current;
            current = tmp;
        }
        return prev[m];
    }

    // ------------------------------------------------------------------
    // JSON helpers (case-insensitive like System.Text.Json lookups in .NET)
    // ------------------------------------------------------------------

    private static JsonNode field(JsonNode node, String name) {
        if (node == null || !node.isObject()) {
            return null;
        }
        JsonNode exact = node.get(name);
        if (exact != null) {
            return exact;
        }
        for (var property : node.properties()) {
            if (property.getKey().equalsIgnoreCase(name)) {
                return property.getValue();
            }
        }
        return null;
    }

    private static String text(JsonNode node, String name) {
        JsonNode value = field(node, name);
        if (value == null || value.isNull() || !value.isValueNode()) {
            return null;
        }
        return value.asText();
    }

    private static boolean isValue(JsonNode node) {
        return node != null && node.isValueNode() && !node.isNull();
    }

    private static double doubleValue(JsonNode node) {
        if (node.isNumber()) {
            return node.asDouble();
        }
        if (node.isTextual()) {
            try {
                return Double.parseDouble(node.asText().trim());
            } catch (NumberFormatException ex) {
                return 0;
            }
        }
        return 0;
    }

    /** Rounds half-to-even like .NET {@code Math.Round(double)}. */
    private static int round(double value) {
        return BigDecimal.valueOf(value).setScale(0, RoundingMode.HALF_EVEN).intValue();
    }

    private static boolean isPunctuation(char c) {
        int type = Character.getType(c);
        return type == Character.CONNECTOR_PUNCTUATION
                || type == Character.DASH_PUNCTUATION
                || type == Character.START_PUNCTUATION
                || type == Character.END_PUNCTUATION
                || type == Character.INITIAL_QUOTE_PUNCTUATION
                || type == Character.FINAL_QUOTE_PUNCTUATION
                || type == Character.OTHER_PUNCTUATION;
    }
}
