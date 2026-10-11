import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PageHeading } from "@/components/learning/PageHeading";
import { ContentState } from "@/components/learning/ContentState";
import { Button } from "@/components/ui/Button";
import { getReviewCards, type Deck, type Flashcard } from "@/services/decks";

interface StatsViewProps {
  decks: Deck[];
  totalDue: number;
  totalCards: number;
  onBack: () => void;
  onSelectDeck: (deck: Deck) => void;
}

export function StatsView({
  decks,
  totalDue,
  totalCards,
  onBack,
  onSelectDeck,
}: StatsViewProps) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    Promise.all(decks.map((deck) => getReviewCards(deck.id)))
      .then((queues) => {
        if (active) setCards(queues.flat());
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [decks, reload]);
  const distribution = [1, 2, 3, 4, 5].map(
    (level) => cards.filter((card) => (card.mastery || 1) === level).length,
  );
  const maximum = Math.max(...distribution, 1);

  return (
    <div>
      <PageHeading
        eyebrow="Your word collection"
        title="Familiarity comes with practice."
        description="An overview of your collections and the cards ready for another look."
        actions={
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft size={15} className="mr-2" />
            Collections
          </Button>
        }
      />
      <div className="word-progress-metrics">
        <div>
          <span>Collections</span>
          <strong>{decks.length}</strong>
        </div>
        <div>
          <span>Words & expressions kept</span>
          <strong>{totalCards}</strong>
        </div>
        <div>
          <span>Ready to review</span>
          <strong>{totalDue}</strong>
        </div>
      </div>
      {loading ? (
        <ContentState loading description="Opening your review progress…" />
      ) : error ? (
        <ContentState
          description="Your review progress could not be loaded."
          onRetry={() => setReload((value) => value + 1)}
        />
      ) : (
        <div className="word-progress-panels">
          <section className="learning-paper">
            <h2>In your review queue.</h2>
            <p className="word-progress-description">
              Mastery levels for the {cards.length} cards currently ready to
              review.
            </p>
            {distribution.map((count, index) => (
              <div className="word-progress-row" key={index}>
                <span>Level {index + 1}</span>
                <div>
                  <span style={{ width: `${(count / maximum) * 100}%` }} />
                </div>
                <strong>{count}</strong>
              </div>
            ))}
            <p className="word-progress-note">
              Level 1 is a new discovery. Level 5 is becoming familiar. Cards
              scheduled for later are outside this view.
            </p>
          </section>
          <section className="learning-paper">
            <h2>A little review, by collection.</h2>
            <div className="word-progress-decks">
              {decks.length ? (
                decks.map((deck) => (
                  <button
                    key={deck.id}
                    type="button"
                    onClick={() => onSelectDeck(deck)}
                  >
                    <span>
                      <strong>{deck.name}</strong>
                      <small>
                        {deck.totalCards || 0} cards · {deck.dueCardsCount || 0}{" "}
                        ready
                      </small>
                    </span>
                    <ArrowRight size={16} />
                  </button>
                ))
              ) : (
                <p className="word-progress-description">
                  Save a word from the dictionary to start a collection.
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
