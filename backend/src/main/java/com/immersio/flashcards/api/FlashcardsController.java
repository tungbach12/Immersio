package com.immersio.flashcards.api;
import com.immersio.flashcards.api.dto.*; import com.immersio.flashcards.service.SrsService; import com.immersio.shared.dto.ApiResponse; import com.immersio.shared.security.JwtTokenProvider;
import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api/flashcards")
public class FlashcardsController {
    private final SrsService service; private final JwtTokenProvider jwt;
    public FlashcardsController(SrsService service, JwtTokenProvider jwt) { this.service = service; this.jwt = jwt; }
    @PostMapping("/decks") public ApiResponse<DeckDto> createDeck(@RequestHeader("Authorization") String auth, @RequestBody Map<String,String> body) { return ApiResponse.successResult(service.createDeck(user(auth), body.get("name"))); }
    @GetMapping("/decks") public ApiResponse<List<DeckDto>> decks(@RequestHeader("Authorization") String auth) { return ApiResponse.successResult(service.getDecks(user(auth))); }
    @DeleteMapping("/decks/{deckId}") public ApiResponse<Void> deleteDeck(@PathVariable UUID deckId) { service.deleteDeck(deckId); return ApiResponse.successResult(null); }
    @GetMapping("/decks/{deckId}/review") public ApiResponse<List<CardDto>> review(@PathVariable UUID deckId) { return ApiResponse.successResult(service.getReviewCards(deckId)); }
    @PostMapping("/decks/{deckId}/cards") public ApiResponse<Map<String,Integer>> add(@PathVariable UUID deckId, @RequestBody List<AddCardDto> cards) { return ApiResponse.successResult(Map.of("count", service.addCards(deckId, cards))); }
    @PostMapping("/cards/{cardId}/review") public ApiResponse<CardDto> reviewCard(@PathVariable UUID cardId, @RequestBody ReviewCardRequest req) { return ApiResponse.successResult(service.reviewCard(cardId, req.quality())); }
    @DeleteMapping("/cards/{cardId}") public ApiResponse<Void> deleteCard(@PathVariable UUID cardId) { service.deleteCard(cardId); return ApiResponse.successResult(null); }
    private UUID user(String auth) { return jwt.extractUserId(auth.replace("Bearer ", "")); }
}
