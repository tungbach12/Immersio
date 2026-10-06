package com.immersio.practice.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.immersio.practice.api.dto.PronunciationAssessmentDto;
import com.immersio.practice.api.dto.WordAssessmentDto;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Pure-logic tests for the Azure pronunciation assessment parsing,
 * word alignment and fallback builders ported from the .NET backend.
 */
class PronunciationAssessmentParserTest {

    @Test
    void parsesSuccessfulAssessment() throws Exception {
        String json = """
                {"RecognitionStatus":"Success","DisplayText":"Hello wonderful world",
                 "NBest":[{"PronScore":87.4,"Words":[
                   {"Word":"Hello","AccuracyScore":92,"ErrorType":"None","Phonemes":[{"Phoneme":"hh","AccuracyScore":95},{"Phoneme":"ah","AccuracyScore":88}]},
                   {"Word":"wonderful","AccuracyScore":85,"ErrorType":"Mispronunciation","Phonemes":[{"Phoneme":"w","AccuracyScore":90}]},
                   {"Word":"world","AccuracyScore":88,"ErrorType":"None","Phonemes":[{"Phoneme":"er","AccuracyScore":87}]}]}]}
                """;

        PronunciationAssessmentDto result = PronunciationAssessmentParser.parse(json, "Hello wonderful world");

        assertThat(result.transcript()).isEqualTo("Hello wonderful world");
        assertThat(result.score()).isEqualTo(87);
        assertThat(result.message()).isEqualTo("Great pronunciation and flow, keep practicing.");
        assertThat(result.words()).hasSize(3);
        assertThat(result.words().get(0).word()).isEqualTo("Hello");
        assertThat(result.words().get(0).accuracyScore()).isEqualTo(92);
        assertThat(result.words().get(0).phonemes()).hasSize(2);
        assertThat(result.words().get(0).phonemes().get(0).phoneme()).isEqualTo("hh");
        assertThat(result.words().get(0).phonemes().get(0).accuracyScore()).isEqualTo(95);
        assertThat(result.words().get(1).errorType()).isEqualTo("Mispronunciation");
    }

    @Test
    void readsJsonKeysCaseInsensitively() throws Exception {
        String json = """
                {"recognitionStatus":"Success","displayText":"Hi there",
                 "nBest":[{"pronScore":71.6,"words":[
                   {"word":"Hi","accuracyScore":70,"errorType":"None","phonemes":[{"phoneme":"h","accuracyScore":70}]},
                   {"word":"there","accuracyScore":73,"errorType":"None","phonemes":[]}]}]}
                """;

        PronunciationAssessmentDto result = PronunciationAssessmentParser.parse(json, "Hi there");

        assertThat(result.transcript()).isEqualTo("Hi there");
        assertThat(result.score()).isEqualTo(72);
        assertThat(result.message()).isEqualTo("Great pronunciation and flow, keep practicing.");
        assertThat(result.words()).hasSize(2);
        assertThat(result.words().get(1).accuracyScore()).isEqualTo(73);
    }

    @Test
    void returnsRecognitionFailureWhenStatusIsNotSuccess() throws Exception {
        String json = "{\"RecognitionStatus\":\"NoMatch\"}";

        PronunciationAssessmentDto result = PronunciationAssessmentParser.parse(json, "Hello");

        assertThat(result.transcript()).isEmpty();
        assertThat(result.score()).isZero();
        assertThat(result.message()).isEqualTo("Azure Speech failed to recognize your voice. Please speak clearly.");
        assertThat(result.words()).isEmpty();
    }

