import { useState, useEffect } from "react";
import {
  Flame,
  Trophy,
  Target,
  ArrowRight,
  Play,
  BookOpen,
  Star,
  Monitor,
  ChevronDown,
  ChevronUp,
  Zap,
  Mic,
  Brain,
} from "lucide-react";
import { Link } from "react-router-dom";
import { scenarios } from "@/data/scenarios";
import { motion, AnimatePresence } from "motion/react";
import { authService, UserDto } from "@/services/auth";
import { practiceService, CefrAnalysisDto } from "@/services/practice";

const NM_RAISED = { boxShadow: '6px 6px 12px #D5C9B8, -6px -6px 12px #FFFFFF' } as const;
const NM_RAISED_LG = { boxShadow: '12px 12px 24px #D5C9B8, -12px -12px 24px #FFFFFF' } as const;
const NM_INSET_SM = { boxShadow: 'inset 2px 2px 4px #D5C9B8, inset -2px -2px 4px #FFFFFF' } as const;

const CEFR_LABELS: Record<string, { label: string; emoji: string }> = {
  Unassigned: { label: "Not yet assessed", emoji: "❓" },
  A1: { label: "Breakthrough", emoji: "🌱" },
  A2: { label: "Elementary", emoji: "🌿" },
  B1: { label: "Intermediate", emoji: "⚡" },
  B2: { label: "Upper-Inter", emoji: "🔥" },
  C1: { label: "Advanced", emoji: "💎" },
  C2: { label: "Mastery", emoji: "👑" },
};

function formatExp(exp: number): string {
  if (exp >= 1000) return `${(exp / 1000).toFixed(1)}k`;
  return String(exp);
}

