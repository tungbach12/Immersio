package com.immersio.practice.domain;
import jakarta.persistence.*; import java.time.Instant; import java.util.UUID;
@Entity @Table(name="\"UserPronunciationLogs\"")
public class UserPronunciationLog {
 @Id @GeneratedValue(strategy=GenerationType.UUID) @Column(name="\"Id\"") private UUID id;
 @Column(name="\"UserId\"",nullable=false) private UUID userId; @Column(name="\"Phrase\"",nullable=false,length=2000) private String phrase;
 @Column(name="\"Transcript\"",nullable=false,length=2000) private String transcript; @Column(name="\"Score\"",nullable=false) private int score;
 @Column(name="\"PracticedAt\"",nullable=false) private Instant practicedAt=Instant.now(); protected UserPronunciationLog(){}
 public UserPronunciationLog(UUID u,String p,String t,int s){userId=u;phrase=p;transcript=t;score=s;} public UUID getId(){return id;} public UUID getUserId(){return userId;} public String getPhrase(){return phrase;} public String getTranscript(){return transcript;} public int getScore(){return score;} public Instant getPracticedAt(){return practicedAt;}
}
