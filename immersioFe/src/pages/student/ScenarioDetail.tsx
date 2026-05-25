import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import {
  Mic,
  Send,
  ArrowLeft,
  Sparkles,
  Volume2,
  Info,
  AlertCircle,
  Loader2,
  X,
  Check,
  Brain,
  Trophy,
  UserCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { scenarioService, Scenario } from "@/services/scenario";
import { getDecks, addCardsToDeck, addDeck, Deck, Flashcard } from "@/services/decks";

type ChatMessage = { 
  role: "user" | "model"; 
  text: string; 
  correction?: { corrected: string; explanation: string };
};

const getVoiceForLanguage = (lang?: string, defaultVoice?: string) => {
  if (!lang) return defaultVoice || "en-US-JennyNeural";
  const lower = lang.toLowerCase();
  if (lower.includes("japanese") || lower === "ja") return "ja-JP-NanamiNeural";
  if (lower.includes("chinese") || lower === "zh") return "zh-CN-XiaoxiaoNeural";
  if (lower.includes("french") || lower === "fr") return "fr-FR-DeniseNeural";
  return "en-US-JennyNeural";
};

const getBrowserLangCode = (lang?: string) => {
  if (!lang) return "en-US";
  const lower = lang.toLowerCase();
  if (lower.includes("japanese") || lower === "ja") return "ja-JP";
  if (lower.includes("chinese") || lower === "zh") return "zh-CN";
  if (lower.includes("french") || lower === "fr") return "fr-FR";
  return "en-US";
};

export default function ScenarioDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(window.location.search);
  const targetLang = queryParams.get("lang") || undefined;

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingScenario, setLoadingScenario] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"2d" | "feedback">("2d");
  const [isLoading, setIsLoading] = useState(false);
  const [showCorrection, setShowCorrection] = useState<{ original: string; corrected: string; explanation: string } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Feedback & Flashcards state
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState(false);
  const [selectedFlashcardOptions, setSelectedFlashcardOptions] = useState<string[]>(["grammar", "vocabulary", "improvement"]);

  // Deck states
  const [showSaveDeckModal, setShowSaveDeckModal] = useState(false);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [newDeckName, setNewDeckName] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load scenario details and start learning session
  useEffect(() => {
    if (!id) return;
    scenarioService.getScenarioById(id)
      .then(async (data) => {
        setScenario(data);
        setLoadingScenario(false);
        try {
          const res = await scenarioService.startSession(data.id, targetLang);
          setSessionId(res.sessionId);
          const startMsg = res.initialMessage || data.initialMessage;
          setMessages([{ role: "model", text: startMsg }]);
          playTextToSpeech(startMsg, targetLang);
        } catch (err: any) {
          console.error("Failed to start session on backend:", err);
          if (err.message) alert(err.message);
        }
      })
      .catch(err => {
        console.error(err);
        setLoadingScenario(false);
      });
  }, [id]);

  // Auto-scroll to bottom of messages inside visual novel dialogue
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const playTextToSpeech = async (text: string, langOverride?: string) => {
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
      } catch (e) {
        // ignore
      }
    }

    try {
      const activeLang = langOverride || targetLang || scenario?.language;
      const selectedVoice = getVoiceForLanguage(activeLang, scenario?.voiceId);
      const token = localStorage.getItem("token") || "";
      const response = await fetch("http://localhost:5249/api/practice/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          text: text,
          voice: selectedVoice
        })
      });

      if (!response.ok) {
        throw new Error("TTS request failed");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      setCurrentAudio(audio);
      await audio.play();
    } catch (e) {
      console.error("Azure TTS Playback failed, falling back to browser SpeechSynthesis:", e);
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const activeLang = langOverride || targetLang || scenario?.language;
        utterance.lang = getBrowserLangCode(activeLang);
        window.speechSynthesis.speak(utterance);
      } catch (synthErr) {
        console.error("SpeechSynthesis fallback failed:", synthErr);
      }
    }
  };

  // Speech Recognition Initialization
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        setIsListening(false);
        return;
      }
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // Update Recognition Language when scenario/language changes
  useEffect(() => {
    if (recognitionRef.current && scenario) {
      const activeLang = targetLang || scenario.language;
      recognitionRef.current.lang = getBrowserLangCode(activeLang);
    }
  }, [scenario, targetLang]);

  const startListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) return;

    setIsListening(true);
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error("Recognition start error:", e);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Stop error:", e);
      }
      setIsListening(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !scenario || !sessionId) return;

    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await scenarioService.sendMessage(sessionId, userMsg);
      
      // Update the user message item in history with its correction if any
      if (response.correction) {
        setMessages(prev => prev.map((msg, idx) => 
          (idx === prev.length - 1 && msg.role === "user")
            ? { ...msg, correction: response.correction }
            : msg
        ));
      }

      setMessages(prev => [...prev, { role: "model", text: response.reply }]);

      // Auto-play NPC response
      playTextToSpeech(response.reply, targetLang);

      // Analysis for feedback (standard logic)
      if (response.correction) {
        setShowCorrection({
          original: userMsg,
          corrected: response.correction.corrected,
          explanation: response.correction.explanation
        });
        setTimeout(() => setShowCorrection(null), 8000);
      }

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishLesson = async () => {
    if (!scenario || !sessionId) return;
    setMode("feedback");
    setIsLoadingFeedback(true);
    setFlashcards(null);
    setSelectedFlashcardOptions(["grammar", "vocabulary", "improvement"]);

    try {
      const response = await scenarioService.finishSession(sessionId);
      setFeedbackText(response.feedback);
      
      // Auto-trigger dynamic custom flashcards generation using all three default options
      setIsLoadingFlashcards(true);
      try {
        const customCards = await scenarioService.generateCustomFlashcards(sessionId, ["grammar", "vocabulary", "improvement"]);
        setFlashcards(customCards.map((c, i) => ({
          id: `temp-${i}`,
          front: c.front,
          back: c.back,
          explanation: c.explanation || ""
        })));
      } catch (fErr) {
        console.error("Failed to generate initial flashcards:", fErr);
      } finally {
        setIsLoadingFlashcards(false);
      }
    } catch (error) {
      console.error("Error generating feedback:", error);
      setFeedbackText("Great effort! Keep practicing to improve your skills.");
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  const toggleFlashcardOption = (option: string) => {
    setSelectedFlashcardOptions(prev => 
      prev.includes(option) 
        ? prev.filter(o => o !== option) 
        : [...prev, option]
    );
  };

  const handleGenerateCustomCards = async () => {
    if (!sessionId) return;
    if (selectedFlashcardOptions.length === 0) {
      alert("Please select at least one card category option to generate!");
      return;
    }
    setIsLoadingFlashcards(true);
    setFlashcards(null);
    setIsSaved(false);

    try {
      const customCards = await scenarioService.generateCustomFlashcards(sessionId, selectedFlashcardOptions);
      setFlashcards(customCards.map((c, i) => ({
        id: `temp-${i}`,
        front: c.front,
        back: c.back,
        explanation: c.explanation || ""
      })));
    } catch (error) {
      console.error("Error generating dynamic flashcards:", error);
    } finally {
      setIsLoadingFlashcards(false);
    }
  };

  const handleOpenSaveModal = async () => {
    try {
      const list = await getDecks();
      setDecks(list);
      setShowSaveDeckModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveToDeck = async (deckId: string) => {
    if (flashcards && flashcards.length > 0) {
      try {
        await addCardsToDeck(deckId, flashcards);
        setIsSaved(true);
        setShowSaveDeckModal(false);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCreateAndSaveDeck = async () => {
    if (newDeckName.trim() && flashcards && flashcards.length > 0) {
      try {
        const newDeck = await addDeck(newDeckName.trim());
        await addCardsToDeck(newDeck.id, flashcards);
        setIsSaved(true);
        setShowSaveDeckModal(false);
        setNewDeckName("");
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loadingScenario) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-4">Connecting to simulation server...</p>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-white">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <p className="text-xl mb-4 font-bold">Scenario not found</p>
        <Button onClick={() => navigate("/student/scenarios")} className="bg-indigo-600 hover:bg-indigo-700">Back to Library</Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col font-body select-none">
      
      {/* Background Graphic Layer */}
      <div className="absolute inset-0 z-0">
        <img
          src={scenario.bg}
          alt="Scenario Background"
          className="w-full h-full object-cover opacity-35 filter brightness-75 contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-transparent to-slate-950/95" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-transparent to-slate-950/70" />
      </div>

      {/* Modern Translucent Header */}
      <div className="relative z-30 p-4 md:p-6 flex items-center justify-between bg-gradient-to-b from-slate-950/90 to-transparent">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 rounded-full w-11 h-11 shrink-0"
            onClick={() => navigate("/student/scenarios")}
          >
            <ArrowLeft size={24} />
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 shadow-2xl">
              <span className="text-indigo-400 font-black text-xs uppercase tracking-widest">{targetLang || scenario.language}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-slate-900/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 shadow-2xl">
              <span className="text-white/60 font-bold text-xs uppercase tracking-widest">{scenario.level}</span>
            </div>
          </div>
        </div>

        <div>
          {mode !== "feedback" && (
            <Button
              className="rounded-2xl h-11 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-transform"
              onClick={handleFinishLesson}
            >
              Finish Lesson
            </Button>
          )}
        </div>
      </div>

      {/* Save Deck Modal */}
      <AnimatePresence>
        {showSaveDeckModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSaveDeckModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl flex flex-col max-h-[80vh] z-10"
            >
              <div className="flex items-center justify-between mb-6 shrink-0">
                <h2 className="text-xl font-black text-white italic tracking-tight">Save to Deck</h2>
                <button onClick={() => setShowSaveDeckModal(false)} className="text-white/40 hover:text-white p-2">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-6 custom-scrollbar scrollbar-hide">
                {decks.map(deck => (
                  <button
                    key={deck.id}
                    onClick={() => handleSaveToDeck(deck.id)}
                    className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <h3 className="text-white font-bold text-sm tracking-tight">{deck.name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{deck.cards.length} cards</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:text-indigo-400 text-white/40 transition-colors">
                      <Check size={14} />
                    </div>
                  </button>
                ))}
                {decks.length === 0 && (
                  <p className="text-xs text-slate-500 font-bold text-center py-4 uppercase">No decks found. Create one below.</p>
                )}
              </div>

              <div className="shrink-0 pt-4 border-t border-white/10">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Or Create New Deck</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                    placeholder="Deck Name..."
                    className="flex-1 h-12 bg-black/40 border border-white/10 rounded-2xl px-4 text-white text-sm focus:outline-none focus:border-indigo-500/50 font-bold"
                  />
                  <Button
                    onClick={handleCreateAndSaveDeck}
                    disabled={!newDeckName.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-5 h-12 shrink-0 font-black uppercase text-[10px] tracking-wider"
                  >
                    Create & Save
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      {mode === "feedback" ? (
        /* Lesson Feedback Summary and Dynamic Card Generator */
        <div className="flex-1 relative z-20 flex flex-col items-center justify-start pt-6 px-4 w-full h-full overflow-y-auto pb-24">
          <div className="w-full max-w-3xl bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-vibrant px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-2">
              <Trophy size={16} className="text-white animate-bounce" />
              <span className="text-white font-black text-[10px] uppercase tracking-widest">Simulation Complete</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter mb-8 text-center mt-4">
              Evaluation & <span className="text-indigo-400">Insights</span>
            </h2>

            <div className="bg-white/5 rounded-[2rem] p-6 md:p-8 border border-white/10 mb-10 shadow-inner">
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
                <Brain size={16} />
                Performance Report
              </h3>
              {isLoadingFeedback ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="animate-spin text-indigo-500 mb-4" size={36} />
                  <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Running CEFR Dialogic Analysis...</p>
                </div>
              ) : (
                <div className="text-white/90 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium">
                  {feedbackText}
                </div>
              )}
            </div>

            {!isLoadingFeedback && (
              <div className="space-y-8">
                <div className="text-center">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Select Flashcard Categories</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Select topics to extract card packs</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { key: "grammar", label: "Grammar Core" },
                    { key: "vocabulary", label: "Advanced Vocabulary" },
                    { key: "improvement", label: "Dialogic Reformulation" }
                  ].map((opt) => (
                    <Button
                      key={opt.key}
                      onClick={() => toggleFlashcardOption(opt.key)}
                      disabled={isLoadingFlashcards}
                      className={cn(
                        "h-14 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all border border-indigo-500/20 active:scale-95",
                        selectedFlashcardOptions.includes(opt.key)
                          ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/30"
                          : "bg-white/5 text-white/60 hover:bg-white/10"
                      )}
                    >
                      {selectedFlashcardOptions.includes(opt.key) ? `✓ ${opt.label}` : opt.label}
                    </Button>
                  ))}
                </div>

                <div className="flex justify-center pt-2">
                  <Button
                    onClick={handleGenerateCustomCards}
                    disabled={isLoadingFlashcards || selectedFlashcardOptions.length === 0}
                    className="px-10 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2.5 shadow-xl shadow-indigo-600/25 active:scale-95 transition-all"
                  >
                    <Sparkles size={16} className="text-amber-300" />
                    Extract Card Lab Pack ({selectedFlashcardOptions.length})
                  </Button>
                </div>

                {isLoadingFlashcards && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="animate-spin text-indigo-500 mb-4" size={36} />
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Synthesizing personalized cards...</p>
                  </div>
                )}

                {flashcards && flashcards.length > 0 && (
                  <div className="mt-10 space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Synthesized Cards</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {flashcards.map((card, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/15 rounded-2xl p-6 hover:bg-white/10 transition-all shadow-md">
                          <p className="text-sm font-black text-white mb-2 pb-2 border-b border-white/5 leading-snug uppercase tracking-tight">{card.front}</p>
                          <p className="text-sm text-indigo-400 font-black mb-2">{card.back}</p>
                          {card.explanation && <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">💡 {card.explanation}</p>}
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-8 flex flex-col sm:flex-row justify-center gap-4">
                      <Button
                        onClick={handleOpenSaveModal}
                        disabled={isSaved}
                        className={cn(
                          "rounded-2xl px-10 h-14 font-black tracking-widest uppercase text-[10px] transition-all duration-300 active:scale-95",
                          isSaved 
                            ? "bg-emerald-600 text-white shadow-xl shadow-emerald-500/20" 
                            : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                        )}
                      >
                        {isSaved ? "Saved successfully!" : "Save Card Pack"}
                      </Button>
                      <Button 
                        onClick={() => navigate("/student/scenarios")} 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-10 h-14 font-black tracking-widest uppercase text-[10px] shadow-xl shadow-indigo-600/25 active:scale-95 transition-all"
                      >
                        Return to Library
                      </Button>
                    </div>
                  </div>
                )}

                {flashcards && flashcards.length === 0 && !isLoadingFlashcards && (
                  <div className="text-center py-8 text-slate-500 font-bold text-xs uppercase tracking-widest">
                    No flashcards generated. Please try toggling other options.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Visual Novel Dialogue Mode */
        <div className="flex-1 relative z-20 flex flex-col justify-end pb-8 px-4 w-full h-full overflow-hidden">
          
          {/* Breathing Visual Novel Character Avatar */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[68vh] md:h-[82vh] w-auto z-10 flex items-end justify-center pointer-events-none">
            <motion.img
              src={scenario.avatar}
              alt="Scenario Character Avatar"
              animate={{ 
                y: [0, -8, 0],
                scale: [1, 1.01, 1]
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="h-full w-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.85)] filter contrast-[1.05]"
            />
          </div>

          {/* Interactive Dialogue & Scrolling Chat Panel */}
          <div className="relative z-20 w-full max-w-4xl mx-auto flex flex-col gap-4 pointer-events-auto">
            
            {/* Scrolling Dialogue Panel */}
            <div className="bg-slate-950/85 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-2xl min-h-[280px] flex flex-col justify-between max-h-[45vh]">
              
              {/* Header card for Speech Lab */}
              <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black">
                    ✦
                  </div>
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">IMMERSIO Speech Lab</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Active Dialogue</span>
                </div>
              </div>

              {/* Conversation list */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar scrollbar-hide py-2 select-text">
                {messages.map((msg, idx) => (
                  <div key={idx} className={cn("flex gap-3 max-w-[85%] animate-fade-in", msg.role === "user" ? "ml-auto justify-end" : "justify-start")}>
                    {msg.role !== "user" && (
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 border border-white/10 shadow-md">
                        <Sparkles size={12} />
                      </div>
                    )}
                    
                    <div className={cn(
                      "p-3.5 rounded-2xl border text-xs md:text-sm font-semibold leading-relaxed shadow-sm relative group",
                      msg.role === "user" 
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500/20 rounded-tr-none" 
                        : "bg-white/5 border-white/5 text-slate-200 rounded-tl-none pr-12"
                    )}>
                      {msg.role !== "user" && (
                        <p className="text-[9px] font-black text-indigo-400 mb-1 uppercase tracking-wide leading-none">
                          {scenario.title.split(' ')[0]} (AI Barista)
                        </p>
                      )}
                      {msg.role === "user" && (
                        <p className="text-[9px] font-black text-cyan-300 mb-1 text-right uppercase tracking-wide leading-none">
                          You (Speaking)
                        </p>
                      )}
                      
                      <p>{msg.text}</p>
                      
                      {/* Audio Button overlay on AI messages */}
                      {msg.role !== "user" && (
                        <button
                          className="absolute bottom-2.5 right-2.5 w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/55 hover:text-white hover:bg-white/15 transition-all duration-200"
                          onClick={() => playTextToSpeech(msg.text, targetLang)}
                        >
                          <Volume2 size={12} />
                        </button>
                      )}

                      {/* Inline grammar correction inside user bubble */}
                      {msg.role === "user" && msg.correction && (
                        <div className="mt-2.5 pt-2.5 border-t border-white/10 text-[9px] text-cyan-200 font-medium">
                          💡 Suggestion: Did you mean <span className="font-extrabold text-white">"{msg.correction.corrected}"</span>?
                          <p className="italic text-white/70 mt-0.5 font-bold">"{msg.correction.explanation}"</p>
                        </div>
                      )}

                      {/* Accent / pronunciation rating bubble mockup inside user speech bubbles */}
                      {msg.role === "user" && (
                        <div className="mt-2.5 flex items-center justify-end gap-1 shrink-0">
                          <span className="text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Pronunciation: 96%</span>
                        </div>
                      )}
                    </div>

                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-white shrink-0 shadow-md">
                        <UserCircle2 size={14} />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* User Response controls */}
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 relative group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={isListening ? "Listening closely..." : "Type your response..."}
                  className={cn(
                    "w-full h-16 bg-slate-950/85 border border-white/10 rounded-[2.2rem] px-6 pr-16 text-white font-bold text-sm placeholder:text-white/30 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 backdrop-blur-2xl shadow-2xl transition-all",
                    isListening && "ring-4 ring-red-500/20 bg-red-950/20 border-red-500/35"
                  )}
                />
                
                <Button
                  size="icon"
                  className={cn(
                    "absolute right-2 top-2 h-12 w-12 rounded-full transition-all active:scale-95 shadow-lg",
                    input.trim() 
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white scale-100" 
                      : "bg-white/5 text-white/20 scale-90 pointer-events-none"
                  )}
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                >
                  <Send size={18} />
                </Button>
              </div>

              {/* Pulsing Glowing Mic Control */}
              <Button
                size="icon"
                className={cn(
                  "rounded-[1.75rem] h-16 w-16 shrink-0 shadow-2xl transition-all relative overflow-hidden border border-white/10",
                  isListening
                    ? "bg-red-600 scale-110 ring-4 ring-red-500/30"
                    : "bg-gradient-to-br from-slate-900 to-black hover:from-slate-800 hover:to-slate-950"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  if (isListening) {
                    stopListening();
                  } else {
                    startListening();
                  }
                }}
              >
                {isListening ? (
                  <motion.div
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                  >
                    <div className="w-5 h-5 bg-white rounded-md" />
                  </motion.div>
                ) : (
                  <Mic size={24} className="text-white" />
                )}
              </Button>
            </div>
          </div>

          {/* Grammar Correction Toast Popup Overlay */}
          <AnimatePresence>
            {showCorrection && (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                className="absolute bottom-72 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-red-650/95 backdrop-blur-lg text-white p-6 rounded-3xl shadow-2xl border border-red-500/40 z-50 overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-2.5 h-full bg-red-500" />
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-red-500/25 rounded-2xl text-red-300">
                    <Info size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-300 mb-1">Syntactic Repair</p>
                    <p className="text-xs line-through text-white/60 mb-1 font-semibold truncate">{showCorrection.original}</p>
                    <p className="text-sm font-black text-white mb-2 leading-snug">{showCorrection.corrected}</p>
                    <p className="text-xs text-white/80 font-bold italic leading-relaxed">"{showCorrection.explanation}"</p>
                  </div>
                  <button onClick={() => setShowCorrection(null)} className="text-white/40 hover:text-white p-1">
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
