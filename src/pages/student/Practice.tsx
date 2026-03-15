import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, Mic, ChevronLeft, ChevronRight, Check, X, RefreshCw, Volume2, Target, Square, SkipBack, SkipForward, Plus } from "lucide-react";
import { getDecks, Deck, Flashcard } from "@/services/decks";

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
    <div className="w-full h-full">
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
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="px-4 py-6 pb-24 md:pb-6 flex flex-col gap-8 max-w-2xl mx-auto"
    >
      <div className="flex items-center gap-4 mt-4">
        <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
          <Target className="w-7 h-7 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Practice</h1>
          <p className="text-slate-500">Daily exercises & drills</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div 
          className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 active:scale-[0.98] transition-transform flex items-center gap-4 cursor-pointer"
          onClick={() => onSelect("decks")}
        >
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
            <BookOpen className="w-8 h-8 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-slate-900 leading-tight">Smart Cards</h3>
            <p className="text-sm text-slate-500 mt-0.5">Vocabulary & Grammar drills</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 ml-auto">
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
        </div>

        <div 
          className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 active:scale-[0.98] transition-transform flex items-center gap-4 cursor-pointer"
          onClick={() => onSelect("pronunciation")}
        >
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
            <Mic className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-slate-900 leading-tight">Pronunciation Lab</h3>
            <p className="text-sm text-slate-500 mt-0.5">AI voice feedback & grading</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 ml-auto">
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
    setDecks(getDecks());
  }, []);

  return (
    <motion.div 
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-slate-50 flex flex-col"
    >
      <div className="h-16 bg-white border-b border-slate-100 flex items-center px-4 shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full active:bg-slate-100 text-slate-600 transition-colors">
          <ChevronLeft className="w-7 h-7" />
        </button>
        <h2 className="flex-1 text-center font-bold text-slate-900 text-lg">Select Deck</h2>
        <div className="w-11" /> {/* Spacer */}
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {decks.map(deck => (
          <div 
            key={deck.id}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 active:scale-[0.98] transition-transform flex items-center gap-4 cursor-pointer"
            onClick={() => onSelectDeck(deck)}
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900">{deck.name}</h3>
              <p className="text-xs text-slate-500">{deck.cards.length} cards</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
        ))}
        {decks.length === 0 && (
          <div className="text-center text-slate-400 mt-10">No decks available.</div>
        )}
      </div>
    </motion.div>
  );
}

