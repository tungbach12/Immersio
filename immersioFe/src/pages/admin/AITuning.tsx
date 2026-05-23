import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { Switch } from "@/components/ui/Switch";
import { Save, Loader2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { adminService, AiSettings } from "@/services/admin";

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
        </>
      )}
    </div>
  );
}
