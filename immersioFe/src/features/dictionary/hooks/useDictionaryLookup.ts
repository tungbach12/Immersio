import { useEffect, useRef, useState, type FormEvent } from "react";
import { practiceService, type DictionaryEntryDto } from "@/services/practice";
import { speakText } from "@/lib/speech";

export function useDictionaryLookup() {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [entry, setEntry] = useState<DictionaryEntryDto | null>(null);
  const [error, setError] = useState("");
  const [saveOpen, setSaveOpen] = useState(false);
  const [savedCollection, setSavedCollection] = useState("");
  const request = useRef(0);
  useEffect(
    () => () => {
      ++request.current;
      window.speechSynthesis?.cancel();
    },
    [],
  );

  async function search(event?: FormEvent) {
    event?.preventDefault();
    if (!query.trim()) return;
    const requestId = ++request.current;
    setLoading(true);
    setEntry(null);
    setError("");
    setSavedCollection("");
    try {
      const result = await practiceService.lookupWord(query.trim(), language);
      if (requestId === request.current) setEntry(result);
    } catch {
      if (requestId === request.current)
        setError(
          "This word could not be looked up. Check your connection and try again.",
        );
    } finally {
      if (requestId === request.current) setLoading(false);
    }
  }

  return {
    query,
    setQuery,
    language,
    setLanguage: (value: string) => {
      setLanguage(value);
      setEntry(null);
      setSavedCollection("");
      setError("");
    },
    loading,
    entry,
    error,
    search,
    saveOpen,
    setSaveOpen,
    savedCollection,
    setSavedCollection,
    listen: () => {
      if (entry) speakText(entry.word, language);
    },
    cards: entry
      ? [
          {
            front: `${entry.word}\n${entry.phonetic}`,
            back: entry.translation,
            explanation: `${entry.partOfSpeech} • Definition: ${entry.definition}\n\nExample: '${entry.example}'\nTranslation: '${entry.exampleTranslation}'`,
          },
        ]
      : [],
  };
}
