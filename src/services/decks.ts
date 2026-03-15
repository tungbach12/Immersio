export interface Flashcard {
  id: string;
  front: string;
  back: string;
  explanation?: string;
  mastery?: number;
}

export interface Deck {
  id: string;
  name: string;
  cards: Flashcard[];
}

export function getDecks(): Deck[] {
  const data = localStorage.getItem("immersio_decks");
  if (data) {
    return JSON.parse(data);
  }
  // Default decks
  const defaultDecks: Deck[] = [
    {
      id: "default-1",
      name: "General Vocabulary",
      cards: [
        { id: "1", front: "Serendipity", back: "The occurrence and development of events by chance in a happy or beneficial way.", explanation: "A fortunate stroke of serendipity.", mastery: 2 },
        { id: "2", front: "Present Perfect", back: "Used for actions that happened at an unspecified time in the past or began in the past and continue to the present.", explanation: "I have lived here for five years.", mastery: 1 },
        { id: "3", front: "Ubiquitous", back: "Present, appearing, or found everywhere.", explanation: "His ubiquitous influence was felt by all the family.", mastery: 4 },
      ]
    }
  ];
  saveDecks(defaultDecks);
  return defaultDecks;
}

export function saveDecks(decks: Deck[]) {
  localStorage.setItem("immersio_decks", JSON.stringify(decks));
}

export function addDeck(name: string): Deck {
  const decks = getDecks();
  const newDeck: Deck = { id: Date.now().toString(), name, cards: [] };
  decks.push(newDeck);
  saveDecks(decks);
  return newDeck;
}

export function addCardsToDeck(deckId: string, cards: Omit<Flashcard, "id">[]) {
  const decks = getDecks();
  const deck = decks.find(d => d.id === deckId);
  if (deck) {
    const newCards = cards.map(c => ({ ...c, id: Date.now().toString() + Math.random().toString() }));
    deck.cards.push(...newCards);
    saveDecks(decks);
  }
}
