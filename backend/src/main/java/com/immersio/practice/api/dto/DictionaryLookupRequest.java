package com.immersio.practice.api.dto;

/**
 * Request body for POST /api/practice/dictionary-lookup. The frontend sends
 * both {@code targetLanguage} and {@code language}; the legacy .NET DTO only
 * bound {@code targetLanguage}, so it takes precedence when present.
 */
public record DictionaryLookupRequest(String word, String targetLanguage, String language) {

    public String resolvedTargetLanguage() {
        if (targetLanguage != null && !targetLanguage.isBlank()) {
            return targetLanguage;
        }
        if (language != null && !language.isBlank()) {
            return language;
        }
        return "English";
    }
}
