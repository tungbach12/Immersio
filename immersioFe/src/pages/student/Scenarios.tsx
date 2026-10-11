import { motion } from "motion/react";
import { PageHeading } from "@/components/learning/PageHeading";
import { ContentState } from "@/components/learning/ContentState";
import { ScenarioCard } from "@/components/learning/ScenarioCard";
import { Button } from "@/components/ui/Button";
import { ConversationFilters } from "@/features/scenarios/components/ConversationFilters";
import { useConversationLibrary } from "@/features/scenarios/hooks/useConversationLibrary";

export default function Scenarios() {
  const library = useConversationLibrary();
  return (
    <div>
      <PageHeading
        eyebrow="Your conversation library"
        title="Find a moment. Find your words."
        description="A coffee order, a new city, a friendly introduction. Practise the conversations that feel like life."
      />
      <ConversationFilters
        query={library.query}
        onQueryChange={library.setQuery}
        language={library.language}
        onLanguageChange={library.chooseLanguage}
        category={library.category}
        categories={library.categories}
        onCategoryChange={library.setCategory}
        showCategories={!library.loading && !library.error}
        resultCount={library.filtered.length}
      />
      {library.loading ? (
        <div
          className="workspace-practice-grid"
          role="status"
          aria-label="Loading conversations"
        >
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div key={index} className="workspace-loading-card animate-pulse" />
          ))}
        </div>
      ) : library.error ? (
        <ContentState
          title="A moment to reconnect."
          description="The conversation library could not be loaded right now."
          onRetry={library.reload}
        />
      ) : !library.filtered.length ? (
        <ContentState
          title={
            library.scenarios.length
              ? "Let’s try a different word."
              : "A new chapter is on its way."
          }
          description={
            library.scenarios.length
              ? "No conversations match these filters. Try another search or explore the full collection."
              : "Conversations will appear here when they’re added to the library."
          }
        >
          {!!library.scenarios.length && (
            <Button variant="outline" size="sm" onClick={library.clearFilters}>
              Show all conversations
            </Button>
          )}
        </ContentState>
      ) : (
        <div className="workspace-practice-grid">
          {library.filtered.map((scenario, index) => (
            <motion.div
              key={scenario.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(index, 5) * 0.04 }}
            >
              <ScenarioCard scenario={scenario} language={library.language} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
