import { Check } from "lucide-react";
import { FlashcardTag } from "@/components/learning/FlashcardTag";
import { getCardSummary } from "@/features/flashcards/lib/cardSummary";
import type { Flashcard } from "@/services/decks";

export function ReviewCard({
  card,
  selected,
  onToggle,
}: {
  card: Flashcard;
  selected: boolean;
  onToggle: () => void;
}) {
  const summary = getCardSummary(card);
  return (
    <button
      type="button"
      className={`conversation-review-card ${selected ? "is-selected" : ""}`}
      aria-pressed={selected}
      onClick={onToggle}
    >
      <span>
        <FlashcardTag tag={card.tag} />
        <span className="conversation-card-check" aria-hidden="true">
          {selected && <Check size={13} />}
        </span>
      </span>
      <strong>{summary.front}</strong>
      <p>{summary.back}</p>
      {summary.explanation && <small>{summary.explanation}</small>}
    </button>
  );
}
