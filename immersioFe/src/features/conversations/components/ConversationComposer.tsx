import { Mic, Send, Square } from "lucide-react";
import type { useConversation } from "../hooks/useConversation";

type Props = Pick<
  ReturnType<typeof useConversation>,
  | "input"
  | "setInput"
  | "silenceTimerRef"
  | "isListening"
  | "handleSend"
  | "isLoading"
  | "autoSend"
  | "setAutoSend"
  | "stopListening"
  | "startListening"
  | "sessionReady"
>;

export function ConversationComposer({
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
  sessionReady,
}: Props) {
  return (
    <div className="conversation-composer">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleSend();
        }}
      >
        <label className="sr-only" htmlFor="conversation-response">
          Your response
        </label>
        <input
          id="conversation-response"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing && event.key === "Enter")
              event.preventDefault();
          }}
          disabled={!sessionReady || isLoading}
          placeholder={
            !sessionReady
              ? "Opening your conversation…"
              : isListening
                ? "Listening to your words…"
                : "Write a response, or speak…"
          }
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading || !sessionReady}
          aria-label="Send response"
        >
          <Send size={18} />
        </button>
      </form>
      <div className="conversation-voice-controls">
        <button
          type="button"
          className={isListening ? "is-listening" : ""}
          aria-label={isListening ? "Stop microphone" : "Start microphone"}
          aria-pressed={isListening}
          disabled={!sessionReady || isLoading}
          onClick={() => {
            if (isListening) stopListening(true);
            else void startListening();
          }}
        >
          {isListening ? (
            <Square size={16} fill="currentColor" />
          ) : (
            <Mic size={18} />
          )}
          <span>{isListening ? "Listening" : "Speak"}</span>
        </button>
        <button
          type="button"
          className="conversation-auto-send"
          aria-pressed={autoSend}
          onClick={() => setAutoSend((previous) => !previous)}
        >
          <span className={autoSend ? "is-on" : ""} aria-hidden="true" />
          Send after speaking: {autoSend ? "on" : "off"}
        </button>
      </div>
    </div>
  );
}
