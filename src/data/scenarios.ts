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
}

export const scenarios: Scenario[] = [
  {
    id: "1",
    title: "Ordering Coffee in Paris",
    language: "French",
    level: "Beginner",
    category: "Travel",
    description: "Practice ordering your favorite drink and pastry at a busy Parisian café. Focus on politeness and specific vocabulary.",
    rating: 4.8,
    users: "2.4k",
    duration: "10 mins",
    image: "https://picsum.photos/seed/coffee/400/300",
    context: "You are a barista at a busy café in Paris named 'Le Petit Coin'. The user is a customer ordering coffee and a pastry. You are polite but busy. Ask what they want, confirm the order, ask if they want it for here or to go, and tell them the price (total is usually around 8-12 euros).",
    initialMessage: "Bonjour ! Bienvenue à Le Petit Coin. Qu'est-ce que je vous sers aujourd'hui ?",
    avatar: "https://picsum.photos/seed/barista/800/800",
    bg: "https://picsum.photos/seed/cafe/1920/1080",
    modes: ["2d", "ar"]
  },
  {
    id: "2",
    title: "Job Interview at Tech Corp",
    language: "English",
    level: "Advanced",
    category: "Business",
    description: "Master common interview questions, professional etiquette, and how to describe your strengths and weaknesses.",
    rating: 4.9,
    users: "5.1k",
    duration: "20 mins",
    image: "https://picsum.photos/seed/office/400/300",
    context: "You are a hiring manager at a major tech company. You are interviewing the user for a Senior Developer position. Ask about their experience, a challenging project they worked on, and why they want to work here. Be professional but encouraging.",
    initialMessage: "Hello, thanks for coming in today. I've reviewed your resume and I'm impressed. To start, could you tell me a little bit about yourself?",
    avatar: "https://picsum.photos/seed/manager/800/800",
    bg: "https://picsum.photos/seed/office_interior/1920/1080",
    modes: ["2d"]
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
    id: "4",
    title: "Asking for Directions in Tokyo",
    language: "Japanese",
    level: "Beginner",
    category: "Travel",
    description: "Learn how to ask for directions to the nearest train station or landmark politely.",
    rating: 4.6,
    users: "3.2k",
    duration: "12 mins",
    image: "https://picsum.photos/seed/tokyo/400/300",
    context: "You are a helpful local in Tokyo. The user is lost and asking for directions to Shinjuku Station. Give them clear instructions (go straight, turn left at the signal, etc.) but pretend to be a bit in a rush but still polite.",
    initialMessage: "Sumimasen? Nanika komari desu ka?",
    avatar: "https://picsum.photos/seed/local/800/800",
    bg: "https://picsum.photos/seed/street/1920/1080",
    modes: ["2d"]
  },
  {
    id: "5",
    title: "Networking Event Mixer",
    language: "English",
    level: "Intermediate",
    category: "Social",
    description: "Practice small talk and professional introductions at a casual business mixer.",
    rating: 4.5,
    users: "1.5k",
    duration: "15 mins",
    image: "https://picsum.photos/seed/party/400/300",
    context: "You are a fellow attendee at a networking event. You are friendly and curious. Ask the user what they do, how they are finding the event, and try to find common ground.",
    initialMessage: "Hi there! I don't think we've met yet. I'm Alex. Enjoying the event so far?",
    avatar: "https://picsum.photos/seed/alex/800/800",
    bg: "https://picsum.photos/seed/event/1920/1080",
    modes: ["2d", "ar"]
  },
  {
    id: "6",
    title: "University Admission Interview",
    language: "English",
    level: "Advanced",
    category: "Academic",
    description: "Prepare for a university admission interview. Discuss your academic goals and research interests.",
    rating: 4.8,
    users: "900",
    duration: "25 mins",
    image: "https://picsum.photos/seed/university/400/300",
    context: "You are a university professor conducting an admission interview. Ask the user about their academic background, why they chose this specific program, and their future research goals.",
    initialMessage: "Welcome. Please take a seat. We've read your application with great interest. Why did you choose to apply to our program specifically?",
    avatar: "https://picsum.photos/seed/professor/800/800",
    bg: "https://picsum.photos/seed/library/1920/1080",
    modes: ["2d"]
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
    image: "/assets/Shinji.png",
    context: "You are a barista at a coffee shop. The user is ordering coffee. Be friendly and helpful.",
    initialMessage: "Hi there! What can I get for you today?",
    avatar: "/assets/Shinji.png",
    bg: "/assets/coffeeshop background.png",
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
  },
  {
    id: "9",
    title: "Bargaining at a Silk Market",
    language: "Chinese",
    level: "Intermediate",
    category: "Travel",
    description: "Learn the art of bargaining for silk and souvenirs at a local Chinese market.",
    rating: 4.6,
    users: "2.3k",
    duration: "15 mins",
    image: "https://picsum.photos/seed/market/400/300",
    context: "You are a vendor at a silk market in Beijing. You are selling a beautiful silk scarf. Start with a high price (e.g., 500 RMB) and let the user bargain with you. Be friendly but firm, and eventually agree on a fair price (around 150-200 RMB).",
    initialMessage: "美女/帅哥，来看看这个真丝围巾，质量非常好！只要五百块，怎么样？",
    avatar: "https://picsum.photos/seed/vendor_cn/800/800",
    bg: "https://picsum.photos/seed/market_cn/1920/1080",
    modes: ["2d", "ar"]
  }
];
