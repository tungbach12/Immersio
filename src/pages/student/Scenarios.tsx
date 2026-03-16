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
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-950 italic tracking-tight leading-tight">Explore <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-4">Library</span></h1>
          <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.3em] mt-2">500+ Immersive Experiences</p>
        </div>
        
        <div className="relative group">
          <div className="absolute inset-0 bg-indigo-500/5 blur-2xl rounded-[2rem] opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 transition-all group-focus-within:text-indigo-600 group-focus-within:scale-110" size={20} />
          <input 
            type="text" 
            placeholder="Search scenarios..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-sm font-bold text-sm placeholder:text-slate-300 relative z-10"
          />
        </div>
      </div>

      {/* Filters Section */}
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 ml-1">
            <Monitor size={12} className="text-indigo-400" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Mode</span>
          </div>
          <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
            <button
              onClick={() => setSelectedMode("2d")}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                selectedMode === "2d"
                  ? "bg-white text-slate-950 shadow-sm border border-slate-200 ring-1 ring-slate-100" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Monitor size={14} />
              <span>2D</span>
            </button>
            <button
              onClick={() => setSelectedMode("ar")}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                selectedMode === "ar"
                  ? "bg-white text-slate-950 shadow-sm border border-slate-200 ring-1 ring-slate-100" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Video size={14} />
              <span>AR</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 ml-1">
            <Globe size={12} className="text-indigo-400" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Language</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={cn(
                  "px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                  selectedLanguage === lang
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100" 
                    : "bg-white text-slate-500 border-slate-100 hover:border-indigo-100"
                )}
              >
                {lang}
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
              <Link to={`/student/scenarios/${scenario.id}?mode=${selectedMode}`} className="block group">
                <div className="glass-card rounded-[2.2rem] overflow-hidden h-full flex flex-col border border-slate-100 hover:border-indigo-100 transition-all duration-500 relative z-10">
                  <div className="h-44 bg-slate-100 relative overflow-hidden">
                    <img 
                      src={scenario.image} 
                      alt={scenario.title} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
                    
                    <div className="absolute top-4 right-4">
                      <div className="bg-white/95 backdrop-blur-md px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-xl border border-white">
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
                    <h3 className="font-black text-lg text-slate-950 tracking-tight mb-3 group-hover:text-indigo-600 transition-colors leading-tight uppercase">
                      {scenario.title}
                    </h3>
                    <p className="text-slate-500 text-xs font-medium mb-8 line-clamp-2 flex-1 leading-relaxed">
                      {scenario.description}
                    </p>
                    
                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Users size={12} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{scenario.users}</span>
                      </div>
                      <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 h-10 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 group-hover:scale-105 transition-transform">
                        Simulate
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
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
