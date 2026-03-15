import { motion } from "motion/react";
import { Check, Sparkles, Zap, Shield, Star, Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useState } from "react";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Basic",
    price: "Free",
    description: "Get started with IMMERSIO",
    features: [
      "Standard AI Model (High Speed)",
      "5 Scenarios per day",
      "Grammar & Vocabulary correction",
      "10 Flashcards/day (Vocab only)",
      "Basic Storyline access",
    ],
    icon: Star,
    color: "slate",
    buttonText: "Current Plan",
    popular: false,
  },
  {
    name: "Plus",
    price: "69,000đ",
    period: "/mo",
    description: "Real-world communication & flexibility",
    features: [
      "Advanced AI: Natural dialogue & context",
      "20 Scenarios per day",
      "Pronunciation scoring & analysis",
      "Unlimited Flashcards (Vocab, Grammar)",
      "Interactive AR Experience",
      "5 Storylines + 7 Custom Outfits",
    ],
    icon: Zap,
    color: "indigo",
    buttonText: "Upgrade to Plus",
    popular: true,
  },
  {
    name: "Premium",
    price: "199,000đ",
    period: "/mo",
    description: "The ultimate mentor experience",
    features: [
      "Elite AI: Deep reasoning & metaphors",
      "Unlimited Scenarios",
      "AI Coach: Native-like expressions",
      "Auto-generate cards from mistakes",
      "Long-term NPC Memory (Full history)",
      "Optimized AR + Smooth animations",
      "All Storylines + Limited Outfits",
    ],
    icon: Crown,
    color: "amber",
    buttonText: "Go Premium",
    popular: false,
  },
];

const comparisonData = [
  {
    category: "AI Intelligence",
    basic: "Standard Model (High Speed)",
    plus: "Advanced: Natural & Context-aware",
    premium: "Elite: Deep reasoning & Metaphors",
  },
  {
    category: "Practice Intensity",
    basic: "5 scenarios / day",
    plus: "20 scenarios / day",
    premium: "Unlimited",
  },
  {
    category: "Language Skills",
    basic: "Grammar & Vocab fixes",
    plus: "Pronunciation scoring & Analysis",
    premium: "AI Coach: Native-like expressions",
  },
  {
    category: "Flashcard System",
    basic: "10 cards / day (Vocab only)",
    plus: "Unlimited: Vocab, Grammar, Phrases",
    premium: "Unlimited + Auto-generate from errors",
  },
  {
    category: "NPC Memory",
    basic: "Resets after each session",
    plus: "Remembers your profile",
    premium: "Long-term: Full chat history",
  },
  {
    category: "AR Experience",
    basic: "Not supported",
    plus: "Interactive AR in real space",
    premium: "Optimized AR + Smooth animations",
  },
  {
    category: "Content & Graphics",
    basic: "1 Basic Storyline",
    plus: "5 Storylines + 7 Custom Outfits",
    premium: "Full Storylines + Limited Assets",
  },
];

