import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Mail, Lock, ArrowRight, Github, Chrome, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { authService } from "@/services/auth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleCredentialResponse = async (response: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.loginWithGoogle(response.credential);
      if (res.user.role === "Admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/student/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Đăng nhập Google thất bại.");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    const initializeGoogle = () => {
      const google = (window as any).google;
      if (google) {
        google.accounts.id.initialize({
          client_id: (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || "292647291155-7bfaa0cioukmqmah4g5lhg9qqcd1mu26.apps.googleusercontent.com",
          callback: handleGoogleCredentialResponse,
        });
        google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          { 
            theme: "filled_blue", 
            size: "large", 
            width: 320,
            shape: "pill"
          }
        );
        return true;
      }
      return false;
    };

    const isInitialized = initializeGoogle();
    if (!isInitialized) {
      const interval = setInterval(() => {
        if ((window as any).google) {
          initializeGoogle();
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await authService.login(email, password);
      if (res.user.role === "Admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/student/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Back Button */}
      <Link 
        to="/" 
        className="absolute top-8 left-8 z-50 flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
      >
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all shadow-md">
          <ArrowLeft size={18} />
        </div>
        <span className="text-xs font-black uppercase tracking-widest hidden md:block">Quay lại trang chủ</span>
      </Link>

      {/* Dynamic Background Glowing Spots */}
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
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="mb-4 p-3.5 bg-white rounded-2xl shadow-xl border border-white/10"
            >
              <img src="/logo.png" alt="IMMERSIO Logo" className="h-12 w-auto object-contain rounded-xl" />
            </motion.div>
            <h1 className="text-2xl font-black text-white italic uppercase tracking-tight text-center">Đăng nhập</h1>
            <p className="text-slate-400 text-xs font-semibold mt-1">Chào mừng bạn quay lại với IMMERSIO</p>
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

          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Mật khẩu</label>
                <Link to="/forgot-password" className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition uppercase tracking-wider">Quên mật khẩu?</Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <Lock size={16} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  Đăng nhập <ArrowRight size={14} />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8">
            <div className="relative flex items-center justify-center mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <span className="relative bg-slate-950 px-4 text-[9px] font-black uppercase tracking-widest text-slate-500">Hoặc tiếp tục với</span>
            </div>

            <div className="flex flex-col items-center justify-center w-full">
              <div id="google-signin-btn" className="w-full min-h-[46px] flex justify-center"></div>
            </div>
          </div>

          <p className="text-center mt-8 text-slate-400 text-xs font-semibold">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-indigo-400 font-black hover:text-indigo-300 transition underline underline-offset-4 uppercase tracking-wider text-[10px]">
              Tạo tài khoản miễn phí
            </Link>
          </p>

          <div className="flex justify-center mt-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
              Powered by NextGen Lab
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
