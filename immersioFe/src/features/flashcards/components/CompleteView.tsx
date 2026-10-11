import { motion } from "motion/react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { PageHeading } from "@/components/learning/PageHeading";
import { Button } from "@/components/ui/Button";
import { ScoreRing } from "./ScoreRing";

interface CompleteViewProps {
  deckName: string;
  totalCards: number;
  knownCount: number;
  bestStreak: number;
  masteryDistribution: number[];
  onRestart: () => void;
  onBack: () => void;
}

export function CompleteView({
  deckName,
  totalCards,
  knownCount,
  bestStreak,
  masteryDistribution,
  onRestart,
  onBack,
}: CompleteViewProps) {
  const remembered = totalCards ? (knownCount / totalCards) * 100 : 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <PageHeading
        eyebrow="A little practice, kept"
        title="Another small step forward."
        description={`You’ve reviewed “${deckName}”. Give yourself a moment, then carry on when you’re ready.`}
      />
      <div className="learning-paper word-review-complete">
        <ScoreRing pct={remembered} />
        <div>
          <h2>{knownCount} words feeling more familiar.</h2>
          <p>
            You marked {knownCount} of {totalCards} cards as “Got it”. Your next
            review will follow your updated schedule.
          </p>
          <span>Best streak in this review: {bestStreak}</span>
        </div>
      </div>
      <div className="word-progress-metrics">
        <div>
          <span>Cards reviewed</span>
          <strong>{totalCards}</strong>
        </div>
        <div>
          <span>Feeling familiar</span>
          <strong>{knownCount}</strong>
        </div>
        <div>
          <span>A little more practice</span>
          <strong>{totalCards - knownCount}</strong>
        </div>
      </div>
      <section className="learning-paper word-review-distribution">
        <h2>Where this collection is growing.</h2>
        <div>
          {masteryDistribution.map((count, index) => (
            <span key={index}>
              <small>Level {index + 1}</small>
              <strong>{count}</strong>
            </span>
          ))}
        </div>
      </section>
      <div className="word-review-actions">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft size={16} className="mr-2" />
          Back to collections
        </Button>
        <Button onClick={onRestart}>
          <RotateCcw size={16} className="mr-2" />
          Review available cards
        </Button>
      </div>
    </motion.div>
  );
}
