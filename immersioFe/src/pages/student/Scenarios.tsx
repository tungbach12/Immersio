import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Search, Filter, Star, Users, Globe, Monitor, Video, X } from "lucide-react";
import { scenarioService, Scenario } from "@/services/scenario";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

export default function Scenarios() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [scenariosList, setScenariosList] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize Practice Language:
  // 1. Previous selection from localStorage
  // 2. Onboarding selection from localStorage
  // 3. Fallback to English
  const [practiceLanguage, setPracticeLanguage] = useState<string>(() => {
    const saved = localStorage.getItem("practice_language");
    if (saved) return saved;
    const onboard = localStorage.getItem("onboarding_language");
    if (onboard) {
      const lower = onboard.toLowerCase();
      if (lower === "english") return "English";
      if (lower === "japanese") return "Japanese";
      if (lower === "chinese") return "Chinese";
    }
    return "English";
  });

  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    scenarioService.getScenarios()
      .then(list => {
        setScenariosList(list);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Dynamically extract categories from loaded scenarios list
  const categories = ["All", ...Array.from(new Set(scenariosList.map(s => s.category)))];

  const filteredScenarios = scenariosList.filter(scenario => {
    const matchesCategory = selectedCategory === "All" || scenario.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = scenario.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          scenario.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-4">Streaming library catalog...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Target Language Selector Widget */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-100 italic tracking-tight leading-tight">Explore <span className="text-indigo-400 underline decoration-indigo-500/20 underline-offset-4">Library</span></h1>
          <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.3em] mt-2">500+ Immersive Experiences</p>
        </div>
        
        {/* Practice Target Language Selection Widget */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white/5 border border-white/5 p-2 px-3 rounded-3xl backdrop-blur-md">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 pl-1">Practice Language:</span>
          <div className="flex gap-1.5 overflow-x-auto">
            {[
              { code: "English", flag: "🇺🇸" },
              { code: "Japanese", flag: "🇯🇵" },
              { code: "Chinese", flag: "🇨🇳" },
              { code: "French", flag: "🇫🇷" }
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setPracticeLanguage(lang.code);
                  localStorage.setItem("practice_language", lang.code);
                }}
                className={cn(
                  "px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 whitespace-nowrap active:scale-95",
                  practiceLanguage === lang.code
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-950/20"
                    : "bg-white/5 text-slate-400 border-transparent hover:bg-white/10 hover:text-white"
                )}
              >
                <span className="text-sm filter drop-shadow-sm">{lang.flag}</span>
                <span>{lang.code}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative group">
        <div className="absolute inset-0 bg-indigo-500/5 blur-2xl rounded-[2rem] opacity-0 group-focus-within:opacity-100 transition-opacity" />
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 transition-all group-focus-within:text-indigo-400 group-focus-within:scale-110" size={20} />
        <input 
          type="text" 
          placeholder="Search scenarios..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/5 border border-white/5 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 text-white transition-all shadow-sm font-bold text-sm placeholder:text-slate-500 relative z-10"
        />
      </div>

      {/* Category Filters Section */}
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 ml-1">
            <Filter size={12} className="text-indigo-400" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Categories</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border capitalize",
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-900/30" 
                    : "bg-white/5 text-slate-400 border-white/5 hover:border-white/10 hover:text-white"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredScenarios.map((scenario) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={scenario.id}
            >
              <div 
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/student/scenarios/${scenario.id}?lang=${practiceLanguage}`);
                }} 
                className="block group cursor-pointer h-full"
              >
                <div className="glass-card rounded-[2.2rem] overflow-hidden h-full flex flex-col border border-white/5 hover:border-indigo-500/20 transition-all duration-500 relative z-10">
                  <div className="h-44 bg-slate-800 relative overflow-hidden">
                    <img 
                      src={scenario.image} 
                      alt={scenario.title} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
                    
                    <div className="absolute top-4 right-4">
                      <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-xl border border-white/10 text-indigo-300">
                        {scenario.level}
                      </div>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <span className="text-[8px] font-black uppercase tracking-widest bg-indigo-600 text-white px-2.5 py-1 rounded-lg shadow-lg">
                        {scenario.category}
                      </span>
                      <div className="flex items-center gap-1 text-amber-400 font-black text-xs">
                          <Star size={12} fill="currentColor" /> {scenario.rating}
                      </div>
                    </div>
                  </div>

                  <div className="p-7 flex-1 flex flex-col">
                    <h3 className="font-black text-lg text-slate-100 tracking-tight mb-3 group-hover:text-indigo-400 transition-colors leading-tight uppercase">
                      {scenario.title}
                    </h3>
                    <p className="text-slate-400 text-xs font-medium mb-8 line-clamp-2 flex-1 leading-relaxed">
                      {scenario.description}
                    </p>
                    
                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Users size={12} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{scenario.users}</span>
                      </div>
                      <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 h-10 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-950/20 group-hover:scale-105 transition-transform">
                        Simulate in {practiceLanguage}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {filteredScenarios.length === 0 && (
        <div className="text-center py-32 bg-slate-900/60 rounded-[3rem] border border-dashed border-white/10 backdrop-blur-md">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={32} className="text-slate-700" />
          </div>
          <h3 className="text-xl font-black text-slate-100 italic tracking-tight">No scenarios found</h3>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Try adjusting your filters</p>
          <Button 
            onClick={() => { setSelectedCategory("All"); setSearchQuery(""); }}
            variant="link" 
            className="mt-4 text-indigo-400 hover:text-indigo-300 font-black uppercase tracking-widest text-[10px]"
          >
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}
