import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Mic, ChevronLeft, Volume2, Square, SkipBack, SkipForward, RefreshCw, Sparkles, Brain, Award, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { practiceService, WordAssessmentDto } from "@/services/practice";

export default function VocalLab() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState<{ score: number; message: string; words?: WordAssessmentDto[] } | null>(null);
  const [isLogging, setIsLogging] = useState(false);

  // AI Phrase Generation States
  const [selectedLang, setSelectedLang] = useState("English");
  const [selectedLevel, setSelectedLevel] = useState("Intermediate");
  const [selectedTopic, setSelectedTopic] = useState("General");
  const [phrase, setPhrase] = useState("");
  const [translation, setTranslation] = useState("");
  const [explanation, setExplanation] = useState("");
  const [isGenerating, setIsGenerating] = useState(true);
  const [isAiGenerated, setIsAiGenerated] = useState(true);

  const handleAiGenerate = async () => {
    setTranscript("");
    setFeedback(null);
    setIsGenerating(true);
    try {
      const data = await practiceService.generatePhrase(selectedLang, selectedLevel, selectedTopic);
      setPhrase(data.phrase);
      setTranslation(data.translation);
      setExplanation(data.explanation);
      setIsAiGenerated(true);
    } catch (err: any) {
      console.error("AI Generation failed:", err);
      if (err?.message !== "No active session") {
        alert("Không thể tạo câu luyện nói bằng AI. Vui lòng thử lại.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Automatically trigger AI phrase generation when VocalLab mounts
  useEffect(() => {
    void handleAiGenerate();
  }, []);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || "audio/webm" });
        await processAndAssessAudio(audioBlob);
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

  const processAndAssessAudio = async (audioBlob: Blob) => {
    try {
      setIsLogging(true);
      setTranscript("Processing audio...");

      // 1. Convert Blob to ArrayBuffer
      const arrayBuffer = await audioBlob.arrayBuffer();

      // 2. Decode Audio Data to AudioBuffer
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const tempCtx = new AudioContextClass();
      
      let decodedBuffer;
      try {
        decodedBuffer = await tempCtx.decodeAudioData(arrayBuffer);
      } catch (decodeErr) {
        console.error("Failed to decode audio data:", decodeErr);
        throw new Error("Không thể giải mã dữ liệu âm thanh ghi được.");
      } finally {
        await tempCtx.close();
      }

      // 3. Downsample to 16000 Hz Mono using OfflineAudioContext
      const targetSampleRate = 16000;
      const offlineCtx = new OfflineAudioContext(
        1, // mono channel
        Math.round(decodedBuffer.duration * targetSampleRate), // length
        targetSampleRate // sample rate
      );

      // Create a buffer source
      const source = offlineCtx.createBufferSource();
      source.buffer = decodedBuffer;
      source.connect(offlineCtx.destination);
      source.start();

      // Render downsampled audio
      const renderedBuffer = await offlineCtx.startRendering();

      // 4. Convert downsampled AudioBuffer to 16kHz Mono WAV Blob
      const channelData = renderedBuffer.getChannelData(0);
      const wavBlob = bufferToWav(channelData, renderedBuffer.sampleRate);

      // 5. Send to C# WebApi Backend
      setTranscript("Analyzing pronunciation...");
      console.log(`[VocalLab] Sending WAV Blob to backend (size: ${wavBlob.size} bytes)...`);
      
      const result = await practiceService.assessPronunciation(wavBlob, phrase);
      console.log("[VocalLab] Pronunciation result received:", result);

      setTranscript(result.transcript);
      setFeedback({ score: result.score, message: result.message, words: result.words });
    } catch (err) {
      console.error("Pronunciation assessment failed:", err);
      setTranscript("Failed to analyze audio.");
      
      // Extract descriptive message for display
      const errMsg = err instanceof Error ? err.message : String(err);
      setFeedback({ 
        score: 0, 
        message: `Lỗi: ${errMsg}. Vui lòng thử lại.` 
      });
    } finally {
      setIsLogging(false);
    }
  };

  const playTTS = () => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = selectedLang === "Japanese" ? 'ja-JP' :
                   selectedLang === "Chinese" ? 'zh-CN' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const handleBack = () => {
    navigate("/student/dashboard");
  };

  return (
    <div className="w-full flex flex-col relative overflow-hidden">
      {/* Visual background glows */}
      <div className="absolute top-[10%] left-[10%] w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="h-20 max-w-xl mx-auto w-full flex items-center px-6 shrink-0 justify-between relative z-10">
        <button onClick={handleBack} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-200 dark:text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-300 border border-white/5 shadow-lg active:scale-95">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h2 className="font-display font-black text-white text-2xl tracking-tight italic uppercase">
            Vocal <span className="text-emerald-450">Lab</span>
          </h2>
          <p className="text-[10px] font-black text-slate-300 dark:text-slate-400 uppercase tracking-[0.3em] leading-none mt-1.5 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-emerald-400" /> Accent Training
          </p>
        </div>
        <div className="w-12" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col max-w-xl mx-auto w-full gap-4.5 relative z-10 custom-scrollbar scrollbar-hide">
        
        {/* Merged AI Composer & Phrase Card */}
        <div className="glass-card bg-slate-900/50 backdrop-blur-xl rounded-[2rem] p-5 border border-white/10 shadow-2xl flex flex-col gap-4 relative overflow-hidden group shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-500/10 transition-colors duration-500 pointer-events-none" />

          {/* Top row: selectors and compact generate button */}
          <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="bg-slate-950/80 border border-white/10 rounded-xl px-2.5 py-1.5 text-[10px] font-black text-white focus:outline-none focus:border-indigo-500 cursor-pointer shadow-inner hover:bg-slate-900"
                disabled={isGenerating || isRecording}
              >
                <option value="English">English 🇺🇸</option>
                <option value="Japanese">Japanese 🇯🇵</option>
                <option value="Chinese">Chinese 🇨🇳</option>
              </select>

              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="bg-slate-950/80 border border-white/10 rounded-xl px-2.5 py-1.5 text-[10px] font-black text-white focus:outline-none focus:border-indigo-500 cursor-pointer shadow-inner hover:bg-slate-900"
                disabled={isGenerating || isRecording}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>

              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="bg-slate-950/80 border border-white/10 rounded-xl px-2.5 py-1.5 text-[10px] font-black text-white focus:outline-none focus:border-indigo-500 cursor-pointer shadow-inner hover:bg-slate-900"
                disabled={isGenerating || isRecording}
              >
                <option value="General">General</option>
                <option value="Travel">Travel</option>
                <option value="Daily Life">Daily Life</option>
                <option value="Business">Business</option>
                <option value="Academic">Academic</option>
                <option value="Shopping">Shopping</option>
              </select>
            </div>

            <Button
              onClick={handleAiGenerate}
              disabled={isGenerating || isRecording}
              className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-wider text-[9px] px-3.5 border-none flex items-center gap-1 active:scale-[0.98] transition-all shrink-0"
            >
              {isGenerating ? <RefreshCw className="w-3 h-3 animate-spin text-white" /> : <Sparkles className="w-3 h-3 text-indigo-300" />}
              <span>{isGenerating ? "Composing..." : "AI Generate"}</span>
            </Button>
          </div>

          {/* Middle & Bottom row: phrase text, translation, explanation, speaker icon */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {isGenerating ? (
                <div className="flex flex-col gap-2 animate-pulse py-1">
                  <div className="h-7 w-11/12 bg-white/10 rounded-lg" />
                  <div className="h-4 w-2/3 bg-white/10 rounded-lg" />
                </div>
              ) : (
                <>
                  <h3 className="text-xl md:text-2xl font-black text-white leading-snug tracking-tight italic select-text pr-2">
                    "{phrase}"
                  </h3>
                  
                  {translation && (
                    <p className="text-xs font-black text-slate-200 dark:text-slate-300 italic mt-2 select-text flex items-center gap-1.5">
                      <span className="text-indigo-600 bg-indigo-50/80 border border-indigo-200/60 dark:text-indigo-300 dark:bg-indigo-950/40 dark:border-indigo-900/30 font-black not-italic text-[8px] uppercase tracking-widest px-2 py-0.5 rounded shrink-0">Mean</span>
                      <span className="truncate">"{translation}"</span>
                    </p>
                  )}

                  {explanation && (
                    <div className="text-[10px] text-indigo-900 bg-indigo-50/80 border border-indigo-200/60 dark:text-indigo-200 dark:bg-indigo-950/25 dark:border-indigo-500/15 px-3.5 py-2.5 rounded-xl border leading-normal mt-3 shadow-inner max-h-[60px] overflow-y-auto custom-scrollbar scrollbar-hide">
                      💡 {explanation}
                    </div>
                  )}
                </>
              )}
            </div>

            <Button
              size="icon"
              onClick={playTTS}
              disabled={isGenerating || isRecording}
              className="w-10 h-10 shrink-0 bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center justify-center text-white shadow-md transition-all duration-300 active:scale-90 border-none mt-1"
            >
              <Volume2 className="w-4.5 h-4.5" />
            </Button>
          </div>
        </div>

        {/* Live Transcript & Feedback */}
        <div className="flex-1 bg-slate-900/30 rounded-[2rem] p-5 relative flex flex-col border border-dashed border-white/10 shadow-inner min-h-[180px]">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-2 shrink-0">Live Transcript</span>
          
          {/* Animated recording waves */}
          {isRecording && (
            <div className="flex gap-1.5 justify-center items-center h-8 my-2 shrink-0">
              {[...Array(7)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [6, 24, 6] }}
                  transition={{ duration: 0.5 + i * 0.08, repeat: Infinity, ease: "easeInOut" }}
                  className="w-1 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-full"
                />
              ))}
            </div>
          )}

          <div className="flex-1 flex flex-col justify-center min-h-[90px] py-2">
            {transcript ? (
              <p className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight italic text-center text-glow-emerald">
                {transcript}
              </p>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Mic className="w-8 h-8 text-slate-600 animate-bounce" />
                <p className="text-xs text-slate-500 font-bold italic text-center max-w-xs leading-relaxed">
                  {isRecording ? "Analyzing audio waves..." : "Engage the mic and start speaking..."}
                </p>
              </div>
            )}
          </div>

          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                className="mt-4"
              >
                {/* Fluency Score Container */}
                <div
                  className={cn(
                    "p-4 rounded-2xl border shadow-2xl flex items-center justify-between gap-4 relative overflow-hidden",
                    feedback.score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5' :
                      feedback.score >= 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/5' :
                        'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/5'
                  )}
                >
                  <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-15 pointer-events-none bg-current" />
                  
                  <div className="relative z-10 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Award className="w-3.5 h-3.5" />
                      <span className="font-black text-[8px] uppercase tracking-[0.25em] opacity-80">Fluency Report</span>
                    </div>
                    <p className="text-xs font-black uppercase tracking-wider leading-tight">{feedback.message}</p>
                    {isLogging && (
                      <p className="text-[8px] font-black opacity-60 mt-1 uppercase tracking-widest animate-pulse flex items-center gap-1">
                        ✦ Synchronizing performance...
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right flex-shrink-0 relative z-10">
                    <span className="text-4xl font-black italic tracking-tighter block leading-none">{feedback.score}%</span>
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-60 mt-0.5 block">Rating</span>
                  </div>
                </div>

                {/* ELSA Speak Word-by-Word Highlight & Phoneme Tooltips */}
                {feedback.words && feedback.words.length > 0 && (
                  <div className="mt-4 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-5 w-full relative z-20 overflow-visible shadow-2xl">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.25em] mb-3 block border-b border-white/5 pb-1.5">
                      Detailed Phonetic Analysis (Tap words)
                    </span>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-5 justify-center items-center py-2">
                      {feedback.words.map((w, wIdx) => {
                        const isOmitted = w.errorType === "Omission";
                        const isGreen = w.accuracyScore >= 80 && !isOmitted;
                        const isYellow = w.accuracyScore >= 50 && w.accuracyScore < 80 && !isOmitted;
                        
                        return (
                          <div key={wIdx} className="group relative flex flex-col items-center">
                            {/* Word button */}
                            <button
                              className={cn(
                                "text-2xl font-black tracking-tight italic transition-all duration-300 hover:scale-115 focus:outline-none",
                                isOmitted ? "text-slate-600 hover:text-slate-500 opacity-40 line-through decoration-slate-700" :
                                isGreen ? "text-emerald-400 hover:text-emerald-300" :
                                isYellow ? "text-amber-400 hover:text-amber-300" :
                                "text-rose-500 hover:text-rose-455"
                              )}
                            >
                              {w.word}
                            </button>

                            {/* Small score label */}
                            <span className="text-[9px] font-bold text-slate-500 mt-0.5">
                              {isOmitted ? "—" : `${w.accuracyScore}%`}
                            </span>

                            {/* Phoneme IPA Dropdown Tooltip */}
                            {w.phonemes && w.phonemes.length > 0 && (
                              <div className="absolute bottom-full mb-3 hidden group-hover:flex flex-col items-center bg-slate-900 border border-white/10 rounded-2xl p-4 shadow-3xl z-30 min-w-[130px] transition-all duration-350">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 pb-1 border-b border-white/5">IPA Phonemes</span>
                                <div className="flex gap-1.5 justify-center items-center">
                                  {w.phonemes.map((p, pIdx) => {
                                    const pGreen = p.accuracyScore >= 80 && !isOmitted;
                                    const pYellow = p.accuracyScore >= 50 && p.accuracyScore < 80 && !isOmitted;
                                    
                                    return (
                                      <div key={pIdx} className="flex flex-col items-center">
                                        <span className={cn(
                                          "text-base font-black font-mono",
                                          isOmitted ? "text-slate-600 opacity-40" :
                                          pGreen ? "text-emerald-400" :
                                          pYellow ? "text-amber-400" :
                                          "text-rose-500"
                                        )}>
                                          /{p.phoneme}/
                                        </span>
                                        <span className="text-[8px] font-bold text-slate-500 mt-0.5">
                                          {isOmitted ? "—" : `${p.accuracyScore}%`}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="absolute top-full w-3 h-3 bg-slate-900 border-r border-b border-white/10 rotate-45 -mt-1.5" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Recording action bar */}
      <div className="p-4 bg-slate-950/60 backdrop-blur-xl border-t border-white/10 shrink-0 flex items-center justify-between max-w-xl mx-auto w-full rounded-b-[2rem] shadow-2xl relative z-10">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-200 dark:text-slate-300 hover:text-white transition-all duration-300 border border-white/5 active:scale-90 disabled:opacity-40 disabled:pointer-events-none"
          onClick={handleAiGenerate}
          disabled={isRecording || isGenerating}
        >
          <SkipBack className="w-6 h-6" />
        </motion.button>

        <div className="relative group">
          <div className={cn(
            "absolute -inset-3 rounded-full blur-2xl transition-all duration-1000",
            isRecording ? "bg-rose-500/25 opacity-100 animate-pulse" : "opacity-0"
          )} />
          <button
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center shadow-3xl active:scale-95 transition-all duration-500 relative z-10 border border-white/10",
              isRecording
                ? 'bg-gradient-to-br from-rose-600 to-pink-650 text-white shadow-rose-500/30'
                : 'bg-gradient-to-br from-indigo-600 to-violet-650 text-white hover:from-indigo-500 hover:to-violet-600 shadow-indigo-500/30'
            )}
            onClick={toggleRecording}
            disabled={isGenerating}
          >
            {isRecording ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-8 h-8" />}
          </button>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-200 dark:text-slate-300 hover:text-white transition-all duration-300 border border-white/5 active:scale-90 disabled:opacity-40 disabled:pointer-events-none"
          onClick={handleAiGenerate}
          disabled={isRecording || isGenerating}
        >
          <SkipForward className="w-6 h-6" />
        </motion.button>
      </div>
    </div>
  );
}

function bufferToWav(buffer: Float32Array, sampleRate: number): Blob {
  const bufferLength = buffer.length;
  const wavBuffer = new ArrayBuffer(44 + bufferLength * 2);
  const view = new DataView(wavBuffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + bufferLength * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw PCM) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 2, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, bufferLength * 2, true);

  // Write PCM audio samples
  let offset = 44;
  for (let i = 0; i < bufferLength; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, buffer[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
