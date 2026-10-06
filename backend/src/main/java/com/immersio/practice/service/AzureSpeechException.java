package com.immersio.practice.service;

/**
 * Upstream Azure Speech failure carrying the HTTP status code and raw error
 * body so callers can surface them to the client (legacy .NET behaviour).
 */
public class AzureSpeechException extends RuntimeException {

    private final int statusCode;
    private final String detail;

    public AzureSpeechException(int statusCode, String detail) {
        super("Azure Speech request failed with status " + statusCode);
        this.statusCode = statusCode;
        this.detail = detail;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public String getDetail() {
        return detail;
    }
}
