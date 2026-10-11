import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import type { CefrAnalysisDto } from "@/services/practice";
export function ProgressDetails({ analysis }: { analysis: CefrAnalysisDto }) {
  return (
    <div className="workspace-cefr-panel">
      <div className="workspace-cefr-heading">
        <div>
          <h3>Your practice, in perspective.</h3>
          <p>{analysis.statusMessage}</p>
        </div>
        <span className="text-xl font-medium">
          {analysis.overallScore}
          <small className="text-xs text-slate-400"> / 100</small>
        </span>
      </div>
      {analysis.skills.map((skill) => (
        <div className="workspace-skill" key={skill.name}>
          <div>
            <span>{skill.name}</span>
            <span>{skill.score}%</span>
          </div>
          <div
            className="workspace-skill-track"
            role="progressbar"
            aria-label={skill.name}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={skill.score}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, Math.min(100, skill.score))}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p>{skill.description}</p>
        </div>
      ))}
      {analysis.suggestions.length > 0 && (
        <div className="workspace-suggestions">
          <p className="workspace-eyebrow">A few ideas for your next step</p>
          <ul className="list-disc pl-4">
            {analysis.suggestions.map((suggestion) => (
              <li key={suggestion}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
      <Link to="/student/vocal-lab" className="workspace-inline-link mt-5">
        Keep practising <ArrowRight size={14} />
      </Link>
    </div>
  );
}
