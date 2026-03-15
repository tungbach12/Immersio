import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Search, Filter, Star, Users, Globe, Monitor, Video, X } from "lucide-react";
import { scenarios } from "@/data/scenarios";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

export default function Scenarios() {
  const navigate = useNavigate();
  const languages = ["All", "English", "Chinese", "Japanese", "French"];
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMode, setSelectedMode] = useState<"2d" | "ar">("2d");

  const filteredScenarios = scenarios.filter(scenario => {
    const matchesLanguage = selectedLanguage === "All" || scenario.language === selectedLanguage;
    const matchesSearch = scenario.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          scenario.language.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMode = scenario.modes.includes(selectedMode);
    return matchesLanguage && matchesSearch && matchesMode;
  });

  return (
    <div className="space-y-10 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-4xl font-display font-black text-slate-950 italic tracking-tight leading-tight">Explore <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-8">Library</span></h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-3">Discover 500+ immersive linguistic experiences</p>
        </div>
        
        <div className="relative group accent-glow rounded-[2.5rem]">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 transition-all group-focus-within:text-indigo-600 group-focus-within:scale-110" size={22} />
          <input 
            type="text" 
            placeholder="Search scenarios, languages, levels..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-16 pr-8 py-5 rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/50 focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-xl shadow-slate-200/20 font-bold text-base placeholder:text-slate-300 relative z-10"
          />
        </div>
      </div>

      {/* Filters Section */}
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 ml-4">
            <Monitor size={14} className="text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Experience Mode</span>
          </div>
          <div className="flex gap-3 p-1">
            <button
              onClick={() => setSelectedMode("2d")}
              className={cn(
                "flex-1 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-3",
                selectedMode === "2d"
                  ? "bg-slate-950 text-white border-slate-950 shadow-2xl shadow-indigo-100" 
                  : "bg-white text-slate-500 border-slate-100 hover:border-indigo-200"
              )}
            >
              <Monitor size={18} className={cn(selectedMode === "2d" ? "text-indigo-400" : "")} />
              <span>2D VN Style</span>
            </button>
            <button
              onClick={() => setSelectedMode("ar")}
              className={cn(
                "flex-1 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-3",
                selectedMode === "ar"
                  ? "bg-slate-950 text-white border-slate-950 shadow-2xl shadow-indigo-100" 
                  : "bg-white text-slate-500 border-slate-100 hover:border-indigo-200"
              )}
            >
              <Video size={18} className={cn(selectedMode === "ar" ? "text-indigo-400" : "")} />
              <span>AR Immersive</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 ml-4">
            <Globe size={14} className="text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Language Library</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-1">
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={cn(
                  "px-8 py-3 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                  selectedLanguage === lang
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100" 
                    : "bg-white text-slate-500 border-slate-100 hover:border-indigo-200"
                )}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredScenarios.map((scenario) => (
          <Link to={`/student/scenarios/${scenario.id}?mode=${selectedMode}`} key={scenario.id} className="block group accent-glow high-contrast-shadow">
            <div className="glass-card rounded-[3rem] overflow-hidden h-full flex flex-col group border-white/50 relative z-10 border-glow">
              <div className="h-64 bg-slate-100 relative overflow-hidden">
                <img 
                  src={scenario.image} 
                  alt={scenario.title} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                <div className="absolute top-6 right-6 flex flex-col gap-2">
                  <div className="bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl border border-white">
                    {scenario.level}
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest bg-indigo-600 text-white px-3 py-1.5 rounded-lg shadow-xl">
                    {scenario.category}
                  </span>
                  <div className="ml-auto flex items-center gap-1.5 text-amber-400 font-black text-sm">
                      <Star size={14} fill="currentColor" /> {scenario.rating}
                  </div>
                </div>
              </div>

              <div className="p-10 flex-1 flex flex-col">
                <h3 className="font-black text-2xl text-slate-950 tracking-tight mb-4 group-hover:text-indigo-600 transition-colors leading-tight">
                  {scenario.title}
                </h3>
                <p className="text-slate-500 text-sm font-medium mb-10 line-clamp-2 flex-1 leading-relaxed">
                  {scenario.description}
                </p>
                
                <div className="flex items-center justify-between pt-8 border-t border-slate-50/50">
                  <div className="flex items-center gap-2.5 text-slate-400">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
                      <Users size={14} className="text-slate-400" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">{scenario.users}</span>
                  </div>
                  <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-6 h-12 text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(79,70,229,0.3)] group-hover:scale-105 transition-transform border border-white/20">
                    Simulate
                  </Button>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {filteredScenarios.length === 0 && (
        <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={32} className="text-slate-200" />
          </div>
          <h3 className="text-xl font-black text-slate-900 italic tracking-tight">No scenarios found</h3>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Try adjusting your filters</p>
          <Button 
            onClick={() => { setSelectedLanguage("All"); setSearchQuery(""); }}
            variant="link" 
            className="mt-4 text-indigo-600 font-black uppercase tracking-widest text-[10px]"
          >
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}
