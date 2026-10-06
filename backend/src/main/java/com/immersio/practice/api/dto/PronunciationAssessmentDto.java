package com.immersio.practice.api.dto;

import java.util.List;

/**
 * Result of a pronunciation assessment. Serialized exactly as the frontend
 * expects: {transcript, score, message, words[{word, accuracyScore, errorType,
 * phonemes[{phoneme, accuracyScore}]}]}.
 */
public record PronunciationAssessmentDto(String transcript, int score, String message, List<WordAssessmentDto> words) {
}
