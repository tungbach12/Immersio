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
    <div className="space-y-10 pb-10">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-black text-slate-900 italic tracking-tight leading-tight">
              Hello, <span className="text-indigo-600">John!</span> 👋
            </h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-1">Your learning journey continues</p>
          </div>
          <div className="flex items-center gap-2 bg-indigo-50/50 px-4 py-3 rounded-2xl border border-indigo-100/50 shadow-sm">
            <Flame className="text-orange-500 fill-orange-500" size={20} />
            <span className="font-black text-slate-950 text-base">12</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <Card className="col-span-2 bg-slate-950 text-white border-none shadow-3xl rounded-[2.5rem] overflow-hidden relative group min-h-[220px]">
          <div className="absolute inset-0 bg-gradient-vibrant opacity-90 group-hover:opacity-100 transition-opacity duration-700" />
          <CardContent className="p-10 flex flex-col justify-between h-full relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 mb-4">
                 <Trophy size={14} className="text-amber-300" />
                 <span className="text-white font-black text-[10px] uppercase tracking-widest">Elite Learner</span>
              </div>
              <p className="text-white/70 font-bold text-xs uppercase tracking-[0.2em] mb-1">Current Level</p>
              <h3 className="text-5xl font-black font-display italic tracking-tighter">B2 Upper</h3>
            </div>
            <div className="flex items-center gap-2 text-white/80 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Top 5% Global Rank this month</span>
            </div>
          </CardContent>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full -ml-16 -mb-16 blur-2xl" />
        </Card>
        
        <div className="bg-white glass-card rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-14 h-14 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100/50">
            <Target size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-950 tracking-tighter">85%</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Daily Goal</p>
          </div>
        </div>

        <div className="bg-white glass-card rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-14 h-14 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-blue-500 shadow-sm border border-blue-100/50">
            <BookOpen size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-950 tracking-tighter">1.2k</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Vocab Size</p>
          </div>
      </div>
    </div>

      {/* Active Scenario */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-slate-900 italic tracking-tight">Active Lesson</h2>
          <Link to="/student/scenarios" className="text-xs font-bold text-indigo-600 uppercase tracking-widest hover:underline">
            Library
          </Link>
        </div>
        <Link to={`/student/scenarios/${featuredScenario.id}?mode=${featuredScenario.modes.includes("2d") ? "2d" : "ar"}`} className="block">
          <Card className="group border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden bg-white">
            <div className="flex flex-col sm:flex-row">
              <div className="w-full sm:w-56 h-48 sm:h-auto bg-slate-100 relative overflow-hidden">
                <img 
                  src={featuredScenario.image}
                  alt="Scenario" 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest border border-white/20">
                    {featuredScenario.language}
                  </span>
                </div>
              </div>
              <div className="flex-1 p-10 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-100/50">
                    {featuredScenario.category}
                  </span>
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <Monitor size={12} />
                    15 min left
                  </span>
                </div>
                <h3 className="text-3xl font-black text-slate-950 mb-6 tracking-tight leading-tight">{featuredScenario.title}</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Course Progress</span>
                    <span className="text-base font-black text-indigo-600 italic">65%</span>
                  </div>
                  <div className="h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-1">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "65%" }}
                      transition={{ duration: 1.5, ease: "circOut" }}
                      className="h-full bg-gradient-vibrant rounded-full shadow-lg shadow-indigo-500/20"
                    />
                  </div>
                </div>
              </div>
              <div className="p-8 flex items-center justify-center bg-slate-50/50 border-l border-slate-100">
                <Button size="icon" className="rounded-full w-16 h-16 bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-200 group-hover:scale-110 transition-transform">
                  <Play className="ml-1 fill-white" size={24} />
                </Button>
              </div>
            </div>
          </Card>
        </Link>
      </section>

      {/* Recommendations */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-slate-900 italic tracking-tight">Daily Picks</h2>
          <Button variant="ghost" className="text-xs font-bold text-slate-400 uppercase tracking-widest rounded-xl">
            Refresh
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendedScenarios.map((scenario) => (
            <Link to={`/student/scenarios/${scenario.id}?mode=2d`} key={scenario.id} className="block">
              <div className="glass-card rounded-[2.5rem] overflow-hidden bg-white h-full flex flex-col group border border-slate-100">
                <div className="h-56 bg-slate-100 relative overflow-hidden">
                  <img 
                    src={scenario.image}
                    alt={scenario.title} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute top-6 left-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md text-indigo-600 text-[10px] font-black uppercase tracking-widest shadow-xl border border-white">
                    {scenario.level}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-black text-xl text-slate-950 tracking-tight line-clamp-1">{scenario.title}</h3>
                    <div className="flex items-center gap-1.5 text-amber-500 bg-amber-50 px-2.5 py-1 rounded-lg text-[10px] font-black border border-amber-100/50">
                        <Star size={12} fill="currentColor" /> {scenario.rating}
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm font-medium mb-8 line-clamp-2 flex-1 leading-relaxed">{scenario.description}</p>
                  <Button className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] h-14 shadow-lg shadow-indigo-100 group-hover:scale-[1.02] transition-transform">
                    Continue Learning
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

