import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || "";
let ai: GoogleGenAI | null = null;

if (apiKey) {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (error) {
    console.warn("Failed to initialize GoogleGenAI:", error);
  }
} else {
  console.warn("GEMINI_API_KEY is missing. AI features will be disabled.");
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export async function generateScenarioResponse(
  history: ChatMessage[],
  scenarioContext: string,
  userMessage: string
): Promise<string> {
  if (!apiKey) {
    return "Error: Gemini API Key is missing. Please configure it in .env.";
  }

  try {
    const model = "gemini-3-flash-preview"; // Fast model for chat
    
    const systemInstruction = `
      You are a roleplay character in a language learning app called IMMERSIO.
      
      SCENARIO CONTEXT:
      ${scenarioContext}
      
      INSTRUCTIONS:
      1. Stay in character at all times.
      2. Keep responses concise (1-3 sentences) to encourage conversation.
      3. Correct major grammatical errors gently if they impede understanding, but prioritize flow.
      4. If the user is stuck, provide a subtle hint in the response.
      5. Do not break character to say you are an AI.
    `;

    if (!ai) {
      return "Error: Gemini AI client not initialized (missing API Key).";
    }

    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: systemInstruction,
      },
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      })),
    });

    const result = await chat.sendMessage({ message: userMessage });
    return result.text || "I didn't catch that. Could you say it again?";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I'm having trouble connecting to the server. Please try again.";
  }
}

export async function getCorrection(userText: string, targetLanguage: string = "English"): Promise<{corrected: string, explanation: string}> {
    if (!apiKey) return { corrected: "", explanation: "API Key missing" };

    try {
        const model = "gemini-3-flash-preview";
        const prompt = `
            Analyze the following sentence spoken by a language learner in ${targetLanguage}: "${userText}"
            
            Return a JSON object with:
            1. "corrected": The corrected version of the sentence (natural sounding).
            2. "explanation": A brief explanation of the error (if any), or "Perfect!" if it was correct.
        `;
        
        if (!ai) throw new Error("AI client not initialized");
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        
        const text = response.text;
        if (!text) throw new Error("No response");
        return JSON.parse(text);
    } catch (e) {
        console.error(e);
        return { corrected: userText, explanation: "Could not analyze." };
    }
}

export async function generateFeedback(history: ChatMessage[], scenarioContext: string): Promise<string> {
  if (!apiKey) return "API Key missing";

  try {
    const model = "gemini-3-flash-preview";
    const prompt = `
      Analyze the following conversation history for a language learning scenario:
      Scenario Context: ${scenarioContext}
      
      Conversation:
      ${history.map(msg => `${msg.role === "user" ? "Student" : "AI"}: ${msg.text}`).join("\n")}
      
      Provide a brief, encouraging feedback summary (2-3 paragraphs) for the student. Highlight what they did well and areas for improvement.
    `;
    
    if (!ai) throw new Error("AI client not initialized");
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    
    return response.text || "Good job on completing the scenario!";
  } catch (e) {
    console.error("Feedback generation error:", e);
    return "Great effort! Keep practicing to improve your skills.";
  }
}

export interface Flashcard {
  front: string;
  back: string;
  explanation?: string;
}

export async function generateFlashcards(history: ChatMessage[], option: "grammar" | "vocabulary" | "improvement"): Promise<Flashcard[]> {
  if (!apiKey) return [];

  try {
    const model = "gemini-3-flash-preview";
    
    let focus = "";
    if (option === "grammar") focus = "grammar rules and corrections based on the student's mistakes or complex structures used.";
    else if (option === "vocabulary") focus = "key vocabulary words, idioms, or phrases used in the conversation.";
    else if (option === "improvement") focus = "better, more natural ways to phrase the student's sentences (Sentence Improvement).";

    const prompt = `
      Analyze the following conversation history for a language learning scenario:
      
      Conversation:
      ${history.map(msg => `${msg.role === "user" ? "Student" : "AI"}: ${msg.text}`).join("\n")}
      
      Generate 3 to 5 flashcards focusing on: ${focus}
      
      Return a JSON array of objects, where each object has:
      - "front": The front of the flashcard (e.g., a word, a grammatically incorrect sentence, or a prompt).
      - "back": The back of the flashcard (e.g., the definition, the corrected sentence, or the improved version).
      - "explanation": A brief explanation of the rule or meaning.
    `;
    
    if (!ai) throw new Error("AI client not initialized");
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text);
  } catch (e) {
    console.error("Flashcard generation error:", e);
    return [];
  }
}
export async function generateSpeech(text: string): Promise<string | null> {
    if (!apiKey) return null;

    if (!ai) return null;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: "Puck" },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || null;
    } catch (error) {
        console.error("Gemini TTS Error:", error);
        return null;
    }
}
