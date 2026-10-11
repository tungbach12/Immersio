import { useEffect, useState } from "react";
import { BookOpen, ArrowRight, Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import {
  getDecks,
  addDeck,
  addCardsToDeck,
  type Deck,
  type Flashcard,
} from "@/services/decks";
import { ContentState } from "./ContentState";

interface SaveToDeckDialogProps {
  open: boolean;
  cards: Omit<Flashcard, "id">[];
  onClose: () => void;
  onSaved: (deck: Deck) => void;
}

export function SaveToDeckDialog({
  open,
  cards,
  onClose,
  onSaved,
}: SaveToDeckDialogProps) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError("");
    setLoadFailed(false);
    setName("");
    getDecks()
      .then((data) => {
        if (active) setDecks(data);
      })
      .catch(() => {
        if (active) setLoadFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, reload]);

  async function save(deck?: Deck) {
    if (saving || cards.length === 0) return;
    setSaving(true);
    setError("");
    try {
      const destination = deck || (await addDeck(name.trim()));
      if (!deck) {
        setDecks((previous) => [...previous, destination]);
        setName("");
      }
      await addCardsToDeck(destination.id, cards);
      onSaved(destination);
      onClose();
    } catch {
      setError(
        "Your words could not be saved. Choose a collection to try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      title="Keep these words."
      description={`Save ${cards.length} ${cards.length === 1 ? "card" : "cards"} to a collection for your next review.`}
      busy={saving}
      onClose={onClose}
    >
      {error && (
        <p className="learning-inline-error" role="alert">
          {error}
        </p>
      )}
      <div className="learning-deck-list">
        {loading ? (
          <ContentState loading description="Opening your collections…" />
        ) : loadFailed ? (
          <ContentState
            description="Your collections could not be loaded."
            onRetry={() => setReload((value) => value + 1)}
          />
        ) : decks.length ? (
          decks.map((deck) => (
            <button
              type="button"
              key={deck.id}
              className="learning-deck-option"
              disabled={saving || !cards.length}
              onClick={() => save(deck)}
            >
              <BookOpen size={19} />
              <span>
                <strong>{deck.name}</strong>
                <small>{deck.totalCards ?? deck.cards.length} cards</small>
              </span>
              <ArrowRight size={16} />
            </button>
          ))
        ) : (
          <p className="learning-dialog-description">
            Your first collection starts here. Give it a name below.
          </p>
        )}
      </div>
      <form
        className="learning-deck-create"
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim()) void save();
        }}
      >
        <label htmlFor="new-word-collection">Or start a new collection</label>
        <div>
          <input
            id="new-word-collection"
            className="learning-input"
            placeholder="e.g. Words for my next trip"
            maxLength={120}
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={saving}
          />
          <Button
            type="submit"
            disabled={!name.trim() || saving || !cards.length}
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Create & save"
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
