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
    <div className="min-h-screen bg-[#FDFEFE] flex flex-col md:flex-row overflow-hidden font-body text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-80 flex-col bg-white border-r border-slate-100 z-20">
        <div className="p-10 flex items-center gap-4">
          <img src="/logo.png" alt="IMMERSIO Logo" className="h-10 w-auto object-contain rounded-xl" />
          <span className="text-xl font-black italic tracking-tighter text-indigo-600">IMMERSIO</span>
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

      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-2xl border-b border-slate-100 z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
           <img src="/logo.png" alt="IMMERSIO Logo" className="h-8 w-auto object-contain" />
           <span className="text-lg font-black italic tracking-tighter text-indigo-600">IMMERSIO</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
            <Bell size={20} />
          </button>
          <Link to="/student/profile">
            <div className="w-10 h-10 rounded-2xl bg-gradient-vibrant flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-100">
              JD
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-20 pb-24 md:pt-0 md:pb-0">
        <div className="max-w-5xl mx-auto p-6 md:p-12 min-h-full">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 h-20 bg-slate-950/95 backdrop-blur-3xl rounded-[2.5rem] z-40 flex items-center justify-around px-2 shadow-2xl border border-white/10">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link to={link.path} key={link.path} className="flex-1">
              <div className="flex flex-col items-center justify-center gap-1.5 relative h-full">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 relative",
                  isActive ? "text-white -translate-y-2 scale-110" : "text-slate-500"
                )}>
                  {isActive && (
                    <motion.div 
                      layoutId="mobile-nav-active"
                      className="absolute inset-0 bg-gradient-vibrant rounded-2xl shadow-xl shadow-indigo-500/20"
                    />
                  )}
                  <link.icon size={22} strokeWidth={isActive ? 2.5 : 2} className="relative z-10" />
                </div>
                <span className={cn(
                  "text-[8px] font-black uppercase tracking-widest transition-all duration-500",
                  isActive ? "text-indigo-400 translate-y-0 opacity-100" : "text-slate-600 translate-y-2 opacity-0"
                )}>
                  {link.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
