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
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-display font-black text-slate-900 italic tracking-tight">
            Hello, John! 👋
          </h1>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
            <Flame className="text-orange-500 fill-orange-500" size={18} />
            <span className="font-black text-slate-900 text-sm">12</span>
          </div>
        </div>
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Your learning journey continues</p>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="col-span-2 bg-indigo-600 text-white border-none shadow-2xl shadow-indigo-200 rounded-[2.5rem] overflow-hidden relative group">
          <CardContent className="p-8 flex flex-col justify-between h-full min-h-[180px] relative z-10">
            <div>
              <p className="text-indigo-200 font-bold text-xs uppercase tracking-[0.2em] mb-2">Current Level</p>
              <h3 className="text-4xl font-black font-display italic tracking-tighter">B2 Upper</h3>
            </div>
            <div className="flex items-center gap-2 text-indigo-200 text-xs font-bold">
              <Trophy size={14} />
              <span>Top 5% this month</span>
            </div>
          </CardContent>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400/20 rounded-full -ml-12 -mb-12 blur-2xl" />
        </Card>
        
        <Card className="bg-white border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full gap-2">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mb-2">
              <Target size={24} />
            </div>
            <h3 className="text-2xl font-black text-slate-900">85%</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Goal</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full gap-2">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mb-2">
              <BookOpen size={24} />
            </div>
            <h3 className="text-2xl font-black text-slate-900">1.2k</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Words</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Scenario */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-slate-900 italic tracking-tight">Active Lesson</h2>
          <Link to="/student/scenarios" className="text-xs font-bold text-indigo-600 uppercase tracking-widest hover:underline">
            Library
          </Link>
        </div>
        <Link to={`/student/scenarios/${featuredScenario.id}?mode=2d`} className="block">
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
              <div className="flex-1 p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em]">
                    {featuredScenario.category}
                  </span>
                  <span className="text-slate-300 text-[10px]">•</span>
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">15 min left</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">{featuredScenario.title}</h3>
                
                <div className="space-y-4 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress</span>
                    <span className="text-sm font-black text-slate-900 italic">65%</span>
                  </div>
                  <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "65%" }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.3)]"
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
              <Card hoverEffect className="border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all overflow-hidden bg-white h-full flex flex-col group">
                <div className="h-48 bg-slate-100 relative overflow-hidden">
                  <img 
                    src={scenario.image}
                    alt={scenario.title} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border border-white/20">
                    {scenario.level}
                  </div>
                </div>
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-lg text-slate-900 tracking-tight line-clamp-1">{scenario.title}</h3>
                    <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2 py-1 rounded-full text-[10px] font-black">
                        <Star size={10} fill="currentColor" /> {scenario.rating}
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm font-medium mb-6 line-clamp-2 flex-1">{scenario.description}</p>
                  <Button className="w-full rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-[10px] h-12">
                    Start Now
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

