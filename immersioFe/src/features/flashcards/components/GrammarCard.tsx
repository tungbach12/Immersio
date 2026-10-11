import type React from "react";
import type { GeneratedCardContent } from "../lib/cardPayload";

export function GrammarFront({ content }: { content: GeneratedCardContent }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-4 text-center">
      <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
        Cấu trúc ngữ pháp
      </span>
      <h3 className="text-2xl md:text-3xl font-black text-card-foreground tracking-tight leading-tight italic font-display px-2">
        {content.title}
      </h3>
      {content.usage && (
        <p className="text-xs text-slate-400 max-w-[280px] mt-4 leading-relaxed font-semibold">
          {content.usage}
        </p>
      )}
      {content.signal_words?.length > 0 && (
        <div className="mt-5 flex flex-wrap justify-center gap-1.5 max-w-[280px]">
          {content.signal_words.map((w: string) => (
            <span
              key={w}
              className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[9px] text-slate-450 font-bold uppercase tracking-wider"
            >
              {w}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
export function GrammarBack({ content }: { content: GeneratedCardContent }) {
  return (
    <div className="h-full flex flex-col justify-between py-2 text-center select-text">
      <div className="overflow-y-auto custom-scrollbar scrollbar-hide pr-1 space-y-4">
        <div>
          <h3 className="text-xl font-black text-card-foreground italic tracking-tight font-display">
            {content.title}
          </h3>
          {content.usage && (
            <p className="text-[11px] text-slate-400 mt-1 max-w-[300px] mx-auto leading-normal font-semibold">
              {content.usage}
            </p>
          )}
        </div>

        <div className="w-12 h-[1px] bg-white/10 rounded-full mx-auto" />

        {content.formula?.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">
              Cấu trúc công thức
            </span>
            <div className="space-y-1.5">
              {content.formula.map((f, idx: number) => (
                <div
                  key={idx}
                  className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-left"
                >
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block leading-none mb-1">
                    {f.form}
                  </span>
                  <code className="text-xs text-card-foreground font-mono font-bold leading-normal">
                    {f.structure}
                  </code>
                </div>
              ))}
            </div>
          </div>
        )}

        {content.common_mistakes && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-[1.25rem] p-3 text-left">
            <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest block mb-1">
              ⚠️ Lỗi thường gặp
            </span>
            <p className="text-[10px] text-amber-300 leading-relaxed font-bold">
              {content.common_mistakes}
            </p>
          </div>
        )}

        {content.examples?.[0] && (
          <div className="mt-4 bg-slate-955/40 border border-white/5 p-4 rounded-[1.5rem] text-left">
            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest block mb-1.5">
              Ví dụ áp dụng
            </span>
            <p className="text-xs text-card-foreground leading-relaxed font-bold">
              "{content.examples[0].sentence}"
            </p>
            {content.examples[0].translation && (
              <p className="text-[10px] text-slate-400 leading-normal mt-1 font-semibold">
                {content.examples[0].translation}
              </p>
            )}
            {content.examples[0].note && (
              <p className="text-[9px] text-indigo-300 leading-normal mt-1.5 pt-1.5 border-t border-white/5 font-semibold">
                💡 Chú ý: {content.examples[0].note}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
