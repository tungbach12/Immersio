package com.immersio.shared.ai;

/**
 * Normalises chat-completion response bodies from the 9Router gateway.
 *
 * <p>9Router appends an SSE terminator to {@code /v1/chat/completions} responses
 * even when the request was sent with {@code stream:false} — the body is the
 * completion JSON immediately followed by {@code data: [DONE]}. Jackson rejects
 * trailing tokens, so a naive {@code readTree(body)} throws and every caller
 * silently degrades to its fallback (no grammar correction, zero flashcards,
 * placeholder dictionary entries). Extract the JSON object before parsing.</p>
 */
public final class ChatCompletionBody {

    private ChatCompletionBody() {
    }

    /**
     * Returns just the leading JSON object from a response body, discarding a leading
     * {@code data: } prefix and any trailing SSE framing such as {@code data: [DONE]}.
     * Falls back to the trimmed input when no balanced object can be located, so
     * existing error handling still applies.
     */
    public static String extractJsonObject(String responseBody) {
        if (responseBody == null) {
            return null;
        }
        String trimmed = responseBody.strip();
        if (trimmed.startsWith("data:")) {
            trimmed = trimmed.substring("data:".length()).strip();
        }
        int start = trimmed.indexOf('{');
        if (start < 0) {
            return trimmed;
        }
        // Walk the text to find the end of the first balanced top-level object,
        // tracking string state so braces inside JSON strings do not miscount.
        int depth = 0;
        boolean inString = false;
        boolean escaped = false;
        for (int i = start; i < trimmed.length(); i++) {
            char c = trimmed.charAt(i);
            if (inString) {
                if (escaped) {
                    escaped = false;
                } else if (c == '\\') {
                    escaped = true;
                } else if (c == '"') {
                    inString = false;
                }
                continue;
            }
            if (c == '"') {
                inString = true;
            } else if (c == '{') {
                depth++;
            } else if (c == '}') {
                depth--;
                if (depth == 0) {
                    return trimmed.substring(start, i + 1);
                }
            }
        }
        return trimmed;
    }
}
