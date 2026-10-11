import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PronunciationFeedback } from "../hooks/usePronunciationLab";

function scoreTone(score: number) {
  return score >= 80
    ? "is-confident"
    : score >= 50
      ? "is-progressing"
      : "is-practising";
}

export function PronunciationResult({
  feedback,
}: {
  feedback: PronunciationFeedback;
}) {
  return (
    <section
      className="learning-paper pronunciation-result"
      aria-labelledby="pronunciation-result-title"
    >
      <div className="pronunciation-score">
        <div>
          <p className="workspace-eyebrow">
            <CheckCircle2 size={14} /> Your pronunciation feedback
          </p>
          <h2 id="pronunciation-result-title">
            A little clearer, word by word.
          </h2>
          <p>{feedback.message}</p>
        </div>
        <strong className={scoreTone(feedback.score)}>
          {Math.round(feedback.score)}
          <small>/100</small>
        </strong>
      </div>
      {!!feedback.words?.length && (
        <>
          <p className="pronunciation-hint">
            Open a word to see its individual sounds. Green: 80–100 · Gold:
            50–79 · Clay: below 50.
          </p>
          <div className="pronunciation-words">
            {feedback.words.map((word, index) => (
              <details
                key={`${word.word}-${index}`}
                className={cn(
                  "pronunciation-word",
                  scoreTone(word.accuracyScore),
                  word.errorType === "Omission" && "is-omitted",
                )}
              >
                <summary>
                  <span>{word.word}</span>
                  <small>
                    {word.errorType === "Omission"
                      ? "Not heard"
                      : `${Math.round(word.accuracyScore)}%`}
                  </small>
                </summary>
                <div>
                  {word.errorType === "Omission" ? (
                    <p>This word was not heard in your recording.</p>
                  ) : word.phonemes?.length ? (
                    word.phonemes.map((phoneme, position) => (
                      <span
                        key={position}
                        className={scoreTone(phoneme.accuracyScore)}
                      >
                        /{phoneme.phoneme}/{" "}
                        <small>{Math.round(phoneme.accuracyScore)}%</small>
                      </span>
                    ))
                  ) : (
                    <p>No individual sound scores for this word.</p>
                  )}
                </div>
              </details>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
