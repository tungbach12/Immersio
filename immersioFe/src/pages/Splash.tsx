import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { motion } from "motion/react";
import { Sparkles, ArrowRight } from "lucide-react";

export default function Splash() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-900 flex flex-col items-center justify-center text-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 flex flex-col items-center text-center px-4"
      >
        <div className="mb-8 p-6 bg-white rounded-[3rem] shadow-2xl border border-white/20">
          <img src="/logo.png" alt="IMMERSIO Logo" className="h-32 md:h-40 w-auto object-contain rounded-[2rem]" />
        </div>
        
        <p className="text-lg md:text-xl text-indigo-100 max-w-md mb-12 font-light mt-4">
          Master languages through immersive AI scenarios and augmented reality experiences.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <Link to="/login" className="w-full">
            <Button size="lg" className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-semibold text-lg h-14 rounded-2xl shadow-xl shadow-indigo-900/20">
              Start Learning
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link to="/admin/dashboard" className="w-full">
            <Button variant="glass" size="lg" className="w-full h-14 rounded-2xl">
              Admin Portal
            </Button>
          </Link>
        </div>
        
        <div className="mt-8">
          <Link to="/intro" className="text-indigo-200 hover:text-white underline underline-offset-4 text-sm font-medium transition-colors">
            Learn more about IMMERSIO
          </Link>
        </div>
      </motion.div>

      <div className="absolute bottom-8 text-indigo-200/60 text-sm font-mono">
        v2.0.4 • AI-Powered Learning
      </div>
    </div>
  );
}
