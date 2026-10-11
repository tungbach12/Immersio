import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, BarChart3, Brain, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageHeading } from "@/components/learning/PageHeading";
import { ContentState } from "@/components/learning/ContentState";
import type { Deck } from "@/services/decks";

interface DeckListViewProps {
  decks: Deck[];
  loading: boolean;
  totalDue: number;
  totalCards: number;
  onSelect: (deck: Deck) => void;
  onStats: () => void;
}

export function DeckListView({
  decks,
  loading,
  totalDue,
  totalCards,
  onSelect,
  onStats,
}: DeckListViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
    >
      <PageHeading
        eyebrow="Your word collection"
        title="Words worth keeping."
        description="Little discoveries from your conversations, ready to become familiar."
        actions={
          <Button variant="outline" onClick={onStats} disabled={loading}>
            <BarChart3 size={16} className="mr-2" />
            Your progress
          </Button>
        }
      />
      <div className="word-collection-summary">
        <span>
          <BookOpen size={18} />
          <strong>{decks.length}</strong> collections
        </span>
        <span>
          <Brain size={18} />
          <strong>{totalCards}</strong> cards kept
        </span>
        <span className="word-collection-due">
          <strong>{totalDue}</strong> ready to review
        </span>
      </div>
      {loading ? (
        <div
          className="word-collection-grid"
          role="status"
          aria-label="Loading word collections"
        >
          {[0, 1, 2].map((index) => (
            <div
              className="word-collection-skeleton animate-pulse"
              key={index}
            />
          ))}
        </div>
      ) : !decks.length ? (
        <ContentState
          title="Start a little collection."
          description="Save a word from the dictionary or keep useful expressions after a conversation."
        >
          <Link to="/student/dictionary" className="workspace-inline-link">
            Discover your first word <ArrowRight size={15} />
          </Link>
        </ContentState>
      ) : (
        <div className="word-collection-grid">
          {decks.map((deck, index) => (
            <button
              key={deck.id}
              type="button"
              className={`word-collection-card collection-tone-${index % 3}`}
              onClick={() => onSelect(deck)}
            >
              <div className="word-collection-cover">
                <BookOpen size={35} strokeWidth={1.2} />
                <span>Collection {String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className="word-collection-body">
                <h2>{deck.name}</h2>
                <p>
                  {deck.totalCards || 0} cards · {deck.dueCardsCount || 0} ready
                  to review
                </p>
                <span className="workspace-inline-link">
                  {deck.dueCardsCount ? "A little review" : "Open collection"}{" "}
                  <ArrowRight size={16} />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
