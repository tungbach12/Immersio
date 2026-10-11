import { Mic, Square, Loader2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

interface RecordingPanelProps {
  recording: boolean;
  assessing: boolean;
  disabled: boolean;
  transcript: string;
  onToggle: () => void;
}

export function RecordingPanel({
  recording,
  assessing,
  disabled,
  transcript,
  onToggle,
}: RecordingPanelProps) {
  const reducedMotion = useReducedMotion();
  return (
    <section
      className="learning-paper speaking-recorder"
      aria-labelledby="recording-title"
    >
      <p className="workspace-eyebrow">A moment to speak</p>
      <h2 id="recording-title">Your voice belongs here.</h2>
      <p>
        Listen to the phrase, then record it at your own pace. Press stop when
        you’re finished.
      </p>
      <div className="speaking-recording-status" role="status">
        {recording ? (
          <div className="speaking-wave" aria-label="Microphone recording">
            {[0, 1, 2, 3, 4, 5, 6].map((index) => (
              <motion.span
                key={index}
                animate={{ height: reducedMotion ? 18 : [8, 26, 8] }}
                transition={{
                  duration: 0.6 + index * 0.08,
                  repeat: reducedMotion ? 0 : Infinity,
                }}
              />
            ))}
          </div>
        ) : assessing ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Listening to your pronunciation…
          </>
        ) : transcript ? (
          <p className="speaking-transcript">“{transcript}”</p>
        ) : (
          <span>Ready whenever you are.</span>
        )}
      </div>
      <button
        type="button"
        className={`speaking-record-button ${recording ? "is-recording" : ""}`}
        onClick={onToggle}
        disabled={disabled || assessing}
        aria-label={
          recording ? "Stop recording and get feedback" : "Start recording"
        }
      >
        {recording ? (
          <Square size={22} fill="currentColor" />
        ) : (
          <Mic size={23} />
        )}
        <span>{recording ? "Stop & get feedback" : "Start recording"}</span>
      </button>
      <small>
        {recording
          ? "Microphone is on"
          : "Your browser will ask for microphone access."}
      </small>
    </section>
  );
}
