import React, { useState, useEffect, useCallback } from "react";
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
  Clock,
  Activity,
  Volume2,
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
      navigate("/student/dashboard");
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
    <div className="w-full min-h-full bg-transparent relative overflow-hidden">

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
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 shadow-lg flex items-center justify-center text-slate-300 hover:bg-white/10 hover:border-indigo-500/30 hover:text-white transition-all duration-300"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Flashcards
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                {decks.length} deck{decks.length !== 1 ? "s" : ""}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                {totalCards} cards
              </span>
              {totalDue > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-700" />
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">
                    {totalDue} due
                  </span>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Quick review row */}
        {totalDue > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="flex items-center gap-3 p-4 bg-indigo-600/80 rounded-2xl text-white shadow-lg border border-indigo-500/20 shadow-indigo-500/10"
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <Zap className="w-5 h-5 text-indigo-300 fill-indigo-300" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">Ready to review?</p>
              <p className="text-xs text-white/70">
                You have {totalDue} card{totalDue !== 1 ? "s" : ""} waiting
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-white/40" />
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
                  className="h-28 rounded-3xl bg-slate-900/40 animate-pulse border border-white/5"
                />
              ))}
            </div>
          ) : decks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-24 px-8 bg-slate-900/20 rounded-3xl border border-dashed border-white/5 shadow-2xl"
            >
              <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-indigo-500/20">
                <BookOpen className="w-7 h-7 text-indigo-455" />
              </div>
              <p className="text-base font-bold text-slate-500 uppercase tracking-widest">
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
                    <div className="relative glass-card bg-slate-900/40 rounded-3xl p-5 border border-white/5 shadow-2xl hover:border-indigo-500/30 hover:bg-slate-900/60 transition-all duration-300 active:scale-[0.98] overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="relative flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10 group-hover:scale-105 group-hover:rotate-3 transition-all duration-500">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-slate-100 leading-tight">
                            {deck.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-medium text-slate-400">
                              {deck.totalCards || 0} cards
                            </span>
                            {deck.dueCardsCount ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                {deck.dueCardsCount} due
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                                <Check className="w-3 h-3" />
                                All done
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/25 group-hover:text-indigo-300 group-hover:translate-x-1 transition-all duration-300">
                          <ChevronLeft className="w-4 h-4 text-slate-450 -rotate-180" />
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
                <div className="relative bg-slate-900/20 rounded-2xl p-4 flex items-center gap-4 border border-white/5 hover:border-violet-500/30 hover:bg-slate-900/40 transition-all duration-300 active:scale-[0.98]">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <BarChart3 className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm text-slate-200">
                      View Statistics
                    </h3>
                    <p className="text-xs text-slate-450">
                      Overall progress & insights
                    </p>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-violet-400 -rotate-180 transition-colors" />
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

const getTagBadge = (tag?: string) => {
  const t = tag?.toLowerCase();
  if (t === "grammar" || t === "ngữ pháp") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        Ngữ pháp
      </span>
    );
  }
  if (t === "cải thiện" || t === "improvement" || t === "sentence" || t === "câu") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
        Ngữ cảnh
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20">
      Từ vựng
    </span>
  );
};

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

  // Parse currentCard.front if it is a JSON string
  let parsedCard = null;
  let isJson = false;
  try {
    if (currentCard?.front && currentCard.front.trim().startsWith('{')) {
      parsedCard = JSON.parse(currentCard.front);
      isJson = true;
    }
  } catch (e) {
    console.error("Failed to parse card.front in FlashcardsPage", e);
  }

  // Determine display values & custom layouts
  let displayFront = currentCard?.front || "";
  let displayBack = currentCard?.back || "";
  let displayExplanation = currentCard?.explanation || "";
  let cardFrontContent: any = null;
  let cardBackContent: any = null;

  if (isJson && parsedCard) {
    const type = parsedCard.type;
    const content = parsedCard.content;
    
    if (type === "vocab") {
      displayFront = `${content.word} (${content.part_of_speech || "vocab"}) ${content.phonetic || ""}`;
      displayBack = content.meaning;
      displayExplanation = content.definition_en;

      cardFrontContent = (
        <div className="flex flex-col items-center justify-center h-full py-4 text-center">
          <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none italic font-display">
            {content.word}
          </h3>
          {content.part_of_speech && (
            <span className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
              {content.part_of_speech}
            </span>
          )}
          {content.phonetic && (
            <p className="text-sm font-semibold text-slate-400 mt-2 font-mono tracking-wide">
              {content.phonetic}
            </p>
          )}
        </div>
      );

      cardBackContent = (
        <div className="h-full flex flex-col justify-between py-2 text-center select-text">
          <div className="overflow-y-auto custom-scrollbar scrollbar-hide pr-1 space-y-4">
            <div>
              <h3 className="text-2xl font-black text-white italic tracking-tight font-display">
                {content.word}
              </h3>
              <div className="flex items-center justify-center gap-2 mt-1.5">
                {content.part_of_speech && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-indigo-500/25 text-indigo-300 border border-indigo-500/20">
                    {content.part_of_speech}
                  </span>
                )}
                {content.phonetic && (
                  <span className="text-xs text-slate-450 font-mono">
                    {content.phonetic}
                  </span>
                )}
              </div>
            </div>

            <div className="w-12 h-[1px] bg-white/10 rounded-full mx-auto" />

            <div className="space-y-1">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Nghĩa tiếng Việt</span>
              <p className="text-lg font-black text-emerald-400 tracking-tight leading-snug">
                {content.meaning}
              </p>
            </div>

            {content.definition_en && (
              <div className="space-y-1">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Định nghĩa tiếng Anh</span>
                <p className="text-xs text-slate-300 dark:text-slate-400 leading-relaxed max-w-xs mx-auto font-medium">
                  {content.definition_en}
                </p>
              </div>
            )}

            {(content.synonyms?.length > 0 || content.antonyms?.length > 0) && (
              <div className="flex flex-wrap gap-2 justify-center pt-1">
                {content.synonyms && content.synonyms.map((s: string) => (
                  <span key={s} className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-bold text-indigo-300">
                    ={s}
                  </span>
                ))}
                {content.antonyms && content.antonyms.map((a: string) => (
                  <span key={a} className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-bold text-slate-450">
                    ≠{a}
                  </span>
                ))}
              </div>
            )}

            {content.examples?.[0] && (
              <div className="mt-4 bg-slate-955/40 border border-white/5 p-4 rounded-[1.5rem] text-left">
                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block mb-1.5">Ví dụ</span>
                <p className="text-xs text-white leading-relaxed italic font-semibold">
                  "{content.examples[0].sentence}"
                </p>
                {content.examples[0].translation && (
                  <p className="text-[10px] text-slate-400 leading-normal mt-1 font-bold">
                    {content.examples[0].translation}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      );
    } else if (type === "grammar") {
      displayFront = content.title || "Grammar point";
      displayBack = content.examples?.[0]
        ? `✓ Correct: ${content.examples[0].sentence}`
        : currentCard.back;
      displayExplanation = content.usage || currentCard.explanation;

      cardFrontContent = (
        <div className="flex flex-col items-center justify-center h-full py-4 text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
            Cấu trúc ngữ pháp
          </span>
          <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight italic font-display px-2">
            {content.title}
          </h3>
          {content.usage && (
            <p className="text-xs text-slate-400 max-w-[280px] mt-4 leading-relaxed font-semibold">
              {content.usage}
            </p>
          )}
          {content.signal_words?.length > 0 && (
            <div className="mt-5 flex flex-wrap justify-center gap-1.5 max-w-[280px]">
              {content.signal_words.map((w: string) => (
                <span key={w} className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[9px] text-slate-450 font-bold uppercase tracking-wider">
                  {w}
                </span>
              ))}
            </div>
          )}
        </div>
      );

      cardBackContent = (
        <div className="h-full flex flex-col justify-between py-2 text-center select-text">
          <div className="overflow-y-auto custom-scrollbar scrollbar-hide pr-1 space-y-4">
            <div>
              <h3 className="text-xl font-black text-white italic tracking-tight font-display">
                {content.title}
              </h3>
              {content.usage && (
                <p className="text-[11px] text-slate-400 mt-1 max-w-[300px] mx-auto leading-normal font-semibold">
                  {content.usage}
                </p>
              )}
            </div>

            <div className="w-12 h-[1px] bg-white/10 rounded-full mx-auto" />

            {content.formula?.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Cấu trúc công thức</span>
                <div className="space-y-1.5">
                  {content.formula.map((f: any, idx: number) => (
                    <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-left">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block leading-none mb-1">
                        {f.form}
                      </span>
                      <code className="text-xs text-white font-mono font-bold leading-normal">
                        {f.structure}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {content.common_mistakes && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-[1.25rem] p-3 text-left">
                <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest block mb-1">⚠️ Lỗi thường gặp</span>
                <p className="text-[10px] text-amber-300 leading-relaxed font-bold">
                  {content.common_mistakes}
                </p>
              </div>
            )}

            {content.examples?.[0] && (
              <div className="mt-4 bg-slate-955/40 border border-white/5 p-4 rounded-[1.5rem] text-left">
                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest block mb-1.5">Ví dụ áp dụng</span>
                <p className="text-xs text-white leading-relaxed font-bold">
                  "{content.examples[0].sentence}"
                </p>
                {content.examples[0].translation && (
                  <p className="text-[10px] text-slate-400 leading-normal mt-1 font-semibold">
                    {content.examples[0].translation}
                  </p>
                )}
                {content.examples[0].note && (
                  <p className="text-[9px] text-indigo-300 leading-normal mt-1.5 pt-1.5 border-t border-white/5 font-semibold">
                    💡 Chú ý: {content.examples[0].note}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      );
    } else if (type === "sentence") {
      const rawCloze = content.cloze_sentence || "";
      const cleanedCloze = rawCloze.replace(/\{\{?c\d+::(.*?)\}\}?/g, "[ ... ]");
      displayFront = cleanedCloze;
      displayBack = content.target_phrase ? `Target: ${content.target_phrase}` : currentCard.back;
      displayExplanation = content.translation;

      // Clean cloze rendering: Highlight the cloze deletion word in front view
      const clozeParts = [];
      const clozeRegex = /\{\{?c\d+::(.*?)\}\}?/g;
      let lastIndex = 0;
      let match;
      while ((match = clozeRegex.exec(rawCloze)) !== null) {
        clozeParts.push(rawCloze.substring(lastIndex, match.index));
        clozeParts.push(
          <span key={match.index} className="px-2.5 py-0.5 mx-1 rounded-lg bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 font-extrabold tracking-wide">
            [ ... ]
          </span>
        );
        lastIndex = clozeRegex.lastIndex;
      }
      clozeParts.push(rawCloze.substring(lastIndex));

      cardFrontContent = (
        <div className="flex flex-col items-center justify-center h-full py-4 text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-5">
            Điền vào chỗ trống
          </span>
          <h3 className="text-xl md:text-2xl font-bold text-white text-center leading-relaxed px-1 whitespace-pre-wrap">
            {clozeParts.length > 1 ? clozeParts : rawCloze.replace(clozeRegex, "[ ... ]")}
          </h3>
          {content.phrase_meaning && (
            <p className="text-xs text-slate-400 mt-6 max-w-[280px] leading-relaxed font-semibold">
              💡 Gợi ý: <span className="text-slate-200 font-bold">{content.phrase_meaning}</span>
            </p>
          )}
          {content.translation && (
            <p className="text-[10px] text-slate-500 mt-3 max-w-[280px] leading-normal font-bold italic">
              "{content.translation}"
            </p>
          )}
        </div>
      );

      const fullText = content.full_sentence || rawCloze.replace(clozeRegex, "$1");
      const target = content.target_phrase || "";
      let highlightedSentence: React.ReactNode = fullText;
      if (target) {
        const idx = fullText.toLowerCase().indexOf(target.toLowerCase());
        if (idx !== -1) {
          highlightedSentence = (
            <>
              {fullText.substring(0, idx)}
              <span className="underline decoration-indigo-400 decoration-wavy underline-offset-4 font-black bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-lg border border-indigo-500/25">
                {fullText.substring(idx, idx + target.length)}
              </span>
              {fullText.substring(idx + target.length)}
            </>
          );
        }
      }

      cardBackContent = (
        <div className="h-full flex flex-col justify-between py-2 text-center select-text">
          <div className="overflow-y-auto custom-scrollbar scrollbar-hide pr-1 space-y-4">
            <div className="space-y-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 leading-none">
                Câu hoàn chỉnh
              </span>
              <h3 className="text-lg md:text-xl font-bold text-white text-center leading-relaxed px-1">
                "{highlightedSentence}"
              </h3>
              {content.translation && (
                <p className="text-xs text-slate-400 leading-normal max-w-[300px] mx-auto font-bold">
                  "{content.translation}"
                </p>
              )}
            </div>

            <div className="w-12 h-[1px] bg-white/10 rounded-full mx-auto" />

            {target && (
              <div className="bg-slate-955/40 border border-white/5 rounded-2xl p-4 text-left">
                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Cụm từ trọng tâm</span>
                <p className="text-sm font-black text-white italic">
                  {target}
                </p>
                {content.phrase_meaning && (
                  <p className="text-xs text-slate-300 dark:text-slate-400 leading-relaxed mt-1 font-semibold">
                    👉 {content.phrase_meaning}
                  </p>
                )}
                {content.context_note && (
                  <p className="text-[10px] text-slate-500 leading-normal mt-2 pt-2 border-t border-white/5 font-semibold">
                    📝 Chú ý ngữ cảnh: {content.context_note}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }
  }

  const playTTS = useCallback(() => {
    if (!currentCard) return;
    window.speechSynthesis.cancel();
    
    let textToSpeak = currentCard.front;
    try {
      if (currentCard.front.trim().startsWith('{')) {
        const parsed = JSON.parse(currentCard.front);
        const type = parsed.type;
        const content = parsed.content;
        if (type === "vocab") {
          textToSpeak = content.word;
        } else if (type === "grammar") {
          textToSpeak = content.examples?.[0]?.sentence || content.title || "";
        } else if (type === "sentence") {
          textToSpeak = (content.cloze_sentence || "").replace(/\{\{?c\d+::(.*?)\}\}?/g, "$1");
        }
      }
    } catch (e) {
      console.error("Failed to extract TTS text from JSON:", e);
    }

    const wordToSpeak = textToSpeak.split("\n")[0].trim();
    if (!wordToSpeak) return;

    let lang = "en-US";
    const hasJapanese = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(wordToSpeak);
    const hasChinese = /[\u4e00-\u9fff]/.test(wordToSpeak) && !hasJapanese;
    
    if (hasJapanese) {
      lang = "ja-JP";
    } else if (hasChinese) {
      lang = "zh-CN";
    } else {
      const deckNameLower = deck?.name.toLowerCase() || "";
      if (deckNameLower.includes("french") || deckNameLower.includes("pháp")) {
        lang = "fr-FR";
      } else if (deckNameLower.includes("japanese") || deckNameLower.includes("nhật")) {
        lang = "ja-JP";
      } else if (deckNameLower.includes("chinese") || deckNameLower.includes("trung")) {
        lang = "zh-CN";
      }
    }

    const utterance = new SpeechSynthesisUtterance(wordToSpeak);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  }, [currentCard, deck]);

  useEffect(() => {
    // Auto-play TTS on card view change
    const timer = setTimeout(() => {
      playTTS();
    }, 150);
    return () => {
      clearTimeout(timer);
      window.speechSynthesis.cancel();
    };
  }, [currentIndex, playTTS]);

  if (loading || initialLoad) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70dvh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-14 h-14 rounded-full border-4 border-white/5 border-t-indigo-500"
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
          className="w-24 h-24 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-6 border border-emerald-500/20"
        >
          <Check className="w-10 h-10 text-emerald-400" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-2">All caught up</h2>
        <p className="text-slate-400 text-center max-w-xs leading-relaxed">
          No cards due for review in{" "}
          <span className="font-semibold text-slate-200">{deck?.name}</span>.
        </p>
        <button
          onClick={onBack}
          className="mt-8 inline-flex items-center gap-2 h-12 px-8 rounded-2xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-all active:scale-95 border-none"
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
          className="w-11 h-11 rounded-2xl bg-white/5 border border-white/5 shadow-sm flex items-center justify-center text-slate-200 dark:text-slate-300 hover:bg-white/10 hover:border-indigo-500/30 hover:text-white transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h2 className="font-bold text-white text-lg">{deck?.name}</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {currentIndex + 1} of {totalCards}
          </p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-indigo-600 border border-white/10 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-600/20">
          {Math.min(currentIndex + 1, totalCards)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-white/5 mx-6 rounded-full overflow-hidden">
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
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-amber-400">
              {currentStreak} streak
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Area */}
      <div className="flex-1 flex items-center justify-center px-6 py-6">
        <div className="w-full max-w-[340px] mx-auto">
          <div className="perspective-2000 w-full aspect-[3/4.6]">
            <motion.div
              className="relative w-full h-full preserve-3d"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            >
              {/* ── CARD FRONT ── */}
              <div
                className={cn(
                  "absolute inset-0 rounded-[2.5rem] cursor-pointer select-none overflow-hidden backface-hidden",
                  "bg-slate-950/60 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                )}
                onClick={onFlip}
              >
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/5 pointer-events-none" />

                <div className="flex flex-col items-center justify-center h-full p-8 text-center relative">
                  {/* Mastery indicator */}
                  <div className="absolute top-8 left-0 right-0 flex flex-col items-center gap-2">
                    <p className="text-[9px] font-black text-slate-450 uppercase tracking-widest">
                      Mastery
                    </p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={cn(
                            "h-1 w-6 rounded-full transition-all duration-500",
                            level <= (currentCard.mastery || 1)
                              ? "bg-gradient-to-r from-indigo-500 to-violet-500 shadow-md shadow-indigo-500/20"
                              : "bg-white/5"
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Card number badge */}
                  <div className="absolute top-20 right-6 w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-slate-400">
                      {currentIndex + 1}
                    </span>
                  </div>

                  {/* Tag badge */}
                  {currentCard.tag && (
                    <div className="absolute top-20 left-6">
                      {getTagBadge(currentCard.tag)}
                    </div>
                  )}

                  {cardFrontContent ? (
                    cardFrontContent
                  ) : (
                    <>
                      <h3 className="text-3xl md:text-3.5xl font-black text-white text-center leading-tight mt-6 italic tracking-tight whitespace-pre-wrap font-display">
                        {displayFront}
                      </h3>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playTTS();
                        }}
                        className="mt-6 w-12 h-12 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 flex items-center justify-center text-indigo-455 border border-indigo-500/20 hover:border-indigo-500/40 transition-all duration-300 active:scale-90 z-20 shadow-lg shadow-indigo-950/20"
                        title="Play pronunciation"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  <div className="absolute bottom-8 flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest pointer-events-none">
                    <span>Tap to reveal</span>
                    <ArrowRight className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
                  </div>
                </div>
              </div>

              {/* ── CARD BACK ── */}
              <div
                className={cn(
                  "absolute inset-0 rounded-[2.5rem] cursor-pointer select-none overflow-hidden backface-hidden",
                  "bg-gradient-to-b from-indigo-950/90 to-slate-950/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                )}
                style={{ transform: "rotateY(180deg)" }}
                onClick={onFlip}
              >
                {/* Decorative elements */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative h-full flex flex-col items-center justify-center p-6 text-center">
                  {/* Tag badge */}
                  {currentCard.tag && (
                    <div className="absolute top-20 left-6">
                      {getTagBadge(currentCard.tag)}
                    </div>
                  )}

                  {cardBackContent ? (
                    cardBackContent
                  ) : (
                    <>
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-4 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                        Bản Dịch
                      </span>

                      <div className="flex flex-col items-center gap-2.5 mb-4">
                        <h3 className="text-base font-black text-slate-200 dark:text-slate-300 italic whitespace-pre-wrap text-center font-display leading-tight">
                          {displayFront}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playTTS();
                          }}
                          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-indigo-400 border border-white/5 hover:border-indigo-500/30 transition-all duration-300 active:scale-90 z-20"
                          title="Play pronunciation"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="w-12 h-[1px] bg-white/10 rounded-full mb-4" />

                      <p className="text-2xl md:text-3xl font-black text-white leading-snug max-w-xs italic tracking-tight font-display">
                        "{displayBack}"
                  </p>

                      {displayExplanation && (
                        <div className="mt-4 bg-slate-955/60 backdrop-blur-md p-4 rounded-[1.5rem] w-full border border-white/5 max-h-[140px] overflow-y-auto custom-scrollbar scrollbar-hide text-left">
                          <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {displayExplanation}
                          </p>
                        </div>
                      )}
                    </>
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
                className="flex-1 h-14 rounded-2xl border border-white/10 bg-white/5 text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/10 hover:border-slate-450 transition-all duration-200 active:scale-95"
              >
                <X className="w-4 h-4" />
                Still Learning
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReview(true);
                }}
                className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all duration-200 active:scale-95 border-none"
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
          stroke="rgba(255, 255, 255, 0.05)"
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
        className="absolute font-bold text-white"
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
      ? "text-emerald-400"
      : accuracy >= 70
      ? "text-indigo-400"
      : accuracy >= 50
      ? "text-amber-400"
      : "text-slate-400";

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
          className="w-11 h-11 rounded-2xl bg-white/5 border border-white/5 shadow-sm flex items-center justify-center text-slate-200 dark:text-slate-300 hover:bg-white/10 hover:border-indigo-500/30 hover:text-white transition-all"
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
            className="glass-card bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl p-8 md:p-10 text-center"
          >
            {/* Score Ring */}
            <div className="flex justify-center mb-6">
              <ScoreRing pct={accuracy} />
            </div>

            <p className={cn("text-sm font-black uppercase tracking-widest mb-1", labelColor)}>
              {label}
            </p>
            <h3 className="text-2xl font-bold text-white mb-8 italic tracking-tight">{deckName}</h3>

            {/* Session Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white/5 rounded-2xl py-4 px-2 border border-white/5">
                <p className="text-xl font-bold text-white">{totalCards}</p>
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-1">
                  Reviewed
                </p>
              </div>
              <div className="bg-emerald-500/10 rounded-2xl py-4 px-2 border border-emerald-500/20">
                <p className="text-xl font-bold text-emerald-400">{knownCount}</p>
                <p className="text-[9px] font-semibold text-emerald-400 uppercase tracking-wider mt-1">
                  Known
                </p>
              </div>
              <div className="bg-white/5 rounded-2xl py-4 px-2 border border-white/5">
                <p className="text-xl font-bold text-white">{learningCount}</p>
                <p className="text-[9px] font-semibold text-slate-450 uppercase tracking-wider mt-1">
                  Learning
                </p>
              </div>
            </div>

            {/* Best Streak */}
            {bestStreak >= 2 && (
              <div className="flex items-center justify-center gap-2 bg-amber-500/10 rounded-2xl py-3 px-4 mb-6 border border-amber-500/20 text-amber-400">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-xs font-bold text-amber-400">
                  Best streak: {bestStreak} cards
                </span>
              </div>
            )}

            {/* Mastery Levels */}
            <div className="bg-slate-900/20 rounded-2xl p-6 mb-6 border border-white/5">
              <p className="text-[10px] font-semibold text-slate-450 uppercase tracking-widest mb-6">
                Mastery Distribution
              </p>
              <div className="flex items-end justify-between h-28 gap-2">
                {masteryDistribution.map((count, idx) => {
                  const pct = (count / maxCount) * 100;
                  const colors = [
                    "from-slate-700 to-slate-650",
                    "from-slate-650 to-slate-550",
                    "from-indigo-500/60 to-indigo-500",
                    "from-indigo-500 to-violet-500",
                    "from-violet-500 to-purple-500",
                  ];
                  return (
                    <div
                      key={idx}
                      className="flex flex-col items-center flex-1 gap-2 h-full"
                    >
                      <span className="text-xs font-semibold text-slate-200 dark:text-slate-300">
                        {count}
                      </span>
                      <div className="w-full bg-white/5 rounded-full relative flex-1 overflow-hidden">
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
                      <span className="text-[9px] font-semibold text-slate-450">
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
                className="flex-1 h-13 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 border-none transition-all active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                Retry
              </button>
              <button
                onClick={onBack}
                className="flex-1 h-13 rounded-2xl border border-white/10 text-slate-300 font-semibold text-sm hover:bg-white/5 transition-all active:scale-95"
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
  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAllCards() {
      try {
        setLoading(true);
        const cardPromises = decks.map(d => getReviewCards(d.id));
        const cardsArrays = await Promise.all(cardPromises);
        setAllCards(cardsArrays.flat());
      } catch (err) {
        console.error("Failed to load cards for detailed statistics:", err);
      } finally {
        setLoading(false);
      }
    }
    if (decks.length > 0) {
      loadAllCards();
    } else {
      setLoading(false);
    }
  }, [decks]);

  const totalDecks = decks.length;

  // Aggregate Mastery Levels (Lv 1 to Lv 5)
  const masteryDistribution = [1, 2, 3, 4, 5].map(
    (level) => allCards.filter((c) => (c.mastery || 1) === level).length
  );
  const maxMasteryCount = Math.max(...masteryDistribution, 1);

  // Deck overall memory strength score (0% to 100%)
  const strengthScore =
    allCards.length > 0
      ? Math.round(
          (allCards.reduce((sum, c) => sum + (c.mastery || 1), 0) /
            (allCards.length * 5)) *
            100
        )
      : 0;

  // Estimated daily review time (e.g. 12 seconds per due card)
  const estReviewTime = Math.ceil((totalDue * 12) / 60);

  // Activity Heatmap Calendar Grid for last 14 days
  const heatMapDays = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d;
  });

  const activityData = heatMapDays.map((date) => {
    const dayStr = date.toDateString();
    const count = allCards.filter(
      (c) => c.lastReviewedAt && new Date(c.lastReviewedAt).toDateString() === dayStr
    ).length;
    return { date, count };
  });

  const statCards = [
    {
      icon: Layers,
      value: totalDecks,
      label: "Spaced Decks",
      gradient: "from-indigo-500 to-violet-500",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
    },
    {
      icon: BookOpen,
      value: totalCards,
      label: "Total Flashcards",
      gradient: "from-violet-500 to-purple-500",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
    },
    {
      icon: Target,
      value: totalDue,
      label: "Due Today",
      gradient: "from-amber-500 to-orange-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      icon: Brain,
      value: `${strengthScore}%`,
      label: "Synapse Strength",
      gradient: "from-emerald-500 to-teal-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col min-h-full relative z-10 pb-16"
    >
      {/* Header */}
      <div className="px-6 md:px-8 pt-6 pb-5">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 shadow-lg flex items-center justify-center text-slate-200 dark:text-slate-300 hover:bg-white/10 hover:border-indigo-500/30 hover:text-white transition-all active:scale-95 duration-300"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-white italic tracking-tight uppercase">
              Deck <span className="text-indigo-400">Stats</span>
            </h1>
            <p className="text-[10px] font-black text-slate-450 uppercase tracking-[0.3em] mt-1">
              Deep Memory Diagnostics
            </p>
          </div>
        </div>

        {/* Stats cards grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {statCards.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i, duration: 0.3 }}
              className={cn(
                "rounded-2.5rem p-5 border shadow-2xl relative overflow-hidden group",
                stat.bg,
                stat.border
              )}
            >
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-10 bg-current pointer-events-none" />
              <div
                className={cn(
                  "w-10 h-10 rounded-xl bg-gradient-to-br mb-3 flex items-center justify-center border border-white/10 shadow-lg",
                  stat.gradient
                )}
              >
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-black text-white tracking-tight leading-none">
                {stat.value}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 leading-none">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Dynamic estimated review panel */}
        {totalDue > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="p-5 bg-indigo-500/20 rounded-3xl border border-indigo-500/20 shadow-xl shadow-indigo-950/20 mb-6 flex items-center gap-4 relative overflow-hidden"
          >
            <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-black text-white leading-tight">Review Workload</p>
              <p className="text-xs text-slate-400 leading-normal mt-0.5">
                Approximately <span className="text-indigo-400 font-black">{estReviewTime} {estReviewTime === 1 ? "minute" : "minutes"}</span> needed for due cards review today.
              </p>
            </div>
          </motion.div>
        )}
      </div>

      <div className="flex-1 px-6 md:px-8 pb-6 space-y-6 max-w-lg mx-auto w-full">
        {loading ? (
          <div className="glass-card bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Calculating Synapse Strengths...</p>
          </div>
        ) : (
          <>
            {/* Daily study consistency heatmap */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="glass-card bg-slate-900/40 border border-white/5 shadow-2xl p-6 rounded-3xl relative overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-200 uppercase tracking-widest leading-none">Daily Consistency</h4>
                  <p className="text-[9px] font-bold text-slate-550 uppercase tracking-wider mt-1 leading-none">Last 14 Days Active Heatmap</p>
                </div>
              </div>

              <div className="flex justify-between items-center gap-2 py-3 px-1.5 bg-slate-950/40 border border-white/5 rounded-2xl">
                {activityData.map((day, idx) => {
                  const hasActivity = day.count > 0;
                  const intensityColor =
                    day.count >= 8
                      ? "bg-emerald-400 shadow-lg shadow-emerald-400/20 border border-emerald-300/30"
                      : day.count >= 4
                      ? "bg-emerald-500/60 border border-emerald-500/10"
                      : day.count > 0
                      ? "bg-emerald-500/25 border border-emerald-500/5"
                      : "bg-white/5 border border-white/5";

                  return (
                    <div key={idx} className="group relative flex flex-col items-center flex-1">
                      <div className={cn("aspect-square w-full rounded-md transition-all duration-300 hover:scale-115", intensityColor)} />
                      
                      {/* Interactive hover indicator */}
                      <span className="text-[7px] font-bold text-slate-550 mt-1 uppercase tracking-tighter">
                        {day.date.toLocaleDateString(undefined, { weekday: 'narrow' })}
                      </span>

                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 shadow-2xl z-30 min-w-[80px] pointer-events-none text-center">
                        <span className="text-[8px] font-black text-white leading-none">
                          {day.count} reviewed
                        </span>
                        <span className="text-[7px] font-bold text-slate-400 leading-none mt-1">
                          {day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Aggregate Mastery Level Distribution */}
            {allCards.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="glass-card bg-slate-900/40 border border-white/5 shadow-2xl p-6 rounded-3xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                    <Brain className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-200 uppercase tracking-widest leading-none">Mastery Level Matrix</h4>
                    <p className="text-[9px] font-bold text-slate-550 uppercase tracking-wider mt-1 leading-none">All Card Strengths</p>
                  </div>
                </div>

                <div className="flex items-end justify-between h-28 gap-3 px-2">
                  {masteryDistribution.map((count, idx) => {
                    const pct = (count / maxMasteryCount) * 100;
                    const colors = [
                      "from-slate-700 to-slate-650",
                      "from-slate-650 to-slate-550",
                      "from-indigo-500/60 to-indigo-500 border border-indigo-400/20",
                      "from-indigo-500 to-violet-500 border border-indigo-400/10",
                      "from-violet-500 to-purple-500 border border-violet-400/10 shadow-lg shadow-purple-500/10",
                    ];
                    return (
                      <div
                        key={idx}
                        className="flex flex-col items-center flex-1 gap-2 h-full"
                      >
                        <span className="text-[10px] font-black text-slate-200 dark:text-slate-300">
                          {count}
                        </span>
                        <div className="w-full bg-white/5 rounded-full relative flex-1 overflow-hidden">
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
                        <span className="text-[9px] font-black text-slate-500">
                          Lv {idx + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Per-deck breakdown details */}
            {decks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                className="glass-card bg-slate-900/40 border border-white/5 shadow-2xl p-6 rounded-3xl"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <BarChart3 className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-200 uppercase tracking-widest leading-none">Deck Strength Index</h4>
                    <p className="text-[9px] font-bold text-slate-550 uppercase tracking-wider mt-1 leading-none">Click to drill deck directly</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  {decks.map((deck, i) => {
                    const deckCards = allCards.filter(c => c.id && c.front && deck.cards?.some(dc => dc.id === c.id));
                    const score = deckCards.length > 0
                      ? Math.round((deckCards.reduce((sum, c) => sum + (c.mastery || 1), 0) / (deckCards.length * 5)) * 100)
                      : 0;

                    return (
                      <motion.button
                        key={deck.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.3 }}
                        onClick={() => onSelectDeck(deck)}
                        className="w-full text-left group"
                      >
                        <div className="rounded-2xl p-4 bg-slate-950/30 hover:bg-slate-900/40 hover:border-indigo-500/30 border border-white/5 transition-all duration-300 active:scale-[0.98]">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-black text-sm text-slate-100 group-hover:text-indigo-400 transition-colors uppercase leading-none">
                                {deck.name}
                              </h4>
                              <div className="flex gap-3 mt-1.5 leading-none">
                                <span className="text-[9px] font-bold text-slate-550 uppercase tracking-wider">
                                  {deck.totalCards || 0} cards
                                </span>
                                {deck.dueCardsCount ? (
                                  <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider">
                                    {deck.dueCardsCount} due
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-black text-emerald-450 uppercase tracking-wider flex items-center gap-0.5">
                                    <Check className="w-2.5 h-2.5" /> All reviewed
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Strength rating */}
                            <div className="text-right">
                              <span className="text-lg font-black text-white group-hover:text-indigo-400 transition-colors italic tracking-tighter">
                                {score > 0 ? `${score}%` : "—"}
                              </span>
                              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block leading-none mt-0.5">
                                Strength
                              </span>
                            </div>
                          </div>

                          {/* Deck progress bar */}
                          {deck.totalCards && deck.totalCards > 0 ? (
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5 mt-3">
                              <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" 
                                style={{ width: `${score > 0 ? score : 5}%` }}
                              />
                            </div>
                          ) : null}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}