export default function Subscription() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="max-w-6xl mx-auto py-6 md:py-12 px-4 pb-24">
      <div className="text-center mb-10 md:mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-[10px] md:text-sm font-black border border-indigo-100 mb-6 uppercase tracking-widest"
        >
          <Sparkles size={14} className="animate-pulse" /> Premium Learning Experience
        </motion.div>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-4 md:mb-6 italic leading-none">
          Choose Your Path
        </h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-sm md:text-lg font-medium px-4">
          Unlock the full potential of IMMERSIO. Master languages faster with our most advanced AI models.
        </p>

        {/* Billing Toggle */}
        <div className="mt-8 md:mt-10 flex items-center justify-center gap-4 md:gap-6">
          <span className={cn("text-[10px] md:text-sm font-black uppercase tracking-widest", billingCycle === "monthly" ? "text-slate-900" : "text-slate-400")}>Monthly</span>
          <button 
            onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
            className="w-14 md:w-16 h-7 md:h-8 bg-slate-200 rounded-full relative p-1 transition-all hover:bg-slate-300 shadow-inner"
          >
            <motion.div 
              animate={{ x: billingCycle === "monthly" ? 0 : (window.innerWidth < 768 ? 28 : 32) }}
              className="w-5 md:w-6 h-5 md:h-6 bg-white rounded-full shadow-md"
            />
          </button>
          <span className={cn("text-[10px] md:text-sm font-black uppercase tracking-widest", billingCycle === "yearly" ? "text-slate-900" : "text-slate-400")}>
            Yearly <span className="text-emerald-500 ml-1 bg-emerald-50 px-2 py-0.5 rounded-full text-[8px] md:text-[10px]">-20%</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-20 md:mb-24">
        {plans.map((plan, idx) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(plan.popular && "md:scale-105 z-10")}
          >
            <Card 
              className={cn(
                "h-full flex flex-col relative overflow-hidden border-2 transition-all duration-500 rounded-[2.5rem] md:rounded-[3rem]",
                plan.popular 
                  ? "border-indigo-600 shadow-[0_20px_40px_-12px_rgba(79,70,229,0.2)] bg-white" 
                  : "border-slate-100 hover:border-indigo-200 shadow-lg bg-white/50"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] md:text-[10px] font-black px-4 md:px-6 py-1.5 md:py-2 rounded-bl-2xl md:rounded-bl-3xl uppercase tracking-[0.2em]">
                  Popular
                </div>
              )}
              
              <CardContent className="p-6 md:p-8 flex-1 flex flex-col">
                <div className={cn(
                  "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mb-4 md:mb-6 shadow-lg",
                  plan.color === "indigo" ? "bg-indigo-600 text-white shadow-indigo-200" : 
                  plan.color === "amber" ? "bg-amber-500 text-white shadow-amber-200" : "bg-slate-800 text-white shadow-slate-200"
                )}>
                  <plan.icon size={20} className="md:w-6 md:h-6" />
                </div>
                
                <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-1 italic tracking-tight">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-3 md:mb-4">
                  <span className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">
                    {billingCycle === "yearly" && plan.price !== "Free" 
                      ? `${(parseInt(plan.price.replace(/\D/g, '')) * 0.8 / 1000).toFixed(3)}.000đ` 
                      : plan.price}
                  </span>
                  {plan.price !== "Free" && <span className="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-widest">{plan.period}</span>}
                </div>
                <p className="text-slate-500 text-[10px] md:text-xs font-medium mb-6 md:mb-8 leading-relaxed">{plan.description}</p>
                
                <div className="space-y-3 md:space-y-4 mb-8 md:mb-10 flex-1">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 md:gap-3">
                      <div className="mt-1 bg-emerald-500 rounded-full p-0.5 shadow-sm shrink-0">
                        <Check size={6} className="text-white md:w-2 md:h-2" strokeWidth={5} />
                      </div>
                      <span className="text-[10px] md:text-xs text-slate-700 font-bold leading-tight">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  className={cn(
                    "w-full h-10 md:h-12 rounded-xl font-black uppercase tracking-[0.2em] text-[8px] md:text-[9px] transition-all duration-300",
                    plan.popular 
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200" 
                      : "bg-slate-900 hover:bg-black text-white shadow-lg"
                  )}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Detailed Comparison Table - Optimized for Mobile */}
      <div className="mt-20 md:mt-32">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 italic tracking-tight mb-3 md:mb-4">Deep Comparison</h2>
          <p className="text-slate-400 font-bold text-[9px] md:text-[10px] uppercase tracking-[0.2em]">Every detail matters for your mastery</p>
        </div>

        <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-collapse min-w-[600px] md:min-w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-6 md:p-8 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Category</th>
                  <th className="p-6 md:p-8 text-base md:text-lg font-black italic text-slate-900 border-b border-slate-100">Basic</th>
                  <th className="p-6 md:p-8 text-base md:text-lg font-black italic text-indigo-600 border-b border-slate-100">Plus</th>
                  <th className="p-6 md:p-8 text-base md:text-lg font-black italic text-amber-600 border-b border-slate-100">Premium</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, i) => (
                  <tr key={i} className="group hover:bg-slate-50/30 transition-colors">
                    <td className="p-6 md:p-8 border-b border-slate-50">
                      <span className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-tight">{row.category}</span>
                    </td>
                    <td className="p-6 md:p-8 border-b border-slate-50">
                      <span className="text-xs md:text-sm text-slate-500 font-medium">{row.basic}</span>
                    </td>
                    <td className="p-6 md:p-8 border-b border-slate-50 bg-indigo-50/5 md:bg-indigo-50/10">
                      <span className="text-xs md:text-sm text-slate-700 font-bold">{row.plus}</span>
                    </td>
                    <td className="p-6 md:p-8 border-b border-slate-50 bg-amber-50/5 md:bg-amber-50/10">
                      <span className="text-xs md:text-sm text-slate-900 font-black">{row.premium}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile Swipe Hint */}
          <div className="md:hidden p-4 bg-slate-50 text-center border-t border-slate-100">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
              <ArrowRight size={10} /> Swipe left to see more <ArrowRight size={10} />
            </p>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="mt-20 md:mt-32 grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 border-t border-slate-100 pt-16 md:pt-20">
        {[
          { icon: Shield, title: "Secure", desc: "Stripe Payment" },
          { icon: Zap, title: "Instant", desc: "Unlock now" },
          { icon: Star, title: "Trial", desc: "7-Day Free" },
          { icon: Crown, title: "Cancel", desc: "Anytime" },
        ].map((badge, i) => (
          <div key={i} className="flex flex-col items-center text-center gap-3 md:gap-4 group">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-indigo-600 transition-all group-hover:scale-110 group-hover:bg-indigo-50">
              <badge.icon size={24} className="md:w-8 md:h-8" />
            </div>
            <div>
              <h4 className="font-black text-slate-900 italic tracking-tight text-sm md:text-base">{badge.title}</h4>
              <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{badge.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
