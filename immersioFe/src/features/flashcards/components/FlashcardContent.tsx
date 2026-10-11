import type { Flashcard } from "@/services/decks";
import { getCardSummary } from "../lib/cardSummary";
import { parseGeneratedCard } from "../lib/cardPayload";
import { VocabularyFront, VocabularyBack } from "./VocabularyCard";
import { GrammarFront, GrammarBack } from "./GrammarCard";
import { SentenceFront, SentenceBack } from "./SentenceCard";

export function getFlashcardContent(card: Flashcard | undefined) {
  const summary = card
    ? getCardSummary(card)
    : { front: "", back: "", explanation: "" };
  const payload = card ? parseGeneratedCard(card.front) : null;
  const content = payload?.content;
  return {
    displayFront: summary.front,
    displayBack: summary.back,
    displayExplanation: summary.explanation,
    cardFrontContent: !content ? null : payload.type === "vocab" ? (
      <VocabularyFront content={content} />
    ) : payload.type === "grammar" ? (
      <GrammarFront content={content} />
    ) : (
      <SentenceFront content={content} />
    ),
    cardBackContent: !content ? null : payload.type === "vocab" ? (
      <VocabularyBack content={content} />
    ) : payload.type === "grammar" ? (
      <GrammarBack content={content} />
    ) : (
      <SentenceBack content={content} />
    ),
  };
}
