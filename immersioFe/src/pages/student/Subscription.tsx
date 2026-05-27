import { motion } from "motion/react";
import { Check, Sparkles, Zap, Shield, Star, Crown, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { authService, UserDto, API_BASE } from "@/services/auth";
import { subscriptionService } from "@/services/subscription";

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
      "Interactive 2D Roleplay Experience",
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
      "Optimized graphics & smooth transitions",
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
    category: "Content & Graphics",
    basic: "1 Basic Storyline",
    plus: "5 Storylines + 7 Custom Outfits",
    premium: "Full Storylines + Limited Assets",
  },
];

export default function Subscription() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [user, setUser] = useState<UserDto | null>(null);
  const [syncing, setSyncing] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial load from session cache
    const cached = authService.getUser();
    setUser(cached);

    // Sync latest user details from server
    authService.getMe()
      .then((latest) => {
        authService.updateUser(latest);
        setUser(latest);
      })
      .catch((err) => console.error("Could not sync user profile:", err))
      .finally(() => setSyncing(false));
  }, []);

  const getPriceValue = (plan: typeof plans[0]) => {
    if (plan.price === "Free") return 0;
    const rawVal = parseInt(plan.price.replace(/\D/g, ""));
    return billingCycle === "yearly" ? Math.round(rawVal * 0.8) : rawVal;
  };

  const formatPrice = (plan: typeof plans[0]) => {
    if (plan.price === "Free") return "Free";
    return `${getPriceValue(plan).toLocaleString("vi-VN")}đ`;
  };

  const handlePlanSelect = (plan: typeof plans[0]) => {
    const activeTier = user?.subscriptionTier || "Basic";
    if (plan.name.toLowerCase() === activeTier.toLowerCase()) {
      return; // Already subscribed
    }

    // Free Basic plan: switch directly without a payment gateway
    if (plan.name === "Basic") {
      processDirectUpgrade("Basic", "free");
      return;
    }

    startVnPayCheckout(plan);
  };

  const processDirectUpgrade = async (tier: string, cycle: string) => {
    setSyncing(true);
    setError(null);
    try {
      const response = await authService.fetchWithAuth(`${API_BASE}/api/subscription/upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, billingCycle: cycle })
      });

      if (!response.ok) {
        throw new Error("Không thể đổi gói.");
      }

      const updatedUser: UserDto = await response.json();
      authService.updateUser(updatedUser);
      setUser(updatedUser);
    } catch (e: any) {
      setError(e.message || "Không thể đổi gói.");
    } finally {
      setSyncing(false);
    }
  };

  // Real payment: create a VNPay order on the backend, then redirect to the gateway.
  const startVnPayCheckout = async (plan: typeof plans[0]) => {
    setProcessingPlan(plan.name);
    setError(null);
    try {
      const paymentUrl = await subscriptionService.createPayment(plan.name, billingCycle);
      window.location.href = paymentUrl;
    } catch (e: any) {
      setError(e.message || "Không tạo được yêu cầu thanh toán.");
      setProcessingPlan(null);
    }
  };

  const activeTier = user?.subscriptionTier || "Basic";

  return (
    <div className="max-w-6xl mx-auto py-8 md:py-12 px-4 pb-24 overflow-x-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full -z-10" />
      {syncing && (
        <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-semibold text-slate-300 shadow-sm z-50">
          <Loader2 className="animate-spin text-indigo-400" size={14} /> Syncing subscription...
        </div>
      )}

      <div className="text-center mb-12 md:mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-300 px-5 py-2 rounded-full text-[10px] md:text-sm font-black border border-indigo-500/20 mb-8 uppercase tracking-[0.2em]"
        >
          <Sparkles size={14} className="animate-pulse text-amber-400" /> Premium Learning Experience
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 italic leading-none">
          Choose Your <span className="text-indigo-400">Path.</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg font-medium px-4 opacity-80">
          Unlock the full potential of IMMERSIO. Master languages faster with our most advanced AI models and fully immersive roleplay scenarios.
        </p>

        {/* Billing Toggle */}
        <div className="mt-12 flex items-center justify-center gap-6">
          <span className={cn("text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-colors", billingCycle === "monthly" ? "text-white" : "text-slate-500")}>Monthly</span>
          <button
            onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
            className="w-16 h-8 bg-slate-800 rounded-full relative p-1 transition-all hover:bg-slate-700 shadow-inner group"
          >
            <motion.div
              animate={{ x: billingCycle === "monthly" ? 0 : 32 }}
              className="w-6 h-6 bg-indigo-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"
            />
          </button>
          <span className={cn("text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-colors", billingCycle === "yearly" ? "text-white" : "text-slate-500")}>
            Yearly <span className="text-emerald-400 ml-2 bg-emerald-500/10 px-2.5 py-1 rounded-lg text-[9px] font-black border border-emerald-500/20">-20% OFF</span>
          </span>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 max-w-md mx-auto p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-xs font-bold"
          >
            {error}
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 relative z-10">
        {plans.map((plan, idx) => {
          const isCurrent = plan.name.toLowerCase() === activeTier.toLowerCase();
          const isProcessing = processingPlan === plan.name;
          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(plan.popular && "md:scale-105")}
            >
              <Card
                className={cn(
                  "h-full flex flex-col relative overflow-hidden border transition-all duration-700 rounded-[3rem] bg-slate-950/45 backdrop-blur-2xl group",
                  plan.popular
                    ? "border-indigo-500/60 shadow-glow"
                    : "border-white/5 hover:border-indigo-500/20 shadow-2xl shadow-black/40",
                  isCurrent && "border-emerald-500/80 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                )}
              >
                {plan.popular && !isCurrent && (
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-black px-6 py-2.5 rounded-bl-[2rem] uppercase tracking-[0.2em] z-20">
                    Popular
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black px-6 py-2.5 rounded-bl-[2rem] uppercase tracking-[0.2em] z-20 flex items-center gap-1.5">
                    <Check size={10} strokeWidth={4} /> Current
                  </div>
                )}

                <CardContent className="p-8 md:p-10 flex-1 flex flex-col relative overflow-hidden">
                  {(plan.popular || isCurrent) && <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -mr-16 -mt-16" />}

                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center mb-8 shadow-xl transition-transform group-hover:rotate-12",
                    isCurrent ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                    plan.color === "indigo" ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" :
                    plan.color === "amber" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-slate-800 text-slate-400"
                  )}>
                    <plan.icon size={24} strokeWidth={2.5} />
                  </div>

                  <h3 className="text-2xl font-black text-white mb-2 italic tracking-tight">{plan.name}</h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl md:text-4xl font-black text-white tracking-tighter">
                      {formatPrice(plan)}
                    </span>
                    {plan.price !== "Free" && <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{plan.period}</span>}
                  </div>
                  <p className="text-slate-400 text-xs font-medium mb-10 leading-relaxed opacity-80">{plan.description}</p>

                  <div className="space-y-4 mb-12 flex-1">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-4 group/item">
                        <div className="mt-1 rounded-full p-1 shadow-sm shrink-0 group-hover/item:scale-125 transition-transform bg-emerald-500">
                          <Check size={8} className="text-white" strokeWidth={5} />
                        </div>
                        <span className="text-xs text-slate-300 font-bold leading-tight group-hover/item:text-white transition-colors uppercase tracking-tight">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handlePlanSelect(plan)}
                    disabled={isCurrent || isProcessing}
                    className={cn(
                      "w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-300 shadow-2xl active:scale-95 flex items-center justify-center gap-2",
                      isCurrent
                        ? "bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed"
                        : plan.popular
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-glow"
                          : "bg-white hover:bg-slate-100 text-slate-950"
                    )}
                  >
                    {isProcessing ? (
                      <><Loader2 className="animate-spin" size={16} /> Đang chuyển đến cổng thanh toán...</>
                    ) : (
                      isCurrent ? "Active Plan" : plan.buttonText
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Detailed Comparison Table */}
      <div className="mt-24 md:mt-36 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black text-white italic tracking-tight mb-4">Deep Comparison</h2>
          <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em]">Every detail matters for your mastery</p>
        </div>

        <div className="glass-card rounded-[3rem] shadow-2xl overflow-hidden relative">
          <div className="overflow-x-auto scrollbar-hide px-4 md:px-0">
            <table className="w-full text-left border-collapse min-w-[700px] md:min-w-full">
              <thead>
                <tr className="bg-white/5">
                  <th className="p-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-white/5">Feature</th>
                  <th className="p-8 text-xl font-black italic text-white border-b border-white/5">Basic</th>
                  <th className="p-8 text-xl font-black italic text-indigo-400 border-b border-white/5 relative">
                    Plus
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500" />
                  </th>
                  <th className="p-8 text-xl font-black italic text-amber-400 border-b border-white/5">Premium</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, i) => (
                  <tr key={i} className="group hover:bg-white/5 transition-colors">
                    <td className="p-8 border-b border-white/5">
                      <span className="text-xs md:text-sm font-black text-white uppercase tracking-tight">{row.category}</span>
                    </td>
                    <td className="p-8 border-b border-white/5">
                      <div className="text-xs md:text-sm text-slate-400 font-medium flex items-center gap-2">
                        {row.basic}
                      </div>
                    </td>
                    <td className="p-8 border-b border-white/5 bg-indigo-500/5">
                      <div className="text-xs md:text-sm text-indigo-200 font-bold flex items-center gap-2">
                        {row.plus}
                      </div>
                    </td>
                    <td className="p-8 border-b border-white/5 bg-amber-500/5">
                      <div className="text-xs md:text-sm text-amber-200 font-black flex items-center gap-2">
                        <Crown size={12} className="text-amber-400 shrink-0" /> {row.premium}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile Swipe Hint */}
          <div className="md:hidden p-4 bg-slate-950 text-center border-t border-white/5">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center justify-center gap-3">
              <ArrowRight size={12} /> Swipe left to see full details <ArrowRight size={12} />
            </p>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="mt-24 md:mt-40 grid grid-cols-2 lg:grid-cols-4 gap-12 border-t border-white/5 pt-20">
        {[
          { icon: Shield, title: "Bảo mật", desc: "PayOS · VietQR" },
          { icon: Zap, title: "Instant Access", desc: "Unlock now" },
          { icon: Star, title: "Free Trial", desc: "7-Day Pro" },
          { icon: Crown, title: "No Commits", desc: "Cancel anytime" },
        ].map((badge, i) => (
          <div key={i} className="flex flex-col items-center text-center gap-5 group">
            <div className="w-16 h-16 rounded-[2rem] bg-slate-900/60 border border-white/5 flex items-center justify-center text-indigo-400 transition-all group-hover:scale-110 group-hover:bg-indigo-500/20 shadow-sm">
              <badge.icon size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="font-black text-white italic tracking-tight text-base mb-1">{badge.title}</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{badge.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
