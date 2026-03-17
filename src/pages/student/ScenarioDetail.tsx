import { useState, useRef, useEffect, MouseEvent } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Mic, Send, ArrowLeft, Video, Monitor, Sparkles, Volume2, Info, AlertCircle, Loader2, Target, Scan, Maximize, Crosshair, Box, X, Check, RefreshCcw, RotateCcw, Coffee, Utensils, Soup, Triangle, Flame, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { generateScenarioResponse, ChatMessage, getCorrection, generateFeedback, generateFlashcards, Flashcard } from "@/services/gemini";
import { getDecks, addCardsToDeck, addDeck, Deck } from "@/services/decks";
import { generateGroqSpeech } from "@/services/groq";
import { scenarios } from "@/data/scenarios";
import '@google/model-viewer';

// Global guard for initial audio to prevent duplication in React Strict Mode (dev)
let lastPlayedInitialScenarioId: string | null = null;

export default function ScenarioDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = (searchParams.get("mode") as "2d" | "ar") || "2d";

  const scenario = scenarios.find(s => s.id === id);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"2d" | "ar" | "feedback">(initialMode);
  const [placedModels, setPlacedModels] = useState<{ id: string, x: number, y: number, scale: number, url: string, image: string, name: string }[]>([]);
  const [selectedModelIndex, setSelectedModelIndex] = useState<number | null>(null);
  const [pendingModel, setPendingModel] = useState<any | null>(null);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCorrection, setShowCorrection] = useState<{ original: string, corrected: string, explanation: string } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<"user" | "environment">("user");
  const [isScanning, setIsScanning] = useState(false);
  const [surfaceDetected, setSurfaceDetected] = useState(false);
  const [reticlePos, setReticlePos] = useState({ x: 50, y: 70 });

  // Feedback & Flashcards state
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState(false);
  const [selectedFlashcardOption, setSelectedFlashcardOption] = useState<"grammar" | "vocabulary" | "improvement" | null>(null);

  // Deck states
  const [showSaveDeckModal, setShowSaveDeckModal] = useState(false);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [newDeckName, setNewDeckName] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [dragOrigin, setDragOrigin] = useState({ x: 0, y: 0 });
  const [initialOrientation, setInitialOrientation] = useState<{ alpha: number, beta: number, gamma: number } | null>(null);
  const [gyroOffset, setGyroOffset] = useState({ x: 0, y: 0 });
  const [gyroPermissionStatus, setGyroPermissionStatus] = useState<"prompt" | "granted" | "denied">("prompt");

  // Gyroscope tracking for spatial anchoring
  useEffect(() => {
    if (mode !== "ar") return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha === null || e.beta === null) return;

      if (!initialOrientation) {
        setInitialOrientation({ alpha: e.alpha, beta: e.beta, gamma: e.gamma || 0 });
        return;
      }

      // Calculate relative movement
      if (!arContainerRef.current) return;
      const rect = arContainerRef.current.getBoundingClientRect();

      // Higher sensitivity for more responsive anchoring (Market Standard)
      const sensitivityX = rect.width / 65; // FOV approx 65 degrees
      const sensitivityY = rect.height / 65;

      let alphaDiff = e.alpha - initialOrientation.alpha;
      if (alphaDiff > 180) alphaDiff -= 360;
      if (alphaDiff < -180) alphaDiff += 360;

      const betaDiff = e.beta - initialOrientation.beta;

      // Smoothly update offsets to compensate for camera rotation using exponential smoothing (Damping)
      setGyroOffset(prev => {
        const targetX = -alphaDiff * sensitivityX;
        // Invert Y: When tilting down (beta increases), floor points move UP in visual space.
        const targetY = -betaDiff * sensitivityY;
        
        // Damping factor: 0.15 for high stability (lower = more smooth)
        const damping = 0.15;
        return {
          x: prev.x + (targetX - prev.x) * damping,
          y: prev.y + (targetY - prev.y) * damping
        };
      });
    };

    const requestPermission = async () => {
      // @ts-ignore - iOS specific permission request
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          // @ts-ignore
          const response = await DeviceOrientationEvent.requestPermission();
          if (response === 'granted') {
            setGyroPermissionStatus("granted");
            window.addEventListener('deviceorientation', handleOrientation);
          } else {
            setGyroPermissionStatus("denied");
          }
        } catch (error) {
          console.error("Permission request failed", error);
          setGyroPermissionStatus("denied");
        }
      } else {
        // Android or non-iOS
        setGyroPermissionStatus("granted");
        window.addEventListener('deviceorientation', handleOrientation);
      }
    };

    if (gyroPermissionStatus === "prompt") {
      requestPermission();
    } else if (gyroPermissionStatus === "granted") {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [mode, initialOrientation, gyroPermissionStatus]);

  // Navigation Mode States
  const [navPhase, setNavPhase] = useState<"intro" | "local_explaining" | "ai_question" | "feedback">("intro");
  const [userAnswer, setUserAnswer] = useState("");
  const [navFeedback, setNavFeedback] = useState<{ isCorrect: boolean, explanation: string } | null>(null);
  const [mapDestination, setMapDestination] = useState({ x: 75, y: 25 }); // Example target on mini-map
  const [userPos, setUserPos] = useState({ x: 20, y: 80 }); // User start on mini-map
  const [basket, setBasket] = useState<{ id: string, name: string, price: number, image: string, count: number }[]>([]);
  const [showBasket, setShowBasket] = useState(false);
  const [isShelfOpen, setIsShelfOpen] = useState(true);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const arContainerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const initialAudioPlayedRef = useRef<string | null>(null);

  // Initialize messages when scenario loads
  useEffect(() => {
    if (scenario && lastPlayedInitialScenarioId !== scenario.id) {
      setMessages([{ role: "model", text: scenario.initialMessage }]);
      // Play initial message audio automatically
      playTextToSpeech(scenario.initialMessage);
      lastPlayedInitialScenarioId = scenario.id;
      initialAudioPlayedRef.current = scenario.id;
    }
  }, [scenario]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle AR Camera
  useEffect(() => {
    let mounted = true;
    const startCamera = async () => {
      if (mode !== "ar") {
        stopCamera();
        return;
      }

      setCameraError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Camera API not supported in this browser.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: cameraFacingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (mounted) {
              videoRef.current?.play().catch(e => console.error("Play error:", e));
            }
          };
        }
      } catch (err: any) {
        console.error("Camera error:", err);
        if (mounted) {
          if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            setCameraError("Camera access denied. Please allow camera permissions in your browser settings.");
          } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
            setCameraError("No camera found on this device.");
          } else {
            setCameraError(`Could not access camera: ${err.message || "Unknown error"}`);
          }
        }
      }
    };

    stopCamera();
    startCamera();

    // Reset spatial anchoring tracking when mode changes
    if (mode === "ar") {
      setInitialOrientation(null);
      setGyroOffset({ x: 0, y: 0 });
    }

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [mode, cameraFacingMode]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const playTextToSpeech = async (text: string) => {
    if (currentAudio) {
      currentAudio.pause();
    }

    const base64Audio = await generateGroqSpeech(text);
    if (base64Audio) {
      try {
        // Use audio/wav for WAV
        const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
        setCurrentAudio(audio);
        await audio.play();
      } catch (e) {
        console.error("Audio play error:", e);
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
      recognitionRef.current.lang = scenario.language === "English" ? 'en-US' :
        scenario.language === "Chinese" ? 'zh-CN' :
          scenario.language === "Japanese" ? 'ja-JP' : 'en-US';
    }
  }, [scenario]);

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

  const toggleCamera = () => {
    setCameraFacingMode(prev => prev === "user" ? "environment" : "user");
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

  const handleARClick = (e: MouseEvent) => {
    if (mode !== "ar" || !arContainerRef.current) return;

    const rect = arContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (pendingModel) {
      // Direct placement at reticle or cursor
      const placementX = surfaceDetected ? reticlePos.x : x;
      const placementY = surfaceDetected ? reticlePos.y : y;

      const newModel = {
        id: Math.random().toString(36).substr(2, 9),
        x: placementX,
        y: placementY,
        scale: 1,
        url: pendingModel.url,
        image: pendingModel.image,
        name: pendingModel.name
      };

      setPlacedModels([...placedModels, newModel]);
      setSelectedModelIndex(placedModels.length);
      setPendingModel(null);
      setIsScanning(false);
      setSurfaceDetected(false);
      return;
    }

    // Simple hit test for selection
    const clickedModelIndex = placedModels.findIndex(m =>
      Math.abs(m.x - x) < 8 && Math.abs(m.y - y) < 12
    );

    if (clickedModelIndex !== -1) {
      setSelectedModelIndex(clickedModelIndex);
    } else {
      setSelectedModelIndex(null);
    }
  };

  const selectModelToPlace = (model: any) => {
    setPendingModel(model);
    setShowModelPicker(false);
    setSelectedModelIndex(null);
    setIsScanning(true);
    setSurfaceDetected(true); // Direct engagement
  };

  const recenterAR = () => {
    setInitialOrientation(null);
    setGyroOffset({ x: 0, y: 0 });
  };

  const updateModelScale = (newScale: number) => {
    if (selectedModelIndex === null) return;
    const updated = [...placedModels];
    updated[selectedModelIndex].scale = newScale;
    setPlacedModels(updated);
  };

  const removeModel = () => {
    if (selectedModelIndex === null) return;
    setPlacedModels(placedModels.filter((_, i) => i !== selectedModelIndex));
    setSelectedModelIndex(null);
  };

  const availableModels = [
    // Add more local .glb models here as they are added to /public/assets
    { name: "Frieren", url: "/assets/frierenmodel.glb", image: "/ModelImage/Frieren.png" },
    { name: "Model 76", url: "/assets/76.glb", image: "/ModelImage/model76.png" },
    { name: "Model 80", url: "/assets/80.glb", image: "/ModelImage/model80.png" },
  ];

  const handleSend = async () => {
    if (!input.trim() || isLoading || !scenario) return;

    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await generateScenarioResponse(messages, scenario.context, userMsg);
      setMessages(prev => [...prev, { role: "model", text: response }]);

      // Auto-play NPC response
      playTextToSpeech(response);

      // Analysis for feedback (standard logic)
      const correction = await getCorrection(userMsg, scenario.language);
      if (correction.corrected !== userMsg && correction.explanation !== "Perfect!") {
        setShowCorrection({
          original: userMsg,
          corrected: correction.corrected,
          explanation: correction.explanation
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
    if (!scenario) return;
    setMode("feedback");
    setIsLoadingFeedback(true);
    setFlashcards(null);
    setSelectedFlashcardOption(null);

    try {
      const feedback = await generateFeedback(messages, scenario.context);
      setFeedbackText(feedback);
    } catch (error) {
      console.error("Error generating feedback:", error);
      setFeedbackText("Great effort! Keep practicing to improve your skills.");
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  const handleGenerateFlashcards = async (option: "grammar" | "vocabulary" | "improvement") => {
    setSelectedFlashcardOption(option);
    setIsLoadingFlashcards(true);
    setIsSaved(false);
    try {
      const cards = await generateFlashcards(messages, option);
      setFlashcards(cards);
    } catch (error) {
      console.error("Error generating flashcards:", error);
      setFlashcards([]);
    } finally {
      setIsLoadingFlashcards(false);
    }
  };

  const handleOpenSaveModal = () => {
    setDecks(getDecks());
    setShowSaveDeckModal(true);
  };

  const handleSaveToDeck = (deckId: string) => {
    if (flashcards && flashcards.length > 0) {
      addCardsToDeck(deckId, flashcards);
      setIsSaved(true);
      setShowSaveDeckModal(false);
    }
  };

  const handleCreateAndSaveDeck = () => {
    if (newDeckName.trim() && flashcards && flashcards.length > 0) {
      const newDeck = addDeck(newDeckName.trim());
      addCardsToDeck(newDeck.id, flashcards);
      setIsSaved(true);
      setShowSaveDeckModal(false);
      setNewDeckName("");
    }
  };

  if (!scenario) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white">
        <p className="text-xl mb-4">Scenario not found</p>
        <Button onClick={() => navigate("/student/scenarios")}>Back to Library</Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">


      {/* Background Layer */}
      <div className="absolute inset-0 z-0 bg-slate-900">
        {mode === "ar" ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Konbini Shelf Overlay */}
            <AnimatePresence mode="wait">
              {scenario.items && mode === "ar" && (
                <motion.div
                  initial={{ opacity: 0, x: -100 }}
                  animate={{
                    opacity: 1,
                    x: isShelfOpen ? 0 : -130, // Narrower offset for narrower mobile shelf
                    transition: { type: "spring", damping: 25, stiffness: 120 }
                  }}
                  className="absolute left-3 top-[12%] z-40 w-32 sm:w-48 pointer-events-auto flex items-start gap-0"
                >
                  <div className="flex-1 bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-l-[2rem] rounded-r-lg p-3 sm:p-4 shadow-2xl flex flex-col">
                    <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      <h3 className="text-white/80 font-black text-[8px] uppercase tracking-[0.2em] italic truncate">Konbini Store</h3>
                    </div>

                    <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1 custom-scrollbar scrollbar-hide">
                      {scenario.items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setBasket(prev => {
                              const existing = prev.find(i => i.id === item.id);
                              if (existing) {
                                return prev.map(i => i.id === item.id ? { ...i, count: i.count + 1 } : i);
                              }
                              return [...prev, { ...item, count: 1 }];
                            });
                          }}
                          className="w-full group text-left space-y-1.5"
                        >
                          <div className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-white/5 group-active:scale-95 transition-transform flex items-center justify-center">
                            {(!item.image || imageErrors[item.id]) ? (
                              <div className="text-cyan-400 opacity-60">
                                {item.icon === "Utensils" && <Utensils size={32} />}
                                {item.icon === "Triangle" && <Triangle size={32} />}
                                {item.icon === "Coffee" && <Coffee size={32} />}
                                {item.icon === "Flame" && <Flame size={32} />}
                                {item.icon === "Bowl" && <Soup size={32} />}
                                {!item.icon && <Box size={32} />}
                              </div>
                            ) : (
                              <img
                                src={item.image}
                                alt={item.name}
                                onError={() => setImageErrors(prev => ({ ...prev, [item.id]: true }))}
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                              />
                            )}
                          </div>
                          <div className="px-0.5">
                            <p className="text-white font-bold text-[8px] leading-tight truncate tracking-tight">{item.name}</p>
                            <p className="text-cyan-400 font-black text-[9px] mt-0.5">¥{item.price}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Integrated Shelf Toggle Handle */}
                  <button
                    onClick={() => setIsShelfOpen(!isShelfOpen)}
                    className="mt-8 -ml-1 h-12 w-6 bg-slate-950/90 backdrop-blur-2xl border-y border-r border-white/10 rounded-r-2xl flex items-center justify-center text-white/40 hover:text-cyan-400 transition-colors shadow-xl group/toggle relative"
                  >
                    {!isShelfOpen && (
                      <div className="absolute inset-0 bg-cyan-400/20 rounded-r-2xl animate-pulse blur-sm" />
                    )}
                    <motion.div
                      animate={{ rotate: isShelfOpen ? 0 : 180 }}
                      className="relative z-10"
                    >
                      <ArrowLeft size={12} className={cn(isShelfOpen ? "text-white/20" : "text-cyan-400")} />
                    </motion.div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Realistic AR Overlays */}
            <div
              ref={arContainerRef}
              onClick={handleARClick}
              className="absolute inset-0 cursor-crosshair overflow-hidden z-10"
            >


              {/* Mini-Map Overlay for Navigation Mode */}
              {scenario.isNavigation && (
                <motion.div
                  className="absolute top-20 left-4 sm:top-24 sm:left-6 z-40"
                >
                  <div className="w-32 h-32 sm:w-48 sm:h-48 bg-slate-900/80 backdrop-blur-2xl rounded-2xl sm:rounded-[2rem] border-2 sm:border-4 border-white/20 shadow-2xl relative overflow-hidden group">
                    {/* Map Background Grid */}
                    <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-20">
                      {[...Array(36)].map((_, i) => <div key={i} className="border-[0.5px] border-cyan-400/30" />)}
                    </div>

                    {/* Streets / Paths - High-Density Urban Noise */}
                    <div className="absolute top-[10%] left-0 w-full h-[1px] bg-white/5" />
                    <div className="absolute top-[30%] left-0 w-full h-[2px] bg-white/10" />
                    <div className="absolute top-[50%] left-0 w-full h-8 bg-slate-800/40 -translate-y-1/2" />
                    <div className="absolute top-[70%] left-0 w-full h-[2px] bg-white/10" />
                    <div className="absolute top-[90%] left-0 w-full h-[1px] bg-white/5" />

                    <div className="absolute left-[10%] top-0 h-full w-[1px] bg-white/5" />
                    <div className="absolute left-[30%] top-0 h-full w-[2px] bg-white/10" />
                    <div className="absolute left-[50%] top-0 h-full w-8 bg-slate-800/40 -translate-x-1/2" />
                    <div className="absolute left-[70%] top-0 h-full w-[2px] bg-white/10" />
                    <div className="absolute left-[90%] top-0 h-full w-[1px] bg-white/5" />

                    {/* Random Alleyways & "Noise" */}
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={`alley-${i}`}
                        style={{
                          left: `${15 + i * 12}%`,
                          top: `${(i % 3) * 30}%`,
                          width: '1px',
                          height: '40%',
                          transform: `rotate(${i * 15}deg)`
                        }}
                        className="absolute bg-white/5"
                      />
                    ))}

                    {/* Diagonal "Scramble" Paths */}
                    <div className="absolute top-1/2 left-1/2 w-[150%] h-6 bg-slate-800/30 -translate-x-1/2 -translate-y-1/2 rotate-[35deg]" />
                    <div className="absolute top-1/2 left-1/2 w-[150%] h-6 bg-slate-800/30 -translate-x-1/2 -translate-y-1/2 -rotate-[35deg]" />

                    {/* SVG Layer for Routes */}
                    <svg
                      viewBox="0 0 100 100"
                      className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
                    >
                      <defs>
                        <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#22d3ee" />
                          <stop offset="100%" stopColor="#818cf8" />
                        </linearGradient>
                        <linearGradient id="decoy-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#94a3b8" />
                          <stop offset="100%" stopColor="#475569" />
                        </linearGradient>
                      </defs>

                      {/* Decoy Paths (Noise) */}
                      <motion.path
                        d={`M ${userPos.x} ${userPos.y} L 20 20 L 80 20`}
                        fill="none"
                        stroke="url(#decoy-gradient)"
                        strokeWidth="1"
                        opacity="0.3"
                        strokeDasharray="2 2"
                      />
                      <motion.path
                        d="M 50 75 L 75 75 L 75 25"
                        fill="none"
                        stroke="url(#decoy-gradient)"
                        strokeWidth="1"
                        opacity="0.2"
                        strokeDasharray="2 2"
                      />
                      <motion.path
                        d="M 20 50 L 20 20 L 60 20"
                        fill="none"
                        stroke="url(#decoy-gradient)"
                        strokeWidth="1"
                        opacity="0.25"
                        strokeDasharray="2 2"
                      />

                      {/* Active Multi-Turn Route Line */}
                      <motion.path
                        d={`
                                        M ${userPos.x} ${userPos.y} 
                                        L ${userPos.x} ${50} 
                                        L ${50} ${50} 
                                        L ${50} ${mapDestination.y}
                                        L ${mapDestination.x} ${mapDestination.y}
                                    `}
                        fill="none"
                        stroke="url(#route-gradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="4 3"
                        initial={{ strokeDashoffset: 100 }}
                        animate={{ strokeDashoffset: 0 }}
                        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                      />
                    </svg>

                    {/* Destination Marker */}
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      style={{ left: `${mapDestination.x}%`, top: `${mapDestination.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                    >
                      <div className="w-6 h-6 bg-red-500 rounded-full blur-md opacity-50" />
                      <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white relative z-10 shadow-lg" />
                    </motion.div>

                    {/* User Pulse */}
                    <div
                      style={{ left: `${userPos.x}%`, top: `${userPos.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                    >
                      <div className="w-8 h-8 bg-cyan-400 rounded-full animate-ping opacity-25" />
                      <div className="w-3 h-3 bg-cyan-400 rounded-full border-2 border-white relative z-10 shadow-lg" />
                    </div>

                    {/* Map Label */}
                    <div className="absolute bottom-3 left-0 w-full text-center">
                      <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Shibuya Area 4-B1</span>
                    </div>
                  </div>

                  {/* Navigation Stats below Map */}
                  <div className="mt-2 sm:mt-4 space-y-1.5 sm:space-y-2">
                    <div className="bg-black/40 backdrop-blur-md px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-white/10 flex items-center gap-2 sm:gap-3">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[8px] sm:text-[10px] font-mono text-white/80 uppercase tracking-widest">Target: Shibuya Crossing</span>
                    </div>
                    <div className="bg-black/40 backdrop-blur-md px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-white/10 flex items-center gap-2 sm:gap-3">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-cyan-400" />
                      <span className="text-[8px] sm:text-[10px] font-mono text-white/80 uppercase tracking-widest">Distance: 150m</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Surface Scanner UI */}
              <AnimatePresence>
                {isScanning && (
                  <>
                    {/* Reticle / Ground Target */}
                    <motion.div
                      initial={{ opacity: 0, scale: 2 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        x: "-50%",
                        y: "-50%"
                      }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      style={{
                        left: `${reticlePos.x}%`,
                        top: `${reticlePos.y}%`,
                        position: 'absolute'
                      }}
                      className="z-40 pointer-events-none"
                    >
                      <div className="relative">
                        {/* Outer Glow */}
                        <div className={cn(
                          "w-32 h-20 rounded-full border-2 transition-all duration-500 blur-sm",
                          surfaceDetected ? "border-cyan-400 bg-cyan-400/10 scale-110" : "border-white/20 scale-100"
                        )} />

                        {/* Target Ring */}
                        <div className={cn(
                          "absolute inset-0 w-32 h-20 rounded-full border-2 border-dashed transition-all duration-300",
                          surfaceDetected ? "border-cyan-400 animate-[spin_8s_linear_infinite]" : "border-white/40"
                        )} />

                        {/* Center Dot / Crosshair */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                          <Plus size={24} className={cn("transition-colors", surfaceDetected ? "text-cyan-400" : "text-white/40")} />
                          {surfaceDetected && <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity }} className="absolute w-4 h-4 bg-cyan-400 rounded-full blur-md opacity-40" />}
                        </div>

                {/* Ghost Model Preview */}
                {surfaceDetected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: -50 }}
                    animate={{ opacity: 0.4, scale: 0.8, y: -80 }}
                    className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                  >
                    {/* @ts-ignore */}
                    <model-viewer
                      src={pendingModel.url}
                      style={{ width: '180px', height: '180px' }}
                      loading="eager"
                      environment-image="neutral"
                      auto-rotate
                      camera-orbit="0deg 75deg 105%"
                    >
                       <div className="absolute inset-x-0 bottom-0 p-4">
                          <div className="bg-cyan-400/20 backdrop-blur-md border border-cyan-400/30 rounded-full px-4 py-1 text-[8px] font-black text-cyan-400 uppercase tracking-widest text-center">
                            Placement HUD Active
                          </div>
                       </div>
                    </model-viewer>
                  </motion.div>
                )}

                        {/* Scanning HUD labels */}
                        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                          <div className="flex items-center gap-3 bg-black/80 backdrop-blur-2xl px-4 py-2 rounded-full border border-white/20 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                            <div className={cn("w-2 h-2 rounded-full", surfaceDetected ? "bg-cyan-400" : "bg-amber-400 animate-pulse")} />
                            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] whitespace-nowrap">
                              {surfaceDetected ? "Stabilized & Ready" : "Relocalizing Environment..."}
                            </span>
                          </div>
                          {surfaceDetected && (
                            <motion.span
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.3em] drop-shadow-lg"
                            >
                              Tap to place at real-world scale
                            </motion.span>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    {/* Floor Mesh Simulation */}
                    <div className="absolute inset-0 pointer-events-none z-30">
                      <div className="absolute bottom-0 left-0 w-full h-[60%] bg-gradient-to-t from-cyan-400/5 to-transparent opacity-30" />
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05]" />
                    </div>
                  </>
                )}
              </AnimatePresence>


              {/* Placed Models */}
              {placedModels.map((model, idx) => (
                <motion.div
                  key={model.id}
                  drag
                  dragMomentum={false}
                  dragElastic={0}
                  onDragStart={(e, info) => {
                    setSelectedModelIndex(idx);
                    if (!arContainerRef.current) return;
                    const rect = arContainerRef.current.getBoundingClientRect();
                    const modelXInPx = (model.x / 100) * rect.width;
                    const modelYInPx = (model.y / 100) * rect.height;
                    setDragOrigin({
                      x: info.point.x - (rect.left + modelXInPx),
                      y: info.point.y - (rect.top + modelYInPx)
                    });
                  }}
                  onDragEnd={(e, info) => {
                    if (!arContainerRef.current) return;
                    const rect = arContainerRef.current.getBoundingClientRect();

                    const adjustedX = info.point.x - dragOrigin.x;
                    const adjustedY = info.point.y - dragOrigin.y;

                    const newX = ((adjustedX - rect.left) / rect.width) * 100;
                    const newY = ((adjustedY - rect.top) / rect.height) * 100;

                    const updated = [...placedModels];
                    updated[idx] = { ...updated[idx], x: newX, y: newY };
                    setPlacedModels(updated);
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: model.scale,
                    opacity: 1,
                    // Apply gyro offset to maintain spatial anchoring
                    x: gyroOffset.x,
                    y: gyroOffset.y
                  }}
                  style={{
                    left: `${model.x}%`,
                    top: `${model.y}%`,
                    position: "absolute",
                    translateX: "-50%",
                    translateY: "-50%"
                  }}
                  className={cn(
                    "z-20 pointer-events-auto cursor-grab active:cursor-grabbing",
                    selectedModelIndex === idx && "ring-4 ring-cyan-400 ring-offset-4 ring-offset-black/20 rounded-2xl"
                  )}
                >
                  <div className="relative group">
                    {/* Visual Grounding / Anchoring - Deep Presence */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 h-12 bg-black/60 blur-3xl rounded-full scale-125 pointer-events-none" />
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-32 h-8 bg-black/80 blur-xl rounded-full pointer-events-none" />
                    <div className={cn(
                      "absolute bottom-4 left-1/2 -translate-x-1/2 w-40 h-10 border-2 rounded-full pointer-events-none transition-all duration-500",
                      selectedModelIndex === idx ? "border-cyan-400/80 opacity-100 scale-100" : "border-white/20 opacity-40 scale-95"
                    )} />

                    {/* Base Glow for Selected State */}
                    {selectedModelIndex === idx && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-40 h-10 bg-cyan-400/20 blur-lg rounded-full animate-pulse pointer-events-none" />
                    )}

                    {/* @ts-ignore */}
                    <model-viewer
                      src={model.url}
                      alt={model.name}
                      ar
                      ar-modes="webxr scene-viewer quick-look"
                      ar-placement="floor"
                      camera-orbit="0deg 75deg 105%"
                      autoplay
                      disable-zoom
                      disable-pan
                      shadow-intensity="2"
                      shadow-softness="1"
                      environment-image="neutral"
                      exposure="1"
                      loading="eager"
                      style={{ width: 'min(320px, 85vw)', height: 'min(320px, 85vw)', pointerEvents: 'none' }}
                    >
                      {/* Shared UI Overlay for WebXR Session Persistence */}
                      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
                         <div className="p-4 flex flex-col gap-2">
                            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 w-fit">
                               <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{scenario.title}</span>
                               <p className="text-[9px] text-white/70 font-bold mt-1 max-w-[150px]">Interacting in stable world scale</p>
                            </div>
                         </div>
                         
                         {/* Bottom Controls Replicated */}
                         <div className="p-4 flex flex-col gap-3">
                            <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl">
                               <p className="text-white text-xs font-bold leading-relaxed">
                                 {messages.length > 0 ? messages[messages.length - 1].text : scenario.initialMessage}
                               </p>
                            </div>
                            <div className="h-10 w-full bg-black/60 border border-white/10 rounded-full px-4 flex items-center justify-between pointer-events-auto">
                               <span className="text-[8px] font-black text-white/40 uppercase tracking-widest italic">Return to chat for full controls</span>
                               <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            </div>
                         </div>
                      </div>
                    </model-viewer>

                    {/* Label */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 whitespace-nowrap shadow-xl pointer-events-none">
                      <span className="text-[10px] font-mono text-white font-black uppercase tracking-widest">{model.name}</span>
                    </div>
                  </div>
                </motion.div>
              ))}





              {/* Grid Overlay */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
            </div>

            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white p-6 text-center z-50">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
                  <h3 className="text-xl font-bold mb-2">Camera Error</h3>
                  <p className="text-slate-300 mb-6 max-w-xs mx-auto">{cameraError}</p>
                  <div className="flex flex-col gap-3">
                    <Button
                      className="bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => {
                        window.location.reload();
                      }}
                    >
                      Retry Connection
                    </Button>
                    <Button variant="ghost" onClick={() => navigate("/student/scenarios")}>
                      Return to Library
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Hybrid AR Guidance and Recenter */}
            {mode === "ar" && !cameraError && (
              <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-4 w-full px-8 pointer-events-none">
                {/* Guidance Toast */}
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="bg-black/80 backdrop-blur-2xl px-4 py-2 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-3 pointer-events-auto"
                >
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-[9px] font-black text-white/80 uppercase tracking-widest whitespace-nowrap">
                    Interactive Overlay Active
                  </span>
                </motion.div>

                {/* Vertical Recenter Action */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    recenterAR();
                  }}
                  className="bg-white/5 border-white/20 backdrop-blur-md rounded-full px-6 h-10 pointer-events-auto hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  <RotateCcw size={14} className="text-cyan-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Recenter Hybrid AR</span>
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full relative">
            <img
              src={scenario.bg}
              alt="Background"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
          </div>
        )}
      </div>

      {/* Header */}
      <div className="relative z-30 p-2 sm:p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-1.5 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 rounded-full w-10 h-10"
            onClick={() => navigate("/student/scenarios")}
          >
            <ArrowLeft size={24} />
          </Button>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 bg-black/40 backdrop-blur-xl px-2 sm:px-4 py-2 rounded-full border border-white/10 shadow-2xl">
              <span className="text-white font-black text-[10px] uppercase tracking-[0.2em]">{scenario.language}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            </div>
            {scenario.items && mode === "ar" && (
              <button
                onClick={() => setShowBasket(!showBasket)}
                className="relative flex items-center gap-2 bg-indigo-600 px-3 py-2 rounded-full border border-white/20 shadow-xl"
              >
                <Box size={16} className="text-white" />
                <span className="text-white font-bold text-[10px]">{basket.reduce((acc, item) => acc + item.count, 0)}</span>
                {showBasket && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl z-50 pointer-events-auto">
                    <h4 className="text-white font-black text-[10px] uppercase tracking-widest mb-3 border-b border-white/10 pb-2">Your Basket</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                      {basket.length === 0 ? (
                        <p className="text-slate-500 text-[10px] italic py-2">Basket is empty</p>
                      ) : (
                        basket.map(item => (
                          <div key={item.id} className="flex items-center justify-between gap-2">
                            <span className="text-white text-[10px] font-bold truncate flex-1">{item.name} x{item.count}</span>
                            <span className="text-cyan-400 text-[10px] font-mono">¥{item.price * item.count}</span>
                          </div>
                        ))
                      )}
                    </div>
                    {basket.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-white/10 flex justify-between items-center">
                        <span className="text-white font-black text-[10px]">TOTAL</span>
                        <span className="text-indigo-400 font-black text-xs">¥{basket.reduce((acc, item) => acc + (item.price * item.count), 0)}</span>
                      </div>
                    )}
                  </div>
                )}
              </button>
            )}
          </div>
        </div>


        <div className="flex items-center gap-2">
          {mode !== "feedback" && (
            <Button
              variant="glass"
              size="sm"
              className="rounded-full h-10 px-3 sm:px-4 bg-indigo-500/20 border-indigo-500/30 text-indigo-400 font-bold text-[10px] sm:text-xs"
              onClick={handleFinishLesson}
            >
              <span className="hidden sm:inline">Finish Lesson</span>
              <span className="sm:hidden">Finish</span>
            </Button>
          )}
          {mode === "ar" && (
            <>
              <Button
                variant="glass"
                size="sm"
                className="rounded-full h-10 w-10 sm:w-auto px-0 sm:px-4 bg-white/10 border-white/20 text-white font-bold text-[10px] sm:text-xs"
                onClick={toggleCamera}
              >
                <RefreshCcw size={16} className={cn("sm:mr-2 transition-transform duration-500", cameraFacingMode === "environment" && "rotate-180")} />
                <span className="hidden sm:inline">Switch Camera</span>
              </Button>
              <Button
                variant="glass"
                size="sm"
                className="rounded-full h-10 px-3 sm:px-4 bg-cyan-500/20 border-cyan-500/30 text-cyan-400 font-bold text-[10px] sm:text-xs"
                onClick={() => setShowModelPicker(true)}
              >
                <Box size={16} className="sm:mr-2" />
                <span className="hidden sm:inline">Place Asset</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Model Picker Modal */}
      <AnimatePresence>
        {showModelPicker && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModelPicker(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-slate-900 border border-white/10 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl font-black text-white italic tracking-tight">Select AR Asset</h2>
                <button onClick={() => setShowModelPicker(false)} className="text-white/40 hover:text-white p-2">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 overflow-y-auto pr-2">
                {availableModels.map((model) => (
                  <button
                    key={model.name}
                    onClick={() => selectModelToPlace(model)}
                    className="group flex flex-col items-center gap-2 md:gap-3 p-3 md:p-4 rounded-2xl md:rounded-3xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/50 transition-all"
                  >
                    <div className="w-full aspect-square rounded-xl md:rounded-2xl overflow-hidden bg-slate-800">
                      <img src={model.image} alt={model.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-[10px] md:text-xs font-bold text-white uppercase tracking-widest truncate w-full">{model.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Save Deck Modal */}
      <AnimatePresence>
        {showSaveDeckModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSaveDeckModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-slate-900 border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-6 shrink-0">
                <h2 className="text-xl font-black text-white italic tracking-tight">Save to Deck</h2>
                <button onClick={() => setShowSaveDeckModal(false)} className="text-white/40 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-6">
                {decks.map(deck => (
                  <button
                    key={deck.id}
                    onClick={() => handleSaveToDeck(deck.id)}
                    className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <h3 className="text-white font-bold">{deck.name}</h3>
                      <p className="text-xs text-slate-400">{deck.cards.length} cards</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:text-indigo-400 text-white/40 transition-colors">
                      <Check size={16} />
                    </div>
                  </button>
                ))}
                {decks.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">No decks available. Create one below.</p>
                )}
              </div>

              <div className="shrink-0 pt-4 border-t border-white/10">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Or Create New Deck</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                    placeholder="Deck Name..."
                    className="flex-1 h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-indigo-500/50"
                  />
                  <Button
                    onClick={handleCreateAndSaveDeck}
                    disabled={!newDeckName.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 h-12 shrink-0"
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
        <div className="flex-1 relative z-20 flex flex-col items-center justify-start pt-10 px-4 w-full h-full overflow-y-auto pb-20">
          <div className="w-full max-w-3xl bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-3xl font-black text-white italic tracking-tight mb-6 text-center">Lesson Complete!</h2>

            <div className="bg-white/5 rounded-3xl p-6 border border-white/10 mb-8">
              <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Sparkles size={16} />
                Your Feedback
              </h3>
              {isLoadingFeedback ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="animate-spin text-indigo-500 mb-4" size={32} />
                  <p className="text-slate-400 font-bold text-sm">Analyzing your conversation...</p>
                </div>
              ) : (
                <div className="text-white/90 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                  {feedbackText}
                </div>
              )}
            </div>

            {!isLoadingFeedback && (
              <div className="space-y-6">
                <h3 className="text-sm font-black text-white uppercase tracking-widest text-center">Generate Flashcards</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Button
                    onClick={() => handleGenerateFlashcards("grammar")}
                    disabled={isLoadingFlashcards}
                    className={cn(
                      "h-14 rounded-2xl font-bold transition-all",
                      selectedFlashcardOption === "grammar" ? "bg-indigo-600 text-white" : "bg-white/10 text-white hover:bg-white/20"
                    )}
                  >
                    Grammar
                  </Button>
                  <Button
                    onClick={() => handleGenerateFlashcards("vocabulary")}
                    disabled={isLoadingFlashcards}
                    className={cn(
                      "h-14 rounded-2xl font-bold transition-all",
                      selectedFlashcardOption === "vocabulary" ? "bg-indigo-600 text-white" : "bg-white/10 text-white hover:bg-white/20"
                    )}
                  >
                    Vocabulary
                  </Button>
                  <Button
                    onClick={() => handleGenerateFlashcards("improvement")}
                    disabled={isLoadingFlashcards}
                    className={cn(
                      "h-14 rounded-2xl font-bold transition-all",
                      selectedFlashcardOption === "improvement" ? "bg-indigo-600 text-white" : "bg-white/10 text-white hover:bg-white/20"
                    )}
                  >
                    Sentence Improvement
                  </Button>
                </div>

                {isLoadingFlashcards && (
                  <div className="flex flex-col items-center justify-center py-10">
                    <Loader2 className="animate-spin text-indigo-500 mb-4" size={32} />
                    <p className="text-slate-400 font-bold text-sm">Generating flashcards...</p>
                  </div>
                )}

                {flashcards && flashcards.length > 0 && (
                  <div className="mt-8 space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Your Flashcards</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {flashcards.map((card, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                          <p className="text-sm font-bold text-white mb-2 pb-2 border-b border-white/10">{card.front}</p>
                          <p className="text-sm text-indigo-300 font-medium mb-2">{card.back}</p>
                          {card.explanation && <p className="text-xs text-slate-400 italic">{card.explanation}</p>}
                        </div>
                      ))}
                    </div>
                    <div className="pt-6 flex flex-col sm:flex-row justify-center gap-4">
                      <Button
                        onClick={handleOpenSaveModal}
                        disabled={isSaved}
                        className={cn(
                          "rounded-full px-8 h-12 font-bold tracking-widest uppercase text-xs transition-colors",
                          isSaved ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-white/10 hover:bg-white/20 text-white"
                        )}
                      >
                        {isSaved ? "Saved to Deck!" : "Save to Deck"}
                      </Button>
                      <Button onClick={() => navigate("/student/scenarios")} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 h-12 font-bold tracking-widest uppercase text-xs">
                        Finish & Return to Library
                      </Button>
                    </div>
                  </div>
                )}

                {flashcards && flashcards.length === 0 && !isLoadingFlashcards && (
                  <div className="text-center py-6 text-slate-400 text-sm">
                    No flashcards could be generated. Try another option.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 relative z-20 flex flex-col justify-end pb-0 px-0 w-full h-full pointer-events-none">

          {/* Character Avatar (2D Mode Only) - Centered Visual Novel Style */}
          <AnimatePresence>
            {mode === "2d" && (
              <motion.div
                key="2d-avatar"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="absolute bottom-0 md:bottom-[5%] left-1/2 -translate-x-1/2 h-[70vh] md:h-[95vh] w-auto z-0 flex items-end justify-center"
              >
                <img
                  src={scenario.avatar}
                  alt="Character"
                  className="h-full w-auto object-contain drop-shadow-2xl"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Visual Novel Dialogue Box */}
          <div className="relative z-20 p-4 md:p-8 w-full max-w-5xl mx-auto mb-2 pointer-events-auto">
            {/* Last Message Display */}
            <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl min-h-[140px] relative overflow-hidden">
              {/* Speaker Name Tag */}
              <div className="absolute top-0 left-0 bg-indigo-600 text-white px-6 py-1.5 rounded-br-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg">
                {messages.length > 0 && messages[messages.length - 1].role === "model" ? scenario.title.split(' ')[0] : "You"}
              </div>

              {/* Message Text */}
              <div className="text-white text-base md:text-lg font-bold leading-relaxed mt-6">
                {messages.length > 0 ? messages[messages.length - 1].text : scenario.initialMessage}
              </div>

              {/* Audio Control */}
              {messages.length > 0 && messages[messages.length - 1].role === "model" && (
                <button
                  className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
                  onClick={() => playTextToSpeech(messages[messages.length - 1].text)}
                >
                  <Volume2 size={18} />
                </button>
              )}
            </div>

            {/* Input Controls */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 relative group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={isListening ? "Listening..." : "Type your response..."}
                  className={cn(
                    "w-full h-14 bg-black/60 border border-white/10 rounded-[2rem] px-6 pr-14 text-white font-bold text-sm placeholder:text-white/30 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 backdrop-blur-2xl shadow-2xl transition-all",
                    isListening && "ring-4 ring-red-500/20 bg-red-500/10 border-red-500/30"
                  )}
                />
                <Button
                  size="icon"
                  className={cn(
                    "absolute right-2 top-2 h-10 w-10 rounded-full transition-all",
                    input.trim() ? "bg-indigo-600 hover:bg-indigo-700 scale-100" : "bg-white/10 text-white/20 scale-90 pointer-events-none"
                  )}
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                >
                  <Send size={18} />
                </Button>
              </div>

              <Button
                size="icon"
                className={cn(
                  "rounded-full h-14 w-14 shrink-0 shadow-2xl transition-all relative overflow-hidden border-4 border-white/10",
                  isListening
                    ? "bg-red-600 scale-110 ring-4 ring-red-500/30"
                    : "bg-gradient-to-br from-slate-800 to-black hover:from-slate-700 hover:to-slate-900"
                )}
                onPointerDown={(e) => {
                  e.preventDefault();
                  startListening();
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  stopListening();
                }}
                onPointerLeave={(e) => {
                  e.preventDefault();
                  if (isListening) stopListening();
                }}
                onContextMenu={(e) => e.preventDefault()}
              >
                {isListening ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    <div className="w-4 h-4 bg-white rounded-sm" />
                  </motion.div>
                ) : (
                  <Mic size={24} className="text-white" />
                )}
              </Button>
            </div>
          </div>

          {/* Correction Overlay */}
          <AnimatePresence>
            {showCorrection && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-64 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-red-500/90 backdrop-blur-md text-white p-4 rounded-xl shadow-xl border border-red-400/50 z-50"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white/20 rounded-full">
                    <Info size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase opacity-80 mb-1">Correction</p>
                    <p className="text-sm line-through opacity-70 mb-1">{showCorrection.original}</p>
                    <p className="text-sm font-bold text-white mb-2">{showCorrection.corrected}</p>
                    <p className="text-xs opacity-90 italic">"{showCorrection.explanation}"</p>
                  </div>
                  <button onClick={() => setShowCorrection(null)} className="ml-auto text-white/60 hover:text-white">
                    <ArrowLeft size={16} className="rotate-180" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>



        </div>
      )}

      {/* Input Area - Hidden as it is now integrated into the Visual Novel layout above */}
      <div className="bg-white/10 backdrop-blur-xl border-t border-white/10 p-4 pb-8 z-20 hidden">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Button
            size="icon"
            variant="glass"
            className="rounded-full h-12 w-12 shrink-0 bg-red-500/80 hover:bg-red-600/80 border-none text-white"
          >
            <Mic />
          </Button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type your response..."
              className="w-full h-12 bg-black/20 border border-white/10 rounded-full px-6 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 backdrop-blur-sm"
            />
            <Button
              size="icon"
              className="absolute right-1 top-1 h-10 w-10 rounded-full bg-indigo-600 hover:bg-indigo-700 border-none"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <Send size={18} />
            </Button>
          </div>
          <Button size="icon" variant="glass" className="rounded-full h-12 w-12 shrink-0">
            <Sparkles size={20} className="text-yellow-400" />
          </Button>
        </div>
      </div>

      {/* AR Model Controls (Mobile Bottom Dock / Desktop Side Panel) */}
      <AnimatePresence>
        {selectedModelIndex !== null && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:right-8 md:-translate-y-1/2 md:left-auto md:w-80 bg-slate-950/95 backdrop-blur-2xl px-6 py-8 md:p-8 rounded-t-[2.5rem] md:rounded-[2.5rem] border-t md:border border-white/10 z-[60] w-full shadow-[0_-20px_50px_rgba(0,0,0,0.5)] md:shadow-2xl pointer-events-auto transition-all"
          >
            {/* Grab Handle for Mobile */}
            <div className="md:hidden w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6 -mt-2" />

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Maximize size={20} />
                </div>
                <div>
                  <h4 className="text-white font-black uppercase tracking-widest text-[10px] sm:text-xs">Asset Controls</h4>
                  <p className="text-[10px] text-slate-500 font-bold">{placedModels[selectedModelIndex].name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedModelIndex(null)}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Scale Size</label>
                  <span className="text-lg font-mono font-black text-cyan-400 tracking-tight">{Math.round(placedModels[selectedModelIndex].scale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3"
                  step="0.1"
                  value={placedModels[selectedModelIndex].scale}
                  onChange={(e) => updateModelScale(parseFloat(e.target.value))}
                  className="modern-slider w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  variant="destructive"
                  className="flex-1 rounded-[1.25rem] h-14 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-900/20 transition-transform active:scale-95"
                  onClick={removeModel}
                >
                  Remove Asset
                </Button>
                <Button
                  className="bg-white/5 hover:bg-white/10 text-white rounded-[1.25rem] h-14 px-6 md:hidden"
                  onClick={() => setSelectedModelIndex(null)}
                >
                  <Check size={20} />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Reset the global guard when navigating away or unmounting if necessary
// But for now, we want it to persist across dev remounts.
