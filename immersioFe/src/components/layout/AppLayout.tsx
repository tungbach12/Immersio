import { useState, useEffect } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Home, BookOpen, User, BarChart2, Layers, Cpu,
  Bell, LogOut, Sparkles, ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const NM_RAISED = { boxShadow: '6px 6px 12px #D5C9B8, -6px -6px 12px #FFFFFF' } as const;
const NM_RAISED_SM = { boxShadow: '4px 4px 8px #D5C9B8, -4px -4px 8px #FFFFFF' } as const;
const NM_INSET_SM = { boxShadow: 'inset 2px 2px 4px #D5C9B8, inset -2px -2px 4px #FFFFFF' } as const;

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
    <div className="min-h-screen bg-[#FDF6EC] flex flex-col md:flex-row overflow-hidden text-[#3E2723] relative" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>

      {/* Background warmth */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#FDF6EC]">
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[55%] h-[55%] bg-[#C4956A]/8 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ x: [0, -40, 0], y: [0, 50, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          className="absolute top-[5%] -right-[10%] w-[50%] h-[50%] bg-[#8B5E3C]/6 rounded-full blur-[90px]"
        />
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, 20, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[10%] left-[20%] w-[60%] h-[50%] bg-[#C4956A]/5 rounded-full blur-[110px]"
        />
      </div>

      {/* Desktop Sidebar */}
      {!isScenarioDetail && (
        <aside className="hidden md:flex w-80 flex-col bg-[#FDF6EC] z-20 border-r border-[#E8DDD0]">
          <div className="p-10 flex items-center gap-3">
            <div className="rounded-xl p-1.5" style={NM_RAISED_SM}>
              <img src="/logo.png" alt="IMMERSIO Logo" className="h-10 w-auto object-contain rounded-lg" />
            </div>
            <span className="text-xl text-[#8B5E3C]" style={{ fontFamily: "'Noto Serif Display', serif" }}>IMMERSIO</span>
          </div>

          <nav className="flex-1 px-6 py-4 space-y-2">
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link to={link.path} key={link.path}>
                  <div
                    className={cn(
                      "flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-350 group relative overflow-hidden",
                      isActive ? "bg-[#8B5E3C] text-white" : "text-[#6D4C41] hover:bg-[#FAF0E1]"
                    )}
                    style={isActive ? { boxShadow: '4px 4px 10px #D5C9B8, -4px -4px 10px #FFFFFF' } : {}}
                  >
                    <link.icon
                      size={18}
                      className={cn(
                        "transition-all duration-300 shrink-0",
                        isActive ? "text-[#F0D0A8]" : "text-[#A0856A] group-hover:text-[#8B5E3C]"
                      )}
                    />
                    <span className="font-medium text-sm tracking-tight">{link.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="p-8">
            <div className="bg-[#FDF6EC] rounded-2xl p-7 mb-5" style={NM_RAISED}>
              <div className="flex items-center gap-4 mb-5">
                <div
                  className="w-12 h-12 rounded-xl bg-gradient-vibrant flex items-center justify-center text-white font-semibold text-sm"
                  style={NM_RAISED_SM}
                >
                  JD
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#3E2723] truncate" style={{ fontFamily: "'Noto Serif Display', serif" }}>John Doe</p>
                  <p className="text-[10px] font-semibold text-[#C4956A] uppercase tracking-widest mt-0.5">Premium Learner</p>
                </div>
              </div>
              <Link to="/student/subscription">
                <button
                  className="w-full rounded-xl bg-[#8B5E3C] hover:bg-[#6B4226] text-white font-semibold uppercase tracking-widest text-[10px] h-11 transition-all duration-300"
                  style={NM_RAISED_SM}
                >
                  View Plans
                </button>
              </Link>
            </div>
            <Link to="/">
              <button className="w-full flex items-center justify-start gap-3 px-4 py-3 text-[#A0856A] hover:text-rose-600 hover:bg-rose-50 rounded-xl font-medium text-sm transition-all duration-200">
                <LogOut size={16} />
                Log Out
              </button>
            </Link>
          </div>
        </aside>
      )}

      {/* Mobile Top Header */}
      {!isScenarioDetail && (
        <header
          className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#FDF6EC] z-40 flex items-center justify-between px-6"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl p-1" style={NM_RAISED_SM}>
              <img src="/logo.png" alt="IMMERSIO Logo" className="h-8 w-auto object-contain rounded-lg" />
            </div>
            <span className="text-base text-[#8B5E3C]" style={{ fontFamily: "'Noto Serif Display', serif" }}>IMMERSIO</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-xl bg-[#FDF6EC] flex items-center justify-center text-[#A0856A] hover:text-[#8B5E3C] transition-colors" style={NM_RAISED_SM}>
              <Bell size={16} />
            </button>
            <Link to="/student/profile">
              <div className="w-9 h-9 rounded-xl bg-gradient-vibrant flex items-center justify-center text-white font-semibold text-[10px]" style={NM_RAISED_SM}>
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

      {/* Mobile Bottom Nav */}
      {!isScenarioDetail && (
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md z-50">
          <nav
            className="h-16 bg-[#FDF6EC] rounded-full flex items-center justify-around px-2"
            style={{ boxShadow: '8px 8px 20px #D5C9B8, -8px -8px 20px #FFFFFF' }}
          >
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link to={link.path} key={link.path} className="relative flex-1 group">
                  <div className="flex flex-col items-center justify-center relative h-full gap-1">
                    {isActive && (
                      <motion.div
                        layoutId="mobile-active-bg"
                        className="absolute inset-x-1 inset-y-1 rounded-full bg-[#8B5E3C]"
                        style={{ boxShadow: '3px 3px 8px #D5C9B8, -3px -3px 8px #FFFFFF' }}
                      />
                    )}
                    <div className={cn(
                      "relative z-10 transition-all duration-300 flex items-center justify-center",
                      isActive ? "text-white" : "text-[#A0856A] group-hover:text-[#8B5E3C]"
                    )}>
                      <link.icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
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
