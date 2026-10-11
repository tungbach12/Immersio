import { Search, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeading } from "@/components/learning/PageHeading";
import { ContentState } from "@/components/learning/ContentState";
import { SaveToDeckDialog } from "@/components/learning/SaveToDeckDialog";
import { Button } from "@/components/ui/Button";
import { DictionaryEntry } from "@/features/dictionary/components/DictionaryEntry";
import { useDictionaryLookup } from "@/features/dictionary/hooks/useDictionaryLookup";

export default function DictionaryPage() {
  const dictionary = useDictionaryLookup();
  return (
    <div className="dictionary-workspace">
      <PageHeading
        eyebrow="A place for new discoveries"
        title="Every word opens a door."
        description="Find its meaning, hear how it sounds, and keep it for another day."
      />
      <form
        className="learning-paper dictionary-search"
        onSubmit={dictionary.search}
      >
        <label>
          Language
          <select
            value={dictionary.language}
            onChange={(event) => dictionary.setLanguage(event.target.value)}
            disabled={dictionary.loading}
          >
            {["English", "Japanese", "Chinese", "French"].map((language) => (
              <option key={language}>{language}</option>
            ))}
          </select>
        </label>
        <label className="dictionary-query">
          Word or expression
          <div>
            <input
              className="learning-input"
              placeholder="What word caught your attention?"
              value={dictionary.query}
              onChange={(event) => dictionary.setQuery(event.target.value)}
              disabled={dictionary.loading}
            />
            <Button
              type="submit"
              disabled={dictionary.loading || !dictionary.query.trim()}
              aria-label="Look up word"
            >
              {dictionary.loading ? (
                <Loader2 size={19} className="animate-spin" />
              ) : (
                <Search size={19} />
              )}
            </Button>
          </div>
        </label>
      </form>
      {dictionary.error && (
        <p className="learning-inline-error" role="alert">
          {dictionary.error}
        </p>
      )}
      <AnimatePresence mode="wait">
        {dictionary.loading ? (
          <ContentState
            key="loading"
            loading
            description="Finding the meaning, sound, and a useful example…"
          />
        ) : dictionary.entry ? (
          <motion.div
            key={dictionary.entry.word}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <DictionaryEntry
              entry={dictionary.entry}
              savedCollection={dictionary.savedCollection}
              onListen={dictionary.listen}
              onSave={() => dictionary.setSaveOpen(true)}
            />
          </motion.div>
        ) : (
          !dictionary.error && (
            <div className="dictionary-start">
              <span aria-hidden="true">Aa</span>
              <h2>A small word. A new possibility.</h2>
              <p>
                Look up a word or phrase you’ve heard, then save it to your own
                collection.
              </p>
            </div>
          )
        )}
      </AnimatePresence>
      <SaveToDeckDialog
        open={dictionary.saveOpen}
        cards={dictionary.cards}
        onClose={() => dictionary.setSaveOpen(false)}
        onSaved={(deck) => dictionary.setSavedCollection(deck.name)}
      />
    </div>
  );
}
