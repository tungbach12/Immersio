import { useState, useEffect } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  BookOpen,
  Settings,
  User,
  Menu,
  X,
  BarChart2,
  Layers,
  Cpu,
  Bell,
  LogOut,
  Sparkles,
  Crown,
  ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function AppLayout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const isScenarioDetail = location.pathname.includes("/scenarios/") && !location.pathname.endsWith("/scenarios");

  const studentLinks = [
    { icon: Home, label: "Home", path: "/student/dashboard" },
    { icon: BookOpen, label: "Learn", path: "/student/scenarios" },
    { icon: Sparkles, label: "Practice", path: "/student/practice" },
    { icon: ShoppingBag, label: "Store", path: "/student/store" },
    { icon: User, label: "Profile", path: "/student/profile" },
  ];

  const adminLinks = [
    { icon: BarChart2, label: "Overview", path: "/admin/dashboard" },
    { icon: User, label: "Users", path: "/admin/users" },
    { icon: Layers, label: "Scenarios", path: "/admin/scenarios" },
    { icon: Cpu, label: "AI Tuning", path: "/admin/ai-tuning" },
  ];

  const links = isAdmin ? adminLinks : studentLinks;

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden font-body text-slate-900 relative">
      {/* Background Decorative Blobs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-slate-50">
        <motion.div
          animate={{ x: [0, 60, 0], y: [0, -40, 0], rotate: [0, 45, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[5%] -left-[10%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 60, 0], rotate: [0, -45, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[5%] -right-[10%] w-[55%] h-[55%] bg-fuchsia-500/15 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[15%] left-[15%] w-[65%] h-[60%] bg-blue-500/15 rounded-full blur-[130px]"
        />

        {/* Dynamic Multi-color Core */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-gradient-to-tr from-violet-500/20 via-pink-500/20 to-amber-500/20 rounded-full blur-[110px]"
        />

        {/* High Saturation Floating Particles */}
        <motion.div
          animate={{ y: [0, -120, 0], x: [0, 30, 0], opacity: [0, 0.6, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute top-[80%] right-[20%] w-6 h-6 rounded-full bg-indigo-600 blur-md shadow-[0_0_20px_rgba(79,70,229,0.5)]"
        />
        <motion.div
          animate={{ y: [0, -100, 0], x: [0, -20, 0], opacity: [0, 0.5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: 3 }}
          className="absolute top-[20%] left-[15%] w-5 h-5 rounded-full bg-pink-600 blur-md shadow-[0_0_20px_rgba(219,39,119,0.5)]"
        />
        <motion.div
          animate={{ y: [0, -150, 0], opacity: [0, 0.4, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear", delay: 1 }}
          className="absolute top-[50%] right-[40%] w-4 h-4 rounded-full bg-cyan-500 blur-md shadow-[0_0_15px_rgba(6,182,212,0.4)]"
        />

        {/* Subtle Grid Pattern - Increased visibility slightly */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.035]" />
      </div>
      {/* Desktop Sidebar */}
      {!isScenarioDetail && (
        <aside className="hidden md:flex w-80 flex-col bg-white/70 backdrop-blur-3xl border-r border-slate-100 z-20">
          <div className="p-10 flex items-center gap-4">
            <img src="/logo.png" alt="IMMERSIO Logo" className="h-12 w-auto object-contain" />
            <span className="text-xl font-black italic tracking-tighter text-slate-900">IMMERSIO</span>
          </div>

          <nav className="flex-1 px-6 py-4 space-y-3">
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link to={link.path} key={link.path}>
                  <div
                    className={cn(
                      "flex items-center gap-4 px-6 py-5 rounded-[1.5rem] transition-all duration-500 group relative overflow-hidden",
                      isActive
                        ? "bg-slate-950 text-white shadow-2xl shadow-slate-200"
                        : "text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    <link.icon
                      size={20}
                      className={cn(
                        "transition-all duration-500",
                        isActive ? "text-indigo-400 scale-110" : "text-slate-400 group-hover:text-slate-900"
                      )}
                    />
                    <span className="font-bold text-sm tracking-tight">{link.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="active-glow"
                        className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-transparent pointer-events-none"
                      />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="p-8">
            <div className="bg-slate-50 rounded-[2.5rem] p-8 mb-6 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-vibrant flex items-center justify-center text-white font-black text-sm shadow-xl shadow-indigo-100">
                  JD
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 truncate">John Doe</p>
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Premium Learner</p>
                </div>
              </div>
              <Link to="/student/subscription">
                <Button size="sm" className="w-full rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 text-[10px] font-black uppercase tracking-widest h-11">
                  View Plans
                </Button>
              </Link>
            </div>
            <Link to="/">
              <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl font-bold text-sm h-12">
                <LogOut size={18} className="mr-3" />
                Log Out
              </Button>
            </Link>
          </div>
        </aside>
      )}

      {/* Mobile Top Header */}
      {!isScenarioDetail && (
        <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-3xl border-b border-slate-100/50 z-40 flex items-center justify-between px-6 transition-all duration-300">
          <div className="flex items-center gap-3">
             <img src="/logo.png" alt="IMMERSIO Logo" className="h-9 w-auto object-contain" />
             <span className="text-base font-black italic tracking-tighter text-slate-900">IMMERSIO</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">
              <Bell size={18} />
            </button>
            <Link to="/student/profile">
              <div className="w-9 h-9 rounded-xl bg-gradient-vibrant flex items-center justify-center text-white font-black text-[10px] shadow-lg shadow-indigo-200/50">
                JD
              </div>
            </Link>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={cn(
        "flex-1 overflow-y-auto relative z-10 scroll-smooth",
        !isScenarioDetail && "pt-16 pb-28 md:pt-0 md:pb-0 min-w-0"
      )}>
        <div className={cn(
          "max-w-5xl mx-auto min-h-full w-full",
          !isScenarioDetail ? "p-5 sm:p-6 md:p-12" : "p-0 max-w-none"
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation - Floating style */}
      {!isScenarioDetail && (
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md z-50">
          <nav className="h-16 bg-slate-950/90 backdrop-blur-2xl rounded-[2rem] flex items-center justify-around px-2 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 ring-1 ring-white/5">
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link to={link.path} key={link.path} className="relative flex-1 group">
                  <div className="flex flex-col items-center justify-center relative h-full">
                    {isActive && (
                      <motion.div
                        layoutId="nav-glow"
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      >
                        <div className="w-10 h-10 bg-indigo-500/20 blur-xl rounded-full" />
                      </motion.div>
                    )}
                    <div className={cn(
                      "transition-all duration-300 flex items-center justify-center",
                      isActive ? "text-indigo-400 -translate-y-1 scale-110" : "text-slate-500 group-hover:text-slate-300"
                    )}>
                      <link.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    {isActive && (
                      <motion.div 
                        layoutId="nav-dot"
                        className="w-1 h-1 bg-indigo-400 rounded-full mt-1 border-[0.5px] border-indigo-300/50 shadow-[0_0_8px_rgba(129,140,248,0.8)]"
                      />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
