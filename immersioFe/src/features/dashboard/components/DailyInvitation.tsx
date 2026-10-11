import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { LearningBooks } from "@/components/learning/LearningBooks";

export function DailyInvitation({
  reviewPath,
  totalDue,
}: {
  reviewPath: string;
  totalDue: number;
}) {
  return (
    <section className="learning-invitation" aria-labelledby="today-title">
      <div className="learning-invitation-art">
        <LearningBooks />
      </div>
      <span className="workspace-eyebrow">A little English for today</span>
      <h2 id="today-title">
        Good words begin
        <br />
        with a conversation.
      </h2>
      <p>
        Find a familiar moment, try a few words, and let your next conversation
        take you somewhere new.
      </p>
      <div className="learning-invitation-actions">
        <Link className="workspace-primary-link" to="/student/scenarios">
          Start a conversation <ArrowUpRight size={15} />
        </Link>
        <Link className="workspace-secondary-link" to={reviewPath}>
          {totalDue > 0
            ? `Review ${totalDue} words`
            : "Visit your word collection"}{" "}
          <ArrowRight size={13} />
        </Link>
      </div>
    </section>
  );
}
