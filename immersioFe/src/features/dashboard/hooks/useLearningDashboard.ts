import { useState, useEffect } from "react";
import { useWorkspaceUser } from "@/components/layout/WorkspaceUserContext";
import { practiceService, type CefrAnalysisDto } from "@/services/practice";
import { useScenarioList } from "@/hooks/useScenarioList";
import { getDecks, type Deck } from "@/services/decks";
export function useLearningDashboard() {
  const { user } = useWorkspaceUser();
  const {
    scenarios: scenarioList,
    loading: loadingScenarios,
    error: scenarioError,
    reload: loadScenarios,
  } = useScenarioList();
  const [dueDecks, setDueDecks] = useState<Deck[]>([]);
  const [analysis, setAnalysis] = useState<CefrAnalysisDto | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState(false);
  const language = localStorage.getItem("practice_language") || "English";
  const totalDue = dueDecks.reduce(
    (total, deck) => total + (deck.dueCardsCount || 0),
    0,
  );

  useEffect(() => {
    let active = true;
    getDecks()
      .then((decks) => {
        if (!active) return;
        const due = decks.filter((deck) => (deck.dueCardsCount || 0) > 0);
        setDueDecks(due);
        const total = due.reduce(
          (count, deck) => count + (deck.dueCardsCount || 0),
          0,
        );
        if (
          total &&
          "Notification" in window &&
          Notification.permission === "granted" &&
          !sessionStorage.getItem("notified_flashcards_today")
        ) {
          new Notification("Immersio", {
            body: `${total} words are ready for a little review today.`,
            icon: "/immersio-mark.svg",
          });
          sessionStorage.setItem("notified_flashcards_today", "true");
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function toggleAnalysis() {
    if (showAnalysis) {
      setShowAnalysis(false);
      return;
    }
    setShowAnalysis(true);
    if (analysis) return;
    setLoadingAnalysis(true);
    setAnalysisError(false);
    try {
      setAnalysis(await practiceService.getCefrAnalysis());
    } catch {
      setAnalysisError(true);
    } finally {
      setLoadingAnalysis(false);
    }
  }

  const reviewPath = dueDecks[0]
    ? `/student/flashcards/${dueDecks[0].id}`
    : "/student/flashcards";

  return {
    user,
    scenarioList,
    loadingScenarios,
    scenarioError,
    totalDue,
    dueDecks,
    analysis,
    showAnalysis,
    loadingAnalysis,
    analysisError,
    language,
    reviewPath,
    loadScenarios,
    toggleAnalysis,
  };
}
