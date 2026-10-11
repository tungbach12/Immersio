import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { scenarioService, Scenario } from "@/services/scenario";
import { type Flashcard } from "@/services/decks";
import { API_BASE, authService } from "@/services/auth";
import { getVoiceIdForLanguageAndGender } from "@/data/azureVoices";
import type { ChatMessage } from "../types";
import { getStyleForVoice, getBrowserLangCode } from "../lib/voice";
import {
  speechRecognitionConstructor,
  type BrowserSpeechRecognition,
} from "../lib/browserSpeech";

export function useConversation() {
  const { id } = useParams();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(window.location.search);
  const targetLang = queryParams.get("lang") || undefined;

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingScenario, setLoadingScenario] = useState(true);
  const [currentEmotion, setCurrentEmotion] = useState<string>("idle");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"2d" | "feedback">("2d");
  const [isLoading, setIsLoading] = useState(false);
  const sendInFlightRef = useRef(false);
  const [conversationError, setConversationError] = useState("");
  const [showCorrection, setShowCorrection] = useState<{
    original: string;
    corrected: string;
    explanation: string;
  } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const speechRequest = useRef(0);
  const wasSpokenRef = useRef(false);
  const isMountedRef = useRef(true);
  const isVoiceModeActiveRef = useRef(false);

  const [autoSend, setAutoSend] = useState(true);
  const autoSendRef = useRef(true);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSendRef = useRef<(() => Promise<void>) | null>(null);
  const startListeningRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    autoSendRef.current = autoSend;
  }, [autoSend]);

  // Feedback & Flashcards state
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState(false);
  const [selectedFlashcardOptions, setSelectedFlashcardOptions] = useState<
    string[]
  >(["grammar", "vocabulary", "improvement"]);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  // Deck states
  const [showSaveDeckModal, setShowSaveDeckModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load scenario details and start learning session
  useEffect(() => {
    if (!id) return;

    let active = true;

    scenarioService
      .getScenarioById(id)
      .then(async (data) => {
        if (!active) return;
        setScenario(data);
        setCurrentEmotion(data.defaultEmotion || "idle");
        setLoadingScenario(false);
        try {
          const res = await scenarioService.startSession(data.id, targetLang);
          if (!active) return;
          setSessionId(res.sessionId);
          const startMsg = res.initialMessage || data.initialMessage;
          setMessages([{ role: "model", text: startMsg }]);
          playTextToSpeech(startMsg, targetLang, data.voiceId ?? undefined);
        } catch (err: any) {
          console.error("Failed to start session on backend:", err);
          if (active)
            setConversationError(
              err.message ||
                "Your conversation could not be started. Please open it again.",
            );
        }
      })
      .catch((err) => {
        console.error(err);
        if (active) setLoadingScenario(false);
      });

    return () => {
      active = false;
      ++speechRequest.current;
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      // Instantly stop any running audio playbacks when unmounted/remounted
      if (currentAudioRef.current) {
        try {
          currentAudioRef.current.pause();
        } catch (e) {
          // ignore
        }
      }
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
    };
  }, [id, targetLang]);

  // Auto-scroll to bottom of messages inside visual novel dialogue
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const playTextToSpeech = async (
    text: string,
    langOverride?: string,
    voiceOverride?: string,
    emotion?: string,
  ) => {
    if (!isMountedRef.current) return;
    const requestId = ++speechRequest.current;
    window.speechSynthesis?.cancel();

    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
      } catch (e) {
        // ignore
      }
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    try {
      // When targetLang differs from scenario.language, the NPC text was translated
      // by the backend — voice must match targetLang, not the scenario's native voiceId
      const npcLang = langOverride ?? scenario?.language;
      const isPracticingNativeLanguage =
        !targetLang || targetLang === scenario?.language;
      const selectedVoice =
        voiceOverride ||
        (isPracticingNativeLanguage ? scenario?.voiceId : undefined) ||
        getVoiceIdForLanguageAndGender(npcLang, scenario?.gender);

      const styleConfig = getStyleForVoice(selectedVoice, emotion ?? "idle");

      const response = await authService.fetchWithAuth(
        `${API_BASE}/api/practice/tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            voice: selectedVoice,
            style: styleConfig?.style ?? null,
            styleDegree: styleConfig?.degree ?? 1.0,
          }),
        },
      );

      if (!isMountedRef.current || requestId !== speechRequest.current) return;

      if (!response.ok) {
        throw new Error("TTS request failed");
      }

      const audioBlob = await response.blob();

      if (!isMountedRef.current || requestId !== speechRequest.current) return;

      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        if (audioUrlRef.current === audioUrl) audioUrlRef.current = null;
        if (isVoiceModeActiveRef.current && isMountedRef.current) {
          startListeningRef.current?.();
        }
      };
      currentAudioRef.current = audio;
      await audio.play();
    } catch (e: any) {
      if (!isMountedRef.current || requestId !== speechRequest.current) return;
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      if (
        e.name === "NotAllowedError" ||
        (e.message && e.message.includes("user didn't interact"))
      ) {
        console.warn(
          "TTS Autoplay blocked by browser. User interaction is required before audio can play.",
        );
        return;
      }
      console.error(
        "Azure TTS Playback failed, falling back to browser SpeechSynthesis:",
        e,
      );
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const activeLang = langOverride || targetLang || scenario?.language;
        utterance.lang = getBrowserLangCode(activeLang);
        utterance.onend = () => {
          if (isVoiceModeActiveRef.current && isMountedRef.current) {
            startListeningRef.current?.();
          }
        };
        window.speechSynthesis.speak(utterance);
      } catch (synthErr) {
        console.error("SpeechSynthesis fallback failed:", synthErr);
      }
    }
  };

  // Mounting & Speech Recognition Cleanup Hook
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);
  const startListening = async () => {
    const SpeechRecognition = speechRecognitionConstructor();
    if (!SpeechRecognition) {
      setConversationError(
        "Speech recognition is unavailable in this browser. You can still type your response.",
      );
      return;
    }

    if (isListening) return;

    // Enable voice mode since the user explicitly started voice interaction
    isVoiceModeActiveRef.current = true;

    // Set listening state immediately
    setIsListening(true);
    setInput("");

    // Request microphone access using standard getUserMedia to warm up hardware and guarantee permissions, matching Practice.tsx
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop()); // release stream immediately so SpeechRecognition can bind it
    } catch (err) {
      console.error(
        "[Speech] Microphone warm-up or permission request failed:",
        err,
      );
      setConversationError(
        "Allow microphone access in your browser to speak. You can also type your response.",
      );
      setIsListening(false);
      isVoiceModeActiveRef.current = false;
      return;
    }

    if (!isMountedRef.current || !isVoiceModeActiveRef.current) return;
    // Forcefully stop any running native instance first to clean up resources
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.interimResults = true;
    recognition.continuous = true; // Keep listening continuously, do not cut off when user pauses
    recognition.maxAlternatives = 1;

    const activeLang = targetLang || scenario?.language;
    recognition.lang = getBrowserLangCode(activeLang);

    recognition.onstart = () => {
      if (isMountedRef.current) {
        setIsListening(true);
      }
    };

    recognition.onresult = (event) => {
      if (!isMountedRef.current) return;
      let interimTranscript = "";
      let finalTranscript = "";

      // Loop from 0 to accumulate all continuous speech results in the current session
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const text = finalTranscript || interimTranscript;
      if (text) {
        setInput(text);
        wasSpokenRef.current = true;

        if (autoSendRef.current) {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
          silenceTimerRef.current = setTimeout(() => {
            handleSendRef.current?.();
          }, 1800);
        }
      }
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error event:", event.error);
      if (event.error === "no-speech") {
        // Do not immediately kill listening on 'no-speech' in continuous mode, let it stay active
        return;
      }

      // Stop voice mode for critical errors to prevent infinite loops (especially on network or blocked permission)
      if (
        [
          "not-allowed",
          "service-not-allowed",
          "network",
          "audio-capture",
        ].includes(event.error)
      ) {
        isVoiceModeActiveRef.current = false;
        if (event.error === "not-allowed" || event.error === "audio-capture") {
          setConversationError(
            "Allow microphone access in your browser to speak. You can also type your response.",
          );
        } else if (event.error === "network") {
          setConversationError(
            "Speech recognition lost its connection. Try the microphone again or type your response.",
          );
        }
      }

      if (isMountedRef.current) {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (isMountedRef.current) {
        setIsListening(false);
        // Self-healing: if voice mode is still active, automatically reboot the recognition engine
        if (isVoiceModeActiveRef.current) {
          console.log(
            "[Speech] Natural end or error event triggered, auto-restarting speech engine...",
          );
          setTimeout(() => {
            if (isVoiceModeActiveRef.current && isMountedRef.current) {
              tryStart();
            }
          }, 300); // Small delay to avoid hardware contention
        }
      }
    };

    // Retry loop to ensure microphone hardware release from previous sessions
    let retryCount = 0;
    const tryStart = () => {
      if (!isMountedRef.current || !isVoiceModeActiveRef.current) {
        setIsListening(false);
        return;
      }
      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.warn(
          `[Speech] Start attempt ${retryCount} failed, retrying...`,
          e,
        );
        if (retryCount < 6) {
          retryCount++;
          setTimeout(tryStart, 150);
        } else {
          console.error(
            "Speech recognition failed to start after maximum retries.",
          );
          if (isMountedRef.current) {
            setIsListening(false);
          }
        }
      }
    };
    tryStart();
  };

  const stopListening = (isManualMute = false) => {
    if (isManualMute) {
      isVoiceModeActiveRef.current = false;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Stop error:", e);
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };
  const handleSend = async () => {
    if (
      !input.trim() ||
      isLoading ||
      sendInFlightRef.current ||
      !scenario ||
      !sessionId
    )
      return;
    sendInFlightRef.current = true;
    setConversationError("");

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (isListening) {
      stopListening(false);
    }

    const userMsg = input;
    setInput("");
    const isSpoken = wasSpokenRef.current;
    wasSpokenRef.current = false;
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await scenarioService.sendMessage(sessionId, userMsg);

      if (response.emotion) {
        setCurrentEmotion(response.emotion.toLowerCase());
      }

      // Update the user message item in history with its correction ONLY IF it was spoken!
      if (response.correction && isSpoken) {
        setMessages((prev) =>
          prev.map((msg, idx) =>
            idx === prev.length - 1 && msg.role === "user"
              ? { ...msg, correction: response.correction }
              : msg,
          ),
        );
      }

      setMessages((prev) => [...prev, { role: "model", text: response.reply }]);

      // Auto-play NPC response with current emotion
      playTextToSpeech(
        response.reply,
        targetLang,
        undefined,
        response.emotion?.toLowerCase(),
      );

      // Analysis for feedback (standard logic) - ONLY IF it was spoken!
      if (response.correction && isSpoken) {
        setShowCorrection({
          original: userMsg,
          corrected: response.correction.corrected,
          explanation: response.correction.explanation,
        });
        setTimeout(() => setShowCorrection(null), 8000);
      }
    } catch (error) {
      console.error(error);
      setConversationError("Your message was not sent. Please try again.");
      setMessages((previous) => previous.slice(0, -1));
      setInput(userMsg);
    } finally {
      sendInFlightRef.current = false;
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  const handleFinishLesson = async () => {
    if (!scenario || !sessionId || isLoading || sendInFlightRef.current) return;
    setConversationError("");
    setMode("feedback");
    setIsLoadingFeedback(true);
    setFlashcards(null);
    setSelectedCardIds([]);
    setIsSaved(false);
    setSelectedFlashcardOptions(["grammar", "vocabulary", "improvement"]);

    try {
      const response = await scenarioService.finishSession(sessionId);
      setFeedbackText(response.feedback);

      // Directly load the flashcards already generated on session completion (avoid duplicate AI calls!)
      if (response.suggestedFlashcards) {
        const mapped = response.suggestedFlashcards.map((c, i) => ({
          id: `temp-${i}`,
          front: c.front,
          back: c.back,
          explanation: c.explanation || "",
          tag: c.tag || "vocab",
        }));
        setFlashcards(mapped);
        setSelectedCardIds(mapped.map((item) => item.id));
      }
    } catch (error) {
      console.error("Error generating feedback:", error);
      setFeedbackText(null);
      setConversationError(
        "Your lesson feedback could not be loaded. Please try again.",
      );
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  const toggleFlashcardOption = (option: string) => {
    setSelectedFlashcardOptions((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option],
    );
  };

  const handleGenerateCustomCards = async () => {
    if (!sessionId) return;
    if (selectedFlashcardOptions.length === 0) {
      setConversationError(
        "Choose at least one card category to create a collection.",
      );
      return;
    }
    setConversationError("");
    setIsLoadingFlashcards(true);
    setFlashcards(null);
    setIsSaved(false);

    try {
      const customCards = await scenarioService.generateCustomFlashcards(
        sessionId,
        selectedFlashcardOptions,
      );
      const mapped = customCards.map((c, i) => ({
        id: `temp-${i}`,
        front: c.front,
        back: c.back,
        explanation: c.explanation || "",
        tag: c.tag || "vocab",
      }));
      setFlashcards(mapped);
      setSelectedCardIds(mapped.map((item) => item.id));
    } catch (error) {
      console.error("Error generating dynamic flashcards:", error);
      setConversationError(
        "Your cards could not be created. Please try again.",
      );
    } finally {
      setIsLoadingFlashcards(false);
    }
  };

  const handleOpenSaveModal = () => setShowSaveDeckModal(true);

  return {
    scenario,
    loadingScenario,
    currentEmotion,
    messages,
    messagesEndRef,
    playTextToSpeech,
    targetLang,
    input,
    setInput,
    silenceTimerRef,
    isListening,
    handleSend,
    isLoading,
    autoSend,
    setAutoSend,
    stopListening,
    startListening,
    showCorrection,
    setShowCorrection,
    mode,
    handleFinishLesson,
    showSaveDeckModal,
    setShowSaveDeckModal,
    feedbackText,
    isLoadingFeedback,
    flashcards,
    isLoadingFlashcards,
    selectedFlashcardOptions,
    selectedCardIds,
    setSelectedCardIds,
    toggleFlashcardOption,
    handleGenerateCustomCards,
    handleOpenSaveModal,
    isSaved,
    setIsSaved,
    conversationError,
    sessionReady: Boolean(sessionId),
    navigate,
  };
}
