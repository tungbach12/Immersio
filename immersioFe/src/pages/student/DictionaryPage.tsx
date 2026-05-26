import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Volume2, Plus, Sparkles, BookOpen, Layers, Check, Loader2, Info, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { practiceService, DictionaryEntryDto } from "@/services/practice";
import { getDecks, addCardsToDeck, addDeck, Deck } from "@/services/decks";

export default function DictionaryPage() {
  const [wordInput, setWordInput] = useState("");
  const [selectedLang, setSelectedLang] = useState("English");
  const [isLoading, setIsLoading] = useState(false);
  const [entry, setEntry] = useState<DictionaryEntryDto | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Deck Import States
  const [decks, setDecks] = useState<Deck[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedDeckName, setSavedDeckName] = useState("");

  // Load decks on mount
  useEffect(() => {
    getDecks()
      .then(data => setDecks(data))
      .catch(err => console.error("Failed to load decks:", err));
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!wordInput.trim()) return;

    setIsLoading(true);
    setEntry(null);
    setErrorMsg("");
    setIsSaved(false);
    setSavedDeckName("");

    try {
      const data = await practiceService.lookupWord(wordInput.trim(), selectedLang);
      setEntry(data);
    } catch (err: any) {
      console.error("Dictionary lookup failed:", err);
      setErrorMsg("Không thể tìm kiếm từ này. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const playTTS = () => {
    if (!entry) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(entry.word);
    utterance.lang = selectedLang === "Japanese" ? "ja-JP" :
                    selectedLang === "Chinese" ? "zh-CN" : 
                    selectedLang === "French" ? "fr-FR" : "en-US";
    window.speechSynthesis.speak(utterance);
  };

  const handleOpenImport = async () => {
    try {
      const latestDecks = await getDecks();
      setDecks(latestDecks);
      setShowImportModal(true);
    } catch (err) {
      console.error("Failed to refresh decks:", err);
      setShowImportModal(true);
    }
  };

  const handleImportToDeck = async (deckId: string, deckName: string) => {
    if (!entry) return;
    setIsImporting(true);

    try {
      const card = {
        front: `${entry.word}\n${entry.phonetic}`,
        back: entry.translation,
        explanation: `${entry.partOfSpeech} • Definition: ${entry.definition}\n\nExample: '${entry.example}'\nTranslation: '${entry.exampleTranslation}'`
      };

      await addCardsToDeck(deckId, [card]);
      setIsSaved(true);
      setSavedDeckName(deckName);
      setShowImportModal(false);
    } catch (err) {
      console.error("Failed to import to deck:", err);
      alert("Không thể lưu thẻ từ vựng vào bộ thẻ này. Vui lòng thử lại.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleCreateAndImport = async () => {
    if (!newDeckName.trim() || !entry) return;
    setIsImporting(true);

    try {
      const newDeck = await addDeck(newDeckName.trim());
      const card = {
        front: `${entry.word}\n${entry.phonetic}`,
        back: entry.translation,
        explanation: `${entry.partOfSpeech} • Definition: ${entry.definition}\n\nExample: '${entry.example}'\nTranslation: '${entry.exampleTranslation}'`
      };

      await addCardsToDeck(newDeck.id, [card]);
      setIsSaved(true);
      setSavedDeckName(newDeck.name);
      setShowImportModal(false);
      setNewDeckName("");
    } catch (err) {
      console.error("Failed to create and import:", err);
      alert("Không thể tạo bộ thẻ mới. Vui lòng thử lại.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-32 flex flex-col gap-8 md:gap-10">
      {/* Premium Header */}
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl relative group border border-white/5">
          <div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <BookOpen className="w-7 h-7 text-indigo-400 relative z-10 animate-pulse" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black text-white italic tracking-tight uppercase">
            AI <span className="text-indigo-500">Dictionary</span>
          </h1>
          <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.3em] mt-1">Smart Bilingual Lexicon</p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="glass-card bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] p-6 border border-white/5 shadow-2xl">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 items-stretch">
          {/* Language selection dropdown */}
          <div className="flex flex-col gap-1.5 shrink-0">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Language</label>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-slate-950 border border-white/10 rounded-2xl px-4 h-14 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer w-full sm:w-40"
              disabled={isLoading}
            >
              <option value="English">English 🇺🇸</option>
              <option value="Japanese">Japanese 🇯🇵</option>
              <option value="Chinese">Chinese 🇨🇳</option>
              <option value="French">French 🇫🇷</option>
            </select>
          </div>

          {/* Glowing Search Box */}
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Search Word or Phrase</label>
            <div className="relative group flex-1">
              <input
                type="text"
                value={wordInput}
                onChange={(e) => setWordInput(e.target.value)}
                placeholder="Type word, idiom or expression..."
                className="w-full h-14 bg-slate-950 border border-white/10 rounded-2xl px-5 pr-14 text-white font-bold text-sm placeholder:text-white/30 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !wordInput.trim()}
                className={cn(
                  "absolute right-2 top-2 h-10 w-10 rounded-xl transition-all active:scale-95 shadow-md flex items-center justify-center p-0",
                  wordInput.trim() 
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
                    : "bg-white/5 text-white/20 pointer-events-none"
                )}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Lookup Output */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-card bg-slate-900/20 rounded-[3rem] p-16 flex flex-col items-center justify-center border border-white/5 border-dashed"
          >
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest animate-pulse">Consulting AI Brain Lexicon...</p>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-rose-500/10 border border-rose-500/20 text-rose-450 p-6 rounded-[2rem] flex items-center gap-4"
          >
            <Info className="w-6 h-6 text-rose-450 shrink-0" />
            <p className="text-sm font-bold">{errorMsg}</p>
          </motion.div>
        )}

        {entry && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="flex flex-col gap-6"
          >
            {/* Primary Entry Card */}
            <div className="glass-card bg-slate-900/40 backdrop-blur-md rounded-[3rem] p-8 md:p-10 shadow-2xl border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full -mr-24 -mt-24 blur-3xl" />
              
              <div className="flex flex-wrap justify-between items-center gap-4 mb-8 relative z-10 border-b border-white/5 pb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-4xl font-black text-white leading-none tracking-tight italic select-text">
                      {entry.word}
                    </h2>
                    <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full shrink-0">
                      {entry.partOfSpeech}
                    </span>
                  </div>
                  <p className="text-slate-450 font-mono font-bold text-sm mt-3">
                    {entry.phonetic}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    size="icon"
                    onClick={playTTS}
                    className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-white/5 transition-transform active:scale-95"
                  >
                    <Volume2 className="w-6 h-6" />
                  </Button>
                  
                  {isSaved ? (
                    <div className="bg-emerald-500/15 border border-emerald-500/25 px-4 h-12 rounded-2xl flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-wider">
                      <Check className="w-4 h-4" /> Saved in {savedDeckName}
                    </div>
                  ) : (
                    <Button
                      onClick={handleOpenImport}
                      className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-5 font-black uppercase text-[10px] tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/25 active:scale-95 border-none"
                    >
                      <Plus className="w-4 h-4" /> Import into Deck
                    </Button>
                  )}
                </div>
              </div>

              {/* Translation & Definition */}
              <div className="flex flex-col gap-6 relative z-10 mb-8">
                <div>
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.25em] mb-2 block">Vietnamese Meaning</span>
                  <p className="text-2xl font-black text-white italic tracking-tight select-text">
                    {entry.translation}
                  </p>
                </div>

                <div>
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.25em] mb-2 block">English Definition</span>
                  <p className="text-sm font-bold text-slate-350 leading-relaxed bg-white/5 rounded-2xl p-5 border border-white/5 select-text">
                    {entry.definition}
                  </p>
                </div>
              </div>

              {/* Usage Example */}
              <div className="bg-slate-950/40 p-6 rounded-[2.5rem] border border-white/5 relative z-10 select-text">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.25em] mb-3 block flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" /> Conversational Example
                </span>
                <p className="text-lg font-black text-white tracking-tight leading-snug italic mb-2">
                  "{entry.example}"
                </p>
                <p className="text-xs font-bold text-slate-400">
                  💡 {entry.exampleTranslation}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Deck Modal */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowImportModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl flex flex-col max-h-[80vh] z-10"
            >
              <div className="flex items-center justify-between mb-6 shrink-0">
                <h2 className="text-xl font-black text-white italic tracking-tight">Import to Deck</h2>
                <button onClick={() => setShowImportModal(false)} className="text-white/40 hover:text-white p-2">
                  <X size={20} />
                </button>
              </div>

              {/* Active Decks List */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-6 custom-scrollbar scrollbar-hide">
                {decks.map(deck => (
                  <button
                    key={deck.id}
                    onClick={() => handleImportToDeck(deck.id, deck.name)}
                    disabled={isImporting}
                    className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <h3 className="text-white font-bold text-sm tracking-tight">{deck.name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{(deck.cards || deck.totalCards) ? (deck.cards?.length || deck.totalCards || 0) : 0} cards</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:text-indigo-400 text-white/40 transition-colors">
                      {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers size={14} />}
                    </div>
                  </button>
                ))}
                {decks.length === 0 && (
                  <p className="text-xs text-slate-500 font-bold text-center py-4 uppercase">No decks found. Create one below.</p>
                )}
              </div>

              {/* Create New Deck */}
              <div className="shrink-0 pt-4 border-t border-white/10">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Or Create New Deck</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                    placeholder="New Deck Name..."
                    className="flex-1 h-12 bg-black/40 border border-white/10 rounded-2xl px-4 text-white text-sm focus:outline-none focus:border-indigo-500/50 font-bold"
                    disabled={isImporting}
                  />
                  <Button
                    onClick={handleCreateAndImport}
                    disabled={!newDeckName.trim() || isImporting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-5 h-12 shrink-0 font-black uppercase text-[10px] tracking-wider border-none"
                  >
                    {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create & Save"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
