export type ChatMessage = {
  role: "user" | "model";
  text: string;
  correction?: { corrected: string; explanation: string };
  pronunciationScore?: number;
};
