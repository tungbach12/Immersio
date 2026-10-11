import { Search, X } from "lucide-react";

interface ConversationFiltersProps {
  query: string;
  onQueryChange: (value: string) => void;
  language: string;
  onLanguageChange: (value: string) => void;
  category: string;
  categories: string[];
  onCategoryChange: (value: string) => void;
  showCategories: boolean;
  resultCount: number;
}

export function ConversationFilters({
  query,
  onQueryChange,
  language,
  onLanguageChange,
  category,
  categories,
  onCategoryChange,
  showCategories,
  resultCount,
}: ConversationFiltersProps) {
  return (
    <>
      <div className="workspace-library-controls">
        <div className="workspace-search">
          <Search size={18} />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Find a conversation…"
            aria-label="Search conversations"
          />
          {query && (
            <button
              type="button"
              className="workspace-clear-search"
              onClick={() => onQueryChange("")}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <label className="workspace-select-label">
          I’m practising
          <select
            value={language}
            onChange={(event) => onLanguageChange(event.target.value)}
          >
            {["English", "Japanese", "Chinese", "French"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      {showCategories && (
        <>
          <div
            className="workspace-category-list"
            role="group"
            aria-label="Conversation categories"
          >
            {categories.map((item) => (
              <button
                type="button"
                key={item}
                aria-pressed={category === item}
                onClick={() => onCategoryChange(item)}
              >
                {item === "All" ? "All conversations" : item}
              </button>
            ))}
          </div>
          <p className="workspace-result-count" aria-live="polite">
            {resultCount} {resultCount === 1 ? "conversation" : "conversations"}{" "}
            to explore{category !== "All" ? ` · ${category}` : ""}
          </p>
        </>
      )}
    </>
  );
}
