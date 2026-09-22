package com.immersio.flashcards.service;

import com.immersio.flashcards.api.dto.*;
import com.immersio.flashcards.domain.*;
import com.immersio.flashcards.repository.*;
import com.immersio.shared.exception.ConflictException;
import com.immersio.shared.exception.ResourceNotFoundException;
import com.immersio.users.domain.User;
import com.immersio.users.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*; import java.util.*;

@Service
public class SrsService {
    private final DeckRepository deckRepository; private final CardRepository cardRepository; private final UserRepository userRepository;
    public SrsService(DeckRepository deckRepository, CardRepository cardRepository, UserRepository userRepository) {
        this.deckRepository = deckRepository; this.cardRepository = cardRepository; this.userRepository = userRepository;
    }
    @Transactional public DeckDto createDeck(UUID userId, String name) { return toDto(deckRepository.save(new Deck(name, userId))); }
    @Transactional(readOnly = true) public List<DeckDto> getDecks(UUID userId) {
        Instant now = Instant.now(); return deckRepository.findAllByUserIdAndIsDeletedFalse(userId).stream()
                .map(d -> new DeckDto(d.getId(), d.getName(), (int) cardRepository.countByDeckIdAndIsDeletedFalse(d.getId()),
                        (int) cardRepository.countByDeckIdAndIsDeletedFalseAndNextReviewDateLessThanEqual(d.getId(), now), d.getCreatedAt())).toList();
    }
    @Transactional(readOnly = true) public List<CardDto> getReviewCards(UUID deckId) {
        activeDeck(deckId); return cardRepository.findAllByDeckIdAndIsDeletedFalseAndNextReviewDateLessThanEqualOrderByNextReviewDateAsc(deckId, Instant.now()).stream().map(SrsService::toDto).toList();
    }
    @Transactional public int addCards(UUID deckId, List<AddCardDto> dtos) {
        Deck deck = activeDeck(deckId); User user = userRepository.findById(deck.getUserId()).filter(u -> !u.isDeleted()).orElseThrow(() -> new ResourceNotFoundException("User not found."));
        long existingToday = cardRepository.countByDeckUserIdAndCreatedAtGreaterThanEqualAndIsDeletedFalse(user.getId(), LocalDate.now(ZoneOffset.UTC).atStartOfDay().toInstant(ZoneOffset.UTC));
        if ("Basic".equalsIgnoreCase(user.getActiveSubscriptionTier()) && existingToday + dtos.size() > 50) throw new ConflictException("Basic users can add at most 50 cards per day.");
        List<Card> cards = dtos.stream().map(d -> new Card(deck, d.front(), d.back(), d.explanation(), d.tag())).toList(); cardRepository.saveAll(cards); return cards.size();
    }
    @Transactional public CardDto reviewCard(UUID cardId, int quality) { Card c = activeCard(cardId); c.review(quality); return toDto(cardRepository.save(c)); }
    @Transactional public void deleteDeck(UUID deckId) { Deck d = activeDeck(deckId); d.delete(); d.getCards().forEach(Card::delete); deckRepository.save(d); cardRepository.saveAll(d.getCards()); }
    @Transactional public void deleteCard(UUID cardId) { Card c = activeCard(cardId); c.delete(); cardRepository.save(c); }
    private Deck activeDeck(UUID id) { return deckRepository.findByIdAndIsDeletedFalse(id).orElseThrow(() -> new ResourceNotFoundException("Deck not found.")); }
    private Card activeCard(UUID id) { return cardRepository.findByIdAndIsDeletedFalse(id).orElseThrow(() -> new ResourceNotFoundException("Card not found.")); }
    private static DeckDto toDto(Deck d) { return new DeckDto(d.getId(), d.getName(), 0, 0, d.getCreatedAt()); }
    private static CardDto toDto(Card c) { return new CardDto(c.getId(), c.getDeckId(), c.getFront(), c.getBack(), c.getExplanation(), c.getTag(), c.getRepetitions(), c.getEasinessFactor(), c.getIntervalDays(), c.getNextReviewDate(), c.getLastReviewedAt()); }
}
