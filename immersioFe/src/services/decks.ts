import { authService } from "./auth";

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  explanation?: string;
  tag?: string;
  mastery?: number; // 1-5 level mapped from backend Repetitions
  repetitions?: number;
  easinessFactor?: number;
  intervalDays?: number;
  nextReviewDate?: string;
  lastReviewedAt?: string;
}

export interface Deck {
  id: string;
  name: string;
  cards: Flashcard[];
  totalCards?: number;
  dueCardsCount?: number;
}

const BASE_URL = "http://localhost:5249/api/flashcards";

export async function getDecks(): Promise<Deck[]> {
  const response = await authService.fetchWithAuth(`${BASE_URL}/decks`);
  if (!response.ok) {
    throw new Error("Failed to load decks from server.");
  }
  const data = await response.json();
  return data.map((d: any) => ({
    id: d.id,
    name: d.name,
    cards: [], // Cards loaded on demand or review
    totalCards: d.totalCards,
    dueCardsCount: d.dueCardsCount,
  }));
}

export async function addDeck(name: string): Promise<Deck> {
  const response = await authService.fetchWithAuth(`${BASE_URL}/decks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(name),
  });

  if (!response.ok) {
    throw new Error("Failed to create deck on server.");
  }

  const d = await response.json();
  return {
    id: d.id,
    name: d.name,
    cards: [],
    totalCards: 0,
    dueCardsCount: 0,
  };
}

export async function addCardsToDeck(deckId: string, cards: Omit<Flashcard, "id">[]): Promise<void> {
  const response = await authService.fetchWithAuth(`${BASE_URL}/decks/${deckId}/cards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cards.map(c => ({
      front: c.front,
      back: c.back,
      explanation: c.explanation,
      tag: c.tag,
    }))),
  });

  if (!response.ok) {
    throw new Error("Failed to add cards to deck.");
  }
}

export async function getReviewCards(deckId: string): Promise<Flashcard[]> {
  const response = await authService.fetchWithAuth(`${BASE_URL}/decks/${deckId}/review`);
  if (!response.ok) {
    throw new Error("Failed to load review queue.");
  }
  const data: any[] = await response.json();
  return data.map(c => ({
    id: c.id,
    front: c.front,
    back: c.back,
    explanation: c.explanation || undefined,
    mastery: Math.min(5, Math.max(1, c.repetitions + 1)),
    repetitions: c.repetitions,
    easinessFactor: c.easinessFactor,
    intervalDays: c.intervalDays,
    nextReviewDate: c.nextReviewDate,
    lastReviewedAt: c.lastReviewedAt || undefined,
  }));
}

export async function reviewCard(cardId: string, quality: number): Promise<Flashcard> {
  const response = await authService.fetchWithAuth(`${BASE_URL}/cards/${cardId}/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ quality }),
  });

  if (!response.ok) {
    throw new Error("Failed to submit review score.");
  }

  const c = await response.json();
  return {
    id: c.id,
    front: c.front,
    back: c.back,
    explanation: c.explanation || undefined,
    mastery: Math.min(5, Math.max(1, c.repetitions + 1)),
    repetitions: c.repetitions,
    easinessFactor: c.easinessFactor,
    intervalDays: c.intervalDays,
    nextReviewDate: c.nextReviewDate,
    lastReviewedAt: c.lastReviewedAt || undefined,
  };
}

export async function deleteDeck(deckId: string): Promise<void> {
  const response = await authService.fetchWithAuth(`${BASE_URL}/decks/${deckId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete deck.");
  }
}
