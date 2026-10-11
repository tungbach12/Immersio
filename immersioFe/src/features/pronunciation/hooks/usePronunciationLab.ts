import { useCallback, useEffect, useRef, useState } from "react";
import { practiceService, type WordAssessmentDto } from "@/services/practice";
import { recordingToWav } from "@/lib/audio";
import { speakText } from "@/lib/speech";

export interface PronunciationFeedback {
  score: number;
  message: string;
  words?: WordAssessmentDto[];
}

export function usePronunciationLab() {
  const [language, setLanguage] = useState("English");
  const [level, setLevel] = useState("Intermediate");
  const [topic, setTopic] = useState("General");
  const [phrase, setPhrase] = useState("");
  const [translation, setTranslation] = useState("");
  const [explanation, setExplanation] = useState("");
  const [generating, setGenerating] = useState(true);
  const [recording, setRecording] = useState(false);
  const [starting, setStarting] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState<PronunciationFeedback | null>(null);
  const [error, setError] = useState("");
  const mounted = useRef(true);
  const request = useRef(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const microphonePending = useRef(false);
  const stream = useRef<MediaStream | null>(null);

  const generate = useCallback(async () => {
    const requestId = ++request.current;
    setGenerating(true);
    setError("");
    setTranscript("");
    setFeedback(null);
    setPhrase("");
    setTranslation("");
    setExplanation("");
    try {
      const result = await practiceService.generatePhrase(
        language,
        level,
        topic,
      );
      if (mounted.current && requestId === request.current) {
        setPhrase(result.phrase);
        setTranslation(result.translation);
        setExplanation(result.explanation);
      }
    } catch {
      if (mounted.current && requestId === request.current)
        setError(
          "Your practice phrase could not be created. Try again in a moment.",
        );
    } finally {
      if (mounted.current && requestId === request.current)
        setGenerating(false);
    }
  }, [language, level, topic]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      ++request.current;
      if (recorder.current) {
        recorder.current.onstop = null;
        if (recorder.current.state !== "inactive") recorder.current.stop();
      }
      stream.current?.getTracks().forEach((track) => track.stop());
      window.speechSynthesis?.cancel();
    };
  }, []);
  useEffect(() => {
    void generate();
    return () => {
      ++request.current;
    };
  }, [generate]);

  async function assess(blob: Blob, referencePhrase: string) {
    setAssessing(true);
    try {
      const wav = await recordingToWav(blob);
      const result = await practiceService.assessPronunciation(
        wav,
        referencePhrase,
      );
      if (mounted.current) {
        setTranscript(result.transcript);
        setFeedback(result);
      }
    } catch {
      if (mounted.current)
        setError(
          "Your recording could not be assessed. Record this phrase again to retry.",
        );
    } finally {
      if (mounted.current) setAssessing(false);
    }
  }

  async function toggleRecording() {
    if (recording) {
      setAssessing(true);
      recorder.current?.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
      setRecording(false);
      return;
    }
    if (!phrase || generating || assessing || microphonePending.current) return;
    microphonePending.current = true;
    setStarting(true);
    setError("");
    setTranscript("");
    setFeedback(null);
    try {
      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      )
        throw new Error("unsupported");
      window.speechSynthesis?.cancel();
      const source = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) {
        source.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = source;
      const microphone = new MediaRecorder(source),
        chunks: Blob[] = [];
      recorder.current = microphone;
      microphone.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      microphone.onstop = () => {
        if (mounted.current)
          void assess(
            new Blob(chunks, { type: microphone.mimeType || "audio/webm" }),
            phrase,
          );
      };
      microphone.onerror = () => {
        source.getTracks().forEach((track) => track.stop());
        if (mounted.current) {
          setRecording(false);
          setError("Recording stopped unexpectedly. Please try again.");
        }
      };
      microphone.start();
      setRecording(true);
    } catch {
      setError("Allow microphone access in your browser to practise speaking.");
    } finally {
      microphonePending.current = false;
      if (mounted.current) setStarting(false);
    }
  }

  return {
    language,
    level,
    topic,
    setLanguage,
    setLevel,
    setTopic,
    phrase,
    translation,
    explanation,
    generating,
    recording,
    starting,
    assessing,
    transcript,
    feedback,
    error,
    generate,
    toggleRecording,
    listen: () => speakText(phrase, language),
  };
}
