import { motion, useReducedMotion } from "motion/react";
import { ConversationMessages } from "./ConversationMessages";
import { ConversationComposer } from "./ConversationComposer";
import { CorrectionNotice } from "./CorrectionNotice";
import type { useConversation } from "../hooks/useConversation";

type Props = Pick<
  ReturnType<typeof useConversation>,
  | "scenario"
  | "currentEmotion"
  | "messages"
  | "messagesEndRef"
  | "playTextToSpeech"
  | "targetLang"
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
  | "showCorrection"
  | "setShowCorrection"
  | "sessionReady"
>;

export function ConversationStage(props: Props) {
  const reducedMotion = useReducedMotion();
  const avatar =
    props.scenario?.emotions?.[props.currentEmotion] || props.scenario?.avatar;
  return (
    <div className="conversation-stage">
      {!avatar && (
        <div className="conversation-context">
          <p className="workspace-eyebrow">
            A little practice for a real moment
          </p>
          <h2>{props.scenario?.title}</h2>
          <p>{props.scenario?.description}</p>
          <small>Take your time. A few words are enough to begin.</small>
        </div>
      )}
      {avatar && (
        <div className="conversation-character" aria-hidden="true">
          <motion.img
            src={avatar}
            alt=""
            animate={reducedMotion ? undefined : { y: [0, -7, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      )}
      <div className="conversation-dialogue">
        <ConversationMessages {...props} />
        <ConversationComposer {...props} />
      </div>
      <CorrectionNotice
        showCorrection={props.showCorrection}
        setShowCorrection={props.setShowCorrection}
      />
    </div>
  );
}
