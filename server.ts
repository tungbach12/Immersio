import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import http from "http";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);

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
        
        // Try to parse as JSON if possible
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
      console.log(`Successfully received audio buffer: ${arrayBuffer.byteLength} bytes`);
      const buffer = Buffer.from(arrayBuffer);
      
      res.set("Content-Type", "audio/wav");
      res.send(buffer);

    } catch (error: any) {
      console.error("Groq TTS Proxy Error:", error);
      res.status(500).json({ 
        error: "Internal Server Error", 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // API Route for Groq Chat
  app.post("/api/chat", async (req, res) => {
    const { messages, model, temperature, response_format } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    console.log(`[Groq Chat] Request received for model: ${model || "llama-3.3-70b-versatile"}`);

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
          stream: false // Non-streaming for simplicity in standard fetch
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Groq Chat] API Error: ${response.status}`, errorText);
        return res.status(response.status).json({ error: "Groq Chat Error", details: errorText });
      }

      const data = await response.json();
      console.log(`[Groq Chat] Success: ${data.choices?.[0]?.message?.content?.substring(0, 50)}...`);
      res.json(data);
    } catch (error: any) {
      console.error("[Groq Chat] Proxy Error:", error);
      res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
  });

  // API Route for Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: {
          server: server
        }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    const path = await import("path");
    const { fileURLToPath } = await import("url");
    
    // In ES modules, we need to derive __dirname
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    // Serve static files from the dist directory
    app.use(express.static(path.join(__dirname, "dist")));
    
    // SPA fallback: redirect all non-API requests to index.html
    app.get("*", (req, res) => {
      if (!req.path.startsWith("/api/")) {
        res.sendFile(path.join(__dirname, "dist", "index.html"));
      }
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
