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
    image: "/ScenariosImage/AskForDirection.webp",
    context: "You are a tourist lost in Shibuya, Tokyo. You are looking for Shibuya Crossing. Ask the user for directions. The user is a local who will provide directions. Respond naturally to their instructions and ask follow-up questions if needed (e.g., about Hachiko Statue).",
    initialMessage: "Excuse me! Could you tell me how to get to Shibuya Crossing?",
    avatar: "/ScenariosImage/AskForDirection.webp",
    bg: "/ScenariosImage/AskForDirection.webp",
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
    image: "https://picsum.photos/seed/konbini/400/300",
    context: "You are a clerk at a Japanese convenience store (Konbini). The user is buying a bento box and a drink. Ask if they want the bento heated up (atatamemasu ka?), if they need chopsticks (ohashi wa otsukai ni narimasu ka?), and handle the payment. End with 'Arigatou gozaimashita'.",
    initialMessage: "Irasshaimase! Konbini e youkoso. Pointo kaado wa omochi desu ka?",
    avatar: "https://picsum.photos/seed/clerk/800/800",
    bg: "https://picsum.photos/seed/store/1920/1080",
    modes: ["2d", "ar"]
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
    image: "/ScenariosImage/OrderingCoffee.jpg",
    context: "You are a barista at a coffee shop. The user is ordering coffee. Be friendly and helpful.",
    initialMessage: "Hi there! What can I get for you today?",
    avatar: "/ScenariosImage/OrderingCoffee.jpg",
    bg: "/ScenariosImage/OrderingCoffee.jpg",
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
    image: "https://picsum.photos/seed/dimsum/400/300",
    context: "You are a waiter at a famous dim sum restaurant in Shanghai. The user is a customer. Recommend some popular dishes like Xiao Long Bao and Har Gow. Ask how many people are in their party and if they want tea.",
    initialMessage: "您好！欢迎光临。请问几位？要喝什么茶？",
    avatar: "https://picsum.photos/seed/waiter_cn/800/800",
    bg: "https://picsum.photos/seed/restaurant_cn/1920/1080",
    modes: ["2d"]
  }
];
