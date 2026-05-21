import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
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
import { Link, useNavigate } from "react-router-dom";
import { scenarios } from "@/data/scenarios";
import { motion, AnimatePresence } from "motion/react";
import { authService, UserDto } from "@/services/auth";
import { practiceService, CefrAnalysisDto } from "@/services/practice";
import { cn } from "@/lib/utils";

const CEFR_CONFIG: Record<
  string,
  { gradient: string; glow: string; ring: string; label: string; emoji: string }
> = {
  A1: {
    gradient: "from-slate-700 via-slate-600 to-slate-800",
    glow: "shadow-slate-400/40",
    ring: "ring-slate-500/60",
    label: "Breakthrough",
    emoji: "🌱",
  },
  A2: {
    gradient: "from-amber-700 via-amber-600 to-amber-800",
    glow: "shadow-amber-500/40",
    ring: "ring-amber-500/60",
    label: "Elementary",
    emoji: "🌿",
  },
  B1: {
    gradient: "from-emerald-700 via-emerald-600 to-teal-700",
    glow: "shadow-emerald-500/40",
    ring: "ring-emerald-500/60",
    label: "Intermediate",
    emoji: "⚡",
  },
  B2: {
    gradient: "from-indigo-700 via-blue-600 to-indigo-800",
    glow: "shadow-indigo-500/40",
    ring: "ring-indigo-500/60",
    label: "Upper-Inter",
    emoji: "🔥",
  },
  C1: {
    gradient: "from-purple-700 via-violet-600 to-purple-800",
    glow: "shadow-purple-500/40",
    ring: "ring-purple-500/60",
    label: "Advanced",
    emoji: "💎",
  },
  C2: {
    gradient: "from-rose-600 via-pink-500 to-orange-500",
    glow: "shadow-rose-500/50",
    ring: "ring-rose-400/70",
    label: "Mastery",
    emoji: "👑",
  },
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

  const level = user?.currentLanguageLevel?.split(" ")[0] ?? "B2";
  const cefrConfig = CEFR_CONFIG[level] ?? CEFR_CONFIG["B2"];
  const streak = user?.streakCount ?? 12;
  const exp = user?.experiencePoints ?? 2400;
  const hours = user?.learningHours ?? 48;

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-slate-900 italic tracking-tight leading-tight">
              Hello,{" "}
              <span className="text-indigo-600">
                {user?.username ?? "Learner"}!
              </span>{" "}
              👋
            </h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-1">
              Your learning journey continues
            </p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm"
          >
            <Flame className="text-orange-500 fill-orange-500" size={18} />
            <span className="font-black text-slate-950 text-sm">{streak}</span>
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-4">
        {/* Dynamic CEFR Level Card */}
        <Card
          className={cn(
            "col-span-6 lg:col-span-4 text-white border-none shadow-2xl rounded-[2.5rem] overflow-hidden relative group cursor-pointer",
            cefrConfig.glow,
            "shadow-2xl"
          )}
          onClick={handleToggleCefr}
        >
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-95 transition-opacity duration-700",
              cefrConfig.gradient
            )}
          />
          {/* Animated glow orbs */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 blur-2xl" />

          <CardContent className="p-8 md:p-10 flex flex-col justify-between relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 mb-4">
                  <Trophy size={14} className="text-amber-300" />
                  <span className="text-white font-black text-[10px] uppercase tracking-widest">
                    Elite Learner
                  </span>
                </div>
                <p className="text-white/70 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">
                  Current CEFR Level
                </p>
                <div className="flex items-end gap-4">
                  <h3 className="text-4xl md:text-5xl font-black font-display italic tracking-tighter">
                    {user?.currentLanguageLevel ?? "B2 Upper"}
                  </h3>
                  <span className="text-3xl mb-1">{cefrConfig.emoji}</span>
                </div>
                <p className="text-white/60 text-xs font-bold mt-1 uppercase tracking-widest">
                  {cefrConfig.label}
                </p>
              </div>

              {/* CEFR Badge Ring */}
              <div
                className={cn(
                  "w-16 h-16 rounded-full ring-4 bg-white/10 backdrop-blur-md flex items-center justify-center flex-shrink-0 mt-2 transition-transform group-hover:scale-110",
                  cefrConfig.ring
                )}
              >
                <span className="text-2xl font-black text-white tracking-tighter">
                  {level}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center gap-2 text-white/80 text-[10px] font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Top 5% Global Rank this month</span>
              </div>
              <button className="flex items-center gap-1.5 text-white/70 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">
                {loadingCefr ? (
                  <span className="animate-spin text-sm">⏳</span>
                ) : showCefrBreakdown ? (
                  <>
                    Hide Analysis <ChevronUp size={14} />
                  </>
                ) : (
                  <>
                    Skill Breakdown <ChevronDown size={14} />
                  </>
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="col-span-3 lg:col-span-1 glass-card rounded-[2.2rem] p-6 flex flex-col items-center justify-center text-center gap-3 accent-glow border-glow">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 border-2 border-white/40">
            <Target size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-950 tracking-tighter italic">
              {formatExp(exp)}
            </h3>
            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">
              Experience
            </p>
          </div>
        </div>

        <div className="col-span-3 lg:col-span-1 glass-card rounded-[2.2rem] p-6 flex flex-col items-center justify-center text-center gap-3 accent-glow border-glow">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 border-2 border-white/40">
            <BookOpen size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-950 tracking-tighter italic">
              {Math.round(hours)}h
            </h3>
            <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mt-0.5">
              Learning
            </p>
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
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 space-y-6 shadow-xl shadow-slate-200/30">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center">
                  <Brain size={18} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-black text-slate-950 text-lg tracking-tight italic">
                    CEFR Analysis
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em]">
                    {cefrData.statusMessage}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <span className="text-3xl font-black text-slate-950 italic tracking-tighter">
                    {cefrData.overallScore}
                  </span>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
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
                          <Monitor size={13} className="text-indigo-500" />
                        ) : i === 1 ? (
                          <Mic size={13} className="text-emerald-500" />
                        ) : (
                          <BookOpen size={13} className="text-amber-500" />
                        )}
                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
                          {skill.name}
                        </span>
                      </div>
                      <span className="text-sm font-black text-slate-950 italic">
                        {skill.score}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.score}%` }}
                        transition={{
                          duration: 1.2,
                          ease: "circOut",
                          delay: i * 0.15,
                        }}
                        className={cn(
                          "h-full rounded-full shadow-sm",
                          i === 0
                            ? "bg-gradient-to-r from-indigo-500 to-indigo-600"
                            : i === 1
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                            : "bg-gradient-to-r from-amber-400 to-amber-500"
                        )}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">
                      {skill.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Study Suggestions */}
              {cefrData.suggestions.length > 0 && (
                <div className="bg-slate-50 rounded-2xl p-5 space-y-2 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">
                    💡 Study Suggestions
                  </p>
                  {cefrData.suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        {s}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <Link to="/student/practice">
                <Button className="w-full h-12 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-transform active:scale-95">
                  <Zap size={14} className="text-indigo-400" />
                  Practice Now to Level Up
                  <ArrowRight size={13} />
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Scenario */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-slate-900 italic tracking-tight">
            Active Lesson
          </h2>
          <Link
            to="/student/scenarios"
            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
          >
            View All
          </Link>
        </div>
        <Link
          to={`/student/scenarios/${featuredScenario.id}?mode=${
            featuredScenario.modes.includes("2d") ? "2d" : "ar"
          }`}
          className="block"
        >
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
                <h3 className="text-2xl font-black text-slate-950 mb-6 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">
                  {featuredScenario.title}
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Progress
                    </span>
                    <span className="text-sm font-black text-indigo-600 italic">
                      65%
                    </span>
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
                <Button
                  size="icon"
                  className="rounded-2xl w-14 h-14 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 group-hover:scale-110 transition-transform"
                >
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
          <h2 className="text-lg font-black text-slate-900 italic tracking-tight">
            Daily Picks
          </h2>
          <Button
            variant="ghost"
            className="text-[10px] font-black text-slate-400 uppercase tracking-widest rounded-xl px-0 hover:bg-transparent hover:text-indigo-600"
          >
            Refresh
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendedScenarios.map((scenario) => (
            <Link
              to={`/student/scenarios/${scenario.id}?mode=2d`}
              key={scenario.id}
              className="block group"
            >
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
                    <h3 className="font-black text-lg text-slate-950 tracking-tight line-clamp-1 group-hover:text-indigo-600 transition-colors uppercase leading-none">
                      {scenario.title}
                    </h3>
                    <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2 rounded-lg text-[9px] font-black border border-amber-100/30 flex-shrink-0">
                      <Star size={10} fill="currentColor" /> {scenario.rating}
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs font-medium mb-6 line-clamp-2 flex-1 leading-relaxed">
                    {scenario.description}
                  </p>
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
