import { PageHeading } from "@/components/learning/PageHeading";
import { usePronunciationLab } from "@/features/pronunciation/hooks/usePronunciationLab";
import { PhraseComposer } from "@/features/pronunciation/components/PhraseComposer";
import { RecordingPanel } from "@/features/pronunciation/components/RecordingPanel";
import { PronunciationResult } from "@/features/pronunciation/components/PronunciationResult";

export default function VocalLab() {
  const lab = usePronunciationLab();
  return (
    <div>
      <PageHeading
        eyebrow="Speaking practice"
        title="Find your speaking rhythm."
        description="One phrase, a little listening, and the confidence to say it out loud."
      />
      {lab.error && (
        <p className="learning-inline-error mb-5" role="alert">
          {lab.error}
        </p>
      )}
      <div className="speaking-layout">
        <PhraseComposer {...lab} />
        <RecordingPanel
          recording={lab.recording}
          assessing={lab.assessing}
          disabled={lab.generating || lab.starting || !lab.phrase}
          transcript={lab.transcript}
          onToggle={lab.toggleRecording}
        />
      </div>
      {lab.feedback && <PronunciationResult feedback={lab.feedback} />}
    </div>
  );
}
