import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Mail, Lock, ArrowRight, User, Layers, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate registration
    setTimeout(() => {
      setIsLoading(false);
      navigate("/onboarding");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Back Button */}
      <Link 
        to="/intro" 
        className="absolute top-8 left-8 z-50 flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
      >
        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all">
          <ArrowLeft size={20} />
        </div>
        <span className="text-sm font-bold uppercase tracking-widest hidden md:block">Back to Home</span>
      </Link>

      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl relative z-10 grid lg:grid-cols-2 gap-0 overflow-hidden bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl"
      >
        {/* Left Side: Info */}
        <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <div>
            <div className="flex items-center gap-2 mb-12 bg-white p-2 rounded-xl w-fit">
              <img src="/logo.png" alt="IMMERSIO Logo" className="h-8 w-auto object-contain rounded-lg" />
            </div>
            <h2 className="text-4xl font-black leading-tight mb-6">Start your journey into the future of language.</h2>
            <div className="space-y-4">
              {[
                "AI-Powered Voice Conversations",
                "Immersive AR Learning Environments",
                "Personalized Learning Path",
                "Real-time Pronunciation Feedback"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-blue-200" />
                  <span className="text-sm font-medium text-blue-50">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-blue-200 text-xs font-medium">
            Join 10,000+ students worldwide.
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 md:p-10">
          <div className="mb-8 lg:hidden flex flex-col items-center">
             <div className="p-3 bg-white rounded-2xl shadow-xl border border-white/20 mb-4">
               <img src="/logo.png" alt="IMMERSIO Logo" className="h-12 w-auto object-contain rounded-xl" />
             </div>
             <h1 className="text-2xl font-black text-white italic">Create Account</h1>
          </div>

          <h2 className="hidden lg:block text-2xl font-black text-white mb-2">Create Account</h2>
          <p className="text-slate-400 text-sm mb-8">Join the IMMERSIO community today.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  required
                  className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  required
                  className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3.5 pl-12 pr-12 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 py-2">
              <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-white/10 bg-slate-800 text-blue-600 focus:ring-blue-500" />
              <p className="text-xs text-slate-400 leading-relaxed">
                I agree to the <a href="#" className="text-blue-500 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-500 hover:underline">Privacy Policy</a>.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-xl shadow-blue-600/20 group"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Create Account <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          <p className="text-center mt-8 text-slate-400 text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-500 font-bold hover:text-blue-400 transition underline underline-offset-4">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
