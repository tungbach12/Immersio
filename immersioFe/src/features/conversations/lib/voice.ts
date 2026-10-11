const EMOTION_STYLE_MAP: Record<string, { style: string; degree: number }> = {
  happy: { style: "cheerful", degree: 1.2 },
  excited: { style: "excited", degree: 1.3 },
  angry: { style: "angry", degree: 1.2 },
  sad: { style: "sad", degree: 1.0 },
  fearful: { style: "fearful", degree: 1.0 },
  surprised: { style: "excited", degree: 1.0 },
  disgusted: { style: "disgruntled", degree: 1.0 },
  neutral: { style: "chat", degree: 1.0 },
  idle: { style: "chat", degree: 1.0 },
};

// Styles supported per voice locale prefix — Azure rejects unsupported styles silently or with error
const VOICE_STYLE_SUPPORT: Record<string, Set<string>> = {
  "en-US": new Set([
    "chat",
    "cheerful",
    "excited",
    "angry",
    "sad",
    "fearful",
    "disgruntled",
    "shouting",
    "whispering",
    "terrified",
    "unfriendly",
    "hopeful",
  ]),
  "zh-CN": new Set([
    "chat",
    "cheerful",
    "excited",
    "angry",
    "sad",
    "fearful",
    "disgruntled",
    "serious",
    "gentle",
    "affectionate",
    "embarrassed",
    "depressed",
    "lyrical",
  ]),
  "ja-JP": new Set(["chat", "cheerful", "customerservice"]),
  "fr-FR": new Set(["chat"]),
  "ko-KR": new Set(["chat", "cheerful"]),
  "de-DE": new Set(["chat", "cheerful", "unfriendly"]),
  "es-ES": new Set(["chat", "cheerful", "angry", "sad"]),
};

export const getStyleForVoice = (
  voice: string,
  emotion: string,
): { style: string; degree: number } | null => {
  const prefix = voice.length >= 5 ? voice.substring(0, 5) : "en-US";
  const supported = VOICE_STYLE_SUPPORT[prefix] ?? new Set<string>();
  const desired =
    EMOTION_STYLE_MAP[emotion.toLowerCase()] ?? EMOTION_STYLE_MAP["idle"];
  if (supported.has(desired.style)) return desired;
  if (supported.has("chat")) return { style: "chat", degree: 1.0 };
  return null; // voice doesn't support any style — send plain text
};

export const getBrowserLangCode = (lang?: string) => {
  if (!lang) return "en-US";
  const lower = lang.toLowerCase();
  if (lower.includes("japanese") || lower === "ja") return "ja-JP";
  if (lower.includes("chinese") || lower === "zh") return "zh-CN";
  if (lower.includes("french") || lower === "fr") return "fr-FR";
  return "en-US";
};
