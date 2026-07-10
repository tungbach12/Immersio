import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { motion, AnimatePresence } from "motion/react";
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
  ArrowRight,
  ChevronDown,
  X,
  Loader2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { authService, UserDto } from "@/services/auth";
import { uploadImage } from "@/services/upload";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDto | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const currentUser = authService.getUser();
    setUser(currentUser);

    authService.getMe()
      .then((latest) => {
        authService.updateUser(latest);
        setUser(latest);
      })
      .catch((err) => console.error("Could not sync user profile:", err));
  }, []);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Ảnh không được vượt quá 5MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const url = await uploadImage(file, "immersio/avatars");
      const updated = await authService.updateAvatar(url);
      setUser(updated);
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.revokeToken();
    } catch (e) {
      console.error(e);
    } finally {
      navigate("/");
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const menuItems = [
    { id: "notifications", icon: Bell, label: "Notifications", color: "text-orange-500", bg: "bg-orange-500/10 border border-orange-500/20", path: "/student/notifications" },
    { id: "subscription", icon: CreditCard, label: "Subscription", color: "text-purple-400", bg: "bg-purple-500/10 border border-purple-500/20", path: "/student/subscription" },
    { id: "help", icon: HelpCircle, label: "Help Center", color: "text-amber-500", bg: "bg-amber-500/10 border border-amber-500/20", path: "/student/help" },
  ];

  const handleItemClick = (item: typeof menuItems[number]) => {
    navigate(item.path);
  };

  return (
    <div className="space-y-10 pb-24 px-4 overflow-x-hidden">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center gap-6 pt-12 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full -z-10 animate-pulse" />
        
        <div className="relative group">
           <motion.div
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="absolute -inset-4 bg-gradient-vibrant opacity-30 blur-3xl rounded-full group-hover:opacity-50 transition-opacity duration-1000"
           />
          <div className="relative w-36 h-36 rounded-[3.5rem] bg-slate-950 flex items-center justify-center text-white text-5xl font-black shadow-3xl border-[6px] border-white/10 overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-blue-700 to-slate-900 opacity-90" />
             {user?.profilePictureUrl ? (
               <img
                 src={user.profilePictureUrl}
                 alt="Avatar"
                 className="absolute inset-0 w-full h-full object-cover z-10"
               />
             ) : (
               <span className="relative z-10 italic tracking-tighter">
                 {user ? getInitials(user.username) : "—"}
               </span>
             )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={handleAvatarClick}
            disabled={isUploadingAvatar}
            className="absolute bottom-1 right-1 w-12 h-12 bg-slate-900/80 rounded-2xl shadow-2xl flex items-center justify-center text-white border border-white/10 hover:bg-indigo-600 hover:text-indigo-200 transition-all active:scale-95 z-20 backdrop-blur-md disabled:opacity-60"
          >
            {isUploadingAvatar
              ? <Loader2 size={20} className="animate-spin" />
              : <Camera size={22} strokeWidth={2.5} />
            }
          </button>
        </div>

        <div className="relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-display font-black text-white italic tracking-tight leading-tight"
          >
            {user ? user.username : "—"}
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 mt-4 px-4 py-1.5 bg-slate-900/40 border border-white/5 rounded-full shadow-lg mx-auto w-fit backdrop-blur-md"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-slate-300 font-black text-[9px] uppercase tracking-[0.2em]">
              {user ? user.email : "Elite Member since Jan 2024"}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            icon: Zap,
            label: "Streak",
            value: String(user?.streakCount ?? 0),
            color: "text-orange-400",
            bg: "bg-orange-500/10 border border-orange-500/20",
          },
          {
            icon: Award,
            label: "Exp",
            value: user?.experiencePoints
              ? user.experiencePoints >= 1000
                ? `${(user.experiencePoints / 1000).toFixed(1)}k`
                : String(user.experiencePoints)
              : "0",
            color: "text-indigo-400",
            bg: "bg-indigo-500/10 border border-indigo-500/20",
          },
          {
            icon: Clock,
            label: "Hours",
            value: Math.round(user?.learningHours ?? 0).toString(),
            color: "text-emerald-400",
            bg: "bg-emerald-500/10 border border-emerald-500/20",
          },
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="glass-card rounded-[2rem] p-5 flex flex-col items-center justify-center gap-2 shadow-2xl relative z-10 overflow-hidden group hover:scale-105 transition-transform"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12", stat.bg, stat.color)}>
               <stat.icon size={18} strokeWidth={3} />
            </div>
            <span className="text-2xl font-black text-white italic tracking-tighter mt-1">{stat.value}</span>
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">{stat.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Premium Upgrade Card */}
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
                <Crown size={20} className={cn("text-amber-300 fill-amber-300", (user?.subscriptionTier || "Basic").toLowerCase() === "basic" && "text-slate-300 fill-slate-300")} />
                <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">
                  Immersio {user?.subscriptionTier || "Basic"}
                </span>
              </div>
            </div>
            <h3 className="text-3xl font-black text-white italic tracking-tight mb-4 leading-tight">
              {(user?.subscriptionTier || "Basic").toLowerCase() === "basic" 
                ? <>Master Everything. <br/>Own the Metaverse.</>
                : <>You are a Pro. <br/>Unlimited Potential.</>}
            </h3>
            <p className="text-white/70 text-sm font-medium mb-10 leading-relaxed max-w-[240px]">
              {(user?.subscriptionTier || "Basic").toLowerCase() === "basic"
                ? "Unlimited real-time AI accent correction, and exclusive 3D scenario collections."
                : `Enjoy your premium ${user?.subscriptionTier} access with increased scenario sessions and flashcard generation.`}
            </p>
            <Link to="/student/subscription">
              <Button className="w-full rounded-[1.25rem] bg-white hover:bg-orange-50 dark:hover:bg-slate-100 text-slate-100 dark:text-slate-950 hover:text-primary font-black uppercase tracking-widest text-[10px] h-16 shadow-2xl transition-transform active:scale-95 group/btn transition-colors border border-slate-700/50">
                {(user?.subscriptionTier || "Basic").toLowerCase() === "basic" ? "Manage Membership" : "Manage Subscription"} <ArrowRight size={14} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
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
        <div className="glass-card rounded-[2.5rem] overflow-hidden relative z-10">
          {menuItems.map((item, i) => (
            <div 
              key={i} 
              onClick={() => handleItemClick(item)}
              className={cn(
                "flex items-center justify-between px-8 py-7 hover:bg-white/5 transition-all group cursor-pointer",
                i !== menuItems.length - 1 && "border-b border-white/5"
              )}
            >
              <div className="flex items-center gap-5">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110", item.bg, item.color)}>
                  <item.icon size={20} strokeWidth={2.5} />
                </div>
                <span className="font-black text-white text-base tracking-tight">{item.label}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:translate-x-1 transition-transform group-hover:bg-indigo-500/20">
                <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="pt-2">
        <Button 
          onClick={handleSignOut}
          variant="ghost" 
          className="w-full h-16 rounded-[2rem] text-red-400 hover:bg-red-500/10 hover:text-red-300 font-black uppercase tracking-widest text-[10px] gap-2 border border-transparent hover:border-red-500/20 transition-all"
        >
          <LogOut size={18} strokeWidth={3} />
          Sign Out Forever
        </Button>
        <p className="text-center text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-6">Version 2.0.4 Premium</p>
      </div>
    </div>
  );
}
