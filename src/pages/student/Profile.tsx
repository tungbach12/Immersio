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
      <div className="flex flex-col items-center text-center gap-4 pt-4">
        <div className="relative">
          <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-indigo-200 border-4 border-white">
            JD
          </div>
          <button className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-2xl shadow-lg flex items-center justify-center text-slate-600 border border-slate-100 hover:bg-slate-50 transition-colors">
            <Camera size={18} />
          </button>
        </div>
        <div>
          <h1 className="text-3xl font-display font-black text-slate-900 italic tracking-tight">John Doe</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Pro Member since Jan 2024</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Zap, label: "Streak", value: "12", color: "text-orange-500" },
          { icon: Award, label: "Points", value: "2.4k", color: "text-indigo-500" },
          { icon: Clock, label: "Hours", value: "48", color: "text-emerald-500" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-[2rem] p-4 flex flex-col items-center justify-center gap-1 border border-slate-100 shadow-sm">
            <stat.icon size={16} className={stat.color} />
            <span className="text-lg font-black text-slate-900 italic">{stat.value}</span>
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Premium Card */}
      <Card className="bg-slate-900 border-none rounded-[2.5rem] overflow-hidden relative group">
        <CardContent className="p-8 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-amber-400">
              <Zap size={24} fill="currentColor" />
            </div>
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Premium</span>
          </div>
          <h3 className="text-2xl font-black text-white italic tracking-tight mb-2">Unlock Your Full Potential</h3>
          <p className="text-white/60 text-sm font-medium mb-6">Get unlimited AR models, advanced AI feedback, and offline mode.</p>
          <Link to="/student/subscription">
            <Button className="w-full rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black uppercase tracking-widest text-[10px] h-12 shadow-xl">
              Upgrade Now
            </Button>
          </Link>
        </CardContent>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
      </Card>

      {/* Menu Options */}
      <div className="space-y-3">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4 mb-4">Account Settings</h2>
        <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
          {menuItems.map((item, i) => (
            <Link 
              to={item.path || "#"} 
              key={i} 
              className={cn(
                "flex items-center justify-between p-6 hover:bg-slate-50 transition-colors group",
                i !== menuItems.length - 1 && "border-b border-slate-50"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", item.bg, item.color)}>
                  <item.icon size={18} />
                </div>
                <span className="font-bold text-slate-700 text-sm">{item.label}</span>
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-400 transition-colors" />
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
