import { RefreshCw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { usePronunciationLab } from "../hooks/usePronunciationLab";

type Props = Pick<
  ReturnType<typeof usePronunciationLab>,
  | "language"
  | "level"
  | "topic"
  | "setLanguage"
  | "setLevel"
  | "setTopic"
  | "phrase"
  | "translation"
  | "explanation"
  | "generating"
  | "starting"
  | "recording"
  | "assessing"
  | "generate"
  | "listen"
>;

export function PhraseComposer(props: Props) {
  const disabled =
    props.generating || props.starting || props.recording || props.assessing;
  return (
    <section
      className="learning-paper speaking-composer"
      aria-labelledby="practice-phrase-title"
    >
      <div className="speaking-preferences">
        <label>
          Language
          <select
            value={props.language}
            onChange={(event) => props.setLanguage(event.target.value)}
            disabled={disabled}
          >
            {["English", "Japanese", "Chinese"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Level
          <select
            value={props.level}
            onChange={(event) => props.setLevel(event.target.value)}
            disabled={disabled}
          >
            {["Beginner", "Intermediate", "Advanced"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Topic
          <select
            value={props.topic}
            onChange={(event) => props.setTopic(event.target.value)}
            disabled={disabled}
          >
            {[
              "General",
              "Travel",
              "Daily Life",
              "Business",
              "Academic",
              "Shopping",
            ].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="speaking-phrase-heading">
        <span className="workspace-eyebrow" id="practice-phrase-title">
          Your phrase for today
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={props.generate}
          disabled={disabled}
        >
          <RefreshCw
            size={14}
            className={props.generating ? "animate-spin" : ""}
          />
          <span className="ml-2">New phrase</span>
        </Button>
      </div>
      {props.generating ? (
        <div
          className="speaking-phrase-skeleton animate-pulse"
          role="status"
          aria-label="Creating your practice phrase"
        >
          <span />
          <span />
        </div>
      ) : props.phrase ? (
        <>
          <h2 className="speaking-phrase">“{props.phrase}”</h2>
          {props.translation && (
            <p className="speaking-translation">{props.translation}</p>
          )}
          {props.explanation && (
            <p className="speaking-explanation">{props.explanation}</p>
          )}
          <Button
            variant="outline"
            onClick={props.listen}
            disabled={disabled}
            className="mt-5"
          >
            <Volume2 size={17} className="mr-2" />
            Listen first
          </Button>
        </>
      ) : (
        <p className="text-sm text-slate-400">
          Create a phrase to begin your speaking practice.
        </p>
      )}
    </section>
  );
}
