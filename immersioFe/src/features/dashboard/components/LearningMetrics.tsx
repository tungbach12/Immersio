import { Brain, ChevronDown, ChevronUp, Clock, Sparkles } from "lucide-react";
import type { UserDto } from "@/services/auth";

export function LearningMetrics({
  user,
  expanded,
  loading,
  onToggle,
}: {
  user: UserDto | null;
  expanded: boolean;
  loading: boolean;
  onToggle: () => void;
}) {
  const level = user?.currentLanguageLevel;
  const experience = user?.experiencePoints || 0;
  return (
    <div className="workspace-metrics">
      <button
        type="button"
        className="workspace-metric workspace-level-button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls="practice-analysis"
        disabled={loading}
      >
        <span className="workspace-metric-icon">
          <Sparkles size={20} />
        </span>
        <span>
          <small>Current practice level</small>
          <strong>
            {level && level !== "Unassigned" ? level : "Explore your level"}
          </strong>
        </span>
        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      <div className="workspace-metric">
        <span className="workspace-metric-icon">
          <Brain size={20} />
        </span>
        <span>
          <small>Experience earned</small>
          <strong>
            {experience >= 1000
              ? `${(experience / 1000).toFixed(1)}k`
              : experience}
            <span className="text-xs font-body text-slate-400 ml-1">XP</span>
          </strong>
        </span>
      </div>
      <div className="workspace-metric">
        <span className="workspace-metric-icon">
          <Clock size={19} />
        </span>
        <span>
          <small>Time spent learning</small>
          <strong>
            {Math.round(user?.learningHours || 0)}
            <span className="text-xs font-body text-slate-400 ml-1">hours</span>
          </strong>
        </span>
      </div>
    </div>
  );
}
