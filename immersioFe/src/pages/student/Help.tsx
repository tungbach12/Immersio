import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { HelpCircle, ArrowLeft, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export default function HelpCenter() {
  const navigate = useNavigate();
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

  return (
    <div className="max-w-xl mx-auto py-8 md:py-12 px-4 pb-24 relative overflow-x-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full -z-10 animate-pulse" />
      
      <button 
        onClick={() => navigate("/student/profile")} 
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 cursor-pointer text-xs font-black uppercase tracking-widest"
      >
        <ArrowLeft size={16} />
        <span>Back to Profile</span>
      </button>

      <div className="flex items-center gap-4 mb-10">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-lg">
          <HelpCircle size={24} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tight">Trợ giúp & FAQ</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">Giải đáp thắc mắc và hỗ trợ kỹ thuật</p>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {faqs.map((faq, idx) => (
          <div key={idx} className="bg-white/70 dark:bg-slate-950/45 border border-black/10 dark:border-white/5 rounded-2xl overflow-hidden backdrop-blur-2xl">
            <button
              onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
              className="w-full flex items-center justify-between p-5 text-left font-black text-white text-xs uppercase tracking-wider hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              <span>{faq.q}</span>
              <ChevronDown size={14} className={cn("text-slate-400 transition-transform duration-300", activeFaq === idx && "transform rotate-180")} />
            </button>
            <AnimatePresence>
              {activeFaq === idx && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-5 pb-5 overflow-hidden"
                >
                  <p className="text-[10px] text-slate-400 leading-relaxed font-bold border-t border-black/10 dark:border-white/5 pt-3">
                    {faq.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <Card className="bg-white/70 dark:bg-slate-950/45 border-black/10 dark:border-white/5 rounded-[2.5rem] shadow-3xl overflow-hidden relative backdrop-blur-2xl">
        <CardContent className="p-8 md:p-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto mb-4">
            <Sparkles size={20} />
          </div>
          <h4 className="font-black text-amber-500 text-xs uppercase tracking-wider mb-2">Vẫn cần trợ giúp?</h4>
          <p className="text-[10px] text-slate-400 font-bold leading-relaxed mb-6">Hãy gửi email trực tiếp tới bộ phận hỗ trợ kỹ thuật để được giải quyết nhanh nhất.</p>
          <a 
            href="mailto:support@immersio.me"
            className="inline-flex items-center justify-center w-full h-14 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-lg shadow-amber-500/10"
          >
            Gửi email hỗ trợ
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
