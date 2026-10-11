import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ContentState } from "@/components/learning/ContentState";
import { ReviewCard } from "./ReviewCard";
import type { useConversation } from "../hooks/useConversation";

type Props = Pick<
  ReturnType<typeof useConversation>,
  | "feedbackText"
  | "isLoadingFeedback"
  | "flashcards"
  | "isLoadingFlashcards"
  | "selectedFlashcardOptions"
  | "selectedCardIds"
  | "setSelectedCardIds"
  | "toggleFlashcardOption"
  | "handleGenerateCustomCards"
  | "handleOpenSaveModal"
  | "isSaved"
  | "navigate"
>;
const categories = [
  { key: "grammar", label: "Grammar" },
  { key: "vocabulary", label: "Vocabulary" },
  { key: "improvement", label: "Natural expressions" },
];

export function ConversationReview(props: Props) {
  return (
    <div className="conversation-review-scroll">
      <div className="conversation-review-content">
        <header>
          <p className="workspace-eyebrow">A page in your learning journal</p>
          <h2>A conversation to build on.</h2>
          <p>
            Keep what you’ve learned, and carry a few good words into your next
            conversation.
          </p>
        </header>
        {props.isLoadingFeedback ? (
          <ContentState
            loading
            description="Gathering your conversation feedback…"
          />
        ) : (
          props.feedbackText && (
            <section className="learning-paper conversation-feedback">
              <p className="workspace-eyebrow">Your practice, in perspective</p>
              <p>{props.feedbackText}</p>
            </section>
          )
        )}
        {!props.isLoadingFeedback && props.feedbackText && (
          <section
            className="conversation-review-words"
            aria-labelledby="review-words-title"
          >
            <div className="workspace-section-heading">
              <h2 id="review-words-title">Take a few words with you.</h2>
              <span>{props.selectedCardIds.length} selected</span>
            </div>
            <div
              className="workspace-category-list"
              role="group"
              aria-label="Card categories"
            >
              {categories.map((category) => (
                <button
                  key={category.key}
                  type="button"
                  aria-pressed={props.selectedFlashcardOptions.includes(
                    category.key,
                  )}
                  disabled={props.isLoadingFlashcards}
                  onClick={() => props.toggleFlashcardOption(category.key)}
                >
                  {category.label}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={props.handleGenerateCustomCards}
              disabled={
                props.isLoadingFlashcards ||
                !props.selectedFlashcardOptions.length
              }
            >
              <Sparkles size={16} className="mr-2" />
              Create practice cards
            </Button>
            {props.isLoadingFlashcards ? (
              <div className="mt-5">
                <ContentState
                  loading
                  description="Creating cards from your conversation…"
                />
              </div>
            ) : props.flashcards?.length ? (
              <>
                <div className="conversation-review-grid">
                  {props.flashcards.map((card) => (
                    <ReviewCard
                      key={card.id}
                      card={card}
                      selected={props.selectedCardIds.includes(card.id)}
                      onToggle={() =>
                        props.setSelectedCardIds((previous) =>
                          previous.includes(card.id)
                            ? previous.filter((id) => id !== card.id)
                            : [...previous, card.id],
                        )
                      }
                    />
                  ))}
                </div>
                <Button
                  onClick={props.handleOpenSaveModal}
                  disabled={props.isSaved || !props.selectedCardIds.length}
                >
                  {props.isSaved ? (
                    <>
                      <Check size={16} className="mr-2" />
                      Saved to your collection
                    </>
                  ) : (
                    `Keep ${props.selectedCardIds.length} selected cards`
                  )}
                </Button>
              </>
            ) : (
              props.flashcards && (
                <p className="conversation-empty-cards">
                  No cards were returned. Choose another category and try again.
                </p>
              )
            )}
          </section>
        )}
        <div className="conversation-review-footer">
          <Button
            variant="outline"
            onClick={() => props.navigate("/student/scenarios")}
          >
            Back to conversations <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
