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
  Book,
  Brain,
  Mic,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { authService, UserDto } from "@/services/auth";

export default function AppLayout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  const segments = location.pathname.split("/").filter(Boolean);
  const isScenarioDetail = segments[0] === "student" && 
                           segments[1] === "scenarios" && 
                           segments.length > 2;

  const [user, setUser] = useState<UserDto | null>(null);

  useEffect(() => {
    // Load user from localStorage immediately to avoid stale placeholder on initial paint
    setUser(authService.getUser());

    // Snapshot the latest from the server
    authService.getMe()
      .then((latest) => {
        authService.updateUser(latest);
        setUser(latest);
      })
      .catch(() => {
        // If the token is stale or /me is unreachable, keep the localStorage value
        const stored = authService.getUser();
        if (stored) setUser(stored);
      });
  }, []);

  const studentLinks = [
    { icon: Home, label: "Home", path: "/student/dashboard" },
    { icon: BookOpen, label: "Learn", path: "/student/scenarios" },
    { icon: Brain, label: "Smart Cards", path: "/student/flashcards" },
    { icon: Mic, label: "Vocal Lab", path: "/student/vocal-lab" },
    { icon: Book, label: "Dictionary", path: "/student/dictionary" },
    { icon: User, label: "Profile", path: "/student/profile" },
  ];

  const adminLinks = [
    { icon: BarChart2, label: "Overview", path: "/admin/dashboard" },
    { icon: User, label: "Users", path: "/admin/users" },
    { icon: CreditCard, label: "Transactions", path: "/admin/transactions" },
    { icon: Layers, label: "Scenarios", path: "/admin/scenarios" },
    { icon: Cpu, label: "AI Tuning", path: "/admin/ai-tuning" },
  ];

  const links = isAdmin ? adminLinks : studentLinks;

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const logoSrc = isAdmin ? "/logo-admin.png" : "/logo.png";

  return (
    <div className="h-screen bg-background flex flex-col md:flex-row overflow-hidden font-body text-slate-100 relative">
      {/* Background Decorative Blobs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-background">
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
        <aside className="hidden md:flex w-80 flex-col h-full bg-slate-900/80 backdrop-blur-3xl border-r border-slate-800 z-20">
          <div className="p-10 flex items-center gap-4">
            <img src={logoSrc} alt="IMMERSIO Logo" className="h-12 w-auto object-contain" />
            <span className="text-xl font-black italic tracking-tighter text-slate-100">IMMERSIO</span>
          </div>

          <nav className="flex-1 px-6 py-4 space-y-3">
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link to={link.path} key={link.path}>
                  <div
                    className={cn(
                      "flex items-center gap-4 px-6 py-5 rounded-[1.5rem] transition-all duration-500 group relative overflow-hidden border border-transparent",
                      isActive
                        ? "bg-slate-800 text-slate-100 shadow-lg border-slate-700/50"
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
                    )}
                  >
                    <link.icon
                      size={20}
                      className={cn(
                        "transition-all duration-500",
                        isActive ? "text-indigo-500 scale-110" : "text-slate-400 group-hover:text-slate-100"
                      )}
                    />
                    <span className="font-bold text-sm tracking-tight">{link.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="active-glow"
                        className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent pointer-events-none"
                      />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="p-8">

            <Link to="/">
              <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-2xl font-bold text-sm h-12">
                <LogOut size={18} className="mr-3" />
                Log Out
              </Button>
            </Link>

            <div className="flex justify-center mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/5 bg-white/3 text-[9px] font-black uppercase tracking-widest text-slate-600">
                <span className="w-1 h-1 rounded-full bg-indigo-500/60 shrink-0" />
                Powered by NextGen Lab
              </span>
            </div>
          </div>
        </aside>
      )}

      {/* Mobile Top Header */}
      {!isScenarioDetail && (
        <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-3xl border-b border-slate-800 z-40 flex items-center justify-between px-6 transition-all duration-300">
          <div className="flex items-center gap-3">
             <img src={logoSrc} alt="IMMERSIO Logo" className="h-9 w-auto object-contain" />
             <span className="text-base font-black italic tracking-tighter text-slate-100">IMMERSIO</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/student/notifications" className="flex">
              <button className="w-9 h-9 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-indigo-500 transition-all flex items-center justify-center">
                <Bell size={18} />
              </button>
            </Link>
            <Link to="/student/profile">
              <div className="w-9 h-9 rounded-xl bg-gradient-vibrant flex items-center justify-center text-white font-black text-[10px] shadow-lg shadow-indigo-200/50">
                {user ? getInitials(user.username) : "?"}
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
        {/* Desktop Header Actions */}
        {!isScenarioDetail && (
          <div className="hidden md:flex items-center justify-end px-12 pt-8 pb-0 relative z-30">
            <Link to="/student/notifications">
              <button className="w-10 h-10 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-405 hover:text-indigo-400 transition-all flex items-center justify-center border border-white/5 shadow-sm cursor-pointer">
                <Bell size={20} />
              </button>
            </Link>
          </div>
        )}

        <div className={cn(
          "max-w-5xl mx-auto min-h-full w-full",
          !isScenarioDetail ? "p-5 sm:p-6 md:p-12" : "p-0 max-w-none"
        )}>
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation - Floating style */}
      {!isScenarioDetail && (
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md z-50">
          <nav className="h-16 bg-slate-900/90 backdrop-blur-2xl rounded-[2rem] flex items-center justify-around px-2 shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-850 ring-1 ring-slate-800/50">
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
                      isActive ? "text-indigo-500 -translate-y-1 scale-110" : "text-slate-500 group-hover:text-slate-200"
                    )}>
                      <link.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    {isActive && (
                      <motion.div 
                        layoutId="nav-dot"
                        className="w-1 h-1 bg-indigo-500 rounded-full mt-1 border-[0.5px] border-indigo-400/50 shadow-[0_0_8px_rgba(129,140,248,0.8)]"
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