export default function StudentDashboard() {
  const [user, setUser] = useState<UserDto | null>(authService.getUser());
  const [cefrData, setCefrData] = useState<CefrAnalysisDto | null>(null);
  const [showCefrBreakdown, setShowCefrBreakdown] = useState(false);
  const [loadingCefr, setLoadingCefr] = useState(false);


  const recommendedScenarios = scenarios.slice(0, 3);
  const featuredScenario = scenarios[0];

  useEffect(() => {
    // Sync latest user from server
    authService
      .getMe()
      .then((latest) => {
        authService.updateUser(latest);
        setUser(latest);
      })
      .catch((err) => console.error("Profile sync failed:", err));
  }, []);

  const handleToggleCefr = async () => {
    if (showCefrBreakdown) {
      setShowCefrBreakdown(false);
      return;
    }
    if (!cefrData) {
      setLoadingCefr(true);
      try {
        const analysis = await practiceService.getCefrAnalysis();
        setCefrData(analysis);
      } catch (err) {
        console.error("CEFR fetch failed:", err);
      } finally {
        setLoadingCefr(false);
      }
    }
    setShowCefrBreakdown(true);
  };

  const level = user?.currentLanguageLevel?.split(" ")[0] ?? "Unassigned";
  const cefrConfig = CEFR_LABELS[level] ?? CEFR_LABELS["Unassigned"];
  const streak = user?.streakCount ?? 0;
  const exp = user?.experiencePoints ?? 0;
  const hours = user?.learningHours ?? 0;

  return (
    <div className="space-y-8 pb-10" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>

      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl text-[#3E2723] leading-tight" style={{ fontFamily: "'Noto Serif Display', serif" }}>
            Hello, <span style={{ color: '#8B5E3C' }}>{user?.username ?? "Learner"}!</span> 👋
          </h1>
          <p className="text-[#A0856A] font-medium text-[10px] uppercase tracking-[0.3em] mt-1">Your learning journey continues</p>
        </div>
        <motion.div
          whileHover={{ scale: 1.04 }}
          className="flex items-center gap-2 bg-[#FDF6EC] px-4 py-2.5 rounded-2xl cursor-pointer"
          style={NM_RAISED}
        >
          <Flame className="text-orange-500 fill-orange-500" size={18} />
          <span className="font-semibold text-[#3E2723] text-sm" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{streak}</span>
        </motion.div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-6 gap-4">

        {/* Elite Learner / CEFR */}
        <div
          onClick={handleToggleCefr}
          className="col-span-6 lg:col-span-4 rounded-[2rem] overflow-hidden relative min-h-[200px] cursor-pointer group"
          style={{ background: 'linear-gradient(135deg, #6B4226 0%, #8B5E3C 50%, #A0724F 100%)', boxShadow: '8px 8px 20px #D5C9B8, -8px -8px 20px #FFFFFF' }}
        >
          <div className="p-8 md:p-10 flex flex-col justify-between h-full relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 mb-4">
                  <Trophy size={14} className="text-[#F0D0A8]" />
                  <span className="text-white font-semibold text-[10px] uppercase tracking-widest">Elite Learner</span>
                </div>
                <p className="text-white/60 font-medium text-[10px] uppercase tracking-[0.2em] mb-1">Current CEFR Level</p>
                <div className="flex items-end gap-3">
                  <h3 className="text-4xl md:text-5xl text-white" style={{ fontFamily: "'Noto Serif Display', serif" }}>
                    {user?.currentLanguageLevel ?? "Unassigned"}
                  </h3>
                  <span className="text-3xl mb-1">{cefrConfig.emoji}</span>
                </div>
                <p className="text-white/60 text-[10px] font-semibold mt-1 uppercase tracking-widest">{cefrConfig.label}</p>
              </div>
              <div className="w-14 h-14 rounded-full ring-4 ring-white/30 bg-white/10 backdrop-blur-md flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110">
                <span className="text-xl font-semibold text-white" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{level}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2 text-white/70 text-[10px] font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Top 5% Global Rank this month</span>
              </div>
              <button className="flex items-center gap-1.5 text-white/70 hover:text-white text-[10px] font-semibold uppercase tracking-widest transition-colors">
                {loadingCefr ? (
                  <span className="animate-spin text-sm">⏳</span>
                ) : showCefrBreakdown ? (
                  <>Hide Analysis <ChevronUp size={14} /></>
                ) : (
                  <>Skill Breakdown <ChevronDown size={14} /></>
                )}
              </button>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/8 rounded-full -mr-24 -mt-24 blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#C4956A]/20 rounded-full -ml-16 -mb-16 blur-2xl" />
        </div>

        {/* Stat: Experience */}
        <div className="col-span-3 lg:col-span-1 bg-[#FDF6EC] rounded-[2rem] p-6 flex flex-col items-center justify-center text-center gap-3" style={NM_RAISED}>
          <div className="w-12 h-12 bg-[#059669] rounded-2xl flex items-center justify-center text-white" style={{ boxShadow: '4px 4px 10px rgba(5,150,105,0.3)' }}>
            <Target size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-2xl text-[#3E2723]" style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>{formatExp(exp)}</h3>
            <p className="text-[9px] font-semibold text-[#059669] uppercase tracking-widest mt-0.5">Experience</p>
          </div>
        </div>

        {/* Stat: Vocab */}
        <div className="col-span-3 lg:col-span-1 bg-[#FDF6EC] rounded-[2rem] p-6 flex flex-col items-center justify-center text-center gap-3" style={NM_RAISED}>
          <div className="w-12 h-12 bg-[#8B5E3C] rounded-2xl flex items-center justify-center text-white" style={{ boxShadow: '4px 4px 10px rgba(139,94,60,0.3)' }}>
            <BookOpen size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-2xl text-[#3E2723]" style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>{Math.round(hours)}h</h3>
            <p className="text-[9px] font-semibold text-[#C4956A] uppercase tracking-widest mt-0.5">Learning</p>
          </div>
        </div>
      </div>

      {/* CEFR Breakdown Accordion */}
      <AnimatePresence>
        {showCefrBreakdown && cefrData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 250 }}
            className="overflow-hidden"
          >
            <div className="bg-[#FDF6EC] rounded-[2rem] p-8 space-y-6" style={NM_RAISED_LG}>
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#3E2723] rounded-xl flex items-center justify-center">
                  <Brain size={18} className="text-[#F0D0A8]" />
                </div>
                <div>
                  <h3 className="text-lg text-[#3E2723]" style={{ fontFamily: "'Noto Serif Display', serif" }}>
                    CEFR Analysis
                  </h3>
                  <p className="text-[10px] font-semibold text-[#A0856A] uppercase tracking-[0.25em]">
                    {cefrData.statusMessage}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <span className="text-3xl text-[#3E2723]" style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>
                    {cefrData.overallScore}
                  </span>
                  <p className="text-[9px] font-semibold text-[#A0856A] uppercase tracking-widest">
                    / 100
                  </p>
                </div>
              </div>

              {/* Skill Progress Bars */}
              <div className="space-y-4">
                {cefrData.skills.map((skill, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        {i === 0 ? (
                          <Monitor size={13} className="text-[#8B5E3C]" />
                        ) : i === 1 ? (
                          <Mic size={13} className="text-[#059669]" />
                        ) : (
                          <BookOpen size={13} className="text-[#C4956A]" />
                        )}
                        <span className="text-[11px] font-semibold text-[#6D4C41] uppercase tracking-widest">
                          {skill.name}
                        </span>
                      </div>
                      <span className="text-sm text-[#3E2723]" style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>
                        {skill.score}%
                      </span>
                    </div>
                    <div className="h-3 rounded-full p-0.5" style={NM_INSET_SM}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.score}%` }}
                        transition={{
                          duration: 1.2,
                          ease: "circOut",
                          delay: i * 0.15,
                        }}
                        className="h-full rounded-full"
                        style={{
                          background:
                            i === 0
                              ? 'linear-gradient(90deg, #8B5E3C, #A0724F)'
                              : i === 1
                              ? 'linear-gradient(90deg, #059669, #10B981)'
                              : 'linear-gradient(90deg, #C4956A, #D4A87A)',
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-[#A0856A] font-medium mt-1">
                      {skill.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Study Suggestions */}
              {cefrData.suggestions.length > 0 && (
                <div className="bg-[#FAF0E1] rounded-2xl p-5 space-y-2" style={NM_INSET_SM}>
                  <p className="text-[10px] font-semibold text-[#A0856A] uppercase tracking-[0.3em] mb-3">
                    💡 Study Suggestions
                  </p>
                  {cefrData.suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#8B5E3C] flex-shrink-0 mt-1.5" />
                      <p className="text-xs text-[#6D4C41] font-medium leading-relaxed">
                        {s}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <Link to="/student/practice">
                <button className="w-full h-12 rounded-2xl bg-[#8B5E3C] hover:bg-[#6B4226] text-white font-semibold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all duration-300" style={NM_RAISED}>
                  <Zap size={14} className="text-[#F0D0A8]" />
                  Practice Now to Level Up
                  <ArrowRight size={13} />
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
