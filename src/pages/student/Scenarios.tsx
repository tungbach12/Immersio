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
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-900 italic tracking-tight">Library</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Explore real-world situations</p>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600" size={20} />
          <input 
            type="text" 
            placeholder="Search scenarios, languages..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 rounded-[2rem] bg-white border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm font-bold text-sm"
          />
        </div>
      </div>

      {/* Filters Section */}
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 ml-2">
            <Monitor size={12} className="text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Experience Mode</span>
          </div>
          <div className="flex gap-2 px-1">
            <button
              onClick={() => setSelectedMode("2d")}
              className={cn(
                "flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2",
                selectedMode === "2d"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100" 
                  : "bg-white text-slate-500 border-slate-100 hover:border-indigo-200"
              )}
            >
              <Monitor size={16} />
              <span className="hidden sm:inline">2D Visual Novel</span>
              <span className="sm:hidden">2D Mode</span>
            </button>
            <button
              onClick={() => setSelectedMode("ar")}
              className={cn(
                "flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2",
                selectedMode === "ar"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100" 
                  : "bg-white text-slate-500 border-slate-100 hover:border-indigo-200"
              )}
            >
              <Video size={16} />
              <span className="hidden sm:inline">AR Immersive</span>
              <span className="sm:hidden">AR Mode</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 ml-2">
            <Globe size={12} className="text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Languages</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={cn(
                  "px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                  selectedLanguage === lang
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100" 
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
          <Link to={`/student/scenarios/${scenario.id}?mode=${selectedMode}`} key={scenario.id} className="block group">
            <Card hoverEffect className="border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all overflow-hidden bg-white h-full flex flex-col group">
              <div className="h-56 bg-slate-100 relative overflow-hidden">
                <img 
                  src={scenario.image} 
                  alt={scenario.title} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border border-white/20">
                    {scenario.level}
                  </div>
                  <div className="bg-amber-400 px-2 py-1 rounded-full text-[10px] font-black flex items-center justify-center gap-1 shadow-sm">
                    <Star size={10} fill="currentColor" /> {scenario.rating}
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 flex gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest bg-indigo-600 text-white px-3 py-1 rounded-full shadow-lg">
                    {scenario.category}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full border border-white/20">
                    {scenario.language}
                  </span>
                </div>
              </div>

              <CardContent className="p-8 flex-1 flex flex-col">
                <h3 className="font-black text-xl text-slate-900 tracking-tight mb-3 group-hover:text-indigo-600 transition-colors leading-tight">
                  {scenario.title}
                </h3>
                <p className="text-slate-400 text-sm font-medium mb-8 line-clamp-2 flex-1">
                  {scenario.description}
                </p>
                
                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Users size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{scenario.users}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-widest">{scenario.duration}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
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
