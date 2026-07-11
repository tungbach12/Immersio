export type VoiceStyle =
  | "chat" | "cheerful" | "excited" | "angry" | "sad" | "fearful"
  | "disgruntled" | "shouting" | "whispering" | "terrified" | "unfriendly"
  | "hopeful" | "serious" | "gentle" | "affectionate" | "embarrassed"
  | "depressed" | "lyrical" | "newscast" | "customerservice";

export interface AzureVoice {
  id: string;              // Azure voice name used in SSML
  locale: string;          // BCP-47 locale prefix e.g. "en-US"
  language: string;        // Human-readable language name
  name: string;            // Display name
  gender: "Female" | "Male";
  description: string;     // Personality / use-case description
  styles: VoiceStyle[];    // Supported SSML express-as styles
  recommended?: boolean;   // Recommended pick for Immersio scenarios
}

export const AZURE_VOICES: AzureVoice[] = [
  // ─── English (US) ────────────────────────────────────────────────────────
  {
    id: "en-US-JennyNeural",
    locale: "en-US",
    language: "English",
    name: "Jenny",
    gender: "Female",
    description: "Friendly and conversational. Great for casual NPC dialogue and customer service scenarios.",
    styles: ["chat", "cheerful", "excited", "angry", "sad", "fearful", "disgruntled", "shouting", "whispering", "terrified", "unfriendly", "hopeful"],
    recommended: true,
  },
  {
    id: "en-US-AriaNeural",
    locale: "en-US",
    language: "English",
    name: "Aria",
    gender: "Female",
    description: "Warm and expressive with a wide range of styles. Ideal for storytelling scenarios.",
    styles: ["chat", "cheerful", "excited", "angry", "sad", "fearful", "disgruntled", "shouting", "whispering", "terrified", "unfriendly", "hopeful"],
  },
  {
    id: "en-US-GuyNeural",
    locale: "en-US",
    language: "English",
    name: "Guy",
    gender: "Male",
    description: "Clear and authoritative male voice. Good for professional or formal NPC roles.",
    styles: ["chat", "cheerful", "excited", "angry", "sad", "fearful", "disgruntled", "shouting", "whispering", "terrified", "unfriendly", "hopeful"],
  },
  {
    id: "en-US-DavisNeural",
    locale: "en-US",
    language: "English",
    name: "Davis",
    gender: "Male",
    description: "Calm and composed. Suits shopkeepers, guides, and neutral NPC characters.",
    styles: ["chat", "cheerful", "excited", "angry", "sad", "fearful", "disgruntled", "shouting", "whispering", "terrified", "unfriendly", "hopeful"],
  },
  {
    id: "en-US-JaneNeural",
    locale: "en-US",
    language: "English",
    name: "Jane",
    gender: "Female",
    description: "Gentle and warm tone. Works well for friendly or nurturing character roles.",
    styles: ["chat", "cheerful", "excited", "angry", "sad", "fearful"],
  },
  {
    id: "en-US-TonyNeural",
    locale: "en-US",
    language: "English",
    name: "Tony",
    gender: "Male",
    description: "Energetic and youthful. Good for enthusiastic or playful NPC personalities.",
    styles: ["chat", "cheerful", "excited", "angry", "sad"],
  },

  // ─── English (UK) ────────────────────────────────────────────────────────
  {
    id: "en-GB-SoniaNeural",
    locale: "en-GB",
    language: "English (UK)",
    name: "Sonia",
    gender: "Female",
    description: "British accent, natural and polished. Great for formal or educated NPC characters.",
    styles: ["chat", "cheerful", "sad"],
    recommended: true,
  },
  {
    id: "en-GB-RyanNeural",
    locale: "en-GB",
    language: "English (UK)",
    name: "Ryan",
    gender: "Male",
    description: "Clear British male voice with a professional tone. Good for merchant or guide roles.",
    styles: ["chat"],
  },

  // ─── Japanese ─────────────────────────────────────────────────────────────
  {
    id: "ja-JP-NanamiNeural",
    locale: "ja-JP",
    language: "Japanese",
    name: "Nanami",
    gender: "Female",
    description: "Natural and expressive Japanese female voice. Recommended for konbini, café and travel scenarios.",
    styles: ["chat", "cheerful", "customerservice"],
    recommended: true,
  },
  {
    id: "ja-JP-KeitaNeural",
    locale: "ja-JP",
    language: "Japanese",
    name: "Keita",
    gender: "Male",
    description: "Calm and clear Japanese male voice. Works well for shopkeeper or guide characters.",
    styles: ["chat"],
  },
  {
    id: "ja-JP-AoiNeural",
    locale: "ja-JP",
    language: "Japanese",
    name: "Aoi",
    gender: "Female",
    description: "Youthful and friendly tone. Good for casual conversation and beginner-level scenarios.",
    styles: ["chat", "cheerful"],
  },
  {
    id: "ja-JP-DaichiNeural",
    locale: "ja-JP",
    language: "Japanese",
    name: "Daichi",
    gender: "Male",
    description: "Energetic young male voice. Suitable for upbeat or excited NPC personalities.",
    styles: ["chat", "cheerful"],
  },

  // ─── Chinese (Mandarin) ───────────────────────────────────────────────────
  {
    id: "zh-CN-XiaoxiaoNeural",
    locale: "zh-CN",
    language: "Chinese (Mandarin)",
    name: "Xiaoxiao",
    gender: "Female",
    description: "Richly expressive Mandarin female voice with the widest style range. Best for roleplay scenarios.",
    styles: ["chat", "cheerful", "excited", "angry", "sad", "fearful", "disgruntled", "serious", "gentle", "affectionate", "embarrassed", "depressed", "lyrical"],
    recommended: true,
  },
  {
    id: "zh-CN-YunxiNeural",
    locale: "zh-CN",
    language: "Chinese (Mandarin)",
    name: "Yunxi",
    gender: "Male",
    description: "Natural Mandarin male voice. Suitable for street vendor, restaurant or market NPC roles.",
    styles: ["chat", "cheerful", "excited", "angry", "sad", "fearful", "disgruntled"],
  },
  {
    id: "zh-CN-XiaohanNeural",
    locale: "zh-CN",
    language: "Chinese (Mandarin)",
    name: "Xiaohan",
    gender: "Female",
    description: "Soft and calm tone with emotional range. Good for gentle or nurturing characters.",
    styles: ["chat", "cheerful", "sad", "serious", "gentle", "affectionate"],
  },
  {
    id: "zh-CN-YunyangNeural",
    locale: "zh-CN",
    language: "Chinese (Mandarin)",
    name: "Yunyang",
    gender: "Male",
    description: "Clear and professional newscast-style voice. Good for formal or authoritative NPCs.",
    styles: ["chat", "newscast"],
  },

  // ─── French ───────────────────────────────────────────────────────────────
  {
    id: "fr-FR-DeniseNeural",
    locale: "fr-FR",
    language: "French",
    name: "Denise",
    gender: "Female",
    description: "Natural French female voice. Good for café, restaurant and shopping scenarios.",
    styles: ["chat"],
    recommended: true,
  },
  {
    id: "fr-FR-HenriNeural",
    locale: "fr-FR",
    language: "French",
    name: "Henri",
    gender: "Male",
    description: "Calm French male voice with a warm tone. Suits waiter or shopkeeper characters.",
    styles: ["chat", "cheerful"],
  },
  {
    id: "fr-FR-EloiseNeural",
    locale: "fr-FR",
    language: "French",
    name: "Eloise",
    gender: "Female",
    description: "Bright and youthful French female voice. Works well for friendly or enthusiastic NPCs.",
    styles: ["chat", "cheerful"],
  },

  // ─── Vietnamese ───────────────────────────────────────────────────────────
  {
    id: "vi-VN-HoaiMyNeural",
    locale: "vi-VN",
    language: "Vietnamese",
    name: "Hoài My",
    gender: "Female",
    description: "Natural Vietnamese female voice. Ideal for local market, café and everyday scenarios.",
    styles: ["chat"],
    recommended: true,
  },
  {
    id: "vi-VN-NamMinhNeural",
    locale: "vi-VN",
    language: "Vietnamese",
    name: "Nam Minh",
    gender: "Male",
    description: "Clear Vietnamese male voice. Good for shopkeeper or guide NPC roles.",
    styles: ["chat"],
  },

  // ─── Korean ───────────────────────────────────────────────────────────────
  {
    id: "ko-KR-SunHiNeural",
    locale: "ko-KR",
    language: "Korean",
    name: "Sun-Hi",
    gender: "Female",
    description: "Friendly and natural Korean female voice. Great for K-drama style scenarios.",
    styles: ["chat", "cheerful"],
    recommended: true,
  },
  {
    id: "ko-KR-InJoonNeural",
    locale: "ko-KR",
    language: "Korean",
    name: "In-Joon",
    gender: "Male",
    description: "Calm Korean male voice. Suits convenience store, restaurant and city guide NPCs.",
    styles: ["chat"],
  },

  // ─── Spanish ──────────────────────────────────────────────────────────────
  {
    id: "es-ES-ElviraNeural",
    locale: "es-ES",
    language: "Spanish",
    name: "Elvira",
    gender: "Female",
    description: "Warm and expressive Spanish (Spain) female voice with good emotional range.",
    styles: ["chat", "cheerful", "angry", "sad"],
    recommended: true,
  },
  {
    id: "es-ES-AlvaroNeural",
    locale: "es-ES",
    language: "Spanish",
    name: "Álvaro",
    gender: "Male",
    description: "Clear and confident Spanish male voice. Good for formal or assertive characters.",
    styles: ["chat"],
  },

  // ─── German ───────────────────────────────────────────────────────────────
  {
    id: "de-DE-KatjaNeural",
    locale: "de-DE",
    language: "German",
    name: "Katja",
    gender: "Female",
    description: "Natural and professional German female voice. Suits formal or service-oriented NPCs.",
    styles: ["chat", "cheerful"],
    recommended: true,
  },
  {
    id: "de-DE-ConradNeural",
    locale: "de-DE",
    language: "German",
    name: "Conrad",
    gender: "Male",
    description: "Steady German male voice with clear pronunciation. Good for guide or instructor roles.",
    styles: ["chat", "cheerful", "unfriendly"],
  },

  // ─── Italian ──────────────────────────────────────────────────────────────
  {
    id: "it-IT-ElsaNeural",
    locale: "it-IT",
    language: "Italian",
    name: "Elsa",
    gender: "Female",
    description: "Expressive and warm Italian female voice. Great for café or restaurant scenarios.",
    styles: ["chat", "cheerful"],
    recommended: true,
  },
  {
    id: "it-IT-DiegoNeural",
    locale: "it-IT",
    language: "Italian",
    name: "Diego",
    gender: "Male",
    description: "Energetic Italian male voice. Suits lively market or street vendor characters.",
    styles: ["chat", "cheerful"],
  },
];

