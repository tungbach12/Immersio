export interface GeneratedCardContent {
  word?: string;
  meaning?: string;
  part_of_speech?: string;
  phonetic?: string;
  definition_en?: string;
  synonyms?: string[];
  antonyms?: string[];
  title?: string;
  usage?: string;
  signal_words?: string[];
  formula?: { form: string; structure: string }[];
  common_mistakes?: string;
  examples?: { sentence: string; translation?: string; note?: string }[];
  cloze_sentence?: string;
  full_sentence?: string;
  target_phrase?: string;
  phrase_meaning?: string;
  translation?: string;
  context_note?: string;
}

export function parseGeneratedCard(front: string) {
  try {
    if (!front.trim().startsWith("{")) return null;
    const payload = JSON.parse(front);
    if (
      !["vocab", "grammar", "sentence"].includes(payload?.type) ||
      !payload.content ||
      typeof payload.content !== "object"
    )
      return null;
    const content = payload.content;
    const scalarFields = [
      "word",
      "meaning",
      "part_of_speech",
      "phonetic",
      "definition_en",
      "title",
      "usage",
      "common_mistakes",
      "cloze_sentence",
      "full_sentence",
      "target_phrase",
      "phrase_meaning",
      "translation",
      "context_note",
    ];
    if (
      scalarFields.some(
        (key) => content[key] != null && typeof content[key] !== "string",
      )
    )
      return null;
    if (
      ["synonyms", "antonyms", "signal_words"].some(
        (key) =>
          content[key] != null &&
          (!Array.isArray(content[key]) ||
            !content[key].every((value: unknown) => typeof value === "string")),
      )
    )
      return null;
    if (
      content.examples != null &&
      (!Array.isArray(content.examples) ||
        !content.examples.every(
          (example: Record<string, unknown>) =>
            example &&
            typeof example.sentence === "string" &&
            (example.translation == null ||
              typeof example.translation === "string") &&
            (example.note == null || typeof example.note === "string"),
        ))
    )
      return null;
    if (
      content.formula != null &&
      (!Array.isArray(content.formula) ||
        !content.formula.every(
          (formula: Record<string, unknown>) =>
            formula &&
            typeof formula.form === "string" &&
            typeof formula.structure === "string",
        ))
    )
      return null;
    return {
      type: payload.type as "vocab" | "grammar" | "sentence",
      content: content as GeneratedCardContent,
    };
  } catch {
    return null;
  }
}
