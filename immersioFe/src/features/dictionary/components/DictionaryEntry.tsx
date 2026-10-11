import { Volume2, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { DictionaryEntryDto } from "@/services/practice";

interface DictionaryEntryProps {
  entry: DictionaryEntryDto;
  savedCollection: string;
  onListen: () => void;
  onSave: () => void;
}

export function DictionaryEntry({
  entry,
  savedCollection,
  onListen,
  onSave,
}: DictionaryEntryProps) {
  return (
    <article className="learning-paper dictionary-entry">
      <header>
        <div>
          <span className="dictionary-word-type">{entry.partOfSpeech}</span>
          <h2>{entry.word}</h2>
          <p className="dictionary-phonetic">{entry.phonetic}</p>
        </div>
        <div className="dictionary-entry-actions">
          <Button
            variant="outline"
            size="icon"
            onClick={onListen}
            aria-label={`Listen to ${entry.word}`}
          >
            <Volume2 size={20} />
          </Button>
          {savedCollection ? (
            <span className="dictionary-saved" role="status">
              <Check size={16} />
              Saved to {savedCollection}
            </span>
          ) : (
            <Button onClick={onSave}>
              <Plus size={16} className="mr-2" />
              Keep this word
            </Button>
          )}
        </div>
      </header>
      <div className="dictionary-definition">
        <div>
          <p className="workspace-eyebrow">Vietnamese meaning</p>
          <h3>{entry.translation}</h3>
        </div>
        <div>
          <p className="workspace-eyebrow">Definition</p>
          <p>{entry.definition}</p>
        </div>
      </div>
      <blockquote>
        <p className="workspace-eyebrow">In a real conversation</p>
        <p>“{entry.example}”</p>
        <small>{entry.exampleTranslation}</small>
      </blockquote>
    </article>
  );
}
