import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Bell, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { authService, UserDto } from "@/services/auth";
import { cn } from "@/lib/utils";

export default function Notifications() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Notifications states
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [notifStreak, setNotifStreak] = useState(true);
  const [notifTips, setNotifTips] = useState(false);

  useEffect(() => {
    const cached = authService.getUser();
    if (cached) {
      setUser(cached);
      setNotifEmail(cached.notifEmail !== false);
      setNotifPush(cached.notifPush !== false);
      setNotifStreak(cached.notifStreak !== false);
      setNotifTips(cached.notifTips === true);
    }

    authService.getMe()
      .then((latest) => {
        authService.updateUser(latest);
        setUser(latest);
        setNotifEmail(latest.notifEmail !== false);
        setNotifPush(latest.notifPush !== false);
        setNotifStreak(latest.notifStreak !== false);
        setNotifTips(latest.notifTips === true);
      })
      .catch((err) => console.error("Error fetching user profile:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await authService.updateSettings({
        notifEmail,
        notifPush,
        notifStreak,
        notifTips
      });
      setUser(updated);
      showToast("Cấu hình thông báo đã được lưu thành công!", "success");

      // Browser Push Notification simulation
      if (notifPush && typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification("IMMERSIO", {
            body: "Cấu hình thông báo của bạn đã được cập nhật thành công!",
            icon: "/logo.png"
          });
        }
      }
    } catch (e: any) {
      showToast(e.message || "Không thể lưu cài đặt.", "error");
    } finally {
      setSaving(false);
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
    <div className="max-w-xl mx-auto py-8 md:py-12 px-4 pb-24 relative overflow-x-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[100px] rounded-full -z-10 animate-pulse" />
      
      <button 
        onClick={() => navigate("/student/profile")} 
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 cursor-pointer text-xs font-black uppercase tracking-widest"
      >
        <ArrowLeft size={16} />
        <span>Back to Profile</span>
      </button>

      <div className="flex items-center gap-4 mb-10">
        <div className="w-14 h-14 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-500 shadow-lg">
          <Bell size={24} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tight">Cấu hình thông báo</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">Tùy chỉnh tần suất nhắc nhở học tập</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-orange-500" size={32} />
        </div>
      ) : (
        <Card className="bg-white/70 dark:bg-slate-950/45 backdrop-blur-2xl border-black/10 dark:border-white/5 rounded-[2.5rem] shadow-3xl overflow-hidden relative">
          <CardContent className="p-8 md:p-10 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-6 pb-6 border-b border-black/10 dark:border-white/5">
                <div>
                  <h4 className="font-black text-white text-xs uppercase tracking-wider">Email Notifications</h4>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">Nhận email nhắc nhở học tập hàng tuần.</p>
                </div>
                <ToggleSwitch checked={notifEmail} onChange={() => setNotifEmail(!notifEmail)} />
              </div>

              <div className="flex items-center justify-between gap-6 pb-6 border-b border-black/10 dark:border-white/5">
                <div>
                  <h4 className="font-black text-white text-xs uppercase tracking-wider">Push Notifications</h4>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">Thông báo trực tiếp trên trình duyệt.</p>
                </div>
                <ToggleSwitch 
                  checked={notifPush} 
                  onChange={() => {
                    const nextVal = !notifPush;
                    setNotifPush(nextVal);
                    if (nextVal && typeof window !== "undefined" && "Notification" in window) {
                      if (Notification.permission === "default") {
                        Notification.requestPermission();
                      }
                    }
                  }} 
                />
              </div>

              <div className="flex items-center justify-between gap-6 pb-6 border-b border-black/10 dark:border-white/5">
                <div>
                  <h4 className="font-black text-white text-xs uppercase tracking-wider">Streak Reminders</h4>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">Cảnh báo khi sắp đứt chuỗi Streak ngày.</p>
                </div>
                <ToggleSwitch checked={notifStreak} onChange={() => setNotifStreak(!notifStreak)} />
              </div>

              <div className="flex items-center justify-between gap-6">
                <div>
                  <h4 className="font-black text-white text-xs uppercase tracking-wider">Weekly Study Tips</h4>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">Mẹo học từ vựng và cải thiện phát âm hiệu quả.</p>
                </div>
                <ToggleSwitch checked={notifTips} onChange={() => setNotifTips(!notifTips)} />
              </div>
            </div>

            <Button 
              onClick={handleSave}
              disabled={saving}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:shadow-orange-500/25 text-white font-black text-xs uppercase tracking-widest mt-4 shadow-2xl active:scale-95 flex items-center justify-center gap-2"
            >
              {saving ? (
                <><Loader2 className="animate-spin" size={16} /> Đang lưu...</>
              ) : (
                <>Lưu cấu hình</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 text-center">
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
          <Sparkles size={10} className="inline mr-1 text-amber-500" /> Safe & Secure Preferences
        </p>
      </div>
    </div>
  );
}
