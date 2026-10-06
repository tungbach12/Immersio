package com.immersio.flashcards.repository;
import com.immersio.flashcards.domain.Deck;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface DeckRepository extends JpaRepository<Deck, UUID> {
    List<Deck> findAllByUserIdAndIsDeletedFalse(UUID userId);
    Optional<Deck> findByIdAndIsDeletedFalse(UUID id);
}
