import { useFlashcardSpeech } from "../hooks/useFlashcardSpeech";
import { useId } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Check, X, ArrowRight, Zap, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Deck, type Flashcard } from "@/services/decks";
import { getFlashcardContent } from "./FlashcardContent";
import { FlashcardTag } from "@/components/learning/FlashcardTag";

export function StudyView({
  deck,
  cards,
  currentIndex,
  isFlipped,
  loading,
  initialLoad,
  currentStreak,
  bestStreak,
  reviewing,
  onFlip,
  onReview,
  onBack,
}: {
  deck: Deck | null;
  cards: Flashcard[];
  currentIndex: number;
  isFlipped: boolean;
  loading: boolean;
  initialLoad: boolean;
  currentStreak: number;
  bestStreak: number;
  reviewing: boolean;
  onFlip: () => void;
  onReview: (known: boolean) => void;
  onBack: () => void;
}) {
  const cardId = useId();
  const currentCard = cards[currentIndex];
  const totalCards = cards.length;
  const progressPct = totalCards > 0 ? (currentIndex / totalCards) * 100 : 0;

  const {
    displayFront,
    displayBack,
    displayExplanation,
    cardFrontContent,
    cardBackContent,
  } = getFlashcardContent(currentCard);

  const playTTS = useFlashcardSpeech(currentCard, deck);

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
        <h2 className="text-2xl font-bold text-card-foreground mb-2">
          All caught up
        </h2>
        <p className="text-slate-400 text-center max-w-xs leading-relaxed">
          No cards due for review in{" "}
          <span className="font-semibold text-slate-200">{deck?.name}</span>.
        </p>
        <button
          aria-label="Back to word collections"
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
          aria-label="Back to word collections"
          onClick={onBack}
          className="w-11 h-11 rounded-2xl bg-white/5 border border-white/5 shadow-sm flex items-center justify-center text-slate-200 dark:text-slate-300 hover:bg-white/10 hover:border-indigo-500/30 hover:text-white transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h2 className="font-bold text-card-foreground text-lg">
            {deck?.name}
          </h2>
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
          <div id={cardId} className="perspective-2000 w-full aspect-[3/4.6]">
            <motion.div
              className="relative w-full h-full preserve-3d"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            >
              {/* ── CARD FRONT ── */}
              <div
                className={cn(
                  "absolute inset-0 rounded-[2.5rem] cursor-pointer select-none overflow-hidden backface-hidden",
                  "bg-surface border border-input",
                )}
                onClick={onFlip}
                aria-hidden={isFlipped}
                inert={isFlipped ? true : undefined}
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
                              : "bg-white/5",
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
                      {<FlashcardTag tag={currentCard.tag} />}
                    </div>
                  )}

                  {cardFrontContent ? (
                    cardFrontContent
                  ) : (
                    <>
                      <h3 className="text-3xl md:text-3.5xl font-black text-card-foreground text-center leading-tight mt-6 italic tracking-tight whitespace-pre-wrap font-display">
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
                  "bg-surface-hover border border-input",
                )}
                style={{ transform: "rotateY(180deg)" }}
                onClick={onFlip}
                aria-hidden={!isFlipped}
                inert={!isFlipped ? true : undefined}
              >
                {/* Decorative elements */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative h-full flex flex-col items-center justify-center p-6 text-center">
                  {/* Tag badge */}
                  {currentCard.tag && (
                    <div className="absolute top-20 left-6">
                      {<FlashcardTag tag={currentCard.tag} />}
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

                      <p className="text-2xl md:text-3xl font-black text-card-foreground leading-snug max-w-xs italic tracking-tight font-display">
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
          <button
            type="button"
            className="word-card-flip"
            aria-controls={cardId}
            aria-expanded={isFlipped}
            onClick={onFlip}
            disabled={reviewing}
          >
            {isFlipped ? "Show the word again" : "Show the meaning"}{" "}
            <ArrowRight size={14} />
          </button>
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
                disabled={reviewing}
                onClick={(e) => {
                  e.stopPropagation();
                  onReview(false);
                }}
                className="flex-1 h-14 rounded-2xl border border-input bg-surface text-card-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-surface-hover transition-all duration-200 active:scale-95 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Still Learning
              </button>
              <button
                disabled={reviewing}
                onClick={(e) => {
                  e.stopPropagation();
                  onReview(true);
                }}
                className="flex-1 h-14 rounded-2xl bg-primary text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 border-none disabled:opacity-50"
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
