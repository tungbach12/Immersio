import { motion } from "motion/react";
import { ShoppingBag, Box, Star, Filter, Search, ArrowRight, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useState } from "react";
import { cn } from "@/lib/utils";

const models = [
  {
    id: "m1",
    name: "Frieren",
    category: "Characters",
    price: "1,200",
    rating: 4.9,
    image: "/ModelImage/Frieren.png",
    tag: "New",
  },
  {
    id: "m2",
    name: "Model 76",
    category: "Characters",
    price: "1,500",
    rating: 4.8,
    image: "/ModelImage/model76.png",
    tag: "Trending",
  },
  {
    id: "m6",
    name: "Model 80",
    category: "Characters",
    price: "900",
    rating: 4.6,
    image: "/ModelImage/model80.png",
  },
];

const categories = ["All", "Characters", "Environments", "Creatures", "Props"];

export default function Store() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredModels = activeCategory === "All" 
    ? models 
    : models.filter(m => m.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 pb-24 overflow-x-hidden">
      {/* Header - Refined for Mobile App Experience */}
      <div className="flex flex-col gap-8 mb-16 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -z-10" />
        
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-indigo-600 font-black uppercase tracking-[0.3em] text-[10px] mb-4 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100/50 w-fit"
          >
            <Box size={14} strokeWidth={2.5} /> Global Marketplace
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-display font-black text-slate-950 italic tracking-tight leading-tight">
            Asset <span className="text-indigo-600">Store</span>
          </h1>
          <p className="text-slate-400 font-bold text-sm mt-3 leading-relaxed max-w-lg">Enhance your immersion with premium 3D assets & environments</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] px-6 py-4 flex items-center gap-4 shadow-xl shadow-slate-200/20 border border-slate-100 flex-1 sm:flex-none"
          >
            <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-sm border border-amber-100/50">
              <Zap size={18} strokeWidth={3} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Balance</p>
              <p className="text-lg font-black text-slate-950 tracking-tighter">2,450 <span className="text-[10px] italic ml-1">Credits</span></p>
            </div>
          </motion.div>
          <Button className="rounded-2xl h-14 px-8 bg-slate-950 hover:bg-black text-white font-black uppercase tracking-widest text-[10px] shadow-2xl flex-1 sm:flex-none transition-transform active:scale-95">
            Top Up
          </Button>
        </div>
      </div>

      {/* Filters & Search - Mobile Optimized */}
      <div className="flex flex-col gap-6 mb-12">
        <div className="relative group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-indigo-600 pointer-events-none">
            <Search size={22} strokeWidth={2.5} />
          </div>
          <input 
            type="text" 
            placeholder="Search the metaverse..."
            className="w-full h-16 bg-white border border-slate-100 rounded-[2rem] pl-16 pr-6 focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-xl shadow-slate-100/50 font-bold text-base placeholder:text-slate-300"
          />
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap border-2",
                activeCategory === cat 
                  ? "bg-slate-950 border-slate-950 text-white shadow-2xl shadow-slate-200" 
                  : "bg-white border-slate-100 text-slate-500 hover:border-indigo-100"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid - Premium Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredModels.map((model, idx) => (
          <motion.div
            key={model.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="group h-full flex flex-col overflow-hidden border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 rounded-[2.5rem] bg-white">
              <CardContent className="p-0 flex flex-col h-full">
                <div className="aspect-[4/3] relative overflow-hidden bg-slate-100 shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent z-10" />
                  <img 
                    src={model.image} 
                    alt={model.name}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  {model.tag && (
                    <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-md px-4 py-2 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest text-indigo-600 shadow-2xl border border-white z-20">
                      {model.tag}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8 z-30">
                    <Button className="w-full bg-white text-slate-950 hover:bg-slate-100 font-black uppercase tracking-widest text-[10px] rounded-xl h-14 shadow-2xl">
                      Live Preview AR
                    </Button>
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">{model.category}</p>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight italic">{model.name}</h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-500 bg-amber-50 px-2.5 py-1.5 rounded-xl text-[10px] font-black border border-amber-100/50">
                      <Star size={12} fill="currentColor" strokeWidth={2.5} />
                      {model.rating}
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-8 border-t border-slate-50 flex items-center justify-between gap-4">
                    <div className="flex flex-col min-w-0">
                       <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1.5">Price</p>
                       <div className="flex items-center gap-1.5 text-slate-950">
                          <Zap size={14} className="text-amber-500" strokeWidth={3} />
                          <span className="text-xl font-black tracking-tighter italic whitespace-nowrap">{model.price}</span>
                       </div>
                    </div>
                    <Button className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[9px] px-6 h-11 shadow-xl shadow-indigo-100 transition-all active:scale-95 shrink-0">
                      Unlock
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Featured Banner - Modern Dark Impact */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="mt-20 bg-slate-950 rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)]"
      >
        <div className="absolute inset-0 bg-gradient-vibrant opacity-60" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] -mr-64 -mt-64 animate-pulse" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest mb-8 border border-white/20">
              <Sparkles size={14} className="text-amber-300" /> Pro Exclusive
            </div>
            <h2 className="text-4xl md:text-6xl font-black italic leading-none mb-8 tracking-tighter">
              The Entire <span className="text-amber-300">Catalog.</span> <br/>Zero Limits.
            </h2>
            <p className="text-indigo-100 text-base md:text-lg mb-10 font-medium leading-relaxed opacity-80">
              Get access to our entire library of 500+ premium 3D models, environments, and animations for a single monthly price.
            </p>
            <Button className="bg-white text-slate-950 hover:bg-indigo-50 font-black rounded-2xl h-16 px-10 text-xs uppercase tracking-widest shadow-2xl transition-transform active:scale-95 group">
              Upgrade to Pro <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          
          <div className="relative group">
            <div className="absolute -inset-4 bg-white/20 blur-2xl rounded-full opacity-30 group-hover:opacity-50 transition-opacity" />
            <div className="w-56 h-56 md:w-72 md:h-72 bg-white/5 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 flex items-center justify-center p-12 transition-transform duration-700 group-hover:rotate-6">
               <Box size={140} className="text-white/20" strokeWidth={0.5} />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