    @Test
    void marksUnspokenReferenceWordsAsOmitted() throws Exception {
        String json = """
                {"RecognitionStatus":"Success","DisplayText":"one two",
                 "NBest":[{"PronScore":100.0,"Words":[
                   {"Word":"one","AccuracyScore":100,"ErrorType":"None","Phonemes":[{"Phoneme":"w","AccuracyScore":100}]},
                   {"Word":"two","AccuracyScore":100,"ErrorType":"None","Phonemes":[{"Phoneme":"t","AccuracyScore":100}]},
                   {"Word":"three","AccuracyScore":100,"ErrorType":"None","Phonemes":[{"Phoneme":"th","AccuracyScore":100}]},
                   {"Word":"four","AccuracyScore":100,"ErrorType":"None","Phonemes":[{"Phoneme":"f","AccuracyScore":100}]}]}]}
                """;

        PronunciationAssessmentDto result = PronunciationAssessmentParser.parse(json, "one two three four");

        assertThat(result.words()).hasSize(4);
        assertThat(result.words().get(0).errorType()).isEqualTo("None");
        assertThat(result.words().get(0).accuracyScore()).isEqualTo(100);
        assertThat(result.words().get(1).errorType()).isEqualTo("None");
        for (int i = 2; i < 4; i++) {
            WordAssessmentDto omitted = result.words().get(i);
            assertThat(omitted.errorType()).isEqualTo("Omission");
            assertThat(omitted.accuracyScore()).isZero();
            assertThat(omitted.phonemes()).isNotEmpty();
            omitted.phonemes().forEach(p -> assertThat(p.accuracyScore()).isZero());
        }
    }

    @Test
    void fallsBackToNestedPronunciationAssessmentScores() throws Exception {
        String json = """
                {"RecognitionStatus":"Success","DisplayText":"test",
                 "NBest":[{"PronunciationAssessment":{"PronScore":63.2},
                   "Words":[{"Word":"test",
                     "PronunciationAssessment":{"AccuracyScore":64,"ErrorType":"Mispronunciation"},
                     "Phonemes":[{"Phoneme":"t","PronunciationAssessment":{"AccuracyScore":55}}]}]}]}
                """;

        PronunciationAssessmentDto result = PronunciationAssessmentParser.parse(json, "test");

        assertThat(result.score()).isEqualTo(63);
        assertThat(result.message()).isEqualTo("A bit off. Try articulating clearly and speaking louder.");
        assertThat(result.words()).hasSize(1);
        assertThat(result.words().get(0).accuracyScore()).isEqualTo(64);
        assertThat(result.words().get(0).errorType()).isEqualTo("Mispronunciation");
        assertThat(result.words().get(0).phonemes().get(0).accuracyScore()).isEqualTo(55);
    }

    @Test
    void acceptsStringEncodedScores() throws Exception {
        String json = "{\"RecognitionStatus\":\"Success\",\"DisplayText\":\"ok\","
                + "\"NBest\":[{\"PronScore\":\"76.4\",\"Words\":[]}]}";

        PronunciationAssessmentDto result = PronunciationAssessmentParser.parse(json, "ok");

        assertThat(result.score()).isEqualTo(76);
        assertThat(result.transcript()).isEqualTo("ok");
        assertThat(result.words()).isEmpty();
    }

    @Test
    void handlesSuccessResponseWithoutNBest() throws Exception {
        String json = "{\"RecognitionStatus\":\"Success\",\"DisplayText\":\"Just talking\"}";

        PronunciationAssessmentDto result = PronunciationAssessmentParser.parse(json, "Just talking");

        assertThat(result.transcript()).isEqualTo("Just talking");
        assertThat(result.score()).isZero();
        assertThat(result.message()).isEqualTo("Speak slowly, enunciate each syllable, and try again.");
        assertThat(result.words()).isEmpty();
    }

    @Test
    void rejectsMalformedJsonSoCallerCanFallBack() {
        assertThatThrownBy(() -> PronunciationAssessmentParser.parse("{\"broken", "hello"))
                .isInstanceOf(JsonProcessingException.class);
    }

