import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Flame, Trophy, Target, Play, BookOpen, Star, Monitor } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { scenarios } from "@/data/scenarios";
import { motion } from "motion/react";

const NM_RAISED = { boxShadow: '6px 6px 12px #D5C9B8, -6px -6px 12px #FFFFFF' } as const;
const NM_RAISED_LG = { boxShadow: '12px 12px 24px #D5C9B8, -12px -12px 24px #FFFFFF' } as const;
const NM_INSET = { boxShadow: 'inset 4px 4px 8px #D5C9B8, inset -4px -4px 8px #FFFFFF' } as const;
const NM_INSET_SM = { boxShadow: 'inset 2px 2px 4px #D5C9B8, inset -2px -2px 4px #FFFFFF' } as const;

export default function StudentDashboard() {
  const navigate = useNavigate();
  const recommendedScenarios = scenarios.slice(0, 3);
  const featuredScenario = scenarios[0];

  return (
    <div className="space-y-8 pb-10" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>

      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl text-[#3E2723] leading-tight" style={{ fontFamily: "'Noto Serif Display', serif" }}>
            Hello, <span style={{ color: '#8B5E3C' }}>John!</span> 👋
          </h1>
          <p className="text-[#A0856A] font-medium text-[10px] uppercase tracking-[0.3em] mt-1">Your learning journey continues</p>
        </div>
        <motion.div
          whileHover={{ scale: 1.04 }}
          className="flex items-center gap-2 bg-[#FDF6EC] px-4 py-2.5 rounded-2xl cursor-pointer"
          style={NM_RAISED}
        >
          <Flame className="text-orange-500 fill-orange-500" size={18} />
          <span className="font-semibold text-[#3E2723] text-sm" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>12</span>
        </motion.div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-6 gap-4">

        {/* Elite Learner */}
        <div className="col-span-6 lg:col-span-4 rounded-[2rem] overflow-hidden relative min-h-[200px]" style={{ background: 'linear-gradient(135deg, #6B4226 0%, #8B5E3C 50%, #A0724F 100%)', boxShadow: '8px 8px 20px #D5C9B8, -8px -8px 20px #FFFFFF' }}>
          <div className="p-8 md:p-10 flex flex-col justify-between h-full relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 mb-4">
                <Trophy size={14} className="text-[#F0D0A8]" />
                <span className="text-white font-semibold text-[10px] uppercase tracking-widest">Elite Learner</span>
              </div>
              <p className="text-white/60 font-medium text-[10px] uppercase tracking-[0.2em] mb-1">Current Level</p>
              <h3 className="text-4xl md:text-5xl text-white" style={{ fontFamily: "'Noto Serif Display', serif" }}>B2 Upper</h3>
            </div>
            <div className="flex items-center gap-2 text-white/70 text-[10px] font-medium mt-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Top 5% Global Rank this month</span>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/8 rounded-full -mr-24 -mt-24 blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#C4956A]/20 rounded-full -ml-16 -mb-16 blur-2xl" />
        </div>

        {/* Stat: Daily Goal */}
        <div className="col-span-3 lg:col-span-1 bg-[#FDF6EC] rounded-[2rem] p-6 flex flex-col items-center justify-center text-center gap-3" style={NM_RAISED}>
          <div className="w-12 h-12 bg-[#059669] rounded-2xl flex items-center justify-center text-white" style={{ boxShadow: '4px 4px 10px rgba(5,150,105,0.3)' }}>
            <Target size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-2xl text-[#3E2723]" style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>85%</h3>
            <p className="text-[9px] font-semibold text-[#059669] uppercase tracking-widest mt-0.5">Daily Goal</p>
          </div>
        </div>

        {/* Stat: Vocab */}
        <div className="col-span-3 lg:col-span-1 bg-[#FDF6EC] rounded-[2rem] p-6 flex flex-col items-center justify-center text-center gap-3" style={NM_RAISED}>
          <div className="w-12 h-12 bg-[#8B5E3C] rounded-2xl flex items-center justify-center text-white" style={{ boxShadow: '4px 4px 10px rgba(139,94,60,0.3)' }}>
            <BookOpen size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-2xl text-[#3E2723]" style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>1.2k</h3>
            <p className="text-[9px] font-semibold text-[#C4956A] uppercase tracking-widest mt-0.5">Vocab Size</p>
          </div>
        </div>
      </div>

      {/* Active Lesson */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg text-[#3E2723]" style={{ fontFamily: "'Noto Serif Display', serif" }}>Active Lesson</h2>
          <Link to="/student/scenarios" className="text-[10px] font-semibold text-[#8B5E3C] uppercase tracking-widest hover:text-[#6B4226] transition-colors">
            View All
          </Link>
        </div>
        <Link to={`/student/scenarios/${featuredScenario.id}?mode=${featuredScenario.modes.includes("2d") ? "2d" : "ar"}`} className="block">
          <div className="group bg-[#FDF6EC] rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-400 hover:scale-[1.01]" style={NM_RAISED_LG}>
            <div className="flex flex-col lg:flex-row">
              <div className="w-full lg:w-56 h-44 lg:h-auto relative overflow-hidden">
                <img
                  src={featuredScenario.image}
                  alt="Scenario"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#3E2723]/50 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1 rounded-lg bg-white/20 backdrop-blur-md text-white text-[9px] font-semibold uppercase tracking-widest border border-white/20">
                    {featuredScenario.language}
                  </span>
                </div>
              </div>
              <div className="flex-1 p-8 lg:p-10 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-[#FAF0E1] text-[#8B5E3C] text-[9px] font-semibold uppercase tracking-[0.2em]" style={NM_INSET_SM}>
                    {featuredScenario.category}
                  </span>
                  <span className="text-[#A0856A] text-[9px] font-medium uppercase tracking-widest flex items-center gap-1.5">
                    <Monitor size={11} /> 15 min left
                  </span>
                </div>
                <h3 className="text-2xl text-[#3E2723] mb-6 leading-tight group-hover:text-[#8B5E3C] transition-colors" style={{ fontFamily: "'Noto Serif Display', serif" }}>
                  {featuredScenario.title}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-semibold text-[#A0856A] uppercase tracking-widest">Progress</span>
                    <span className="text-sm font-semibold text-[#8B5E3C]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>65%</span>
                  </div>
                  <div className="h-3 rounded-full p-0.5" style={NM_INSET_SM}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "65%" }}
                      transition={{ duration: 1.5, ease: "circOut" }}
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #8B5E3C, #C4956A)' }}
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 lg:p-8 flex items-center justify-center border-t lg:border-t-0 lg:border-l border-[#E8DDD0]">
                <button
                  className="w-14 h-14 bg-[#8B5E3C] hover:bg-[#6B4226] text-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300"
                  style={NM_RAISED}
                >
                  <Play className="ml-0.5 fill-white" size={18} />
                </button>
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* Daily Picks */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg text-[#3E2723]" style={{ fontFamily: "'Noto Serif Display', serif" }}>Daily Picks</h2>
          <button className="text-[10px] font-semibold text-[#A0856A] uppercase tracking-widest hover:text-[#8B5E3C] transition-colors bg-transparent border-none cursor-pointer">
            Refresh
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendedScenarios.map((scenario) => (
            <Link to={`/student/scenarios/${scenario.id}?mode=2d`} key={scenario.id} className="block group">
              <div className="bg-[#FDF6EC] rounded-[2rem] overflow-hidden h-full flex flex-col transition-all duration-400 hover:scale-[1.02]" style={NM_RAISED}>
                <div className="h-48 relative overflow-hidden">
                  <img
                    src={scenario.image}
                    alt={scenario.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-[#FDF6EC] text-[#8B5E3C] text-[9px] font-semibold uppercase tracking-widest" style={{ boxShadow: '3px 3px 6px #D5C9B8, -3px -3px 6px #FFFFFF' }}>
                      {scenario.level}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#3E2723]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-7 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <h3 className="font-semibold text-[17px] text-[#3E2723] line-clamp-1 group-hover:text-[#8B5E3C] transition-colors" style={{ fontFamily: "'Noto Serif Display', serif" }}>
                      {scenario.title}
                    </h3>
                    <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 rounded-lg text-[9px] font-semibold flex-shrink-0">
                      <Star size={10} fill="currentColor" /> {scenario.rating}
                    </div>
                  </div>
                  <p className="text-[#6D4C41] text-xs mb-6 line-clamp-2 flex-1 leading-relaxed">{scenario.description}</p>
                  <button
                    className="w-full rounded-xl bg-[#8B5E3C] hover:bg-[#6B4226] text-white font-semibold uppercase tracking-widest text-[9px] h-11 transition-all duration-300"
                    style={NM_RAISED}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
