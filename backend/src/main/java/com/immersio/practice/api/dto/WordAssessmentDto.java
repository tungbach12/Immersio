package com.immersio.practice.api.dto;

import java.util.List;

public record WordAssessmentDto(String word, int accuracyScore, String errorType, List<PhonemeAssessmentDto> phonemes) {
}
