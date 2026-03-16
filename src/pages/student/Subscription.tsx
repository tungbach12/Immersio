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
    <div className="max-w-6xl mx-auto py-8 md:py-12 px-4 pb-24 overflow-x-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full -z-10" />

      <div className="text-center mb-12 md:mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-5 py-2 rounded-full text-[10px] md:text-sm font-black border border-indigo-100 mb-8 uppercase tracking-[0.2em]"
        >
          <Sparkles size={14} className="animate-pulse text-amber-400" /> Premium Learning Experience
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-6 italic leading-none">
          Choose Your <span className="text-indigo-600">Path.</span>
        </h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-base md:text-lg font-medium px-4 opacity-80">
          Unlock the full potential of IMMERSIO. Master languages faster with our most advanced AI models and immersive AR environments.
        </p>

        {/* Billing Toggle - Refined */}
        <div className="mt-12 flex items-center justify-center gap-6">
          <span className={cn("text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-colors", billingCycle === "monthly" ? "text-slate-900" : "text-slate-400")}>Monthly</span>
          <button 
            onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
            className="w-16 h-8 bg-slate-200 rounded-full relative p-1 transition-all hover:bg-slate-300 shadow-inner group"
          >
            <motion.div 
              animate={{ x: billingCycle === "monthly" ? 0 : 32 }}
              className="w-6 h-6 bg-white rounded-full shadow-lg group-hover:scale-110 transition-transform"
            />
          </button>
          <span className={cn("text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-colors", billingCycle === "yearly" ? "text-slate-900" : "text-slate-400")}>
            Yearly <span className="text-emerald-500 ml-2 bg-emerald-50 px-2.5 py-1 rounded-lg text-[9px] font-black border border-emerald-100">-20% OFF</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 relative z-10">
        {plans.map((plan, idx) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(plan.popular && "md:scale-105")}
          >
            <Card 
              className={cn(
                "h-full flex flex-col relative overflow-hidden border-2 transition-all duration-700 rounded-[3rem] bg-white group",
                plan.popular 
                  ? "border-indigo-600 shadow-[0_30px_60px_-15px_rgba(79,70,229,0.25)]" 
                  : "border-slate-100 hover:border-indigo-200 shadow-xl shadow-slate-200/50"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-black px-6 py-2.5 rounded-bl-[2rem] uppercase tracking-[0.2em] z-20">
                  Popular
                </div>
              )}
              
              <CardContent className="p-8 md:p-10 flex-1 flex flex-col relative overflow-hidden">
                {plan.popular && <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -mr-16 -mt-16" />}
                
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center mb-8 shadow-xl transition-transform group-hover:rotate-12",
                  plan.color === "indigo" ? "bg-slate-950 text-white" : 
                  plan.color === "amber" ? "bg-amber-100 text-amber-600" : "bg-slate-50 text-slate-400"
                )}>
                  <plan.icon size={24} strokeWidth={2.5} />
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 mb-2 italic tracking-tight">{plan.name}</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">
                    {billingCycle === "yearly" && plan.price !== "Free" 
                      ? `${(parseInt(plan.price.replace(/\D/g, '')) * 0.8 / 1000).toFixed(3)}.000đ` 
                      : plan.price}
                  </span>
                  {plan.price !== "Free" && <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{plan.period}</span>}
                </div>
                <p className="text-slate-500 text-xs font-medium mb-10 leading-relaxed opacity-80">{plan.description}</p>
                
                <div className="space-y-4 mb-12 flex-1">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-4 group/item">
                      <div className="mt-1 bg-emerald-500 rounded-full p-1 shadow-sm shrink-0 group-hover/item:scale-125 transition-transform">
                        <Check size={8} className="text-white" strokeWidth={5} />
                      </div>
                      <span className="text-xs text-slate-700 font-bold leading-tight group-hover/item:text-slate-950 transition-colors uppercase tracking-tight">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  className={cn(
                    "w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-300 shadow-2xl active:scale-95",
                    plan.popular 
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200" 
                      : "bg-slate-900 hover:bg-black text-white"
                  )}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Detailed Comparison Table - Ultra Clean App Look */}
      <div className="mt-24 md:mt-36 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black text-slate-900 italic tracking-tight mb-4">Deep Comparison</h2>
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Every detail matters for your mastery</p>
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-3xl overflow-hidden relative">
          <div className="overflow-x-auto scrollbar-hide px-4 md:px-0">
            <table className="w-full text-left border-collapse min-w-[700px] md:min-w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Feature</th>
                  <th className="p-8 text-xl font-black italic text-slate-900 border-b border-slate-100">Basic</th>
                  <th className="p-8 text-xl font-black italic text-indigo-600 border-b border-slate-100 relative">
                    Plus
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600" />
                  </th>
                  <th className="p-8 text-xl font-black italic text-amber-600 border-b border-slate-100">Premium</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, i) => (
                  <tr key={i} className="group hover:bg-slate-50/30 transition-colors">
                    <td className="p-8 border-b border-slate-50">
                      <span className="text-xs md:text-sm font-black text-slate-950 uppercase tracking-tight">{row.category}</span>
                    </td>
                    <td className="p-8 border-b border-slate-50">
                      <div className="text-xs md:text-sm text-slate-500 font-medium flex items-center gap-2">
                        {row.basic}
                      </div>
                    </td>
                    <td className="p-8 border-b border-slate-50 bg-indigo-50/10">
                      <div className="text-xs md:text-sm text-indigo-900 font-bold flex items-center gap-2">
                        {row.plus}
                      </div>
                    </td>
                    <td className="p-8 border-b border-slate-50 bg-amber-50/10">
                      <div className="text-xs md:text-sm text-slate-900 font-black flex items-center gap-2">
                         <Crown size={12} className="text-amber-500 shrink-0" /> {row.premium}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile Swipe Hint */}
          <div className="md:hidden p-4 bg-slate-50 text-center border-t border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center justify-center gap-3">
              <ArrowRight size={12} /> Swipe left to see full details <ArrowRight size={12} />
            </p>
          </div>
        </div>
      </div>

      {/* Trust Badges - Modern Layout */}
      <div className="mt-24 md:mt-40 grid grid-cols-2 lg:grid-cols-4 gap-12 border-t border-slate-100 pt-20">
        {[
          { icon: Shield, title: "Guaranteed", desc: "Stripe Secured" },
          { icon: Zap, title: "Instant Access", desc: "Unlock now" },
          { icon: Star, title: "Free Trial", desc: "7-Day Pro" },
          { icon: Crown, title: "No Commits", desc: "Cancel anytime" },
        ].map((badge, i) => (
          <div key={i} className="flex flex-col items-center text-center gap-5 group">
            <div className="w-16 h-16 rounded-[2rem] bg-slate-50 flex items-center justify-center text-indigo-600 transition-all group-hover:scale-110 group-hover:bg-indigo-50 shadow-sm border border-slate-100/50">
              <badge.icon size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="font-black text-slate-950 italic tracking-tight text-base mb-1">{badge.title}</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{badge.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
