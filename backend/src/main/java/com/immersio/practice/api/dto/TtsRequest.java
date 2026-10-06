package com.immersio.practice.api.dto;

/**
 * Request body for POST /api/practice/tts. Field names mirror the legacy
 * .NET TtsRequest (text, voice, style, styleDegree) sent by the frontend.
 */
public record TtsRequest(String text, String voice, String style, Double styleDegree) {
}
