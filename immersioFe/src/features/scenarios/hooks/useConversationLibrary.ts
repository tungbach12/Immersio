import { useState } from "react";
import { useScenarioList } from "@/hooks/useScenarioList";

function initialLanguage() {
  const saved = localStorage.getItem("practice_language");
  if (saved) return saved;
  const onboarding = localStorage.getItem("onboarding_language")?.toLowerCase();
  return (
    {
      english: "English",
      japanese: "Japanese",
      chinese: "Chinese",
      french: "French",
    }[onboarding || ""] || "English"
  );
}

export function useConversationLibrary() {
  const source = useScenarioList();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [language, setLanguage] = useState(initialLanguage);
  const categories = [
    "All",
    ...new Set(
      source.scenarios.map((scenario) => scenario.category).filter(Boolean),
    ),
  ];
  const search = query.trim().toLowerCase();
  const filtered = source.scenarios.filter(
    (scenario) =>
      (category === "All" || scenario.category === category) &&
      `${scenario.title} ${scenario.description}`
        .toLowerCase()
        .includes(search),
  );
  return {
    ...source,
    query,
    setQuery,
    category,
    setCategory,
    language,
    categories,
    filtered,
    chooseLanguage: (value: string) => {
      setLanguage(value);
      localStorage.setItem("practice_language", value);
    },
    clearFilters: () => {
      setQuery("");
      setCategory("All");
    },
  };
}
