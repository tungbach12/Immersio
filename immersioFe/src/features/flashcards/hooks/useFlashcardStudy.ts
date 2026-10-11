import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getDecks,
  getReviewCards,
  reviewCard,
  type Deck,
  type Flashcard,
} from "@/services/decks";

type StudyView = "decks" | "study" | "complete" | "stats";

export function useFlashcardStudy() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [view, setView] = useState<StudyView>(deckId ? "study" : "decks");
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<Set<number>>(new Set());
  const [decksLoading, setDecksLoading] = useState(true);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [error, setError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const request = useRef(0);
  const reviewLock = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadCards = useCallback(
    async (deck: Deck, requestId = request.current) => {
      setCardsLoading(true);
      setInitialLoad(true);
      setError("");
      setReviewError("");
      setCurrentIndex(0);
      setIsFlipped(false);
      setKnownCards(new Set());
      setCurrentStreak(0);
      setBestStreak(0);
      setCards([]);
      try {
        const queue = await getReviewCards(deck.id);
        if (requestId === request.current) {
          setCards(queue);
          setView("study");
        }
      } catch {
        if (requestId === request.current)
          setError("Your review cards could not be loaded.");
      } finally {
        if (requestId === request.current) {
          setCardsLoading(false);
          setInitialLoad(false);
        }
      }
    },
    [],
  );

  const loadWorkspace = useCallback(async () => {
    const requestId = ++request.current;
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    reviewLock.current = false;
    setReviewing(false);
    setDecksLoading(true);
    setError("");
    setInitialLoad(Boolean(deckId));
    setView(deckId ? "study" : "decks");
    try {
      const collections = await getDecks();
      if (requestId !== request.current) return;
      setDecks(collections);
      const deck = collections.find((item) => item.id === deckId);
      setSelectedDeck(deck || null);
      if (deckId && !deck) {
        setError("This word collection could not be found.");
        setInitialLoad(false);
      } else if (deck) await loadCards(deck, requestId);
    } catch {
      if (requestId === request.current) {
        setError("Your word collections could not be loaded.");
        setInitialLoad(false);
      }
    } finally {
      if (requestId === request.current) setDecksLoading(false);
    }
  }, [deckId, loadCards]);

  useEffect(() => {
    void loadWorkspace();
    return () => {
      ++request.current;
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, [loadWorkspace]);

  async function handleReview(known: boolean) {
    const card = cards[currentIndex];
    if (!card || reviewLock.current) return;
    const requestId = request.current;
    reviewLock.current = true;
    setReviewing(true);
    setReviewError("");
    try {
      const reviewed = await reviewCard(card.id, known ? 5 : 1);
      if (requestId !== request.current) return;
      setCards((previous) =>
        previous.map((item) =>
          item.id === card.id ? { ...item, ...reviewed } : item,
        ),
      );
      if (known) {
        setKnownCards((previous) => new Set(previous).add(currentIndex));
        const nextStreak = currentStreak + 1;
        setCurrentStreak(nextStreak);
        setBestStreak((previous) => Math.max(previous, nextStreak));
      } else setCurrentStreak(0);
      setIsFlipped(false);
      advanceTimer.current = setTimeout(() => {
        setCurrentIndex((previous) => previous + 1);
        if (currentIndex + 1 === cards.length) setView("complete");
        reviewLock.current = false;
        setReviewing(false);
      }, 200);
    } catch {
      if (requestId === request.current) {
        setReviewError(
          "Your review was not saved. Please try this card again.",
        );
        reviewLock.current = false;
        setReviewing(false);
      }
    }
  }

  function goBack() {
    if (view === "stats") {
      setView("decks");
      return;
    }
    navigate(view === "decks" ? "/student/dashboard" : "/student/flashcards");
  }

  return {
    view,
    decks,
    selectedDeck,
    cards,
    currentIndex,
    isFlipped,
    knownCards,
    decksLoading,
    cardsLoading,
    initialLoad,
    currentStreak,
    bestStreak,
    error,
    reviewError,
    reviewing,
    totalDue: decks.reduce((sum, deck) => sum + (deck.dueCardsCount || 0), 0),
    totalCards: decks.reduce((sum, deck) => sum + (deck.totalCards || 0), 0),
    masteryDistribution: [1, 2, 3, 4, 5].map(
      (level) => cards.filter((card) => (card.mastery || 1) === level).length,
    ),
    selectDeck: (deck: Deck) => navigate(`/student/flashcards/${deck.id}`),
    showStats: () => setView("stats"),
    flip: () => {
      if (!reviewLock.current) setIsFlipped((previous) => !previous);
    },
    restart: () => {
      if (selectedDeck) void loadCards(selectedDeck);
    },
    retry: loadWorkspace,
    handleReview,
    goBack,
  };
}