function SmartCards({ deck, onBack }: { deck: Deck, onBack: () => void, key?: string }) {
  const [cardList, setCardList] = useState(deck.cards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownWords, setKnownWords] = useState<number[]>([]);

  const currentCard = cardList[currentIndex];
  const isComplete = cardList.length === 0 || currentIndex >= cardList.length;
  const progress = cardList.length > 0 ? Math.min((currentIndex / cardList.length) * 100, 100) : 100;

  const handleNext = (known: boolean) => {
    if (known) {
      setKnownWords(prev => [...prev, currentIndex]);
    }
    
    // Update mastery level
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
    setCurrentIndex(0);
    setKnownWords([]);
    setIsFlipped(false);
  };

  // Calculate mastery distribution for the end screen
  const masteryCounts = [1, 2, 3, 4, 5].map(level => 
    cardList.filter(w => (w.mastery || 1) === level).length
  );

  return (
    <motion.div 
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-slate-50 flex flex-col"
    >
      {/* App Bar */}
      <div className="h-16 bg-white border-b border-slate-100 flex items-center px-4 shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full active:bg-slate-100 text-slate-600 transition-colors">
          <ChevronLeft className="w-7 h-7" />
        </button>
        <h2 className="flex-1 text-center font-bold text-slate-900 text-lg">Smart Cards</h2>
        <div className="w-12 text-right text-sm font-bold text-indigo-600">
          {Math.min(currentIndex + 1, cardList.length)}/{cardList.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-slate-100 w-full shrink-0">
        <div 
          className="h-full bg-indigo-500 transition-all duration-300 ease-out" 
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center max-w-md mx-auto w-full">
        {cardList.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 text-center">
            <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Empty Deck</h3>
            <p className="text-slate-500 mb-8">
              There are no flashcards in this deck yet. Practice scenarios to generate and save new cards!
            </p>
            <button 
              onClick={onBack} 
              className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center active:scale-95 transition-transform"
            >
              Go Back
            </button>
          </div>
        ) : isComplete ? (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 text-center">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10" />
            </div>
            <h3 className="text-3xl font-bold text-slate-900 mb-2">Complete!</h3>
            <p className="text-slate-500 mb-8">
              You mastered <span className="font-bold text-slate-900">{knownWords.length}</span> out of {cardList.length} cards.
            </p>

            {/* Mastery Chart */}
            <div className="bg-slate-50 rounded-2xl p-5 mb-8">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-8">Mastery Overview</h4>
              <div className="flex items-end justify-between h-32 gap-3 px-2">
                {[1, 2, 3, 4, 5].map((level, idx) => {
                  const count = masteryCounts[idx];
                  const percentage = (count / cardList.length) * 100;
                  return (
                    <div key={level} className="flex flex-col items-center flex-1 gap-3 h-full">
                      <div className="w-full bg-slate-200 rounded-full relative flex items-end justify-center h-full">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(percentage, 5)}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: idx * 0.1 }}
                          className={`w-full rounded-full ${
                            level <= 2 ? 'bg-rose-400' : level <= 4 ? 'bg-amber-400' : 'bg-emerald-500'
                          }`}
                        />
                        {count > 0 && (
                          <span className="absolute -top-7 text-[10px] font-black text-slate-600 bg-white px-1.5 py-0.5 rounded-md shadow-sm border border-slate-100">{count}</span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">Lv {level}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button 
              onClick={handleRestart} 
              className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center active:scale-95 transition-transform"
            >
              <RefreshCw className="w-5 h-5 mr-2" /> Practice Again
            </button>
          </div>
        ) : (
          <div className="perspective-1000 w-full aspect-[3/4] max-h-[60vh] cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
            <motion.div
              className="w-full h-full relative preserve-3d transition-transform duration-500"
              animate={{ rotateX: isFlipped ? 180 : 0 }}
            >
              {/* Front */}
              <div className="absolute w-full h-full backface-hidden rounded-[2.5rem] border border-slate-200 shadow-md flex flex-col items-center justify-center p-8 bg-white">
                <div className="absolute top-8 w-full px-8 flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mastery Level</span>
                  </div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(level => (
                      <div 
                        key={level} 
                        className={`h-2 w-6 rounded-full transition-colors ${
                          level <= (currentCard.mastery || 1)
                            ? ((currentCard.mastery || 1) <= 2 ? 'bg-rose-400' : (currentCard.mastery || 1) <= 4 ? 'bg-amber-400' : 'bg-emerald-500')
                            : 'bg-slate-100'
                        }`} 
                      />
                    ))}
                  </div>
                </div>
                
                <h3 className="text-3xl sm:text-4xl font-black text-slate-900 text-center leading-tight mt-8">{currentCard.front}</h3>
                
                <span className="absolute bottom-8 text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-full">Tap to flip</span>
              </div>

              {/* Back */}
              <div className="absolute w-full h-full backface-hidden rounded-[2.5rem] border border-indigo-100 shadow-lg flex flex-col items-center justify-center p-8 bg-indigo-50 [transform:rotateX(180deg)]">
                <div className="absolute top-8 w-full px-8 flex flex-col items-center">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(level => (
                      <div 
                        key={level} 
                        className={`h-1.5 w-5 rounded-full transition-colors ${
                          level <= (currentCard.mastery || 1)
                            ? ((currentCard.mastery || 1) <= 2 ? 'bg-rose-400' : (currentCard.mastery || 1) <= 4 ? 'bg-amber-400' : 'bg-emerald-500')
                            : 'bg-indigo-100'
                        }`} 
                      />
                    ))}
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-indigo-900 mb-6 mt-4 text-center">{currentCard.front}</h3>
                <p className="text-lg text-indigo-800 text-center mb-8 font-medium leading-relaxed">"{currentCard.back}"</p>
                {currentCard.explanation && (
                  <div className="bg-white/60 p-5 rounded-2xl w-full text-center">
                    <p className="text-indigo-600 italic leading-relaxed">"{currentCard.explanation}"</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      {!isComplete && cardList.length > 0 && (
        <div className="p-6 bg-white border-t border-slate-100 shrink-0 flex gap-4 pb-8">
          <button 
            className="flex-1 h-16 rounded-2xl border-2 border-rose-100 bg-rose-50 text-rose-600 font-bold text-lg flex items-center justify-center active:scale-95 transition-transform"
            onClick={(e) => { e.stopPropagation(); handleNext(false); }}
          >
            <X className="w-6 h-6 mr-2" /> Learning
          </button>
          <button 
            className="flex-1 h-16 rounded-2xl bg-emerald-500 text-white font-bold text-lg flex items-center justify-center shadow-lg shadow-emerald-200 active:scale-95 transition-transform"
            onClick={(e) => { e.stopPropagation(); handleNext(true); }}
          >
            <Check className="w-6 h-6 mr-2" /> Got It
          </button>
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
  
  const recognitionRef = useRef<any>(null);

  const currentPhrase = PRONUNCIATION_PHRASES[phraseIndex];

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      evaluatePronunciation();
    } else {
      setTranscript("");
      setFeedback(null);
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Speech recognition error:", e);
        alert("Speech recognition is not supported in this browser or requires permissions.");
      }
    }
  };

  const evaluatePronunciation = () => {
    if (!transcript) return;
    
    const targetWords = currentPhrase.toLowerCase().replace(/[.,?]/g, '').split(' ');
    const spokenWords = transcript.toLowerCase().replace(/[.,?]/g, '').split(' ');
    
    let matches = 0;
    spokenWords.forEach(word => {
      if (targetWords.includes(word)) matches++;
    });

    const score = Math.min(100, Math.round((matches / targetWords.length) * 100));
    
    let message = "";
    if (score >= 90) message = "Excellent! Perfect pronunciation.";
    else if (score >= 70) message = "Good job! A few words were slightly off.";
    else if (score >= 40) message = "Keep practicing. Try speaking more clearly.";
    else message = "Let's try that again. Listen closely to the phrase.";

    setFeedback({ score, message });
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
      className="fixed inset-0 z-[100] bg-slate-50 flex flex-col"
    >
      {/* App Bar */}
      <div className="h-16 bg-white border-b border-slate-100 flex items-center px-4 shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full active:bg-slate-100 text-slate-600 transition-colors">
          <ChevronLeft className="w-7 h-7" />
        </button>
        <h2 className="flex-1 text-center font-bold text-slate-900 text-lg">Pronunciation</h2>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col max-w-md mx-auto w-full">
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 mb-4 shrink-0">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Target Phrase</span>
            <button 
              onClick={playTTS}
              className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-600 active:bg-slate-100 transition-colors"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
          <h3 className="text-2xl font-medium text-slate-900 leading-relaxed">
            "{currentPhrase}"
          </h3>
        </div>

        <div className="flex-1 bg-slate-100 rounded-[2rem] p-6 relative flex flex-col border border-slate-200/50">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Your Speech</span>
          <div className="flex-1 flex flex-col justify-center">
            {transcript ? (
              <p className="text-xl text-slate-700 leading-relaxed text-center">{transcript}</p>
            ) : (
              <p className="text-lg text-slate-400 italic text-center">
                {isRecording ? "Listening..." : "Tap the microphone and start speaking..."}
              </p>
            )}
          </div>

          {feedback && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 p-5 rounded-2xl border-l-4 ${
                feedback.score >= 80 ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 
                feedback.score >= 50 ? 'bg-amber-50 border-amber-500 text-amber-800' : 
                'bg-rose-50 border-rose-500 text-rose-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm uppercase tracking-wider">Score</span>
                <span className="text-2xl font-black">{feedback.score}%</span>
              </div>
              <p className="text-sm font-medium">{feedback.message}</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="p-6 bg-white border-t border-slate-100 shrink-0 flex items-center justify-between pb-8 max-w-md mx-auto w-full">
        <button 
          className="w-14 h-14 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 active:text-slate-900 transition-colors"
          onClick={() => {
            setTranscript("");
            setFeedback(null);
            setPhraseIndex((prev) => (prev > 0 ? prev - 1 : PRONUNCIATION_PHRASES.length - 1));
          }}
          disabled={isRecording}
        >
          <SkipBack className="w-6 h-6" />
        </button>
        
        <button 
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-all duration-300 ${
            isRecording 
              ? 'bg-rose-500 text-white shadow-rose-200 animate-pulse' 
              : 'bg-emerald-500 text-white shadow-emerald-200'
          }`}
          onClick={toggleRecording}
        >
          {isRecording ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-8 h-8" />}
        </button>

        <button 
          className="w-14 h-14 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 active:text-slate-900 transition-colors"
          onClick={() => {
            setTranscript("");
            setFeedback(null);
            setPhraseIndex((prev) => (prev + 1) % PRONUNCIATION_PHRASES.length);
          }}
          disabled={isRecording}
        >
          <SkipForward className="w-6 h-6" />
        </button>
      </div>
    </motion.div>
  );
}
