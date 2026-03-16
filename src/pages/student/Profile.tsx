import { Card, CardContent } from "@/components/ui/Card";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { 
  Settings, 
  Bell, 
  Shield, 
  CreditCard, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  Award, 
  Clock, 
  Zap,
  Camera,
  Crown,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function Profile() {
  const menuItems = [
    { icon: Bell, label: "Notifications", color: "text-blue-500", bg: "bg-blue-50" },
    { icon: Shield, label: "Privacy & Security", color: "text-emerald-500", bg: "bg-emerald-50" },
    { icon: CreditCard, label: "Subscription", color: "text-purple-500", bg: "bg-purple-50", path: "/student/subscription" },
    { icon: HelpCircle, label: "Help Center", color: "text-amber-500", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-10 pb-24 px-4 overflow-x-hidden">
      {/* Profile Header - Enhanced for Mobile Impact */}
      <div className="flex flex-col items-center text-center gap-6 pt-12 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full -z-10 animate-pulse" />
        
        <div className="relative group">
           <motion.div 
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="absolute -inset-4 bg-gradient-vibrant opacity-30 blur-3xl rounded-full group-hover:opacity-50 transition-opacity duration-1000" 
           />
          <div className="relative w-36 h-36 rounded-[3.5rem] bg-slate-950 flex items-center justify-center text-white text-5xl font-black shadow-3xl border-[6px] border-white overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-blue-700 to-slate-900 opacity-90" />
            <span className="relative z-10 italic tracking-tighter">JD</span>
          </div>
          <button className="absolute bottom-1 right-1 w-12 h-12 bg-white rounded-2xl shadow-2xl flex items-center justify-center text-slate-950 border border-slate-100 hover:bg-slate-50 hover:text-indigo-600 transition-all active:scale-90 z-20">
            <Camera size={22} strokeWidth={2.5} />
          </button>
        </div>

        <div className="relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-display font-black text-slate-950 italic tracking-tight leading-tight"
          >
            John <span className="text-indigo-600">Doe</span>
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 mt-4 px-4 py-1.5 bg-white border border-slate-100 rounded-full shadow-sm mx-auto w-fit"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.2em]">Elite Member since Jan 2024</p>
          </motion.div>
        </div>
      </div>

      {/* Quick Stats - Premium Glass Design */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Zap, label: "Streak", value: "12", color: "text-orange-500", bg: "bg-orange-50/50" },
          { icon: Award, label: "Exp", value: "2.4k", color: "text-indigo-600", bg: "bg-indigo-50/50" },
          { icon: Clock, label: "Hours", value: "48", color: "text-emerald-500", bg: "bg-emerald-50/50" },
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="glass-card rounded-[2rem] p-5 flex flex-col items-center justify-center gap-2 border-white shadow-xl shadow-slate-200/20 relative z-10 overflow-hidden group hover:scale-105 transition-transform"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50/30 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12", stat.bg, stat.color)}>
               <stat.icon size={18} strokeWidth={3} />
            </div>
            <span className="text-2xl font-black text-slate-950 italic tracking-tighter mt-1">{stat.value}</span>
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">{stat.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Premium Upgrade Card - Ultra Luxe */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="bg-slate-950 border-none rounded-[2.5rem] overflow-hidden relative group shadow-3xl">
          <div className="absolute inset-0 bg-gradient-vibrant opacity-90 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/20 rounded-full -mr-40 -mt-40 blur-3xl animate-pulse" />
          <CardContent className="p-10 relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/20 backdrop-blur-3xl border border-white/20">
                <Crown size={20} className="text-amber-300 fill-amber-300" />
                <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Immersio Pro</span>
              </div>
            </div>
            <h3 className="text-3xl font-black text-white italic tracking-tight mb-4 leading-tight">Master Everything. <br/>Own the Metaverse.</h3>
            <p className="text-white/70 text-sm font-medium mb-10 leading-relaxed max-w-[240px]">Unlimited AR environments, real-time AI accent correction, and exclusive 3D collection.</p>
            <Link to="/student/subscription">
              <Button className="w-full rounded-[1.25rem] bg-white hover:bg-slate-50 text-slate-950 font-black uppercase tracking-widest text-[10px] h-16 shadow-2xl transition-transform active:scale-95 group/btn">
                Manage Membership <ArrowRight size={14} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modern List Menu */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 ml-4">
           <Settings size={14} className="text-slate-400" />
           <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Account Ecosystem</h2>
        </div>
        <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-200/20 relative z-10">
          {menuItems.map((item, i) => (
            <Link 
              to={item.path || "#"} 
              key={i} 
              className={cn(
                "flex items-center justify-between px-8 py-7 hover:bg-slate-50/50 transition-all group",
                i !== menuItems.length - 1 && "border-b border-slate-50"
              )}
            >
              <div className="flex items-center gap-5">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110", item.bg, item.color)}>
                  <item.icon size={20} strokeWidth={2.5} />
                </div>
                <span className="font-black text-slate-950 text-base tracking-tight">{item.label}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:translate-x-1 transition-transform group-hover:bg-indigo-50">
                <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Logout - Minimal but Clean */}
      <div className="pt-2">
        <Link to="/">
          <Button variant="ghost" className="w-full h-16 rounded-[2rem] text-red-500 hover:bg-red-50 hover:text-red-600 font-black uppercase tracking-widest text-[10px] gap-2 border border-transparent hover:border-red-100 transition-all">
            <LogOut size={18} strokeWidth={3} />
            Sign Out Forever
          </Button>
        </Link>
        <p className="text-center text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-6">Version 2.0.4 Premium</p>
      </div>
    </div>
  );
}
