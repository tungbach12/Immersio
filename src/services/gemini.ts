export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export async function generateScenarioResponse(
  history: ChatMessage[],
  scenarioContext: string,
  userMessage: string
): Promise<string> {
  try {
    const messages = [
      {
        role: "system",
        content: `You are a roleplay character in a language learning app called IMMERSIO.
        
        SCENARIO CONTEXT:
        ${scenarioContext}
        
        INSTRUCTIONS:
        1. Stay in character at all times.
        2. Keep responses concise (1-3 sentences).
        3. Prioritize natural conversation flow.
        4. Do not break character.`
      },
      ...history.map(msg => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.text
      })),
      { role: "user", content: userMessage }
    ];

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages })
    });

    if (!response.ok) throw new Error("AI request failed");

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "I'm sorry, I didn't get that.";
  } catch (error) {
    console.error("Groq Chat Error:", error);
    return "Sorry, I'm having trouble connecting. Let's try again.";
  }
}

export async function getCorrection(userText: string, targetLanguage: string = "English"): Promise<{corrected: string, explanation: string}> {
  try {
    const messages = [
      {
        role: "system",
        content: `Analyze the sentence spoken by a language learner in ${targetLanguage}. 
        Return a JSON object with "corrected" (natural version) and "explanation" (brief note or "Perfect!"). 
        The output must be strictly valid JSON.`
      },
      { role: "user", content: userText }
    ];

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        messages,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) throw new Error(`Correction API error: ${response.status}`);
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Correction: Empty response content");
    
    return JSON.parse(content);
  } catch (e) {
    console.error("Correction Parsing Error:", e);
    return { corrected: userText, explanation: "Could not analyze sentence at this time." };
  }
}

export async function generateFeedback(history: ChatMessage[], scenarioContext: string): Promise<string> {
  try {
    const messages = [
      {
        role: "system",
        content: "Analyze the conversation and provide encouraging feedback (2-3 paragraphs) for a language learner. Highlight strengths and areas for improvement."
      },
      {
        role: "user",
        content: `Context: ${scenarioContext}\n\nHistory:\n${history.map(msg => `${msg.role}: ${msg.text}`).join("\n")}`
      }
    ];

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Excellent practice today!";
  } catch (e) {
    console.error(e);
    return "Great effort! Keep practicing!";
  }
}

export interface Flashcard {
  front: string;
  back: string;
  explanation?: string;
}

export async function generateFlashcards(history: ChatMessage[], option: "grammar" | "vocabulary" | "improvement"): Promise<Flashcard[]> {
  try {
    let focus = option === "grammar" ? "grammar rules/corrections" : option === "vocabulary" ? "key words/idioms" : "more natural phrasing";

    const messages = [
      {
        role: "system",
        content: `Analyze the conversation and generate 3-5 flashcards focusing on ${focus}. 
        Return a JSON object with a "flashcards" key containing an array of objects with "front", "back", and "explanation".
        The output must be strictly valid JSON.`
      },
      {
        role: "user",
        content: history.map(msg => `${msg.role}: ${msg.text}`).join("\n")
      }
    ];

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        messages,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) throw new Error(`Flashcard API error: ${response.status}`);

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Flashcards: Empty response content");
    
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed;
    if (parsed.flashcards && Array.isArray(parsed.flashcards)) return parsed.flashcards;
    
    return [];
  } catch (e) {
    console.error("Flashcard Generation Error:", e);
    return [];
  }
}

export async function generateSpeech(text: string): Promise<string | null> {
    // Redirect to the existing Groq TTS service via AppLayout/ScenarioDetail patterns if needed,
    // but for simplicity, we provide a unified way to fetch it if some old code still calls this.
    try {
        const response = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        });
        if (!response.ok) return null;
        const arrayBuffer = await response.arrayBuffer();
        return btoa(new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ""));
    } catch (e) {
        return null;
    }
}
