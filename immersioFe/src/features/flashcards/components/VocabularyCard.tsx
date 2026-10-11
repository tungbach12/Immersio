import type React from "react";
import type { GeneratedCardContent } from "../lib/cardPayload";

export function VocabularyFront({
  content,
}: {
  content: GeneratedCardContent;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-4 text-center">
      <h3 className="text-4xl md:text-5xl font-black text-card-foreground tracking-tight leading-none italic font-display">
        {content.word}
      </h3>
      {content.part_of_speech && (
        <span className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
          {content.part_of_speech}
        </span>
      )}
      {content.phonetic && (
        <p className="text-sm font-semibold text-slate-400 mt-2 font-mono tracking-wide">
          {content.phonetic}
        </p>
      )}
    </div>
  );
}
export function VocabularyBack({ content }: { content: GeneratedCardContent }) {
  return (
    <div className="h-full flex flex-col justify-between py-2 text-center select-text">
      <div className="overflow-y-auto custom-scrollbar scrollbar-hide pr-1 space-y-4">
        <div>
          <h3 className="text-2xl font-black text-card-foreground italic tracking-tight font-display">
            {content.word}
          </h3>
          <div className="flex items-center justify-center gap-2 mt-1.5">
            {content.part_of_speech && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-indigo-500/25 text-indigo-300 border border-indigo-500/20">
                {content.part_of_speech}
              </span>
            )}
            {content.phonetic && (
              <span className="text-xs text-slate-450 font-mono">
                {content.phonetic}
              </span>
            )}
          </div>
        </div>

        <div className="w-12 h-[1px] bg-white/10 rounded-full mx-auto" />

        <div className="space-y-1">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">
            Nghĩa tiếng Việt
          </span>
          <p className="text-lg font-black text-emerald-400 tracking-tight leading-snug">
            {content.meaning}
          </p>
        </div>

        {content.definition_en && (
          <div className="space-y-1">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">
              Định nghĩa tiếng Anh
            </span>
            <p className="text-xs text-slate-300 dark:text-slate-400 leading-relaxed max-w-xs mx-auto font-medium">
              {content.definition_en}
            </p>
          </div>
        )}

        {(content.synonyms?.length > 0 || content.antonyms?.length > 0) && (
          <div className="flex flex-wrap gap-2 justify-center pt-1">
            {content.synonyms &&
              content.synonyms.map((s: string) => (
                <span
                  key={s}
                  className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-bold text-indigo-300"
                >
                  ={s}
                </span>
              ))}
            {content.antonyms &&
              content.antonyms.map((a: string) => (
                <span
                  key={a}
                  className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-bold text-slate-450"
                >
                  ≠{a}
                </span>
              ))}
          </div>
        )}

        {content.examples?.[0] && (
          <div className="mt-4 bg-slate-955/40 border border-white/5 p-4 rounded-[1.5rem] text-left">
            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block mb-1.5">
              Ví dụ
            </span>
            <p className="text-xs text-card-foreground leading-relaxed italic font-semibold">
              "{content.examples[0].sentence}"
            </p>
            {content.examples[0].translation && (
              <p className="text-[10px] text-slate-400 leading-normal mt-1 font-bold">
                {content.examples[0].translation}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
