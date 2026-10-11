import type { Flashcard } from "@/services/decks";

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

/** Cards can contain plain text or one of the generated lesson card payloads. */
export function getCardSummary(card: Flashcard) {
  const summary = {
    front: card.front,
    back: card.back,
    explanation: card.explanation || "",
  };
  try {
    if (!card.front.trim().startsWith("{")) return summary;
    const payload = JSON.parse(card.front);
    const content = payload?.content;
    if (!content || typeof content !== "object") return summary;
    if (payload.type === "vocab")
      return {
        front: [text(content.word), text(content.phonetic)]
          .filter(Boolean)
          .join(" "),
        back: text(content.meaning, card.back),
        explanation: text(content.definition_en, summary.explanation),
      };
    if (payload.type === "grammar")
      return {
        front: text(content.title, "Grammar point"),
        back: text(content.examples?.[0]?.sentence, card.back),
        explanation: text(content.usage, summary.explanation),
      };
    if (payload.type === "sentence")
      return {
        front: text(content.cloze_sentence).replace(
          /\{\{?c\d+::(.*?)\}\}?/g,
          "[ … ]",
        ),
        back: text(content.full_sentence, card.back),
        explanation: text(content.translation, summary.explanation),
      };
  } catch {
    /* A plain text card may begin with a brace. */
  }
  return summary;
}
