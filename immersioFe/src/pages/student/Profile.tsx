import { useState, useEffect } from "react";
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
  X
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { authService, UserDto } from "@/services/auth";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDto | null>(null);
  const [activeModal, setActiveModal] = useState<"notifications" | "privacy" | "help" | null>(null);

  // Notifications states
  const [notifEmail, setNotifEmail] = useState(() => localStorage.getItem("notif_email") !== "false");
  const [notifPush, setNotifPush] = useState(() => localStorage.getItem("notif_push") !== "false");
  const [notifStreak, setNotifStreak] = useState(() => localStorage.getItem("notif_streak") !== "false");
  const [notifTips, setNotifTips] = useState(() => localStorage.getItem("notif_tips") === "true");

  useEffect(() => {
    localStorage.setItem("notif_email", String(notifEmail));
  }, [notifEmail]);
  useEffect(() => {
    localStorage.setItem("notif_push", String(notifPush));
  }, [notifPush]);
  useEffect(() => {
    localStorage.setItem("notif_streak", String(notifStreak));
  }, [notifStreak]);
  useEffect(() => {
    localStorage.setItem("notif_tips", String(notifTips));
  }, [notifTips]);

  // Privacy/Security states
  const [currPassword, setCurrPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPublic, setIsPublic] = useState(() => localStorage.getItem("profile_public") !== "false");
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("profile_public", String(isPublic));
  }, [isPublic]);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPwSuccess(null);
    setPwError(null);
    if (!currPassword || !newPassword || !confirmPassword) {
      setPwError("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Mật khẩu mới không khớp.");
      return;
    }
    if (newPassword.length < 6) {
      setPwError("Mật khẩu mới phải từ 6 ký tự.");
      return;
    }
    setPwSuccess("Đổi mật khẩu thành công!");
    setCurrPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // FAQ states
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const faqs = [
    {
      q: "Làm thế nào để chấm điểm phát âm tốt hơn?",
      a: "Hãy chắc chắn rằng bạn đang ở nơi yên tĩnh, giữ micrô ở khoảng cách vừa phải và nói với tốc độ tự nhiên bình thường."
    },
    {
      q: "Thuật toán ôn tập Spaced Repetition (SRS) hoạt động thế nào?",
      a: "Hệ thống sẽ tự động xếp lịch ôn tập thẻ từ vựng dựa trên điểm số phát âm của bạn. Những từ phát âm sai sẽ xuất hiện thường xuyên hơn."
    },
    {
      q: "Tôi có thể học nhiều ngôn ngữ cùng lúc không?",
      a: "Hoàn toàn được! Bạn có thể chuyển đổi ngôn ngữ học bất kỳ lúc nào tại thanh công cụ hoặc bảng cài đặt."
    }
  ];

  useEffect(() => {
    // Attempt to read the user from stored session
    const currentUser = authService.getUser();
    setUser(currentUser);

    // Sync latest user details from server
    authService.getMe()
      .then((latest) => {
        authService.updateUser(latest);
        setUser(latest);
      })
      .catch((err) => console.error("Could not sync user profile:", err));
  }, []);

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
    { id: "notifications", icon: Bell, label: "Notifications", color: "text-orange-500", bg: "bg-orange-500/10 border border-orange-500/20" },
    { id: "privacy", icon: Shield, label: "Privacy & Security", color: "text-emerald-400", bg: "bg-emerald-500/10 border border-emerald-500/20" },
    { id: "subscription", icon: CreditCard, label: "Subscription", color: "text-purple-400", bg: "bg-purple-500/10 border border-purple-500/20", path: "/student/subscription" },
    { id: "help", icon: HelpCircle, label: "Help Center", color: "text-amber-500", bg: "bg-amber-500/10 border border-amber-500/20" },
  ];

  const handleItemClick = (item: typeof menuItems[number]) => {
    if (item.path) {
      navigate(item.path);
    } else {
      setActiveModal(item.id as any);
    }
  };

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        "w-12 h-7 rounded-full p-1 transition-colors duration-250 focus:outline-none flex items-center cursor-pointer shrink-0",
        checked ? "bg-primary" : "bg-slate-700/20 dark:bg-slate-700"
      )}
    >
      <motion.div
        layout
        className="w-5 h-5 bg-white rounded-full shadow-md"
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );

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
              <span className="relative z-10 italic tracking-tighter">
                {user ? getInitials(user.username) : "—"}
              </span>
          </div>
          <button className="absolute bottom-1 right-1 w-12 h-12 bg-slate-900/80 rounded-2xl shadow-2xl flex items-center justify-center text-white border border-white/10 hover:bg-indigo-650 hover:text-indigo-200 transition-all active:scale-90 z-20 backdrop-blur-md">
            <Camera size={22} strokeWidth={2.5} />
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

      {/* Slide-Up Sheets */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full max-w-lg bg-surface border-t border-slate-700/50 rounded-t-[3rem] p-8 md:p-10 shadow-3xl z-10 max-h-[85vh] overflow-y-auto"
            >
              {/* Drag handle */}
              <div className="w-12 h-1.5 bg-slate-700/20 rounded-full mx-auto mb-6" />

              {/* Close Button */}
              <button 
                onClick={() => setActiveModal(null)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              {/* Notifications */}
              {activeModal === "notifications" && (
                <div className="space-y-6 pt-2 text-left">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                      <Bell size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Cấu hình thông báo</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Tùy chỉnh tần suất nhắc nhở</p>
                    </div>
                  </div>

                  <div className="space-y-6 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-black text-white text-xs uppercase tracking-wider">Email Notifications</h4>
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">Nhận email nhắc nhở học tập hàng tuần.</p>
                      </div>
                      <ToggleSwitch checked={notifEmail} onChange={() => setNotifEmail(!notifEmail)} />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-black text-white text-xs uppercase tracking-wider">Push Notifications</h4>
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">Thông báo trực tiếp trên trình duyệt.</p>
                      </div>
                      <ToggleSwitch checked={notifPush} onChange={() => setNotifPush(!notifPush)} />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-black text-white text-xs uppercase tracking-wider">Streak Reminders</h4>
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">Cảnh báo khi sắp đứt chuỗi Streak ngày.</p>
                      </div>
                      <ToggleSwitch checked={notifStreak} onChange={() => setNotifStreak(!notifStreak)} />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-black text-white text-xs uppercase tracking-wider">Weekly Study Tips</h4>
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">Mẹo học từ vựng và cải thiện phát âm hiệu quả.</p>
                      </div>
                      <ToggleSwitch checked={notifTips} onChange={() => setNotifTips(!notifTips)} />
                    </div>
                  </div>

                  <Button 
                    onClick={() => setActiveModal(null)}
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-indigo-600/30 text-white font-black text-xs uppercase tracking-widest mt-8"
                  >
                    Lưu cấu hình
                  </Button>
                </div>
              )}

              {/* Privacy & Security */}
              {activeModal === "privacy" && (
                <div className="space-y-6 pt-2 text-left">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Shield size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Quyền riêng tư</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Bảo mật thông tin tài khoản</p>
                    </div>
                  </div>

                  {pwSuccess && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-[10px] font-bold text-center">
                      {pwSuccess}
                    </div>
                  )}

                  {pwError && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-[10px] font-bold text-center">
                      {pwError}
                    </div>
                  )}

                  <form onSubmit={handlePasswordChange} className="space-y-4 pt-4 border-t border-white/5">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Mật khẩu hiện tại</label>
                      <input 
                        type="password" 
                        required
                        value={currPassword}
                        onChange={(e) => setCurrPassword(e.target.value)}
                        className="w-full h-12 bg-slate-950/80 border border-white/10 rounded-2xl px-4 text-white text-xs font-bold focus:outline-none focus:border-indigo-500/50 transition-all duration-300"
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Mật khẩu mới</label>
                      <input 
                        type="password" 
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full h-12 bg-slate-950/80 border border-white/10 rounded-2xl px-4 text-white text-xs font-bold focus:outline-none focus:border-indigo-500/50 transition-all duration-300"
                        placeholder="Tối thiểu 6 ký tự"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Xác nhận mật khẩu mới</label>
                      <input 
                        type="password" 
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full h-12 bg-slate-950/80 border border-white/10 rounded-2xl px-4 text-white text-xs font-bold focus:outline-none focus:border-indigo-500/50 transition-all duration-300"
                        placeholder="Nhập lại mật khẩu mới"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
                      <div>
                        <h4 className="font-black text-white text-xs uppercase tracking-wider">Hồ sơ công khai</h4>
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">Cho phép người học khác tìm thấy hồ sơ của bạn.</p>
                      </div>
                      <ToggleSwitch checked={isPublic} onChange={() => setIsPublic(!isPublic)} />
                    </div>

                    <Button 
                      type="submit"
                      className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-indigo-600/30 text-white font-black text-xs uppercase tracking-widest mt-4"
                    >
                      Đổi mật khẩu & Lưu cài đặt
                    </Button>
                  </form>
                </div>
              )}

              {/* Help Center */}
              {activeModal === "help" && (
                <div className="space-y-6 pt-2 text-left">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                      <HelpCircle size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Trợ giúp & FAQ</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Giải đáp thắc mắc của bạn</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/5">
                    {faqs.map((faq, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                        <button 
                          onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                          className="w-full flex items-center justify-between p-5 text-left font-black text-white text-xs uppercase tracking-wider hover:bg-white/5 transition-all cursor-pointer"
                        >
                          <span>{faq.q}</span>
                          <ChevronDown size={14} className={cn("text-slate-400 transition-transform", activeFaq === idx && "transform rotate-180")} />
                        </button>
                        <AnimatePresence>
                          {activeFaq === idx && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="px-5 pb-5 overflow-hidden"
                            >
                              <p className="text-[10px] text-slate-400 leading-relaxed font-bold border-t border-white/5 pt-3">
                                {faq.a}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 text-center mt-6">
                    <h4 className="font-black text-amber-500 text-xs uppercase tracking-wider mb-1">Vẫn cần trợ giúp?</h4>
                    <p className="text-[10px] text-slate-400 font-bold">Hãy gửi email trực tiếp tới bộ phận hỗ trợ kỹ thuật.</p>
                    <a 
                      href="mailto:support@immersio.me"
                      className="inline-block mt-4 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all active:scale-95"
                    >
                      Gửi email hỗ trợ
                    </a>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
