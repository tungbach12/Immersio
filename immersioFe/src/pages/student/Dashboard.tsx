import { Link } from "react-router-dom";
import { Flame, Brain, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeading } from "@/components/learning/PageHeading";
import { ContentState } from "@/components/learning/ContentState";
import { DailyInvitation } from "@/features/dashboard/components/DailyInvitation";
import { LearningMetrics } from "@/features/dashboard/components/LearningMetrics";
import { ProgressDetails } from "@/features/dashboard/components/ProgressDetails";
import { RecommendedConversations } from "@/features/dashboard/components/RecommendedConversations";
import { useLearningDashboard } from "@/features/dashboard/hooks/useLearningDashboard";

export default function StudentDashboard() {
  const dashboard = useLearningDashboard();
  return (
    <div>
      <PageHeading
        eyebrow="Your learning journal"
        title={`Hello, ${dashboard.user?.username?.trim() || "Learner"}.`}
        description="A small step today. A little more confidence tomorrow."
        actions={
          <div className="workspace-streak">
            <Flame size={19} />
            <span>
              <strong>{dashboard.user?.streakCount || 0}</strong>
              <small>day streak</small>
            </span>
          </div>
        }
      />
      <DailyInvitation
        totalDue={dashboard.totalDue}
        reviewPath={dashboard.reviewPath}
      />
      <LearningMetrics
        user={dashboard.user}
        expanded={dashboard.showAnalysis}
        loading={dashboard.loadingAnalysis}
        onToggle={dashboard.toggleAnalysis}
      />
      <AnimatePresence>
        {dashboard.showAnalysis && (
          <motion.div
            id="practice-analysis"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-6" aria-live="polite">
              {dashboard.loadingAnalysis ? (
                <ContentState
                  loading
                  description="Gathering your practice progress…"
                />
              ) : dashboard.analysisError ? (
                <ContentState description="Your progress could not be loaded. Close this panel and open it again to retry." />
              ) : dashboard.analysis ? (
                <ProgressDetails analysis={dashboard.analysis} />
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {dashboard.totalDue > 0 && (
        <div className="workspace-review-note">
          <Brain size={23} />
          <div>
            <h3>A few familiar words are waiting.</h3>
            <p>
              {dashboard.totalDue} words are ready for review. Start with “
              {dashboard.dueDecks[0]?.name}”.
            </p>
          </div>
          <Link to={dashboard.reviewPath} className="workspace-inline-link">
            A little review <ArrowRight size={14} />
          </Link>
        </div>
      )}
      <RecommendedConversations
        loading={dashboard.loadingScenarios}
        error={dashboard.scenarioError}
        scenarios={dashboard.scenarioList}
        language={dashboard.language}
        onRetry={dashboard.loadScenarios}
      />
    </div>
  );
}
