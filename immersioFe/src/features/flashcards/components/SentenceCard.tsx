import type React from "react";
import type { GeneratedCardContent } from "../lib/cardPayload";

export function SentenceFront({ content }: { content: GeneratedCardContent }) {
  const rawCloze = content.cloze_sentence || "";
  const cleanedCloze = rawCloze.replace(/\{\{?c\d+::(.*?)\}\}?/g, "[ ... ]");
  const clozeParts: React.ReactNode[] = [];
  const clozeRegex = /\{\{?c\d+::(.*?)\}\}?/g;
  let lastIndex = 0;
  let match;
  while ((match = clozeRegex.exec(rawCloze)) !== null) {
    clozeParts.push(rawCloze.substring(lastIndex, match.index));
    clozeParts.push(
      <span
        key={match.index}
        className="px-2.5 py-0.5 mx-1 rounded-lg bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 font-extrabold tracking-wide"
      >
        [ ... ]
      </span>,
    );
    lastIndex = clozeRegex.lastIndex;
  }
  clozeParts.push(rawCloze.substring(lastIndex));
  return (
    <div className="flex flex-col items-center justify-center h-full py-4 text-center">
      <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-5">
        Điền vào chỗ trống
      </span>
      <h3 className="text-xl md:text-2xl font-bold text-card-foreground text-center leading-relaxed px-1 whitespace-pre-wrap">
        {clozeParts.length > 1
          ? clozeParts
          : rawCloze.replace(clozeRegex, "[ ... ]")}
      </h3>
      {content.phrase_meaning && (
        <p className="text-xs text-slate-400 mt-6 max-w-[280px] leading-relaxed font-semibold">
          💡 Gợi ý:{" "}
          <span className="text-slate-200 font-bold">
            {content.phrase_meaning}
          </span>
        </p>
      )}
      {content.translation && (
        <p className="text-[10px] text-slate-500 mt-3 max-w-[280px] leading-normal font-bold italic">
          "{content.translation}"
        </p>
      )}
    </div>
  );
}
export function SentenceBack({ content }: { content: GeneratedCardContent }) {
  const rawCloze = content.cloze_sentence || "";
  const cleanedCloze = rawCloze.replace(/\{\{?c\d+::(.*?)\}\}?/g, "[ ... ]");
  const clozeParts: React.ReactNode[] = [];
  const clozeRegex = /\{\{?c\d+::(.*?)\}\}?/g;
  let lastIndex = 0;
  let match;
  while ((match = clozeRegex.exec(rawCloze)) !== null) {
    clozeParts.push(rawCloze.substring(lastIndex, match.index));
    clozeParts.push(
      <span
        key={match.index}
        className="px-2.5 py-0.5 mx-1 rounded-lg bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 font-extrabold tracking-wide"
      >
        [ ... ]
      </span>,
    );
    lastIndex = clozeRegex.lastIndex;
  }
  clozeParts.push(rawCloze.substring(lastIndex));
  const fullText = content.full_sentence || rawCloze.replace(clozeRegex, "$1");
  const target = content.target_phrase || "";
  let highlightedSentence: React.ReactNode = fullText;
  if (target) {
    const idx = fullText.toLowerCase().indexOf(target.toLowerCase());
    if (idx !== -1) {
      highlightedSentence = (
        <>
          {fullText.substring(0, idx)}
          <span className="underline decoration-indigo-400 decoration-wavy underline-offset-4 font-black bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-lg border border-indigo-500/25">
            {fullText.substring(idx, idx + target.length)}
          </span>
          {fullText.substring(idx + target.length)}
        </>
      );
    }
  }
  return (
    <div className="h-full flex flex-col justify-between py-2 text-center select-text">
      <div className="overflow-y-auto custom-scrollbar scrollbar-hide pr-1 space-y-4">
        <div className="space-y-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 leading-none">
            Câu hoàn chỉnh
          </span>
          <h3 className="text-lg md:text-xl font-bold text-card-foreground text-center leading-relaxed px-1">
            "{highlightedSentence}"
          </h3>
          {content.translation && (
            <p className="text-xs text-slate-400 leading-normal max-w-[300px] mx-auto font-bold">
              "{content.translation}"
            </p>
          )}
        </div>

        <div className="w-12 h-[1px] bg-white/10 rounded-full mx-auto" />

        {target && (
          <div className="bg-slate-955/40 border border-white/5 rounded-2xl p-4 text-left">
            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block mb-1">
              Cụm từ trọng tâm
            </span>
            <p className="text-sm font-black text-card-foreground italic">
              {target}
            </p>
            {content.phrase_meaning && (
              <p className="text-xs text-slate-300 dark:text-slate-400 leading-relaxed mt-1 font-semibold">
                👉 {content.phrase_meaning}
              </p>
            )}
            {content.context_note && (
              <p className="text-[10px] text-slate-500 leading-normal mt-2 pt-2 border-t border-white/5 font-semibold">
                📝 Chú ý ngữ cảnh: {content.context_note}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
