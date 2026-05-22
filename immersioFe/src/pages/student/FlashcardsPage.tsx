import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  RotateCcw,
  Check,
  X,
  BookOpen,
  ArrowRight,
  BarChart3,
  Zap,
  TrendingUp,
  Target,
  Layers,
  Sparkles,
  Brain,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getDecks,
  getReviewCards,
  reviewCard,
  type Deck,
  type Flashcard,
} from "@/services/decks";

type ViewState = "decks" | "study" | "complete" | "stats";

export default function FlashcardsPage() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>(deckId ? "study" : "decks");
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

  useEffect(() => {
    getDecks()
      .then((data) => {
        setDecks(data);
        if (deckId) {
          const deck = data.find((d) => d.id === deckId);
          if (deck) {
            setSelectedDeck(deck);
            loadCards(deck);
          }
        }
      })
      .catch(console.error)
      .finally(() => setDecksLoading(false));
  }, [deckId]);

  useEffect(() => {
    if (view === "study" && cards.length > 0 && currentIndex >= cards.length) {
      const timer = setTimeout(() => setView("complete"), 350);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, cards.length, view]);

  const loadCards = useCallback(async (deck: Deck) => {
    setCardsLoading(true);
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCards(new Set());
    setCurrentStreak(0);
    setBestStreak(0);
    try {
      const data = await getReviewCards(deck.id);
      setCards(data);
      setView("study");
    } catch (err) {
      console.error(err);
      setCards([]);
    } finally {
      setCardsLoading(false);
      setInitialLoad(false);
    }
  }, []);

  const selectDeck = (deck: Deck) => {
    setSelectedDeck(deck);
    navigate(`/student/flashcards/${deck.id}`, { replace: true });
    loadCards(deck);
  };

  const handleReview = async (known: boolean) => {
    const card = cards[currentIndex];
    if (!card) return;
    if (known) {
      setKnownCards((prev) => new Set(prev).add(currentIndex));
      setCurrentStreak((prev) => {
        const next = prev + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
    } else {
      setCurrentStreak(0);
    }
    try {
      await reviewCard(card.id, known ? 5 : 1);
    } catch (err) {
      console.error("Review failed:", err);
    }
    setCards((prev) =>
      prev.map((c, idx) => {
        if (idx !== currentIndex) return c;
        const newMastery = known
          ? Math.min((c.mastery || 1) + 1, 5)
          : Math.max((c.mastery || 1) - 1, 1);
        return { ...c, mastery: newMastery };
      })
    );
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => prev + 1), 200);
  };

  const goBack = () => {
    if (view === "study" || view === "complete" || view === "stats") {
      setView("decks");
      navigate("/student/flashcards", { replace: true });
      setSelectedDeck(null);
      setCards([]);
      setCurrentIndex(0);
      setIsFlipped(false);
      setKnownCards(new Set());
    } else {
      navigate("/student/practice");
    }
  };

  const handleRestart = () => {
    if (selectedDeck) loadCards(selectedDeck);
  };

  const masteryDistribution = [1, 2, 3, 4, 5].map(
    (level) => cards.filter((c) => (c.mastery || 1) === level).length
  );

  const totalDue = decks.reduce((sum, d) => sum + (d.dueCardsCount || 0), 0);
  const totalAllCards = decks.reduce((sum, d) => sum + (d.totalCards || 0), 0);

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 via-indigo-50/20 to-white relative overflow-hidden">
      {/* Ambient background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-indigo-100/40 via-purple-100/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-violet-100/30 via-indigo-100/20 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <AnimatePresence mode="wait">
        {view === "decks" && (
          <DeckListView
            key="decks"
            decks={decks}
            loading={decksLoading}
            totalDue={totalDue}
            totalCards={totalAllCards}
            onSelect={selectDeck}
            onBack={goBack}
            onStats={() => setView("stats")}
          />
        )}
        {view === "study" && (
          <StudyView
            key={`study-${selectedDeck?.id || "none"}`}
            deck={selectedDeck}
            cards={cards}
            currentIndex={currentIndex}
            isFlipped={isFlipped}
            loading={cardsLoading}
            initialLoad={initialLoad}
            currentStreak={currentStreak}
            bestStreak={bestStreak}
            onFlip={() => setIsFlipped((prev) => !prev)}
            onReview={handleReview}
            onBack={goBack}
          />
        )}
        {view === "complete" && (
          <CompleteView
            key="complete"
            deckName={selectedDeck?.name || "Deck"}
            totalCards={cards.length}
            knownCount={knownCards.size}
            bestStreak={bestStreak}
            masteryDistribution={masteryDistribution}
            onRestart={handleRestart}
            onBack={goBack}
          />
        )}
        {view === "stats" && (
          <StatsView
            key="stats"
            decks={decks}
            totalDue={totalDue}
            totalCards={totalAllCards}
            onBack={goBack}
            onSelectDeck={(deck) => {
              setSelectedDeck(deck);
              navigate(`/student/flashcards/${deck.id}`, { replace: true });
              loadCards(deck);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ────────────────── DECK LIST ────────────────── */

function DeckListView({
  decks,
  loading,
  totalDue,
  totalCards,
  onSelect,
  onBack,
  onStats,
}: {
  key?: string;
  decks: Deck[];
  loading: boolean;
  totalDue: number;
  totalCards: number;
  onSelect: (deck: Deck) => void;
  onBack: () => void;
  onStats: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col min-h-full relative z-10"
    >
      {/* Header */}
      <div className="px-6 md:px-8 pt-6 pb-5">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="flex items-center gap-4 mb-6"
        >
          <button
            onClick={onBack}
            className="w-12 h-12 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-lg shadow-slate-200/50 flex items-center justify-center text-slate-600 hover:bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all duration-300"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Flashcards
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                {decks.length} deck{decks.length !== 1 ? "s" : ""}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                {totalCards} cards
              </span>
              {totalDue > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em]">
                    {totalDue} due
                  </span>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Quick stats row */}
        {totalDue > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl text-white shadow-lg shadow-indigo-500/25"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">Ready to review?</p>
              <p className="text-xs text-white/70">
                You have {totalDue} card{totalDue !== 1 ? "s" : ""} waiting
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-white/60" />
          </motion.div>
        )}
      </div>

      <div className="flex-1 px-6 md:px-8 pb-6">
        <div className="max-w-lg mx-auto">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-28 rounded-3xl bg-white/60 animate-pulse border border-slate-100"
                />
              ))}
            </div>
          ) : decks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-24 px-8 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <BookOpen className="w-7 h-7 text-indigo-500" />
              </div>
              <p className="text-base font-bold text-slate-400 uppercase tracking-widest">
                No decks yet
              </p>
            </motion.div>
          ) : (
            <>
              <div className="space-y-4">
                {decks.map((deck, i) => (
                  <motion.button
                    key={deck.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.05 * i,
                      duration: 0.4,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                    onClick={() => onSelect(deck)}
                    className="w-full text-left group"
                  >
                    <div className="relative bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all duration-300 active:scale-[0.98] overflow-hidden">
                      {/* Gradient accent on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="relative flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 group-hover:rotate-3 transition-all duration-500">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-slate-900 leading-tight">
                            {deck.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-medium text-slate-400">
                              {deck.totalCards || 0} cards
                            </span>
                            {deck.dueCardsCount ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                {deck.dueCardsCount} due
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500">
                                <Check className="w-3 h-3" />
                                All done
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 group-hover:translate-x-1 transition-all duration-300">
                          <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 -rotate-180" />
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.06 * decks.length + 0.15 }}
                onClick={onStats}
                className="w-full mt-5 group"
              >
                <div className="relative bg-white rounded-2xl p-4 flex items-center gap-4 border border-slate-100 hover:border-violet-200 hover:bg-gradient-to-r hover:from-violet-50/50 hover:to-indigo-50/50 transition-all duration-300 active:scale-[0.98]">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <BarChart3 className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm text-slate-700">
                      View Statistics
                    </h3>
                    <p className="text-xs text-slate-400">
                      Overall progress & insights
                    </p>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-violet-400 -rotate-180 transition-colors" />
                </div>
              </motion.button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ────────────────── STUDY VIEW ────────────────── */

function StudyView({
  deck,
  cards,
  currentIndex,
  isFlipped,
  loading,
  initialLoad,
  currentStreak,
  bestStreak,
  onFlip,
  onReview,
  onBack,
}: {
  key?: string;
  deck: Deck | null;
  cards: Flashcard[];
  currentIndex: number;
  isFlipped: boolean;
  loading: boolean;
  initialLoad: boolean;
  currentStreak: number;
  bestStreak: number;
  onFlip: () => void;
  onReview: (known: boolean) => void;
  onBack: () => void;
}) {
  const currentCard = cards[currentIndex];
  const totalCards = cards.length;
  const progressPct = totalCards > 0 ? (currentIndex / totalCards) * 100 : 0;

  if (loading || initialLoad) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70dvh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-14 h-14 rounded-full border-4 border-slate-100 border-t-indigo-500"
        />
        <p className="text-slate-400 font-semibold text-sm mt-5">
          Loading cards...
        </p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center min-h-[70dvh] px-6 relative z-10"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl flex items-center justify-center mb-6"
        >
          <Check className="w-10 h-10 text-emerald-500" />
        </motion.div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">All caught up</h2>
        <p className="text-slate-500 text-center max-w-xs leading-relaxed">
          No cards due for review in{" "}
          <span className="font-semibold text-slate-700">{deck?.name}</span>.
        </p>
        <button
          onClick={onBack}
          className="mt-8 inline-flex items-center gap-2 h-12 px-8 rounded-2xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-all active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Decks
        </button>
      </motion.div>
    );
  }

  if (!currentCard) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col min-h-full relative z-10"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 md:px-8 pt-6 pb-4">
        <button
          onClick={onBack}
          className="w-11 h-11 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-sm flex items-center justify-center text-slate-500 hover:bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h2 className="font-bold text-slate-900 text-lg">{deck?.name}</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {currentIndex + 1} of {totalCards}
          </p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/30">
          {Math.min(currentIndex + 1, totalCards)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-slate-100 mx-6 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
        />
      </div>

      {/* Streak indicator */}
      <AnimatePresence>
        {currentStreak >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            className="flex items-center justify-center gap-2 py-3"
          >
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="text-xs font-bold text-amber-600">
              {currentStreak} streak
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Area */}
      <div className="flex-1 flex items-center justify-center px-6 py-6">
        <div className="w-full max-w-md">
          <div className="perspective-2000 w-full aspect-[3/4]">
            <motion.div
              className="relative w-full h-full preserve-3d"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            >
              {/* ── CARD FRONT ── */}
              <div
                className={cn(
                  "absolute inset-0 rounded-[2rem] cursor-pointer select-none overflow-hidden backface-hidden",
                  "bg-white border border-slate-200 shadow-xl shadow-slate-200/50"
                )}
                onClick={onFlip}
              >
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-violet-50/30 pointer-events-none" />

                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />

                <div className="flex flex-col items-center justify-center h-full p-8 text-center relative">
                  {/* Mastery indicator */}
                  <div className="absolute top-8 left-0 right-0 flex flex-col items-center gap-2">
                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
                      Mastery
                    </p>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={cn(
                            "h-1.5 w-10 rounded-full transition-all duration-500",
                            level <= (currentCard.mastery || 1)
                              ? "bg-gradient-to-r from-indigo-500 to-violet-500"
                              : "bg-slate-100"
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Card number badge */}
                  <div className="absolute top-20 right-6 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-slate-400">
                      {currentIndex + 1}
                    </span>
                  </div>

                  <h3 className="text-3xl md:text-4xl font-bold text-slate-900 text-center leading-tight mt-4">
                    {currentCard.front}
                  </h3>

                  <div className="absolute bottom-8 flex items-center gap-2 text-[10px] text-slate-400">
                    <span>Tap to reveal</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>

              {/* ── CARD BACK ── */}
              <div
                className={cn(
                  "absolute inset-0 rounded-[2rem] cursor-pointer select-none overflow-hidden backface-hidden",
                  "bg-gradient-to-br from-indigo-600 to-violet-700 shadow-xl shadow-indigo-500/25"
                )}
                style={{ transform: "rotateY(180deg)" }}
                onClick={onFlip}
              >
                {/* Decorative elements */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-violet-400/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative h-full flex flex-col items-center justify-center p-8 text-center">
                  <p className="text-[9px] font-semibold text-white/50 uppercase tracking-widest mb-4">
                    Definition
                  </p>

                  <h3 className="text-lg font-medium text-white/60 mb-4">
                    {currentCard.front}
                  </h3>

                  <div className="w-10 h-0.5 bg-white/20 rounded-full mb-4" />

                  <p className="text-2xl md:text-3xl font-bold text-white leading-snug max-w-xs">
                    {currentCard.back}
                  </p>

                  {currentCard.explanation && (
                    <div className="mt-6 bg-white/10 backdrop-blur-sm p-4 rounded-2xl w-full border border-white/10">
                      <p className="text-sm text-white/80 leading-relaxed">
                        {currentCard.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div
            key="actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="px-6 pb-8"
          >
            <div className="max-w-md mx-auto flex gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReview(false);
                }}
                className="flex-1 h-14 rounded-2xl border-2 border-slate-200 bg-white text-slate-600 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 active:scale-95 shadow-sm"
              >
                <X className="w-4 h-4" />
                Still Learning
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReview(true);
                }}
                className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-200 active:scale-95"
              >
                <Check className="w-4 h-4" />
                Got It
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ────────────────── COMPLETE VIEW ────────────────── */

function ScoreRing({ pct, size = 140 }: { pct: number; size?: number }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#scoreGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <motion.span
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="absolute font-bold text-slate-900"
        style={{ fontSize: size * 0.28 }}
      >
        {Math.round(pct)}%
      </motion.span>
    </div>
  );
}

function CompleteView({
  deckName,
  totalCards,
  knownCount,
  bestStreak,
  masteryDistribution,
  onRestart,
  onBack,
}: {
  key?: string;
  deckName: string;
  totalCards: number;
  knownCount: number;
  bestStreak: number;
  masteryDistribution: number[];
  onRestart: () => void;
  onBack: () => void;
}) {
  const maxCount = Math.max(...masteryDistribution, 1);
  const accuracy = totalCards > 0 ? (knownCount / totalCards) * 100 : 0;
  const learningCount = totalCards - knownCount;

  const label =
    accuracy >= 90
      ? "Outstanding!"
      : accuracy >= 70
      ? "Great work!"
      : accuracy >= 50
      ? "Keep going!"
      : "More practice needed";

  const labelColor =
    accuracy >= 90
      ? "text-emerald-600"
      : accuracy >= 70
      ? "text-indigo-600"
      : accuracy >= 50
      ? "text-amber-600"
      : "text-slate-600";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col min-h-full relative z-10"
    >
      <div className="flex items-center px-6 md:px-8 pt-6 pb-2">
        <button
          onClick={onBack}
          className="w-11 h-11 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-sm flex items-center justify-center text-slate-500 hover:bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-6">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 p-8 md:p-10 text-center"
          >
            {/* Score Ring */}
            <div className="flex justify-center mb-6">
              <ScoreRing pct={accuracy} />
            </div>

            <p className={cn("text-sm font-bold uppercase tracking-widest mb-1", labelColor)}>
              {label}
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mb-8">{deckName}</h3>

            {/* Session Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-slate-50 rounded-2xl py-4 px-2">
                <p className="text-xl font-bold text-slate-900">{totalCards}</p>
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-1">
                  Reviewed
                </p>
              </div>
              <div className="bg-emerald-50 rounded-2xl py-4 px-2 border border-emerald-100">
                <p className="text-xl font-bold text-emerald-600">{knownCount}</p>
                <p className="text-[9px] font-semibold text-emerald-500 uppercase tracking-wider mt-1">
                  Known
                </p>
              </div>
              <div className="bg-slate-50 rounded-2xl py-4 px-2">
                <p className="text-xl font-bold text-slate-900">{learningCount}</p>
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-1">
                  Learning
                </p>
              </div>
            </div>

            {/* Best Streak */}
            {bestStreak >= 2 && (
              <div className="flex items-center justify-center gap-2 bg-amber-50 rounded-2xl py-3 px-4 mb-6 border border-amber-100">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-xs font-bold text-amber-700">
                  Best streak: {bestStreak} cards
                </span>
              </div>
            )}

            {/* Mastery Levels */}
            <div className="bg-slate-50/80 rounded-2xl p-6 mb-6 border border-slate-100">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-6">
                Mastery Distribution
              </p>
              <div className="flex items-end justify-between h-28 gap-2">
                {masteryDistribution.map((count, idx) => {
                  const pct = (count / maxCount) * 100;
                  const colors = [
                    "from-slate-300 to-slate-400",
                    "from-slate-300 to-slate-400",
                    "from-indigo-400 to-indigo-500",
                    "from-indigo-500 to-violet-500",
                    "from-violet-500 to-purple-500",
                  ];
                  return (
                    <div
                      key={idx}
                      className="flex flex-col items-center flex-1 gap-2 h-full"
                    >
                      <span className="text-xs font-semibold text-slate-500">
                        {count}
                      </span>
                      <div className="w-full bg-slate-100 rounded-full relative flex-1 overflow-hidden">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(pct, 8)}%` }}
                          transition={{
                            duration: 0.8,
                            ease: [0.25, 0.1, 0.25, 1],
                            delay: idx * 0.1,
                          }}
                          className={cn(
                            "absolute bottom-0 w-full rounded-full bg-gradient-to-t",
                            colors[idx]
                          )}
                        />
                      </div>
                      <span className="text-[9px] font-semibold text-slate-400">
                        Lv {idx + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onRestart}
                className="flex-1 h-13 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                Retry
              </button>
              <button
                onClick={onBack}
                className="flex-1 h-13 rounded-2xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all active:scale-95"
              >
                Decks
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ────────────────── STATS VIEW ────────────────── */

function StatsView({
  decks,
  totalDue,
  totalCards,
  onBack,
  onSelectDeck,
}: {
  key?: string;
  decks: Deck[];
  totalDue: number;
  totalCards: number;
  onBack: () => void;
  onSelectDeck: (deck: Deck) => void;
}) {
  const totalDecks = decks.length;
  const avgCardsPerDeck = totalDecks > 0 ? Math.round(totalCards / totalDecks) : 0;
  const avgDuePerDeck = totalDecks > 0 ? Math.round(totalDue / totalDecks) : 0;

  const statCards = [
    {
      icon: Layers,
      value: totalDecks,
      label: "Decks",
      gradient: "from-indigo-500 to-violet-500",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
    },
    {
      icon: BookOpen,
      value: totalCards,
      label: "Total Cards",
      gradient: "from-violet-500 to-purple-500",
      bg: "bg-violet-50",
      border: "border-violet-100",
    },
    {
      icon: Target,
      value: totalDue,
      label: "Due Today",
      gradient: "from-amber-500 to-orange-500",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
    {
      icon: TrendingUp,
      value: avgCardsPerDeck,
      label: "Avg / Deck",
      gradient: "from-emerald-500 to-teal-500",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col min-h-full relative z-10"
    >
      <div className="px-6 md:px-8 pt-6 pb-5">
        <div className="flex items-center gap-4 mb-5">
          <button
            onClick={onBack}
            className="w-11 h-11 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-sm flex items-center justify-center text-slate-500 hover:bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Statistics</h1>
            <p className="text-xs text-slate-400 mt-0.5">Overall study insights</p>
          </div>
        </div>

        {/* Stats cards grid */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.3 }}
              className={cn(
                "rounded-2xl p-5 border",
                stat.bg,
                stat.border
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl bg-gradient-to-br mb-3 flex items-center justify-center",
                  stat.gradient,
                  "shadow-sm"
                )}
              >
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-6">
        <div className="max-w-lg mx-auto">
          {/* Per-deck breakdown */}
          {decks.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="font-semibold text-slate-800">Deck Breakdown</p>
              </div>
              <div className="space-y-3">
                {decks.map((deck, i) => (
                  <motion.button
                    key={deck.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    onClick={() => onSelectDeck(deck)}
                    className="w-full text-left group"
                  >
                    <div className="rounded-xl p-4 bg-slate-50 hover:bg-indigo-50/50 transition-colors border border-transparent hover:border-indigo-100 active:scale-[0.98]">
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="font-semibold text-sm text-slate-800">
                          {deck.name}
                        </h4>
                        <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 -rotate-180 transition-colors" />
                      </div>
                      <div className="flex gap-4">
                        <span className="text-xs font-medium text-slate-500">
                          {deck.totalCards || 0} cards
                        </span>
                        {deck.dueCardsCount ? (
                          <span className="text-xs font-semibold text-amber-600">
                            {deck.dueCardsCount} due
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-emerald-500 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            All reviewed
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}