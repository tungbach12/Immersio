package com.immersio.practice.api.dto; import java.time.Instant; import java.util.UUID;
public record PronunciationLogDto(UUID id,String phrase,String transcript,int score,Instant practicedAt){}
