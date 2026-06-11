import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Mail, Lock, ArrowRight, User, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { authService } from "@/services/auth";

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
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
      setError(err.message || "Đăng ký Google thất bại.");
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
          document.getElementById("google-signup-btn"),
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
      await authService.register(username, email, password);
      navigate("/onboarding");
    } catch (err: any) {
      setError(err.message || "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.");
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
        className="w-full max-w-4xl relative z-10 grid lg:grid-cols-12 gap-0 overflow-hidden bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-2xl"
      >
        {/* Left Side: Info */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 bg-gradient-to-b from-slate-900/80 via-slate-900 to-indigo-950/80 text-white border-r border-white/5 relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl z-0 pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl z-0 pointer-events-none" />
          
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-2 group transition-transform duration-300 hover:scale-[1.02] mb-16">
              <div className="bg-white p-2 rounded-xl shadow-md border border-white/10">
                <img src="/logo.png" alt="IMMERSIO Logo" className="h-7 w-auto object-contain rounded-lg" />
              </div>
              <span className="font-black text-lg italic tracking-tighter text-white">IMMERSIO</span>
            </Link>
            
            <h2 className="text-3xl font-black leading-tight mb-8 uppercase italic tracking-tight">
              Khởi đầu <br />
              hành trình nói <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                ngoại ngữ mới
              </span>
            </h2>
            
            <div className="space-y-5">
              {[
                { title: "Nói tự nhiên với AI", desc: "Hội thoại 2D không rào cản" },
                { title: "Đánh giá chuẩn âm vị", desc: "Chính xác đến 98% từng phụ âm" },
                { title: "Lộ trình chuẩn CEFR", desc: "Thăng hạng giao tiếp vượt bậc" },
                { title: "Trích xuất Flashcard SRS", desc: "Thuật toán giãn cách dài hạn" }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={12} className="text-indigo-400 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">{item.title}</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative z-10 text-[9px] font-black uppercase tracking-widest text-slate-500 mt-12">
            Đồng hành cùng 10,000+ học viên
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="lg:col-span-7 p-8 md:p-12 bg-slate-950/20">
          <div className="mb-10 lg:hidden flex flex-col items-center">
             <Link to="/" className="flex items-center gap-2 group transition-transform duration-300 hover:scale-[1.02] mb-6">
               <div className="bg-white p-2 rounded-xl shadow-md border border-white/10">
                 <img src="/logo.png" alt="IMMERSIO Logo" className="h-6 w-auto object-contain rounded-lg" />
               </div>
               <span className="font-black text-base italic tracking-tighter text-white">IMMERSIO</span>
             </Link>
             <h1 className="text-2xl font-black text-white italic uppercase tracking-tight">Đăng Ký Tài Khoản</h1>
          </div>

          <h2 className="hidden lg:block text-2xl font-black text-white uppercase italic tracking-tight mb-2">Đăng Ký Tài Khoản</h2>
          <p className="text-slate-400 text-xs font-semibold mb-8">Bắt đầu trải nghiệm học phản xạ nói tiếng Anh, Nhật, Trung bằng AI ngay hôm nay.</p>

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
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Họ và tên của bạn</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <User size={16} />
                </div>
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-14 bg-slate-950/80 border border-white/10 rounded-2xl pl-12 pr-4 text-white placeholder:text-slate-700 text-xs font-bold focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300"
                  placeholder="Nguyễn Văn A"
                />
              </div>
            </div>

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
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Mật khẩu bảo mật</label>
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

            <div className="flex items-start gap-3 py-1">
              <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-white/10 bg-slate-950 text-indigo-600 focus:ring-indigo-500" />
              <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                Tôi đồng ý với các <a href="#" className="text-indigo-400 hover:underline">Điều khoản dịch vụ</a> và <a href="#" className="text-indigo-400 hover:underline">Chính sách bảo mật</a> của IMMERSIO.
              </p>
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
                  Tạo tài khoản học ngay <ArrowRight size={14} />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative flex items-center justify-center mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <span className="relative bg-slate-950 px-4 text-[9px] font-black uppercase tracking-widest text-slate-500">Hoặc tiếp tục với</span>
            </div>

            <div className="flex flex-col items-center justify-center w-full">
              <div id="google-signup-btn" className="w-full min-h-[46px] flex justify-center"></div>
            </div>
          </div>

          <p className="text-center mt-8 text-slate-400 text-xs font-semibold">
            Đã có tài khoản?{" "}
            <Link to="/login" className="text-indigo-400 font-black hover:text-indigo-300 transition underline underline-offset-4 uppercase tracking-wider text-[10px]">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
