import React, { useState, useEffect } from "react";
import { scenarioService, Scenario, ScenarioItem } from "@/services/scenario";
import { adminService } from "@/services/admin";
import { API_BASE } from "@/services/auth";
import { uploadImage } from "@/services/upload";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  Layers, Plus, Trash2, Edit, Loader2, X, Check, Globe, Sliders, Image, Type, HelpCircle, DollarSign, Volume2
} from "lucide-react";
import { cn } from "@/lib/utils";

const LANGUAGE_VOICES: Record<string, { id: string; label: string }[]> = {
  English: [
    { id: "en-US-JennyNeural", label: "Jenny (Female, US - Friendly/Expressive)" },
    { id: "en-US-GuyNeural", label: "Guy (Male, US - Conversational)" },
    { id: "en-US-AvaNeural", label: "Ava (Female, US - Youthful)" },
    { id: "en-US-AndrewNeural", label: "Andrew (Male, US - Conversational)" },
    { id: "en-GB-SoniaNeural", label: "Sonia (Female, UK - Elegant)" },
    { id: "en-GB-RyanNeural", label: "Ryan (Male, UK - Clear)" },
  ],
  Japanese: [
    { id: "ja-JP-NanamiNeural", label: "Nanami (Female - Standard)" },
    { id: "ja-JP-KeitaNeural", label: "Keita (Male - Natural)" },
    { id: "ja-JP-AoiNeural", label: "Aoi (Female - Gentle)" },
  ],
  Chinese: [
    { id: "zh-CN-XiaoxiaoNeural", label: "Xiaoxiao (Female - Sweet)" },
    { id: "zh-CN-YunxiNeural", label: "Yunxi (Male - Natural)" },
    { id: "zh-CN-XiaoyiNeural", label: "Xiaoyi (Female - Conversational)" },
  ],
  Spanish: [
    { id: "es-ES-ElviraNeural", label: "Elvira (Female - Gentle)" },
    { id: "es-ES-AlvaroNeural", label: "Alvaro (Male - Clear)" },
  ],
};

