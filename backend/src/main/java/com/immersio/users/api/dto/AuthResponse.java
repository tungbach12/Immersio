package com.immersio.users.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AuthResponse(
        @JsonProperty("accessToken") String accessToken,
        @JsonProperty("refreshToken") String refreshToken,
        @JsonProperty("user") UserDto user) {

    @JsonProperty("token")
    public String token() {
        return accessToken;
    }
}
