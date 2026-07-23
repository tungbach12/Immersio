import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { authService } from "@/services/auth";
import { subscriptionService, PaymentReturnResult } from "@/services/subscription";

type Status = "verifying" | "success" | "failed";

const autoRedirectSeconds = 5;

export default function PayOsReturn() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("verifying");
  const [result, setResult] = useState<PaymentReturnResult | null>(null);
  const [countdown, setCountdown] = useState(autoRedirectSeconds);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = () => {
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          navigate("/student/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderCode = params.get("orderCode");

    if (!orderCode) {
      setStatus("failed");
      setResult({ success: false, message: "Thiếu mã đơn hàng.", amount: 0 });
      return;
    }

    subscriptionService
      .verifyReturn(orderCode)
      .then(async (res) => {
        setResult(res);
        setStatus(res.success ? "success" : "failed");
        if (res.success) {
          try {
            const latest = await authService.getMe();
            authService.updateUser(latest);
          } catch {
            /* non-blocking */
          }
          startCountdown();
        }
      })
      .catch((err) => {
        setResult({ success: false, message: err.message || "Xác thực giao dịch thất bại.", amount: 0 });
        setStatus("failed");
      });

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatAmount = (amount: number) =>
    amount > 0 ? `${amount.toLocaleString("vi-VN")}đ` : "";

  // SVG circular progress (r=20, circumference ~125.7)
  const circumference = 2 * Math.PI * 20;
  const progressOffset = circumference * (1 - countdown / autoRedirectSeconds);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 md:p-12 shadow-2xl text-center flex flex-col items-center">
          {status === "verifying" && (
            <>
              <Loader2 size={48} className="text-indigo-400 animate-spin mb-6" />
              <h1 className="text-xl font-black text-white italic uppercase tracking-tight">Đang xác thực giao dịch...</h1>
              <p className="text-slate-400 text-xs font-semibold mt-2">Vui lòng đợi trong giây lát</p>
            </>
          )}

          {status === "success" && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6"
              >
                <CheckCircle2 size={40} className="text-emerald-400" />
              </motion.div>
              <h1 className="text-2xl font-black text-white italic uppercase tracking-tight">Thanh toán thành công!</h1>
              <p className="text-slate-300 text-sm font-semibold mt-3">
                Chào mừng bạn đến với gói{" "}
                <span className="text-indigo-400 font-black">{result?.tier}</span>
              </p>
              {result && result.amount > 0 && (
                <div className="mt-6 w-full bg-slate-950/60 rounded-2xl p-5 border border-white/5 space-y-2 text-left">
                  <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <span>Gói</span>
                    <span className="text-white">{result.tier}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <span>Chu kỳ</span>
                    <span className="text-white capitalize">{result.billingCycle === "yearly" ? "Hàng năm" : "Hàng tháng"}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider border-t border-white/5 pt-2">
                    <span>Số tiền</span>
                    <span className="text-indigo-400 font-black">{formatAmount(result.amount)}</span>
                  </div>
                </div>
              )}

              {/* Auto-redirect countdown indicator */}
              <div className="mt-6 flex items-center gap-3 text-slate-400">
                <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={progressOffset}
                    style={{ transition: "stroke-dashoffset 0.9s linear" }}
                  />
                  <text
                    x="24"
                    y="24"
                    dominantBaseline="middle"
                    textAnchor="middle"
                    className="rotate-90"
                    style={{ fill: "#a5b4fc", fontSize: "13px", fontWeight: 800, transform: "rotate(90deg)", transformOrigin: "24px 24px" }}
                  >
                    {countdown}
                  </text>
                </svg>
                <p className="text-xs font-semibold leading-relaxed text-left">
                  Tự động chuyển về Dashboard<br />
                  <span className="text-slate-500">sau {countdown} giây...</span>
                </p>
              </div>

              <Button
                onClick={() => {
                  if (countdownRef.current) clearInterval(countdownRef.current);
                  navigate("/student/dashboard");
                }}
                className="w-full h-14 mt-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-indigo-600/30 text-white font-black text-xs uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all"
              >
                <span className="flex items-center justify-center gap-2">Bắt đầu học ngay <ArrowRight size={14} /></span>
              </Button>
            </>
          )}

          {status === "failed" && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-6"
              >
                <XCircle size={40} className="text-rose-400" />
              </motion.div>
              <h1 className="text-2xl font-black text-white italic uppercase tracking-tight">Thanh toán chưa hoàn tất</h1>
              <p className="text-slate-300 text-sm font-semibold mt-3 leading-relaxed">
                {result?.message || "Giao dịch không thành công."}
              </p>
              <Button
                onClick={() => navigate("/student/subscription")}
                className="w-full h-14 mt-8 rounded-2xl bg-white hover:bg-orange-50 dark:hover:bg-slate-100 text-slate-100 dark:text-slate-950 hover:text-primary font-black text-xs uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all border border-slate-700/50"
              >
                Thử lại
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
