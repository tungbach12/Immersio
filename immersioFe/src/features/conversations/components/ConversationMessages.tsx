import { Volume2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { useConversation } from "../hooks/useConversation";

type Props = Pick<
  ReturnType<typeof useConversation>,
  | "messages"
  | "messagesEndRef"
  | "playTextToSpeech"
  | "targetLang"
  | "currentEmotion"
  | "isLoading"
  | "scenario"
>;

export function ConversationMessages({
  messages,
  messagesEndRef,
  playTextToSpeech,
  targetLang,
  currentEmotion,
  isLoading,
  scenario,
}: Props) {
  return (
    <section
      className="conversation-messages-panel"
      aria-labelledby="conversation-messages-title"
    >
      <header>
        <span className="workspace-eyebrow" id="conversation-messages-title">
          Your conversation
        </span>
        <span className="conversation-live-state">
          {isLoading ? "Thinking…" : "At your pace"}
        </span>
      </header>
      <div className="conversation-message-scroll">
        <ol aria-label="Conversation messages">
          {messages.map((message, index) => (
            <li
              key={index}
              className={cn(
                "conversation-message",
                message.role === "user" && "from-learner",
              )}
            >
              <div>
                <span>
                  {message.role === "user"
                    ? "You"
                    : scenario?.title || "Your conversation partner"}
                </span>
                <p>{message.text}</p>
                {message.correction && (
                  <aside>
                    <strong>A useful expression</strong>
                    <p>“{message.correction.corrected}”</p>
                    <small>{message.correction.explanation}</small>
                  </aside>
                )}
              </div>
              {message.role !== "user" && (
                <button
                  type="button"
                  aria-label="Listen to this response"
                  onClick={() =>
                    playTextToSpeech(
                      message.text,
                      targetLang,
                      undefined,
                      currentEmotion,
                    )
                  }
                >
                  <Volume2 size={16} />
                </button>
              )}
            </li>
          ))}
        </ol>
        {isLoading && (
          <p className="conversation-thinking" role="status">
            <Loader2 size={16} className="animate-spin" />
            Your partner is replying…
          </p>
        )}
        <div ref={messagesEndRef} />
      </div>
    </section>
  );
}