export default function ScenarioBuilder() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Builder Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
  
  // Form fields
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("English");
  const [level, setLevel] = useState("Beginner");
  const [category, setCategory] = useState("Travel");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("10 mins");
  const [imageUrl, setImageUrl] = useState("/ScenariosImage/Ordering coffee background.jpg");
  const [avatarUrl, setAvatarUrl] = useState("/ScenariosImage/Ordering coffee character.png");
  const [uploadingBg, setUploadingBg] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [initialMessage, setInitialMessage] = useState("");

  const handleImageUpload = async (
    file: File | undefined,
    setUrl: (u: string) => void,
    setBusy: (b: boolean) => void,
  ) => {
    if (!file) return;
    setBusy(true);
    setUploadError(null);
    try {
      const url = await uploadImage(file, "immersio/scenarios");
      setUrl(url);
    } catch (err: any) {
      setUploadError(err.message || "Upload failed.");
    } finally {
      setBusy(false);
    }
  };
  const [contextPrompt, setContextPrompt] = useState("");
  const [isNavigation, setIsNavigation] = useState(false);
  const [saving, setSaving] = useState(false);

  const [voiceId, setVoiceId] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState("");

  const handlePreviewVoice = async () => {
    if (!voiceId) return;
    setPreviewing(true);
    setPreviewError("");
    try {
      const textToSpeak = initialMessage || "Hello! This is a preview of my voice.";
      const token = localStorage.getItem("token") || "";
      const response = await fetch(`${API_BASE}/api/practice/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          text: textToSpeak,
          voice: voiceId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Preview failed" }));
        throw new Error(errorData.detail || "Failed to synthesize speech.");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (err: any) {
      console.error(err);
      setPreviewError(err.message || "Failed to preview voice.");
    } finally {
      setPreviewing(false);
    }
  };

  // Vocab Item Builder State
  const [activeScenarioForItems, setActiveScenarioForItems] = useState<Scenario | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("0");
  const [newItemImage, setNewItemImage] = useState("https://images.unsplash.com/photo-1594631252845-29fc4586216c?q=80&w=2574&auto=format&fit=crop");
  const [newItemIcon, setNewItemIcon] = useState("Coffee");
  const [addingItem, setAddingItem] = useState(false);

  useEffect(() => {
    loadScenarios();
  }, []);

  useEffect(() => {
    const list = LANGUAGE_VOICES[language] || LANGUAGE_VOICES["English"];
    if (list && list.length > 0) {
      const matches = list.some(v => v.id === voiceId);
      if (!matches) {
        setVoiceId(list[0].id);
      }
    }
  }, [language]);

  const loadScenarios = () => {
    setLoading(true);
    scenarioService.getScenarios()
      .then((data) => setScenarios(data))
      .catch((err) => {
        console.error(err);
        setError("Failed to load scenario logs.");
      })
      .finally(() => setLoading(false));
  };

  const handleOpenCreate = () => {
    setEditingScenario(null);
    setTitle("");
    setLanguage("English");
    setLevel("Beginner");
    setCategory("Travel");
    setDescription("");
    setDuration("10 mins");
    setImageUrl("/ScenariosImage/Ordering coffee background.jpg");
    setAvatarUrl("/ScenariosImage/Ordering coffee character.png");
    setInitialMessage("");
    setContextPrompt("");
    setIsNavigation(false);
    setVoiceId("en-US-JennyNeural");
    setPreviewError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Scenario) => {
    setEditingScenario(item);
    setTitle(item.title);
    setLanguage(item.language);
    setLevel(item.level);
    setCategory(item.category);
    setDescription(item.description);
    setDuration(item.duration);
    setImageUrl(item.image);
    setAvatarUrl(item.avatar);
    setInitialMessage(item.initialMessage);
    // Fetch scenario prompt or provide fallback
    setContextPrompt(item.context || "");
    setIsNavigation(!!item.isNavigation);
    setVoiceId(item.voiceId || "en-US-JennyNeural");
    setPreviewError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      title,
      language,
      level,
      category,
      description,
      rating: editingScenario ? editingScenario.rating : 5.0,
      duration,
      imageUrl,
      contextPrompt,
      initialMessage,
      avatarUrl,
      isNavigation,
      voiceId
    };

    try {
      if (editingScenario) {
        await adminService.updateScenario(editingScenario.id, payload);
        setSuccess("Scenario updated successfully!");
      } else {
        await adminService.createScenario(payload);
        setSuccess("New Scenario successfully built and compiled!");
      }
      setIsModalOpen(false);
      loadScenarios();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save scenario.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this scenario? This cannot be undone.")) return;
    try {
      await adminService.deleteScenario(id);
      setScenarios(scenarios.filter(s => s.Id !== id));
      loadScenarios();
      setSuccess("Scenario archived.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to archive scenario.");
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeScenarioForItems) return;
    setAddingItem(true);
    try {
      const payload = {
        name: newItemName,
        price: parseFloat(newItemPrice) || 0,
        imageUrl: newItemImage,
        icon: newItemIcon
      };
      await adminService.addScenarioItem(activeScenarioForItems.id, payload);
      // Reload items in localized view
      const updatedScenarios = await scenarioService.getScenarios();
      setScenarios(updatedScenarios);
      const matched = updatedScenarios.find(s => s.id === activeScenarioForItems.id);
      if (matched) setActiveScenarioForItems(matched);

      setNewItemName("");
      setNewItemPrice("0");
    } catch (err: any) {
      alert(err.message || "Failed to append vocab item.");
    } finally {
      setAddingItem(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
        <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Parsing active scenario index...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic">SCENARIO BUILDER</h1>
          <p className="text-slate-400 font-bold text-[10px] mt-1 uppercase tracking-[0.2em]">Build dialog configurations & context items for interactive scenarios</p>
        </div>
        <Button 
          onClick={handleOpenCreate}
          className="gap-2 h-12 px-6 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white shadow-glow"
        >
          <Plus size={16} />
          Create Scenario
        </Button>
      </div>

      {success && (
        <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold px-6 py-4 rounded-2xl">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold px-6 py-4 rounded-2xl">
          {error}
        </div>
      )}

      {/* Grid of Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {scenarios.map((item) => (
          <Card key={item.id} className="bg-slate-950/45 backdrop-blur-2xl border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden group hover:border-indigo-500/20 transition-all flex flex-col h-full">
            <div className="h-44 w-full overflow-hidden relative">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-6 left-6 flex items-center gap-3">
                <img src={item.avatar} alt={item.title} className="w-10 h-10 rounded-xl border border-white/10 object-cover" />
                <div>
                  <h3 className="text-lg font-black text-white italic tracking-tight uppercase leading-none">{item.title}</h3>
                  <span className="text-[9px] font-black uppercase text-indigo-400 tracking-wider mt-1.5 block">{item.language} • {item.level}</span>
                </div>
              </div>
            </div>
            
            <CardContent className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold opacity-85 mb-6">{item.description}</p>
                <div className="flex flex-wrap gap-2 mb-8">
                  <span className="bg-white/5 border border-white/10 text-[9px] font-black uppercase px-2.5 py-1 rounded-lg text-slate-300">{item.category}</span>
                  <span className="bg-white/5 border border-white/10 text-[9px] font-black uppercase px-2.5 py-1 rounded-lg text-slate-300">{item.duration}</span>
                  <span className="bg-white/5 border border-white/10 text-[9px] font-black uppercase px-2.5 py-1 rounded-lg text-slate-300">{item.items?.length || 0} vocabulary items</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-5 gap-3">
                <Button 
                  onClick={() => setActiveScenarioForItems(item)}
                  variant="ghost"
                  className="h-10 px-4 rounded-xl font-bold uppercase tracking-wider text-[9px] border border-white/5 hover:border-indigo-500/20 text-slate-400 hover:text-indigo-400 bg-white/5 hover:bg-indigo-500/10"
                >
                  Configure Vocab ({item.items?.length || 0})
                </Button>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => handleOpenEdit(item)}
                    variant="ghost"
                    className="h-10 w-10 p-0 rounded-xl border border-white/5 hover:border-indigo-500/20 text-slate-400 hover:text-indigo-400 bg-white/5 hover:bg-indigo-500/10"
                  >
                    <Edit size={14} />
                  </Button>
                  <Button 
                    onClick={() => handleDelete(item.id)}
                    className="h-10 w-10 p-0 rounded-xl bg-red-950/20 border border-red-500/10 hover:border-red-500/30 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scenario Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" />
          <div className="bg-slate-950 rounded-[2.5rem] shadow-2xl border border-white/10 w-full max-w-2xl overflow-hidden relative z-10 p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>

            <div>
              <h3 className="text-xl font-black text-white italic tracking-tight uppercase leading-none mb-1">
                {editingScenario ? "Edit Scenario" : "Create Scenario"}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Configure properties and cognitive contexts for interactive dialogue sessions</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Scenario Title</label>
                  <input 
                    type="text" 
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Lost in Shibuya Navigation"
                    className="h-11 px-4 rounded-xl border border-white/10 bg-slate-900/60 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-200 placeholder:text-slate-600"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Target Language</label>
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="h-11 px-4 rounded-xl border border-white/10 bg-slate-900/60 text-xs font-bold text-indigo-400"
                  >
                    <option value="English">English</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Spanish">Spanish</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">CEFR Level</label>
                  <select 
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="h-11 px-4 rounded-xl border border-white/10 bg-slate-900/60 text-xs font-bold text-indigo-400"
                  >
                    <option value="Beginner">Beginner (A1-A2)</option>
                    <option value="Intermediate">Intermediate (B1-B2)</option>
                    <option value="Advanced">Advanced (C1-C2)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Category</label>
                  <input 
                    type="text" 
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Travel / Navigation"
                    className="h-11 px-4 rounded-xl border border-white/10 bg-slate-900/60 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-200"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Estimated Duration</label>
                  <input 
                    type="text" 
                    required
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 10 mins"
                    className="h-11 px-4 rounded-xl border border-white/10 bg-slate-900/60 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-200"
                  />
                </div>

                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Background Image</label>
                  <div className="flex items-center gap-2">
                    {imageUrl && (
                      <img src={imageUrl} alt="bg preview" className="h-11 w-16 rounded-lg object-cover border border-white/10" />
                    )}
                    <input
                      type="text"
                      required
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Upload or paste a URL"
                      className="flex-1 h-11 px-4 rounded-xl border border-white/10 bg-slate-900/60 text-xs font-mono focus:outline-none focus:border-indigo-500 text-slate-300"
                    />
                    <label className="h-11 px-3 flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-indigo-500/20 whitespace-nowrap">
                      {uploadingBg ? <Loader2 size={14} className="animate-spin" /> : <Image size={14} />}
                      {uploadingBg ? "..." : "Upload"}
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => handleImageUpload(e.target.files?.[0], setImageUrl, setUploadingBg)} />
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Character Avatar</label>
                  <div className="flex items-center gap-2">
                    {avatarUrl && (
                      <img src={avatarUrl} alt="avatar preview" className="h-11 w-11 rounded-lg object-cover border border-white/10" />
                    )}
                    <input
                      type="text"
                      required
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="Upload or paste a URL"
                      className="flex-1 h-11 px-4 rounded-xl border border-white/10 bg-slate-900/60 text-xs font-mono focus:outline-none focus:border-indigo-500 text-slate-300"
                    />
                    <label className="h-11 px-3 flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-indigo-500/20 whitespace-nowrap">
                      {uploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Image size={14} />}
                      {uploadingAvatar ? "..." : "Upload"}
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => handleImageUpload(e.target.files?.[0], setAvatarUrl, setUploadingAvatar)} />
                    </label>
                  </div>
                  {uploadError && (
                    <span className="text-[10px] font-bold text-rose-400 ml-1">{uploadError}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Initial Opening Message</label>
                  <input 
                    type="text" 
                    required
                    value={initialMessage}
                    onChange={(e) => setInitialMessage(e.target.value)}
                    placeholder="e.g. Welcome! What can I get for you today?"
                    className="h-11 px-4 rounded-xl border border-white/10 bg-slate-900/60 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-200"
                  />
                </div>

                <div className="flex flex-col gap-2 col-span-2 p-5 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-[10px] text-white uppercase tracking-widest block">Character Neural Voice</span>
                      <span className="text-[8px] font-medium text-slate-500">Populated based on Target Language</span>
                    </div>
                    <Button 
                      type="button"
                      disabled={previewing || !voiceId}
                      onClick={handlePreviewVoice}
                      className="gap-2 h-9 px-4 rounded-xl font-bold uppercase tracking-wider text-[9px] bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-glow active:scale-95 transition-all shrink-0"
                    >
                      {previewing ? <Loader2 className="animate-spin" size={12} /> : <Volume2 size={12} />}
                      {previewing ? "Previewing..." : "Listen Preview"}
                    </Button>
                  </div>

                  <select 
                    value={voiceId}
                    onChange={(e) => setVoiceId(e.target.value)}
                    className="h-10 px-4 rounded-xl border border-white/10 bg-slate-950 text-xs font-bold text-indigo-400 w-full"
                  >
                    {(LANGUAGE_VOICES[language] || LANGUAGE_VOICES["English"]).map((v) => (
                      <option key={v.id} value={v.id}>{v.label}</option>
                    ))}
                  </select>

                  {previewError && (
                    <span className="text-[10px] font-bold text-red-400 mt-1 uppercase block tracking-wide">
                      ⚠️ {previewError}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">System Context & Character Prompt</label>
                  <textarea 
                    required
                    value={contextPrompt}
                    onChange={(e) => setContextPrompt(e.target.value)}
                    placeholder="You are Shinji, a barista... The user is a customer..."
                    className="h-24 p-4 rounded-xl border border-white/10 bg-slate-900/60 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-200 leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-900/40 rounded-xl border border-white/5 col-span-2">
                  <div>
                    <span className="font-extrabold text-[10px] text-white uppercase tracking-wider block">Enable AR/Navigation Mode</span>
                    <span className="text-[8px] font-medium text-slate-500">Enable spatial tracking inside scenario</span>
                  </div>
                  <input 
                    type="checkbox"
                    checked={isNavigation}
                    onChange={(e) => setIsNavigation(e.target.checked)}
                    className="w-5 h-5 rounded border-white/10 accent-indigo-600 bg-slate-900 focus:ring-0 focus:ring-offset-0"
                  />
                </div>
              </div>

              <Button 
                type="submit"
                disabled={saving}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-xl shadow-glow flex items-center justify-center gap-2 mt-4"
              >
                {saving ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                {editingScenario ? "Save Changes" : "Compile Scenario"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Target Vocabulary Item Builder Modal */}
      {activeScenarioForItems && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setActiveScenarioForItems(null)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" />
          <div className="bg-slate-950 rounded-[2.5rem] shadow-2xl border border-white/10 w-full max-w-xl overflow-hidden relative z-10 p-8 flex flex-col gap-6 max-h-[85vh] overflow-y-auto">
            <button 
              onClick={() => setActiveScenarioForItems(null)}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>

            <div>
              <h3 className="text-xl font-black text-white italic tracking-tight uppercase leading-none mb-1">Target Vocabulary</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Configure context items or target vocabulary for <span className="text-indigo-400">{activeScenarioForItems.title}</span></p>
            </div>

            {/* List existing items */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-2 scrollbar-hide">
              {activeScenarioForItems.items && activeScenarioForItems.items.length > 0 ? (
                activeScenarioForItems.items.map((v: any, index: number) => (
                  <div key={v.id || index} className="flex items-center justify-between p-4 bg-slate-900/40 border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <img src={v.image} alt={v.name} className="w-10 h-10 rounded-xl object-cover" />
                      <div>
                        <span className="text-xs font-extrabold text-white block uppercase tracking-tight">{v.name}</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase mt-0.5 block">{v.icon} • {v.price}đ</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-slate-600 text-[10px] font-black uppercase tracking-wider">No vocabulary items added yet.</p>
              )}
            </div>

            {/* Form to add item */}
            <form onSubmit={handleAddItem} className="border-t border-white/5 pt-6 space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-wider italic">Add New Item</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Item Name</label>
                  <input 
                    type="text" 
                    required
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g. Salmon Bento"
                    className="h-10 px-4 rounded-xl border border-white/10 bg-slate-900/60 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-200"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Price (Mock Currency)</label>
                  <input 
                    type="text" 
                    required
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="e.g. 540"
                    className="h-10 px-4 rounded-xl border border-white/10 bg-slate-900/60 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-200"
                  />
                </div>

                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Item Image URL</label>
                  <input 
                    type="text" 
                    required
                    value={newItemImage}
                    onChange={(e) => setNewItemImage(e.target.value)}
                    className="h-10 px-4 rounded-xl border border-white/10 bg-slate-900/60 text-xs font-mono focus:outline-none focus:border-indigo-500 text-slate-300"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Display Icon</label>
                  <select 
                    value={newItemIcon}
                    onChange={(e) => setNewItemIcon(e.target.value)}
                    className="h-10 px-4 rounded-xl border border-white/10 bg-slate-900/60 text-xs font-bold text-indigo-400"
                  >
                    <option value="Coffee">Coffee / Beverage</option>
                    <option value="Utensils">Utensils / Food</option>
                    <option value="Triangle">Triangle / Snack</option>
                    <option value="Flame">Flame / Hot Food</option>
                    <option value="Bowl">Bowl / Noodles</option>
                  </select>
                </div>

                <div className="flex items-end col-span-1">
                  <Button 
                    type="submit"
                    disabled={addingItem}
                    className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] text-[9px] rounded-xl shadow-glow flex items-center justify-center gap-1.5"
                  >
                    {addingItem ? <Loader2 className="animate-spin" size={12} /> : <Plus size={12} />}
                    Add Item
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
