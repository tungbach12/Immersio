import { authService, API_BASE } from "./auth";

const BASE_URL = `${API_BASE}/api/practice`;

export interface PronunciationLogDto {
  id: string;
  phrase: string;
  transcript: string;
  score: number;
  practicedAt: string;
}

export interface SkillScoreDto {
  name: string;
  score: number;
  description: string;
}

export interface CefrAnalysisDto {
  currentLevel: string;
  overallScore: number;
  colorTheme: string;
  statusMessage: string;
  skills: SkillScoreDto[];
  suggestions: string[];
}

export const practiceService = {
  async logPronunciation(
    phrase: string,
    transcript: string,
    score: number
  ): Promise<PronunciationLogDto> {
    const response = await authService.fetchWithAuth(
      `${BASE_URL}/pronunciation-log`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phrase, transcript, score }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: "Log failed" }));
      throw new Error(err.detail || "Failed to log pronunciation");
    }

    return response.json();
  },

  async getPronunciationHistory(): Promise<PronunciationLogDto[]> {
    const response = await authService.fetchWithAuth(
      `${BASE_URL}/pronunciation-history`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch pronunciation history");
    }

    return response.json();
  },

  async getCefrAnalysis(): Promise<CefrAnalysisDto> {
    const response = await authService.fetchWithAuth(
      `${BASE_URL}/cefr-analysis`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch CEFR analysis");
    }

    return response.json();
  },

  async assessPronunciation(
    audioBlob: Blob,
    phrase: string
  ): Promise<{ transcript: string; score: number; message: string; words: WordAssessmentDto[] }> {
    const formData = new FormData();
    formData.append("audio", audioBlob, "pronunciation.webm");
    formData.append("phrase", phrase);

    const response = await authService.fetchWithAuth(
      `${BASE_URL}/assess-pronunciation`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: "Assessment failed" }));
      throw new Error(err.detail || "Failed to assess pronunciation");
    }

    return response.json();
  },

  async generatePhrase(
    language: string,
    level: string,
    topic: string
  ): Promise<GeneratedPhraseDto> {
    const response = await authService.fetchWithAuth(
      `${BASE_URL}/generate-phrase`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, level, topic }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: "Generation failed" }));
      throw new Error(err.detail || "Failed to generate AI phrase");
    }

    return response.json();
  },

  async lookupWord(
    word: string,
    targetLanguage: string
  ): Promise<DictionaryEntryDto> {
    const response = await authService.fetchWithAuth(
      `${BASE_URL}/dictionary-lookup`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word, targetLanguage }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: "Lookup failed" }));
      throw new Error(err.detail || "Failed to lookup dictionary entry");
    }

    return response.json();
  },
};

export interface DictionaryEntryDto {
  word: string;
  translation: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  example: string;
  exampleTranslation: string;
}

export interface PhonemeAssessmentDto {
  phoneme: string;
  accuracyScore: number;
}

export interface WordAssessmentDto {
  word: string;
  accuracyScore: number;
  errorType: string;
  phonemes: PhonemeAssessmentDto[];
}

export interface GeneratedPhraseDto {
  phrase: string;
  translation: string;
  explanation: string;
}
