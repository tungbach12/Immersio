import { useCallback, useEffect } from "react";
import { speakText } from "@/lib/speech";
import type { Deck, Flashcard } from "@/services/decks";

function pronunciationText(front = "") {
  try {
    if (front.trim().startsWith("{")) {
      const { type, content } = JSON.parse(front);
      if (type === "vocab") return String(content.word || "");
      if (type === "grammar")
        return String(content.examples?.[0]?.sentence || content.title || "");
      if (type === "sentence")
        return String(content.cloze_sentence || "").replace(
          /\{\{?c\d+::(.*?)\}\}?/g,
          "$1",
        );
    }
  } catch {
    /* Keep the original front when a card contains plain text. */
  }
  return front.split("\n")[0].trim();
}

function cardLanguage(text: string, deckName = "") {
  const name = deckName.toLowerCase();
  if (name.includes("japanese") || name.includes("nhật")) return "Japanese";
  if (name.includes("chinese") || name.includes("trung")) return "Chinese";
  if (name.includes("french") || name.includes("pháp")) return "French";
  if (/[\u3040-\u30ff]/.test(text)) return "Japanese";
  if (/[\u4e00-\u9fff]/.test(text)) return "Chinese";
  return "English";
}

export function useFlashcardSpeech(
  card: Flashcard | undefined,
  deck: Deck | null,
) {
  const text = pronunciationText(card?.front),
    language = cardLanguage(text, deck?.name);
  const play = useCallback(() => speakText(text, language), [text, language]);
  useEffect(() => {
    const timer = setTimeout(play, 150);
    return () => {
      clearTimeout(timer);
      window.speechSynthesis?.cancel();
    };
  }, [card?.id, play]);
  return play;
}
