import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ContentState } from "@/components/learning/ContentState";
import { SaveToDeckDialog } from "@/components/learning/SaveToDeckDialog";
import { useConversation } from "@/features/conversations/hooks/useConversation";
import { ConversationReview } from "@/features/conversations/components/ConversationReview";
import { ConversationStage } from "@/features/conversations/components/ConversationStage";

export default function ScenarioDetail() {
  const conversation = useConversation();
  const {
    scenario,
    loadingScenario,
    mode,
    targetLang,
    isLoading,
    sessionReady,
    isLoadingFeedback,
    conversationError,
    handleFinishLesson,
    navigate,
  } = conversation;
  if (loadingScenario)
    return (
      <div className="conversation-opening">
        <ContentState loading description="Opening a new conversation…" />
      </div>
    );
  if (!scenario)
    return (
      <div className="conversation-opening">
        <ContentState
          title="This conversation isn’t available."
          description="Return to the library and choose another moment to practise."
        >
          <Button
            variant="outline"
            onClick={() => navigate("/student/scenarios")}
          >
            Back to conversations
          </Button>
        </ContentState>
      </div>
    );
  return (
    <div
      className={`conversation-workspace ${mode === "feedback" ? "is-reviewing" : ""}`}
    >
      {mode !== "feedback" && scenario.bg && (
        <img className="conversation-background" src={scenario.bg} alt="" />
      )}
      <header className="conversation-topbar">
        <button
          type="button"
          className="conversation-back"
          onClick={() => navigate("/student/scenarios")}
          aria-label="Back to conversations"
        >
          <ArrowLeft size={21} />
        </button>
        <div>
          <span>
            {targetLang || scenario.language} · {scenario.level}
          </span>
          <h1>{scenario.title}</h1>
        </div>
        {mode !== "feedback" && (
          <Button
            onClick={handleFinishLesson}
            disabled={isLoading || !sessionReady}
          >
            Finish practice
          </Button>
        )}
      </header>
      {conversationError && (
        <div className="conversation-error" role="alert">
          <p>{conversationError}</p>
          {mode === "feedback" && !isLoadingFeedback && (
            <Button variant="outline" size="sm" onClick={handleFinishLesson}>
              Try feedback again
            </Button>
          )}
        </div>
      )}
      {mode === "feedback" ? (
        <ConversationReview {...conversation} />
      ) : (
        <ConversationStage {...conversation} />
      )}
      <SaveToDeckDialog
        open={conversation.showSaveDeckModal}
        cards={(conversation.flashcards || []).filter((card) =>
          conversation.selectedCardIds.includes(card.id),
        )}
        onClose={() => conversation.setShowSaveDeckModal(false)}
        onSaved={() => conversation.setIsSaved(true)}
      />
    </div>
  );
}
