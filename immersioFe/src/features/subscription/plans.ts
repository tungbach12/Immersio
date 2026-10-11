import { Star, Zap, Crown } from "lucide-react";
export const plans = [
  {
    name: "Basic",
    price: "Free",
    description: "Get started with IMMERSIO",
    features: [
      "Standard AI Model (High Speed)",
      "5 Scenarios per day",
      "Grammar & Vocabulary correction",
      "10 Flashcards/day (Vocab only)",
      "Basic Storyline access",
    ],
    icon: Star,
    color: "slate",
    buttonText: "Current Plan",
    popular: false,
  },
  {
    name: "Plus",
    price: "69,000đ",
    period: "/mo",
    description: "Real-world communication & flexibility",
    features: [
      "Advanced AI: Natural dialogue & context",
      "20 Scenarios per day",
      "Pronunciation scoring & analysis",
      "Unlimited Flashcards (Vocab, Grammar)",
      "Interactive 2D Roleplay Experience",
      "5 Storylines + 7 Custom Outfits",
    ],
    icon: Zap,
    color: "indigo",
    buttonText: "Upgrade to Plus",
    popular: true,
  },
  {
    name: "Premium",
    price: "199,000đ",
    period: "/mo",
    description: "The ultimate mentor experience",
    features: [
      "Elite AI: Deep reasoning & metaphors",
      "Unlimited Scenarios",
      "AI Coach: Native-like expressions",
      "Auto-generate cards from mistakes",
      "Long-term NPC Memory (Full history)",
      "Optimized graphics & smooth transitions",
      "All Storylines + Limited Outfits",
    ],
    icon: Crown,
    color: "amber",
    buttonText: "Go Premium",
    popular: false,
  },
];

export const comparisonData = [
  {
    category: "AI Intelligence",
    basic: "Standard Model (High Speed)",
    plus: "Advanced: Natural & Context-aware",
    premium: "Elite: Deep reasoning & Metaphors",
  },
  {
    category: "Practice Intensity",
    basic: "5 scenarios / day",
    plus: "20 scenarios / day",
    premium: "Unlimited",
  },
  {
    category: "Language Skills",
    basic: "Grammar & Vocab fixes",
    plus: "Pronunciation scoring & Analysis",
    premium: "AI Coach: Native-like expressions",
  },
  {
    category: "Flashcard System",
    basic: "10 cards / day (Vocab only)",
    plus: "Unlimited: Vocab, Grammar, Phrases",
    premium: "Unlimited + Auto-generate from errors",
  },
  {
    category: "NPC Memory",
    basic: "Resets after each session",
    plus: "Remembers your profile",
    premium: "Long-term: Full chat history",
  },
  {
    category: "Content & Graphics",
    basic: "1 Basic Storyline",
    plus: "5 Storylines + 7 Custom Outfits",
    premium: "Full Storylines + Limited Assets",
  },
];
export type LearningPlan = (typeof plans)[number];