/** Get all voices for a given language name (case-insensitive) */
export const getVoicesByLanguage = (language: string): AzureVoice[] =>
  AZURE_VOICES.filter(v => v.language.toLowerCase().includes(language.toLowerCase()));

/** Get recommended voice for a language */
export const getRecommendedVoice = (language: string): AzureVoice | undefined =>
  AZURE_VOICES.find(v =>
    v.language.toLowerCase().includes(language.toLowerCase()) && v.recommended
  );

/** Map scenario language string → default Azure voice ID */
export const getVoiceIdForLanguage = (lang?: string, defaultVoiceId?: string): string => {
  if (defaultVoiceId) return defaultVoiceId;
  if (!lang) return "en-US-JennyNeural";
  const lower = lang.toLowerCase();
  if (lower.includes("japanese") || lower === "ja") return "ja-JP-NanamiNeural";
  if (lower.includes("chinese") || lower === "zh") return "zh-CN-XiaoxiaoNeural";
  if (lower.includes("french") || lower === "fr") return "fr-FR-DeniseNeural";
  if (lower.includes("vietnamese") || lower === "vi") return "vi-VN-HoaiMyNeural";
  if (lower.includes("korean") || lower === "ko") return "ko-KR-SunHiNeural";
  if (lower.includes("spanish") || lower === "es") return "es-ES-ElviraNeural";
  if (lower.includes("german") || lower === "de") return "de-DE-KatjaNeural";
  if (lower.includes("italian") || lower === "it") return "it-IT-ElsaNeural";
  return "en-US-JennyNeural";
};
