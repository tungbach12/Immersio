import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// API Route for Groq TTS
app.post("/api/tts", async (req, res) => {
  const { text, voice } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error("GROQ_API_KEY is missing on server");
    return res.status(500).json({ error: "Server configuration error: API Key missing" });
  }

  try {
    console.log(`Proxying TTS request for text: "${text?.substring(0, 20)}..."`);
    const response = await fetch("https://api.groq.com/openai/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Node.js)",
      },
      body: JSON.stringify({
        model: "canopylabs/orpheus-v1-english",
        input: text,
        voice: voice || "austin",
        response_format: "wav",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq TTS API Error: ${response.status}`, errorText);
      
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        errorJson = { message: errorText };
      }

      return res.status(response.status || 500).json({ 
        error: "Groq API Error", 
        details: errorJson
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    res.set("Content-Type", "audio/wav");
    res.send(buffer);

  } catch (error: any) {
    console.error("Groq TTS Proxy Error:", error);
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: error.message
    });
  }
});

// API Route for Groq Chat
app.post("/api/chat", async (req, res) => {
  const { messages, model, temperature, response_format } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error("[Groq Chat] API Key missing");
    return res.status(500).json({ error: "Server configuration error: Groq API Key missing" });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || "llama-3.3-70b-versatile",
        messages,
        temperature: temperature ?? 0.7,
        max_completion_tokens: 1024,
        response_format: response_format || { type: "text" },
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Groq Chat] API Error: ${response.status}`, errorText);
      return res.status(response.status).json({ error: "Groq Chat Error", details: errorText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("[Groq Chat] Proxy Error:", error);
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

export default app;
