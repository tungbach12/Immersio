import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, Link } from "react-router-dom";
import { BookOpen, Mic, ChevronLeft, ChevronRight, Check, X, RefreshCw, Volume2, Target, Square, SkipBack, SkipForward, Plus, ArrowRight, Monitor, Video } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { getDecks, getReviewCards, reviewCard, Deck, Flashcard } from "@/services/decks";
import { practiceService } from "@/services/practice";

const PRONUNCIATION_PHRASES = [
  "The quick brown fox jumps over the lazy dog.",
  "She sells seashells by the seashore.",
  "How much wood would a woodchuck chuck if a woodchuck could chuck wood?",
  "I scream, you scream, we all scream for ice cream.",
  "Peter Piper picked a peck of pickled peppers."
];

// --- Types ---
type ViewState = "menu" | "decks" | "cards" | "pronunciation";

export default function Practice() {
  const [view, setView] = useState<ViewState>("menu");
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);

  return (
    <div className="w-full h-full bg-[#030712]">
      <AnimatePresence mode="wait">
        {view === "menu" && <MainMenu key="menu" onSelect={setView} />}
        {view === "decks" && <DeckSelection key="decks" onBack={() => setView("menu")} onSelectDeck={(deck) => { setSelectedDeck(deck); setView("cards"); }} />}
        {view === "cards" && selectedDeck && <SmartCards key="cards" deck={selectedDeck} onBack={() => setView("decks")} />}
        {view === "pronunciation" && <PronunciationLab key="pronun" onBack={() => setView("menu")} />}
      </AnimatePresence>
    </div>
  );
}

