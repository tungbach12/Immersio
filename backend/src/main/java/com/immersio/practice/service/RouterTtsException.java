package com.immersio.practice.service;

/** Thrown when 9Router's TTS endpoint answers with a non-2xx status. */
public class RouterTtsException extends java.io.IOException {

    private final int statusCode;
    private final String detail;

    public RouterTtsException(int statusCode, String detail) {
        super("9Router TTS error: HTTP " + statusCode);
        this.statusCode = statusCode;
        this.detail = detail == null ? "" : detail;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public String getDetail() {
        return detail;
    }
}
