import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Clock, BookOpen } from "lucide-react";
import type { Scenario } from "@/services/scenario";
import { LearningBooks } from "./LearningBooks";

export function ScenarioCard({
  scenario,
  language,
}: {
  scenario: Scenario;
  language: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <Link
      className="workspace-scenario-card"
      to={`/student/scenarios/${scenario.id}?lang=${encodeURIComponent(language)}`}
    >
      <div className="workspace-scenario-image">
        {scenario.image && !imageFailed ? (
          <img
            src={scenario.image}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-5">
            <div className="w-36">
              <LearningBooks />
            </div>
          </div>
        )}
        <span className="workspace-scenario-level">
          {scenario.level || "Your own pace"}
        </span>
      </div>
      <div className="workspace-scenario-body">
        <span className="workspace-scenario-category">
          {scenario.category || "Everyday English"}
        </span>
        <h3>{scenario.title}</h3>
        <p>{scenario.description}</p>
        <div className="workspace-scenario-footer">
          <span>
            {scenario.duration ? (
              <>
                <Clock size={12} />
                {scenario.duration}
              </>
            ) : (
              <>
                <BookOpen size={12} />A little conversation
              </>
            )}
          </span>
          <span>
            Let’s talk <ArrowUpRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
