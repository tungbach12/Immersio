import { Card, CardContent } from "@/components/ui/Card";
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
  Camera
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
    <div className="space-y-8 pb-10">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center gap-6 pt-10">
        <div className="relative group">
           <div className="absolute -inset-4 bg-gradient-vibrant opacity-20 blur-3xl rounded-full group-hover:opacity-40 transition-opacity duration-1000" />
          <div className="relative w-40 h-40 rounded-[3.5rem] bg-slate-950 flex items-center justify-center text-white text-5xl font-black shadow-3xl border-[6px] border-white overflow-hidden">
             <div className="absolute inset-0 bg-gradient-premium opacity-80" />
            <span className="relative z-10 italic">JD</span>
          </div>
          <button className="absolute bottom-1 right-1 w-12 h-12 bg-white rounded-2xl shadow-2xl flex items-center justify-center text-slate-950 border border-slate-100 hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-90">
            <Camera size={22} />
          </button>
        </div>
        <div>
          <h1 className="text-4xl font-display font-black text-slate-950 italic tracking-tight leading-tight">John <span className="text-indigo-600">Doe</span></h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-3 bg-slate-50 w-fit mx-auto px-4 py-1.5 rounded-full border border-slate-100">Elite Member since Jan 2024</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-5">
        {[
          { icon: Zap, label: "Streak", value: "12", color: "text-orange-500", bg: "bg-orange-50" },
          { icon: Award, label: "Exp", value: "2.4k", color: "text-indigo-600", bg: "bg-indigo-50" },
          { icon: Clock, label: "Hours", value: "48", color: "text-emerald-500", bg: "bg-emerald-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white glass-card rounded-[2.5rem] p-6 flex flex-col items-center justify-center gap-2 border border-slate-100 shadow-xl shadow-slate-100/30">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.bg, stat.color)}>
               <stat.icon size={18} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-black text-slate-950 italic tracking-tighter mt-1">{stat.value}</span>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Premium Card */}
      <Card className="bg-slate-950 border-none rounded-[3rem] overflow-hidden relative group shadow-3xl">
        <div className="absolute inset-0 bg-gradient-vibrant opacity-90 group-hover:opacity-100 transition-opacity duration-700" />
        <CardContent className="p-10 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/20 backdrop-blur-3xl border border-white/20">
              <Zap size={20} className="text-amber-300 fill-amber-300" />
              <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Immersio Pro</span>
            </div>
          </div>
          <h3 className="text-3xl font-black text-white italic tracking-tight mb-4 leading-tight">Master Everything. <br/>Own the Metaverse.</h3>
          <p className="text-white/70 text-base font-medium mb-10 leading-relaxed">Unlimited AR environments, real-time AI accent correction, and exclusive 3D collection.</p>
          <Link to="/student/subscription">
            <Button className="w-full rounded-[1.25rem] bg-white hover:bg-slate-50 text-slate-950 font-black uppercase tracking-widest text-xs h-16 shadow-2xl transition-transform active:scale-95">
              Manage Pro Membership
            </Button>
          </Link>
        </CardContent>
        {/* Abstract Decorations */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-40 -mt-40 blur-3xl animate-pulse" />
      </Card>

      {/* Menu Options */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 ml-4">
           <Settings size={14} className="text-slate-400" />
           <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Account Ecosystem</h2>
        </div>
        <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-100/50">
          {menuItems.map((item, i) => (
            <Link 
              to={item.path || "#"} 
              key={i} 
              className={cn(
                "flex items-center justify-between px-10 py-8 hover:bg-slate-50 transition-all group",
                i !== menuItems.length - 1 && "border-b border-slate-50"
              )}
            >
              <div className="flex items-center gap-6">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm", item.bg, item.color)}>
                  <item.icon size={20} strokeWidth={2.5} />
                </div>
                <span className="font-black text-slate-950 text-base tracking-tight">{item.label}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Logout */}
      <Link to="/">
        <Button variant="ghost" className="w-full h-16 rounded-[2rem] text-red-500 hover:bg-red-50 font-black uppercase tracking-widest text-[10px] gap-2">
          <LogOut size={18} />
          Sign Out
        </Button>
      </Link>
    </div>
  );
}
