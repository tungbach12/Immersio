import { AnimatePresence } from "motion/react";
import { ContentState } from "@/components/learning/ContentState";
import { useFlashcardStudy } from "@/features/flashcards/hooks/useFlashcardStudy";
import { DeckListView } from "@/features/flashcards/components/DeckListView";
import { StudyView } from "@/features/flashcards/components/StudyView";
import { CompleteView } from "@/features/flashcards/components/CompleteView";
import { StatsView } from "@/features/flashcards/components/StatsView";

export default function FlashcardsPage() {
  const study = useFlashcardStudy();
  if (study.error)
    return (
      <ContentState
        title="Let’s find your words again."
        description={study.error}
        onRetry={study.retry}
      />
    );
  return (
    <div className="flashcard-workspace">
      {study.reviewError && (
        <p className="learning-inline-error mb-4" role="alert">
          {study.reviewError}
        </p>
      )}
      <AnimatePresence mode="wait">
        {study.view === "decks" && (
          <DeckListView
            key="decks"
            decks={study.decks}
            loading={study.decksLoading}
            totalDue={study.totalDue}
            totalCards={study.totalCards}
            onSelect={study.selectDeck}
            onStats={study.showStats}
          />
        )}
        {study.view === "study" && (
          <StudyView
            key={`study-${study.selectedDeck?.id || "loading"}`}
            deck={study.selectedDeck}
            cards={study.cards}
            currentIndex={study.currentIndex}
            isFlipped={study.isFlipped}
            loading={study.cardsLoading}
            initialLoad={study.initialLoad}
            currentStreak={study.currentStreak}
            bestStreak={study.bestStreak}
            reviewing={study.reviewing}
            onFlip={study.flip}
            onReview={study.handleReview}
            onBack={study.goBack}
          />
        )}
        {study.view === "complete" && (
          <CompleteView
            key="complete"
            deckName={study.selectedDeck?.name || "Collection"}
            totalCards={study.cards.length}
            knownCount={study.knownCards.size}
            bestStreak={study.bestStreak}
            masteryDistribution={study.masteryDistribution}
            onRestart={study.restart}
            onBack={study.goBack}
          />
        )}
        {study.view === "stats" && (
          <StatsView
            key="stats"
            decks={study.decks}
            totalDue={study.totalDue}
            totalCards={study.totalCards}
            onBack={study.goBack}
            onSelectDeck={study.selectDeck}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
