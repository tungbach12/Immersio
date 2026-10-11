import { cn } from "@/lib/utils";

export function FlashcardTag({ tag }: { tag?: string }) {
  const normalized = tag?.toLowerCase();
  const grammar = normalized === "grammar" || normalized === "ngữ pháp";
  const context = ["cải thiện", "improvement", "sentence", "câu"].includes(
    normalized || "",
  );
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1 text-[10px] font-medium",
        grammar
          ? "border-primary/20 bg-primary/10 text-primary"
          : context
            ? "border-indigo-500/20 bg-indigo-500/10 text-indigo-400"
            : "border-amber-500/20 bg-amber-500/10 text-amber-700",
      )}
    >
      {grammar ? "Grammar" : context ? "In context" : "Vocabulary"}
    </span>
  );
}
