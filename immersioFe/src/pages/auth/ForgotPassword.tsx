import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Lock, ArrowRight, ArrowLeft, KeyRound, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { authService } from "@/services/auth";

type Step = "request" | "reset" | "done";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setInfo(null);
    try {
      await authService.forgotPassword(email.trim());
      setStep("reset");
      setInfo("Nếu email tồn tại, mã OTP đã được gửi. Kiểm tra hộp thư (cả mục Spam).");
    } catch (err: any) {
      setError(err.message || "Không gửi được mã OTP. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await authService.resetPassword(email.trim(), otp.trim(), newPassword);
      setStep("done");
      setTimeout(() => navigate("/login"), 2200);
    } catch (err: any) {
      setError(err.message || "Đặt lại mật khẩu thất bại.");
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    setError(null);
    setInfo(null);
    setIsLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setInfo("Đã gửi lại mã OTP mới.");
    } catch (err: any) {
      setError(err.message || "Không gửi lại được mã OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <Link
        to="/login"
        className="absolute top-8 left-8 z-50 flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
      >
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all shadow-md">
          <ArrowLeft size={18} />
        </div>
        <span className="text-xs font-black uppercase tracking-widest hidden md:block">Quay lại đăng nhập</span>
      </Link>

      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="mb-4 p-3.5 bg-white rounded-2xl shadow-xl border border-white/10"
            >
              <img src="/logo.png" alt="IMMERSIO Logo" className="h-12 w-auto object-contain rounded-xl" />
            </motion.div>
            <h1 className="text-2xl font-black text-white italic uppercase tracking-tight text-center">
              {step === "done" ? "Hoàn tất" : "Quên mật khẩu"}
            </h1>
            <p className="text-slate-400 text-xs font-semibold mt-1 text-center">
              {step === "request" && "Nhập email để nhận mã OTP đặt lại mật khẩu"}
              {step === "reset" && "Nhập mã OTP và mật khẩu mới của bạn"}
              {step === "done" && "Mật khẩu đã được đặt lại thành công"}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-[10px] font-bold text-center leading-relaxed"
            >
              {error}
            </motion.div>
          )}

          {info && step !== "done" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-2xl text-[10px] font-bold text-center leading-relaxed"
            >
              {info}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === "request" && (
              <motion.form
                key="request"
                onSubmit={handleRequest}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Địa chỉ Email</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-14 bg-slate-950/80 border border-white/10 rounded-2xl pl-12 pr-4 text-white placeholder:text-slate-700 text-xs font-bold focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-indigo-600/30 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Gửi mã OTP <ArrowRight size={14} />
                    </span>
                  )}
                </Button>
              </motion.form>
            )}

            {step === "reset" && (
              <motion.form
                key="reset"
                onSubmit={handleReset}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Mã OTP (6 chữ số)</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                      <KeyRound size={16} />
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      className="w-full h-14 bg-slate-950/80 border border-white/10 rounded-2xl pl-12 pr-4 text-white placeholder:text-slate-700 text-lg font-black tracking-[0.5em] text-center focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300"
                      placeholder="000000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Mật khẩu mới</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-14 bg-slate-950/80 border border-white/10 rounded-2xl pl-12 pr-12 text-white placeholder:text-slate-700 text-xs font-bold focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-indigo-600/30 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Đặt lại mật khẩu <ArrowRight size={14} />
                    </span>
                  )}
                </Button>

                <p className="text-center text-slate-400 text-[10px] font-semibold">
                  Chưa nhận được mã?{" "}
                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={isLoading}
                    className="text-indigo-400 font-black hover:text-indigo-300 transition uppercase tracking-wider disabled:opacity-50"
                  >
                    Gửi lại
                  </button>
                </p>
              </motion.form>
            )}

            {step === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center py-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-5">
                  <CheckCircle2 size={32} className="text-emerald-400" />
                </div>
                <p className="text-slate-300 text-xs font-bold leading-relaxed mb-6">
                  Mật khẩu của bạn đã được cập nhật. Đang chuyển đến trang đăng nhập...
                </p>
                <Link
                  to="/login"
                  className="text-indigo-400 font-black hover:text-indigo-300 transition underline underline-offset-4 uppercase tracking-wider text-[10px]"
                >
                  Đăng nhập ngay
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {step !== "done" && (
            <p className="text-center mt-8 text-slate-400 text-xs font-semibold">
              Nhớ mật khẩu rồi?{" "}
              <Link to="/login" className="text-indigo-400 font-black hover:text-indigo-300 transition underline underline-offset-4 uppercase tracking-wider text-[10px]">
                Đăng nhập
              </Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
