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
    <div className="min-h-screen bg-[#F8F9FD] flex flex-col md:flex-row overflow-hidden font-body">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col bg-white border-r border-slate-100 z-20">
        <div className="p-8 flex items-center gap-4">
          <img src="/logo.png" alt="IMMERSIO Logo" className="h-12 w-auto object-contain rounded-xl" />
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              {isAdmin ? "Admin Portal" : "Student Hub"}
            </span>
          </div>
        </div>

        <nav className="flex-1 px-6 py-4 space-y-2">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link to={link.path} key={link.path}>
                <div
                  className={cn(
                    "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <link.icon
                    size={20}
                    className={cn(
                      "transition-colors",
                      isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                  <span className="font-bold text-sm tracking-tight">{link.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="active-glow"
                      className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none"
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-6">
          <div className="bg-slate-50 rounded-[2rem] p-6 mb-6 border border-slate-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-emerald-100">
                JD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 truncate">John Doe</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pro Member</p>
              </div>
            </div>
            <Link to="/student/subscription">
              <Button size="sm" className="w-full rounded-xl bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-100 shadow-none text-[10px] font-black uppercase tracking-widest">
                Upgrade Plan
              </Button>
            </Link>
          </div>
          <Link to="/">
            <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl font-bold text-sm">
              <LogOut size={18} className="mr-3" />
              Sign Out
            </Button>
          </Link>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-2xl border-b border-slate-100 z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="IMMERSIO Logo" className="h-10 w-auto object-contain rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">
            <Bell size={20} />
          </button>
          <Link to="/student/profile">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-md">
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-2xl border-t border-slate-100 z-40 flex items-center justify-around px-4 pb-safe">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link to={link.path} key={link.path} className="flex-1">
              <div className="flex flex-col items-center justify-center gap-1 relative">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                  isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 -translate-y-1" : "text-slate-400"
                )}>
                  <link.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                  isActive ? "text-indigo-600 opacity-100" : "text-slate-400 opacity-0"
                )}>
                  {link.label}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="mobile-nav-dot"
                    className="absolute -bottom-1 w-1 h-1 rounded-full bg-indigo-600"
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
