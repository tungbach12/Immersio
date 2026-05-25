import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { Switch } from "@/components/ui/Switch";
import { Save, Loader2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { adminService, AiSettings } from "@/services/admin";

const CATALOG_MODELS = [
  { value: "llama-3.3-70b-versatile", name: "Llama 3.3 70B (Groq Default)", desc: "Great all-rounder, excellent Vietnamese support & extremely fast." },
  { value: "nvidia/nemotron-mini-4b-instruct", name: "NVIDIA Nemotron Mini 4B (NVIDIA)", desc: "Optimized SLM. Ultra-low latency, perfect for conversational roleplay." },
  { value: "nvidia/llama-3.1-nemotron-70b-instruct", name: "NVIDIA Llama 3.1 Nemotron 70B", desc: "Superb language correction, evaluation, and precise spelling analyzer." },
  { value: "meta/llama-3.3-70b-instruct", name: "Meta Llama 3.3 70B (NVIDIA)", desc: "Heavy SOTA model, perfect for comprehensive session feedback and reports." },
  { value: "nemotron-mini-4b-instruct", name: "NVIDIA Nemotron Mini 4B (Groq)", desc: "Groq-hosted Nemotron Mini 4B model." },
  { value: "llama-4-maverick-17b-128e-instruct", name: "Meta Llama 4 Maverick 17B", desc: "Multilingual sparse MoE model. Excellent natural flow for dialog." },
  { value: "step-3.5-flash", name: "Stepfun Step 3.5 Flash", desc: "200B reasoning sparse MoE. Superb for logic and sentence analysis." },
  { value: "gemma-3n-e2b-it", name: "Google Gemma 3 2B", desc: "Small model for edge, text, image, and voice tasks." },
  { value: "minimax-m2.7", name: "MiniMax M2.7 230B", desc: "High capacity MoE. Outstanding translation and logical structure." },
  { value: "mistral-nemotron", name: "Mistral Nemotron 12B", desc: "Designed for agentic workflows and complex instruction following." },
  { value: "qwen3-coder-480b-a35b-instruct", name: "Qwen 3 Coder 480B", desc: "Massive Alibaba coder model. Exceptional logic and structured data extraction." },
  { value: "mistral-large-3-675b-instruct-2512", name: "Mistral Large 3 675B", desc: "SOTA heavy MoE, perfect for complex performance reports." },
  { value: "custom", name: "✏️ Custom Model Name...", desc: "Type any custom model identifier manually." }
];

export default function AITuning() {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    adminService.getAiSettings()
      .then((data) => {
        setSettings(data);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load AI configurations from server.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      await adminService.saveAiSettings(settings);
      setSuccessMsg("AI system configuration successfully updated!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const renderModelSelector = (
    label: string,
    sublabel: string,
    value: string,
    onChange: (val: string) => void
  ) => {
    // Check if the current value is one of the catalog models (excluding 'custom')
    const isPredefined = CATALOG_MODELS.some(m => m.value !== "custom" && m.value === value);
    const selectValue = isPredefined ? value : "custom";

    // Find the currently selected model's description for rich UI annotation
    const currentModel = CATALOG_MODELS.find(m => m.value === (isPredefined ? value : "custom"));

    return (
      <div className="p-5 bg-slate-900/40 rounded-2xl border border-white/5 hover:border-white/10 transition-colors flex flex-col gap-3">
        <div>
          <span className="font-extrabold text-xs text-white uppercase tracking-wider block">{label}</span>
          <span className="text-[9px] font-medium text-slate-500">{sublabel}</span>
        </div>
        <div className="flex flex-col gap-2">
          <select
            className="bg-slate-950 text-xs font-bold text-indigo-400 outline-none border border-white/10 p-3 rounded-xl focus:border-indigo-500 w-full"
            value={selectValue}
            onChange={(e) => {
              const selectedVal = e.target.value;
              if (selectedVal === "custom") {
                onChange(""); // let the user type custom value
              } else {
                onChange(selectedVal);
              }
            }}
          >
            {CATALOG_MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.name}
              </option>
            ))}
          </select>

          {!isPredefined && (
            <input
              type="text"
              className="w-full p-3 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-xs bg-slate-950 text-indigo-300 font-mono font-bold leading-none"
              placeholder="Type custom model name (e.g. gpt-4o)..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          )}
        </div>
        {currentModel && (
          <p className="text-[9px] font-semibold text-slate-400 italic">
            {selectValue === "custom" && value ? `Active custom model: "${value}"` : currentModel.desc}
          </p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
        <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Loading AI Parameters...</p>
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 text-center max-w-xl mx-auto my-12">
        <p className="text-red-400 font-bold mb-4">{error}</p>
        <button 
          onClick={() => { setLoading(true); setError(""); }}
          className="px-6 py-2.5 bg-red-500/20 text-red-300 font-semibold rounded-2xl border border-red-500/30 hover:bg-red-500/30 transition-all text-xs"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic">AI TUNING CENTER</h1>
          <p className="text-slate-400 font-bold text-[10px] mt-1 uppercase tracking-[0.2em]">Configure the behavior and cognitive focus of AI NPC tutors</p>
        </div>
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="gap-2 h-12 px-6 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white shadow-glow"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Save Changes
        </Button>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold px-6 py-4 rounded-2xl leading-relaxed">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold px-6 py-4 rounded-2xl leading-relaxed">
          {error}
        </div>
      )}

      {settings && (
        <>
          <Card className="bg-slate-950/45 backdrop-blur-2xl border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-lg font-black text-white italic tracking-tight uppercase">Global System Prompt Directive</CardTitle>
              <CardDescription className="text-slate-500 text-[10px] font-black uppercase tracking-widest">This core instructional prompt is appended to all active roleplay sessions</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <textarea 
                className="w-full h-44 p-5 rounded-2xl border border-white/10 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 font-mono text-xs bg-slate-900/60 text-slate-200 leading-relaxed"
                value={settings.systemPrompt}
                onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-slate-950/45 backdrop-blur-2xl border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-lg font-black text-white italic tracking-tight uppercase">Correction Strictness</CardTitle>
                <CardDescription className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Tune how assertively the LLM criticizes grammar & vocabulary</CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8 space-y-6">
                <div>
                  <div className="flex justify-between mb-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <span>Grammar Sensitivity</span>
                    <span className="text-indigo-400">{settings.grammarSensitivity}%</span>
                  </div>
                  <Slider 
                    value={[settings.grammarSensitivity]} 
                    max={100} 
                    step={1} 
                    onValueChange={(val) => setSettings({ ...settings, grammarSensitivity: val[0] })}
                    className="w-full py-2 [&_.bg-primary]:bg-indigo-500 [&_.border-primary]:border-indigo-500" 
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <span>Vocabulary Suggestions</span>
                    <span className="text-indigo-400">{settings.vocabSensitivity}%</span>
                  </div>
                  <Slider 
                    value={[settings.vocabSensitivity]} 
                    max={100} 
                    step={1} 
                    onValueChange={(val) => setSettings({ ...settings, vocabSensitivity: val[0] })}
                    className="w-full py-2 [&_.bg-primary]:bg-indigo-500 [&_.border-primary]:border-indigo-500" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-950/45 backdrop-blur-2xl border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-lg font-black text-white italic tracking-tight uppercase">Voice & Personality Tone</CardTitle>
                <CardDescription className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Adjust linguistic style configurations</CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8 space-y-6">
                <div className="flex items-center justify-between p-5 bg-slate-900/40 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                  <div>
                    <span className="font-extrabold text-xs text-white uppercase tracking-wider block">Enable Slang/Idioms</span>
                    <span className="text-[9px] font-medium text-slate-500">Inject native phrases</span>
                  </div>
                  <Switch 
                    checked={settings.enableSlang}
                    onCheckedChange={(val) => setSettings({ ...settings, enableSlang: val })}
                    className="data-[state=checked]:bg-indigo-600 data-[state=unchecked]:bg-slate-800"
                  />
                </div>
                <div className="flex items-center justify-between p-5 bg-slate-900/40 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                  <div>
                    <span className="font-extrabold text-xs text-white uppercase tracking-wider block">Speed of Speech</span>
                    <span className="text-[9px] font-medium text-slate-500">NPC voice synthesis rate</span>
                  </div>
                  <select 
                    className="bg-slate-900 text-xs font-bold text-indigo-400 outline-none border border-white/10 p-2.5 rounded-xl focus:border-indigo-500"
                    value={settings.speedOfSpeech}
                    onChange={(e) => setSettings({ ...settings, speedOfSpeech: e.target.value })}
                  >
                    <option value="0.8x (Slow)">0.8x (Slow)</option>
                    <option value="1.0x (Normal)">1.0x (Normal)</option>
                    <option value="1.2x (Fast)">1.2x (Fast)</option>
                  </select>
                </div>
              </CardContent>
             </Card>
          </div>

          <Card className="bg-slate-950/45 backdrop-blur-2xl border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden mt-8">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-lg font-black text-white italic tracking-tight uppercase">Cognitive LLM Engine Configuration</CardTitle>
              <CardDescription className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Select the neural model powering dialogue, grammar corrections, and flashcard generation</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-6">
              
              {/* Presets Selection */}
              <div>
                <span className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest block mb-3">Quick Presets (Auto-configure all tasks)</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    {
                      name: "Groq Default",
                      endpoint: "https://api.groq.com/openai/v1/chat/completions",
                      chat: "llama-3.3-70b-versatile",
                      grammar: "llama-3.3-70b-versatile",
                      feedback: "llama-3.3-70b-versatile",
                      flashcard: "llama-3.3-70b-versatile",
                      phrase: "llama-3.3-70b-versatile"
                    },
                    {
                      name: "NVIDIA NIM",
                      endpoint: "https://integrate.api.nvidia.com/v1/chat/completions",
                      chat: "nvidia/nemotron-mini-4b-instruct",
                      grammar: "nvidia/llama-3.1-nemotron-70b-instruct",
                      feedback: "meta/llama-3.3-70b-instruct",
                      flashcard: "meta/llama-3.3-70b-instruct",
                      phrase: "nvidia/nemotron-mini-4b-instruct"
                    },
                    {
                      name: "StepFun MoE",
                      endpoint: "https://api.stepfun.com/v1/chat/completions",
                      chat: "step-3.5-flash",
                      grammar: "step-3.5-flash",
                      feedback: "step-3.5-flash",
                      flashcard: "step-3.5-flash",
                      phrase: "step-3.5-flash"
                    },
                    {
                      name: "Custom Setup",
                      endpoint: settings.llmEndpoint,
                      chat: settings.modelChat,
                      grammar: settings.modelGrammar,
                      feedback: settings.modelFeedback,
                      flashcard: settings.modelFlashcard,
                      phrase: settings.modelPhrase
                    }
                  ].map((p, idx) => {
                    const isSelected = idx === 3 
                      ? (settings.llmEndpoint !== "https://api.groq.com/openai/v1/chat/completions" && 
                         settings.llmEndpoint !== "https://integrate.api.nvidia.com/v1/chat/completions" &&
                         settings.llmEndpoint !== "https://api.stepfun.com/v1/chat/completions")
                      : (settings.llmEndpoint === p.endpoint && 
                         settings.modelChat === p.chat &&
                         settings.modelGrammar === p.grammar &&
                         settings.modelFeedback === p.feedback &&
                         settings.modelFlashcard === p.flashcard &&
                         settings.modelPhrase === p.phrase);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (idx !== 3) {
                            setSettings({
                              ...settings,
                              llmEndpoint: p.endpoint,
                              modelChat: p.chat,
                              modelGrammar: p.grammar,
                              modelFeedback: p.feedback,
                              modelFlashcard: p.flashcard,
                              modelPhrase: p.phrase
                            });
                          }
                        }}
                        className={`p-4 rounded-2xl border text-center transition-all ${
                          isSelected
                            ? "bg-indigo-600/20 border-indigo-500 text-white font-extrabold shadow-glow-sm"
                            : "bg-slate-900/40 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-200"
                        }`}
                      >
                        <span className="text-[10px] uppercase tracking-wider block font-black">{p.name}</span>
                        <span className="text-[8px] text-slate-500 font-medium block mt-1 truncate">
                          {idx === 0 ? "Llama 3.3" : idx === 1 ? "Mix NIMs" : idx === 2 ? "Mix StepFun" : "Custom Configuration"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Endpoint configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <span className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest block mb-2">API Endpoint URL</span>
                  <input
                    type="text"
                    className="w-full p-4 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-xs bg-slate-900/60 text-slate-200 font-mono font-bold leading-none"
                    placeholder="e.g. https://integrate.api.nvidia.com/v1/chat/completions"
                    value={settings.llmEndpoint}
                    onChange={(e) => setSettings({ ...settings, llmEndpoint: e.target.value })}
                  />
                </div>
                <div>
                  <span className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest block mb-2">Provider Custom API Key (Optional)</span>
                  <input
                    type="password"
                    className="w-full p-4 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-xs bg-slate-900/60 text-slate-200 font-mono font-bold leading-none"
                    placeholder="Enter key to override standard server system key..."
                    value={settings.llmApiKey}
                    onChange={(e) => setSettings({ ...settings, llmApiKey: e.target.value })}
                  />
                </div>
              </div>

              {settings.llmEndpoint !== "https://api.groq.com/openai/v1/chat/completions" && !settings.llmApiKey && (
                <div className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-5 py-4 rounded-2xl mt-2 leading-relaxed uppercase tracking-wider flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Warning: You have selected a custom API Endpoint but haven't provided a Custom API Key. The server will fall back to the default Groq API Key, which will cause authentication failures (401/500) if the endpoint is not Groq!</span>
                </div>
              )}

              {/* Granular Dropdowns with Annotations */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <span className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Fine-Tune Capability Models</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Chat Dialogue */}
                  {renderModelSelector(
                    "Roleplay AI Chat Response",
                    "NPC cognitive intelligence in conversations",
                    settings.modelChat,
                    (val) => setSettings({ ...settings, modelChat: val })
                  )}

                  {/* Grammar Corrector */}
                  {renderModelSelector(
                    "Grammar & Speech Correction",
                    "Analyzer scoring user sentence structure",
                    settings.modelGrammar,
                    (val) => setSettings({ ...settings, modelGrammar: val })
                  )}

                  {/* End of session CEFR Feedback */}
                  {renderModelSelector(
                    "Performance Feedback & CEFR Report",
                    "Comprehensive feedback evaluation engine",
                    settings.modelFeedback,
                    (val) => setSettings({ ...settings, modelFeedback: val })
                  )}

                  {/* Flashcards Extraction */}
                  {renderModelSelector(
                    "Flashcards Deck Generator",
                    "Vocabulary, spelling & idioms extraction",
                    settings.modelFlashcard,
                    (val) => setSettings({ ...settings, modelFlashcard: val })
                  )}

                  {/* Pronunciation Phrase Generator */}
                  {renderModelSelector(
                    "Pronunciation Phrase Generator",
                    "Phrase composer for Vocal Lab speaking practices",
                    settings.modelPhrase,
                    (val) => setSettings({ ...settings, modelPhrase: val })
                  )}
                </div>
              </div>

            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
