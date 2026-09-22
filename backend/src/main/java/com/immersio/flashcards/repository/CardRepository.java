package com.immersio.flashcards.repository;
import com.immersio.flashcards.domain.Card;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant; import java.util.*;
public interface CardRepository extends JpaRepository<Card, UUID> {
    List<Card> findAllByDeckIdAndIsDeletedFalseAndNextReviewDateLessThanEqualOrderByNextReviewDateAsc(UUID deckId, Instant now);
    long countByDeckIdAndIsDeletedFalse(UUID deckId);
    long countByDeckIdAndIsDeletedFalseAndNextReviewDateLessThanEqual(UUID deckId, Instant now);
    long countByDeckUserIdAndCreatedAtGreaterThanEqualAndIsDeletedFalse(UUID userId, Instant date);
    Optional<Card> findByIdAndIsDeletedFalse(UUID id);
}