    @Test
    void buildsFallbackAssessmentFromPhrase() {
        PronunciationAssessmentDto result = PronunciationAssessmentParser.fallback(
                "Hello,  world!", "Hello,  world!", 85, "Connection failed. Fallback simulation active: Great effort!",
                index -> 90);

        assertThat(result.transcript()).isEqualTo("Hello,  world!");
        assertThat(result.score()).isEqualTo(85);
        assertThat(result.message()).isEqualTo("Connection failed. Fallback simulation active: Great effort!");
        assertThat(result.words()).hasSize(2);
        assertThat(result.words().get(0).word()).isEqualTo("Hello");
        assertThat(result.words().get(0).accuracyScore()).isEqualTo(90);
        assertThat(result.words().get(0).errorType()).isEqualTo("None");
        assertThat(result.words().get(0).phonemes()).hasSize(5);
        assertThat(result.words().get(0).phonemes().get(0).phoneme()).isEqualTo("h");
        assertThat(result.words().get(0).phonemes().get(0).accuracyScore()).isEqualTo(90);
        assertThat(result.words().get(1).word()).isEqualTo("world");
        assertThat(result.words().get(1).phonemes()).hasSize(5);
    }

    @Test
    void mapsScoreThresholdsToFeedbackMessages() {
        assertThat(PronunciationAssessmentParser.messageForScore(95))
                .isEqualTo("Perfect accent! Microsoft AI grades you as elite.");
        assertThat(PronunciationAssessmentParser.messageForScore(90))
                .isEqualTo("Perfect accent! Microsoft AI grades you as elite.");
        assertThat(PronunciationAssessmentParser.messageForScore(89))
                .isEqualTo("Great pronunciation and flow, keep practicing.");
        assertThat(PronunciationAssessmentParser.messageForScore(70))
                .isEqualTo("Great pronunciation and flow, keep practicing.");
        assertThat(PronunciationAssessmentParser.messageForScore(69))
                .isEqualTo("A bit off. Try articulating clearly and speaking louder.");
        assertThat(PronunciationAssessmentParser.messageForScore(40))
                .isEqualTo("A bit off. Try articulating clearly and speaking louder.");
        assertThat(PronunciationAssessmentParser.messageForScore(39))
                .isEqualTo("Speak slowly, enunciate each syllable, and try again.");
        assertThat(PronunciationAssessmentParser.messageForScore(0))
                .isEqualTo("Speak slowly, enunciate each syllable, and try again.");
    }

    @Test
    void normalizesPunctuationAndCaseForAlignment() {
        assertThat(PronunciationAssessmentParser.normalizeWords("  Don’t stop!  "))
                .containsExactly("don't", "stop");
        assertThat(PronunciationAssessmentParser.normalizeWords("It's — fine."))
                .containsExactly("it's", "fine");
        assertThat(PronunciationAssessmentParser.normalizeWords(null)).isEmpty();
        assertThat(PronunciationAssessmentParser.normalizeWords("   ")).isEmpty();
    }

    @Test
    void computesCharacterEditDistance() {
        assertThat(PronunciationAssessmentParser.levenshtein("kitten", "sitting")).isEqualTo(3);
        assertThat(PronunciationAssessmentParser.levenshtein("", "abc")).isEqualTo(3);
        assertThat(PronunciationAssessmentParser.levenshtein("abc", "")).isEqualTo(3);
        assertThat(PronunciationAssessmentParser.levenshtein("same", "same")).isZero();
    }

    @Test
    void alignsFuzzilySpokenWords() {
        List<String> reference = PronunciationAssessmentParser.normalizeWords("wonderful world");
        List<String> spoken = PronunciationAssessmentParser.normalizeWords("wonderfull worls");

        // reference words are longer than 4 chars -> edit distance tolerance of 2
        assertThat(PronunciationAssessmentParser.alignLastSpokenIndex(reference, spoken)).isEqualTo(1);
        assertThat(PronunciationAssessmentParser.alignLastSpokenIndex(reference, List.of())).isEqualTo(-1);
    }
}
