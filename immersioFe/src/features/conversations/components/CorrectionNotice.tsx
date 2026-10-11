import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { useConversation } from "../hooks/useConversation";

type Props = Pick<
  ReturnType<typeof useConversation>,
  "showCorrection" | "setShowCorrection"
>;

export function CorrectionNotice({ showCorrection, setShowCorrection }: Props) {
  return (
    <AnimatePresence>
      {showCorrection && (
        <motion.aside
          className="conversation-correction"
          role="status"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Dismiss expression suggestion"
            onClick={() => setShowCorrection(null)}
          >
            <X size={17} />
          </button>
          <p className="workspace-eyebrow">A little more natural</p>
          <p className="conversation-original">{showCorrection.original}</p>
          <strong>{showCorrection.corrected}</strong>
          <p>{showCorrection.explanation}</p>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