function MainMenu({ onSelect }: { onSelect: (view: ViewState) => void, key?: string }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="px-5 md:px-6 py-8 pb-32 md:pb-10 flex flex-col gap-8 md:gap-10 max-w-2xl mx-auto"
    >
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl relative group border border-white/5">
           <div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
           <Target className="w-7 h-7 text-indigo-400 relative z-10" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black text-white italic tracking-tight leading-tight uppercase">Skill <span className="text-indigo-500">Lab</span></h1>
          <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.3em] mt-1">Sharpen your instincts</p>
        </div>
      </div>

      <div className="grid gap-5">
        <div
          className="glass-card bg-slate-900/40 backdrop-blur-md rounded-[2.2rem] p-7 md:p-10 flex items-center gap-5 md:gap-8 cursor-pointer group border border-white/5 shadow-2xl hover:border-indigo-500/30 hover:bg-slate-900/60 transition-all duration-300"
          onClick={() => navigate("/student/flashcards")}
        >
          <div className="w-14 h-14 md:w-16 md:h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500 border border-indigo-500/20">
            <BookOpen className="w-7 h-7 md:w-8 md:h-8 text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-xl md:text-2xl text-slate-100 leading-tight tracking-tight uppercase group-hover:text-indigo-400 transition-colors">Smart Cards</h3>
            <p className="text-[11px] md:text-sm font-medium text-slate-400 mt-1 md:mt-2 leading-relaxed">Master vocabulary via adaptive drilling</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 ml-auto group-hover:translate-x-1 transition-transform group-hover:bg-indigo-500/20 group-hover:text-indigo-300">
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
        </div>

        <div
          className="glass-card bg-slate-900/40 backdrop-blur-md rounded-[2.2rem] p-7 md:p-10 flex items-center gap-5 md:gap-8 cursor-pointer group border border-white/5 shadow-2xl hover:border-emerald-500/30 hover:bg-slate-900/60 transition-all duration-300"
          onClick={() => onSelect("pronunciation")}
        >
          <div className="w-14 h-14 md:w-16 md:h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500 border border-emerald-500/20">
            <Mic className="w-7 h-7 md:w-8 md:h-8 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-xl md:text-2xl text-slate-100 leading-tight tracking-tight uppercase group-hover:text-emerald-400 transition-colors">Vocal Lab</h3>
            <p className="text-[11px] md:text-sm font-medium text-slate-400 mt-1 md:mt-2 leading-relaxed">AI-powered feedback for perfect accent mastery</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 ml-auto group-hover:translate-x-1 transition-transform group-hover:bg-emerald-500/20 group-hover:text-emerald-300">
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function DeckSelection({ onBack, onSelectDeck }: { onBack: () => void, onSelectDeck: (deck: Deck) => void, key?: string }) {
  const [decks, setDecks] = useState<Deck[]>([]);

  useEffect(() => {
    getDecks().then(data => setDecks(data)).catch(err => console.error(err));
  }, []);

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex flex-col pt-16 pb-28"
    >
      <div className="h-24 bg-slate-950/40 backdrop-blur-md border-b border-white/5 flex items-center px-6 shrink-0 justify-between">
        <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-300 hover:bg-white/10 hover:text-white transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="font-black text-white text-xl tracking-tight italic">Select Deck</h2>
        <div className="w-12" />
      </div>

      <div className="flex-1 overflow-y-auto p-10 flex flex-col gap-6 max-w-2xl mx-auto w-full">
        <div className="mb-4">
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Ready to Drill?</p>
          <h3 className="text-2xl font-black text-white mt-1">Available Decks</h3>
        </div>

        {decks.map(deck => (
          <div
            key={deck.id}
            className="glass-card bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] p-8 flex items-center gap-6 cursor-pointer group border border-white/5 shadow-2xl hover:border-indigo-500/30 hover:bg-slate-900/60 transition-all duration-300"
            onClick={() => onSelectDeck(deck)}
          >
            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-500/20 group-hover:scale-110 transition-transform">
              <BookOpen className="w-7 h-7 text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-xl text-slate-100 leading-tight">{deck.name}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{deck.totalCards || 0} Cards ({deck.dueCardsCount || 0} Due)</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform group-hover:bg-indigo-500/20 group-hover:text-indigo-300">
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        ))}

        {decks.length === 0 && (
          <div className="text-center py-20 bg-slate-900/20 rounded-[3rem] border border-dashed border-white/5">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No decks found yet</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SmartCards({ deck, onBack }: { deck: Deck, onBack: () => void, key?: string }) {
  const [cardList, setCardList] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownWords, setKnownWords] = useState<number[]>([]);

  useEffect(() => {
    getReviewCards(deck.id)
      .then(cards => {
        setCardList(cards);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [deck.id]);

  const currentCard = cardList[currentIndex];
  const isComplete = cardList.length === 0 || currentIndex >= cardList.length;
  const progress = cardList.length > 0 ? Math.min((currentIndex / cardList.length) * 100, 100) : 100;

  const handleNext = async (known: boolean) => {
    if (known) {
      setKnownWords(prev => [...prev, currentIndex]);
    }

    const quality = known ? 5 : 1;
    if (currentCard) {
      try {
        await reviewCard(currentCard.id, quality);
      } catch (err) {
        console.error("Failed to review card on backend:", err);
      }
    }

    setCardList(prev => prev.map((item, idx) => {
      if (idx === currentIndex) {
        const newMastery = known
          ? Math.min((item.mastery || 1) + 1, 5)
          : Math.max((item.mastery || 1) - 1, 1);
        return { ...item, mastery: newMastery };
      }
      return item;
    }));

    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, 150);
  };

  const handleRestart = () => {
    setLoading(true);
    getReviewCards(deck.id)
      .then(cards => {
        setCardList(cards);
        setCurrentIndex(0);
        setKnownWords([]);
        setIsFlipped(false);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const masteryCounts = [1, 2, 3, 4, 5].map(level =>
    cardList.filter(w => (w.mastery || 1) === level).length
  );

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center pt-16 pb-28">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-4">Loading due cards...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex flex-col pt-16 pb-28 md:pb-0"
    >
      <div className="h-24 bg-slate-950/40 backdrop-blur-md border-b border-white/5 flex items-center px-6 shrink-0 justify-between">
        <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-300 hover:bg-white/10 hover:text-white transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h2 className="font-black text-white text-xl tracking-tight italic">Smart Cards</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-0.5">Session Progress</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-black text-indigo-400 text-sm">
          {Math.min(currentIndex + 1, cardList.length)}
        </div>
      </div>

      <div className="h-1.5 bg-white/5 w-full shrink-0">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/20"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-10 flex flex-col justify-center max-w-lg mx-auto w-full">
        {cardList.length === 0 ? (
          <div className="glass-card bg-slate-900/40 backdrop-blur-md rounded-[3rem] border border-white/5 shadow-2xl p-12 text-center">
            <div className="w-24 h-24 bg-white/5 text-slate-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/5">
              <BookOpen className="w-12 h-12 text-indigo-400" />
            </div>
            <h3 className="text-3xl font-black text-white mb-4 tracking-tight">Deck is Empty</h3>
            <p className="text-slate-450 font-medium mb-12 leading-relaxed">
              Unlock vocabulary by completing scenarios and drills in the Library.
            </p>
            <Button
              onClick={onBack}
              className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-2xl transition-transform active:scale-95 border-none"
            >
              Back to Practice
            </Button>
          </div>
        ) : isComplete ? (
          <div className="glass-card bg-slate-900/40 backdrop-blur-md rounded-[3rem] border border-white/5 shadow-2xl p-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black text-[10px] uppercase tracking-widest mb-6">
              <Check className="w-4 h-4" /> Goal Met
            </div>
            <h3 className="text-4xl font-black text-white mb-4 tracking-tighter italic">Drill Complete!</h3>
            <p className="text-slate-400 font-medium mb-12">
              You mastered <span className="font-black text-indigo-400 underline decoration-indigo-500/30 decoration-4">{knownWords.length} cards</span> this session.
            </p>

            <div className="bg-slate-900/20 rounded-[2.5rem] p-8 mb-12 border border-white/5">
              <h4 className="text-[10px] font-black text-slate-450 uppercase tracking-[0.3em] mb-12">Mastery Performance</h4>
              <div className="flex items-end justify-between h-40 gap-4 px-2">
                {[1, 2, 3, 4, 5].map((level, idx) => {
                  const count = masteryCounts[idx];
                  const percentage = (count / cardList.length) * 100;
                  return (
                    <div key={level} className="flex flex-col items-center flex-1 gap-4 h-full">
                      <div className="w-full bg-white/5 rounded-full relative flex items-end justify-center h-full">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(percentage, 5)}%` }}
                          transition={{ duration: 1, ease: "circOut", delay: idx * 0.1 }}
                          className={cn(
                            "w-full rounded-full shadow-lg",
                            level <= 2 ? 'bg-gradient-to-t from-cyan-600 to-blue-500' : level <= 4 ? 'bg-gradient-to-t from-indigo-600 to-violet-500' : 'bg-gradient-to-t from-fuchsia-600 to-pink-500'
                          )}
                        />
                        {count > 0 && (
                          <span className="absolute -top-10 text-[10px] font-black text-indigo-400 bg-slate-900 px-2 py-1.5 rounded-xl shadow-2xl border border-white/5">{count}</span>
                        )}
                      </div>
                      <span className="text-[10px] font-black text-slate-450">Lv {level}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={handleRestart}
              className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-2xl transition-transform active:scale-95 border-none"
            >
              <RefreshCw className="w-5 h-5 mr-3" /> Retry Session
            </Button>
          </div>
        ) : (
          <div className="perspective-2000 w-full aspect-[3/4] cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
            <motion.div
              className="w-full h-full relative preserve-3d transition-transform duration-700"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
            >
              {/* Front */}
              <div className="absolute inset-0 backface-hidden rounded-[3rem] border border-white/5 shadow-2xl flex flex-col items-center justify-center p-12 bg-slate-900/40 backdrop-blur-md">
                <div className="absolute top-10 w-full px-12 flex flex-col items-center">
                  <p className="text-[10px] font-black text-slate-450 uppercase tracking-[0.3em] mb-4">Mastery Rank</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(level => (
                      <div
                        key={level}
                        className={cn(
                          "h-2.5 w-10 rounded-full transition-all duration-500",
                          level <= (currentCard.mastery || 1)
                            ? ((currentCard.mastery || 1) <= 2 ? 'bg-indigo-500/30' : (currentCard.mastery || 1) <= 4 ? 'bg-indigo-500/60' : 'bg-indigo-500 shadow-lg shadow-indigo-500/30')
                            : 'bg-white/5'
                        )}
                      />
                    ))}
                  </div>
                </div>

                <h3 className="text-4xl sm:text-5xl font-black text-white text-center tracking-tighter italic leading-tight mt-12">{currentCard.front}</h3>

                <span className="absolute bottom-10 inline-flex items-center gap-2 text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] bg-indigo-500/10 px-5 py-2.5 rounded-full border border-indigo-500/20">
                  Tap to uncover <ArrowRight size={12} />
                </span>
              </div>

              {/* Back */}
              <div className="absolute inset-0 backface-hidden rounded-[3rem] border border-white/5 shadow-3xl flex flex-col items-center justify-center p-12 bg-slate-950 text-white [transform:rotateY(180deg)] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/40 to-slate-950 opacity-40 shrink-0" />
                <div className="relative z-10 w-full flex flex-col items-center text-center">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-8">Meaning & Context</p>
                  <h3 className="text-3xl font-black text-white mb-8 tracking-tighter italic">{currentCard.front}</h3>
                  <div className="w-16 h-1.5 bg-indigo-500/50 rounded-full mb-10" />
                  <p className="text-2xl font-bold text-white/90 leading-relaxed mb-10 px-4 italic">"{currentCard.back}"</p>

                  {currentCard.explanation && (
                    <div className="bg-slate-900/60 backdrop-blur-md p-8 rounded-[2rem] w-full border border-white/5">
                      <p className="text-indigo-200 text-sm font-medium leading-relaxed">"{currentCard.explanation}"</p>
                    </div>
                  )}
                </div>

                {/* Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {!isComplete && cardList.length > 0 && (
        <div className="p-8 bg-slate-950/40 backdrop-blur-md border-t border-white/5 shrink-0 flex gap-5 max-w-lg mx-auto w-full">
          <Button
            variant="outline"
            className="flex-1 h-16 rounded-[1.5rem] border border-white/10 hover:bg-white/5 text-slate-300 font-black text-xs uppercase tracking-widest flex items-center justify-center transition-all active:scale-95"
            onClick={(e) => { e.stopPropagation(); handleNext(false); }}
          >
            Learning
          </Button>
          <Button
            className="flex-1 h-16 rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center shadow-2xl shadow-indigo-600/20 transition-all active:scale-95 border-none"
            onClick={(e) => { e.stopPropagation(); handleNext(true); }}
          >
            Got It
          </Button>
        </div>
      )}
    </motion.div>
  );
}

function PronunciationLab({ onBack }: { onBack: () => void, key?: string }) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState<{ score: number; message: string } | null>(null);
  const [isLogging, setIsLogging] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const currentPhrase = PRONUNCIATION_PHRASES[phraseIndex];

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    setTranscript("");
    setFeedback(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await handleAudioStopped(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
      alert("Không thể truy cập microphone. Vui lòng cấp quyền truy cập mic.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      void startRecording();
    }
  };

  const handleAudioStopped = async (audioBlob: Blob) => {
    try {
      setIsLogging(true);
      setTranscript("Analyzing audio...");
      const result = await practiceService.assessPronunciation(audioBlob, currentPhrase);
      setTranscript(result.transcript);
      setFeedback({ score: result.score, message: result.message });
    } catch (err) {
      console.error("Pronunciation assessment failed:", err);
      setTranscript("Failed to analyze audio.");
      setFeedback({ score: 0, message: "Lỗi kết nối máy chủ. Vui lòng thử lại." });
    } finally {
      setIsLogging(false);
    }
  };

  const playTTS = () => {
    const utterance = new SpeechSynthesisUtterance(currentPhrase);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex flex-col pt-16 pb-28 md:pb-0"
    >
      <div className="h-24 bg-slate-950/40 backdrop-blur-md border-b border-white/5 flex items-center px-6 shrink-0 justify-between">
        <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-300 hover:bg-white/10 hover:text-white transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h2 className="font-black text-white text-xl tracking-tight italic">Pronunciation Lab</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mt-0.5">Vocal Feedback</p>
        </div>
        <div className="w-12" />
      </div>

      <div className="flex-1 overflow-y-auto p-8 flex flex-col max-w-xl mx-auto w-full gap-8">
        <div className="glass-card bg-slate-900/40 backdrop-blur-md rounded-[3rem] p-10 shadow-2xl border border-white/5 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="flex justify-between items-center mb-8 relative z-10">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20">Guide Audio</span>
            <Button
              size="icon"
              onClick={playTTS}
              className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-xl transition-transform active:scale-95 border-none"
            >
              <Volume2 className="w-6 h-6" />
            </Button>
          </div>
          <h3 className="text-4xl font-black text-white leading-tight tracking-tighter italic relative z-10">
            "{currentPhrase}"
          </h3>
        </div>

        <div className="flex-1 bg-slate-900/20 rounded-[3rem] p-10 relative flex flex-col border border-white/5 border-dashed">
          <span className="text-[10px] font-black text-slate-450 uppercase tracking-[0.3em] mb-6">Live Transcript</span>
          <div className="flex-1 flex flex-col justify-center min-h-[160px]">
            {transcript ? (
              <p className="text-3xl font-black text-white leading-tight tracking-tight italic text-center">{transcript}</p>
            ) : (
              <p className="text-xl text-slate-500 font-bold italic text-center leading-relaxed">
                {isRecording ? "Analyzing audio waves..." : "Engage the mic and start speaking..."}
              </p>
            )}
          </div>

          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "mt-8 p-8 rounded-[2rem] border shadow-2xl",
                feedback.score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5' :
                  feedback.score >= 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/5' :
                    'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/5'
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-black text-[10px] uppercase tracking-[0.4em] opacity-80">Fluency Score</span>
                <span className="text-4xl font-black italic tracking-tighter">{feedback.score}%</span>
              </div>
              <p className="text-sm font-black uppercase tracking-widest">{feedback.message}</p>
              {isLogging && (
                <p className="text-[10px] font-bold opacity-60 mt-3 uppercase tracking-widest animate-pulse">
                  ✦ Saving to profile...
                </p>
              )}
            </motion.div>
          )}
        </div>
      </div>

      <div className="p-10 bg-slate-950/40 backdrop-blur-md border-t border-white/5 shrink-0 flex items-center justify-between max-w-xl mx-auto w-full">
        <Button
          variant="outline"
          className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all border-none"
          onClick={() => {
            setTranscript("");
            setFeedback(null);
            setPhraseIndex((prev) => (prev > 0 ? prev - 1 : PRONUNCIATION_PHRASES.length - 1));
          }}
          disabled={isRecording}
        >
          <SkipBack className="w-8 h-8" />
        </Button>

        <div className="relative group">
          <div className={cn(
            "absolute -inset-4 rounded-full blur-2xl transition-opacity duration-1000",
            isRecording ? "bg-rose-500/30 opacity-100 animate-pulse" : "opacity-0"
          )} />
          <button
            className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center shadow-3xl active:scale-95 transition-all duration-500 relative z-10",
              isRecording
                ? 'bg-rose-600 text-white'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            )}
            onClick={toggleRecording}
          >
            {isRecording ? <Square className="w-10 h-10 fill-current" /> : <Mic className="w-10 h-10" />}
          </button>
        </div>

        <Button
          variant="outline"
          className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all border-none"
          onClick={() => {
            setTranscript("");
            setFeedback(null);
            setPhraseIndex((prev) => (prev + 1) % PRONUNCIATION_PHRASES.length);
          }}
          disabled={isRecording}
        >
          <SkipForward className="w-8 h-8" />
        </Button>
      </div>
    </motion.div>
  );
}
