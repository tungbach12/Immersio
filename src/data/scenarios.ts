export interface Scenario {
  id: string;
  title: string;
  language: string;
  level: string;
  category: string;
  description: string;
  rating: number;
  users: string;
  duration: string;
  image: string;
  context: string;
  initialMessage: string;
  avatar: string;
  bg: string;
  modes: ("2d" | "ar")[];
  isNavigation?: boolean;
  items?: { id: string, name: string, price: number, image: string, icon?: string }[];
}

export const scenarios: Scenario[] = [
  {
    id: "0",
    title: "Discovery: Shibuya Navigation",
    language: "English",
    level: "Beginner",
    category: "Navigation",
    description: "Learn to navigate Tokyo's busiest district using AR directions and interactive maps.",
    rating: 5.0,
    users: "New",
    duration: "15 mins",
    image: "/ScenariosImage/Discovery shibuya navigation background.jpg",
    context: "You are a tourist lost in Shibuya, Tokyo. You are looking for Shibuya Crossing. Ask the user for directions. The user is a local who will provide directions. Respond naturally to their instructions and ask follow-up questions if needed (e.g., about Hachiko Statue).",
    initialMessage: "Excuse me! Could you tell me how to get to Shibuya Crossing?",
    avatar: "/ScenariosImage/Discovery shibuya navigation character.png",
    bg: "/ScenariosImage/Discovery shibuya navigation background.jpg",
    modes: ["ar"],
    isNavigation: true
  },
  {
    id: "3",
    title: "Konbini Late Night Run",
    language: "Japanese",
    level: "Intermediate",
    category: "Travel",
    description: "Navigate a Japanese convenience store interaction. Ask for heated bento, chopsticks, and handle payment.",
    rating: 4.7,
    users: "1.8k",
    duration: "8 mins",
    image: "/ScenariosImage/Konbini late night run Background.jpg",
    context: "あなたは日本のコンビニの店員です。ユーザーがお弁当と飲み物を買っています。お弁当を温めるか（「お弁当温めますか？」）、お箸が必要か（「お箸はお使いになりますか？」）を尋ね、支払いを担当してください。最後は「ありがとうございました」で締めてください。",
    initialMessage: "いらっしゃいませ！コンビニへようこそ。ポイントカードはお持ちですか？",
    avatar: "/ScenariosImage/Konbini late night run character.png",
    bg: "/ScenariosImage/Konbini late night run Background.jpg",
    modes: ["2d", "ar"],
    items: [
      { id: "bento", name: "鮭弁当", price: 540, image: "https://images.unsplash.com/photo-1580442151529-343f2f5e0e37?q=80&w=2670&auto=format&fit=crop", icon: "Utensils" },
      { id: "onigiri", name: "ツナマヨおにぎり", price: 120, image: "https://images.unsplash.com/photo-1604328701720-3de131014e76?q=80&w=2670&auto=format&fit=crop", icon: "Triangle" },
      { id: "tea", name: "お茶", price: 150, image: "https://images.unsplash.com/photo-1594631252845-29fc4586216c?q=80&w=2574&auto=format&fit=crop", icon: "Coffee" },
      { id: "chicken", name: "ファミチキ", price: 220, image: "https://upload.wikimedia.org/wikipedia/commons/e/ea/Famichiki_of_FamilyMart.jpg", icon: "Flame" },
      { id: "noodle", name: "カップヌードル", price: 180, image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=2100&auto=format&fit=crop", icon: "Bowl" }
    ]
  },
  {
    id: "7",
    title: "Ordering Coffee (English)",
    language: "English",
    level: "Beginner",
    category: "Travel",
    description: "Practice ordering coffee in English with Shinji at a coffee shop.",
    rating: 4.9,
    users: "1.2k",
    duration: "10 mins",
    image: "/ScenariosImage/Ordering coffee background.jpg",
    context: "You are a barista at a coffee shop. The user is ordering coffee. Be friendly and helpful.",
    initialMessage: "Hi there! What can I get for you today?",
    avatar: "/ScenariosImage/Ordering coffee character.png",
    bg: "/ScenariosImage/Ordering coffee background.jpg",
    modes: ["2d", "ar"]
  },
  {
    id: "8",
    title: "Ordering Dim Sum in Shanghai",
    language: "Chinese",
    level: "Beginner",
    category: "Travel",
    description: "Practice ordering delicious dim sum at a traditional restaurant in Shanghai.",
    rating: 4.7,
    users: "1.1k",
    duration: "12 mins",
    image: "/ScenariosImage/Ordering dim sum in shanghai background.jpg",
    context: "You are a waiter at a famous dim sum restaurant in Shanghai. The user is a customer. Recommend some popular dishes like Xiao Long Bao and Har Gow. Ask how many people are in their party and if they want tea.",
    initialMessage: "您好！欢迎光临。请问几位？要喝什么茶？",
    avatar: "/ScenariosImage/Ordering dim sum in shanghai character.png",
    bg: "/ScenariosImage/Ordering dim sum in shanghai background.jpg",
    modes: ["2d"]
  }
];
