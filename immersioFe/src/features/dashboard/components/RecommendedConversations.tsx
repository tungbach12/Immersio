import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { Scenario } from "@/services/scenario";
import { ScenarioCard } from "@/components/learning/ScenarioCard";
import { ContentState } from "@/components/learning/ContentState";

export function RecommendedConversations({
  loading,
  error,
  scenarios,
  language,
  onRetry,
}: {
  loading: boolean;
  error: boolean;
  scenarios: Scenario[];
  language: string;
  onRetry: () => void;
}) {
  return (
    <section aria-labelledby="conversation-picks">
      <div className="workspace-section-heading">
        <h2 id="conversation-picks">A conversation for your day.</h2>
        <Link to="/student/scenarios" className="workspace-inline-link">
          See all <ArrowRight size={14} />
        </Link>
      </div>
      {loading ? (
        <div
          className="workspace-practice-grid"
          role="status"
          aria-label="Loading conversations"
        >
          {[0, 1, 2].map((index) => (
            <div key={index} className="workspace-loading-card animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <ContentState
          title="Let’s try that again."
          description="Your conversations could not be loaded. Try again when the connection is ready."
          onRetry={onRetry}
        />
      ) : !scenarios.length ? (
        <ContentState
          title="A new chapter is on its way."
          description="Conversations will appear here when they’re added to the library."
        >
          <Link to="/student/vocal-lab" className="workspace-inline-link">
            Visit speaking practice <ArrowRight size={14} />
          </Link>
        </ContentState>
      ) : (
        <div className="workspace-practice-grid">
          {scenarios.slice(0, 3).map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              language={language}
            />
          ))}
        </div>
      )}
    </section>
  );
}
