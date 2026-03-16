import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Flame, Trophy, Target, ArrowRight, Play, BookOpen, Star, Monitor, Video, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { scenarios } from "@/data/scenarios";
import { motion, AnimatePresence } from "motion/react";

export default function StudentDashboard() {
  const navigate = useNavigate();
  // Get a few scenarios for the dashboard
  const recommendedScenarios = scenarios.slice(0, 3);
  const featuredScenario = scenarios[0];

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-slate-900 italic tracking-tight leading-tight">
              Hello, <span className="text-indigo-600">John!</span> 👋
            </h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-1">Your learning journey continues</p>
          </div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm"
          >
            <Flame className="text-orange-500 fill-orange-500" size={18} />
            <span className="font-black text-slate-950 text-sm">12</span>
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-4">
        {/* Elite Learner Card - More responsive layout */}
        <Card className="col-span-6 lg:col-span-4 bg-slate-950 text-white border-none shadow-2xl rounded-[2.5rem] overflow-hidden relative group min-h-[200px]">
          <div className="absolute inset-0 bg-gradient-vibrant opacity-90 group-hover:opacity-100 transition-opacity duration-700" />
          <CardContent className="p-8 md:p-10 flex flex-col justify-between h-full relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 mb-4">
                 <Trophy size={14} className="text-amber-300" />
                 <span className="text-white font-black text-[10px] uppercase tracking-widest">Elite Learner</span>
              </div>
              <p className="text-white/70 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Current Level</p>
              <h3 className="text-4xl md:text-5xl font-black font-display italic tracking-tighter">B2 Upper</h3>
            </div>
            <div className="flex items-center gap-2 text-white/80 text-[10px] font-bold mt-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Top 5% Global Rank this month</span>
            </div>
          </CardContent>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full -ml-16 -mb-16 blur-2xl" />
        </Card>
        
        {/* Stats Grid - optimized for mobile */}
        <div className="col-span-3 lg:col-span-1 glass-card rounded-[2.2rem] p-6 flex flex-col items-center justify-center text-center gap-3 accent-glow border-glow">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 border-2 border-white/40">
            <Target size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-950 tracking-tighter italic">85%</h3>
            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">Daily Goal</p>
          </div>
        </div>

        <div className="col-span-3 lg:col-span-1 glass-card rounded-[2.2rem] p-6 flex flex-col items-center justify-center text-center gap-3 accent-glow border-glow">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 border-2 border-white/40">
            <BookOpen size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-950 tracking-tighter italic">1.2k</h3>
            <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mt-0.5">Vocab Size</p>
          </div>
        </div>
      </div>

      {/* Active Scenario */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-slate-900 italic tracking-tight">Active Lesson</h2>
          <Link to="/student/scenarios" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">
            View All
          </Link>
        </div>
        <Link to={`/student/scenarios/${featuredScenario.id}?mode=${featuredScenario.modes.includes("2d") ? "2d" : "ar"}`} className="block">
          <Card className="group border-slate-100 rounded-[2.5rem] shadow-lg shadow-slate-200/50 hover:shadow-2xl transition-all cursor-pointer overflow-hidden bg-white">
            <div className="flex flex-col lg:flex-row">
              <div className="w-full lg:w-56 h-44 lg:h-auto bg-slate-100 relative overflow-hidden">
                <img 
                  src={featuredScenario.image}
                  alt="Scenario" 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1 rounded-lg bg-white/20 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest border border-white/20">
                    {featuredScenario.language}
                  </span>
                </div>
              </div>
              <div className="flex-1 p-8 lg:p-10 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-[0.2em] border border-indigo-100/50">
                    {featuredScenario.category}
                  </span>
                  <span className="text-slate-400 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <Monitor size={12} />
                    15 min left
                  </span>
                </div>
                <h3 className="text-2xl font-black text-slate-950 mb-6 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">{featuredScenario.title}</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                    <span className="text-sm font-black text-indigo-600 italic">65%</span>
                  </div>
                  <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "65%" }}
                      transition={{ duration: 1.5, ease: "circOut" }}
                      className="h-full bg-gradient-vibrant rounded-full shadow-md"
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 lg:p-8 flex items-center justify-center bg-slate-50/30 border-t lg:border-t-0 lg:border-l border-slate-100">
                <Button size="icon" className="rounded-2xl w-14 h-14 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 group-hover:scale-110 transition-transform">
                  <Play className="ml-1 fill-white" size={20} />
                </Button>
              </div>
            </div>
          </Card>
        </Link>
      </section>

      {/* Recommendations */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-slate-900 italic tracking-tight">Daily Picks</h2>
          <Button variant="ghost" className="text-[10px] font-black text-slate-400 uppercase tracking-widest rounded-xl px-0 hover:bg-transparent hover:text-indigo-600">
            Refresh
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendedScenarios.map((scenario) => (
            <Link to={`/student/scenarios/${scenario.id}?mode=2d`} key={scenario.id} className="block group">
              <div className="glass-card rounded-[2.5rem] overflow-hidden bg-white h-full flex flex-col border border-slate-100 hover:border-indigo-100 transition-all duration-500">
                <div className="h-48 bg-slate-100 relative overflow-hidden">
                  <img 
                    src={scenario.image}
                    alt={scenario.title} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md text-indigo-600 text-[9px] font-black uppercase tracking-widest shadow-xl border border-white">
                    {scenario.level}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-7 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <h3 className="font-black text-lg text-slate-950 tracking-tight line-clamp-1 group-hover:text-indigo-600 transition-colors uppercase leading-none">{scenario.title}</h3>
                    <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2 rounded-lg text-[9px] font-black border border-amber-100/30 flex-shrink-0">
                        <Star size={10} fill="currentColor" /> {scenario.rating}
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs font-medium mb-6 line-clamp-2 flex-1 leading-relaxed">{scenario.description}</p>
                  <Button className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[9px] h-12 shadow-lg shadow-indigo-50 transition-all group-hover:shadow-indigo-200">
                    Continue
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

