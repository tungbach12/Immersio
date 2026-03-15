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
    id: "m3",
    name: "Modern Office Set",
    category: "Environments",
    price: "800",
    rating: 4.7,
    image: "https://picsum.photos/seed/office/400/400",
  },
  {
    id: "m4",
    name: "Space Station Hub",
    category: "Environments",
    price: "2,000",
    rating: 5.0,
    image: "https://picsum.photos/seed/space/400/400",
    tag: "Premium",
  },
  {
    id: "m5",
    name: "Fantasy Dragon",
    category: "Creatures",
    price: "1,800",
    rating: 4.9,
    image: "https://picsum.photos/seed/dragon/400/400",
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
    <div className="max-w-7xl mx-auto py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-indigo-600 font-black uppercase tracking-[0.3em] text-[10px] mb-4 bg-indigo-50/50 w-fit px-3 py-1 rounded-lg border border-indigo-100/50"
          >
            <Box size={14} /> Global Marketplace
          </motion.div>
          <h1 className="text-4xl font-display font-black text-slate-950 italic tracking-tight leading-tight">
            Asset <span className="text-indigo-600">Store</span>
          </h1>
          <p className="text-slate-400 font-bold text-sm mt-3 leading-relaxed">Enhance your immersion with premium 3D assets & environments</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white glass-card rounded-3xl px-6 py-4 flex items-center gap-4 shadow-xl shadow-slate-100/50 border border-slate-100">
            <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-sm border border-amber-100/50">
              <Zap size={18} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Balance</p>
              <p className="text-base font-black text-slate-950">2,450 Credits</p>
            </div>
          </div>
          <Button className="rounded-2xl h-14 px-8 bg-slate-950 hover:bg-black text-white font-black uppercase tracking-widest text-[10px] shadow-2xl">
            Get Credits
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-6 mb-12">
        <div className="flex-1 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-indigo-600" size={22} />
          <input 
            type="text" 
            placeholder="Search assets, creators, bundles..."
            className="w-full h-16 bg-white border border-slate-100 rounded-[2rem] pl-16 pr-6 focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-xl shadow-slate-100/50 font-bold text-base placeholder:text-slate-300"
          />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-4 md:pb-0 scrollbar-hide px-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap",
                activeCategory === cat 
                  ? "bg-slate-950 text-white shadow-2xl shadow-slate-200" 
                  : "bg-white border border-slate-100 text-slate-500 hover:border-indigo-200"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredModels.map((model, idx) => (
          <motion.div
            key={model.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card hoverEffect className="group overflow-hidden border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500">
              <CardContent className="p-0">
                <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
                  <img 
                    src={model.image} 
                    alt={model.name}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  {model.tag && (
                    <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 shadow-2xl border border-white">
                      {model.tag}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
                    <Button className="w-full bg-white text-slate-950 hover:bg-slate-100 font-black uppercase tracking-widest text-[10px] rounded-[1.25rem] h-14 shadow-2xl">
                      Live Preview
                    </Button>
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">{model.category}</p>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{model.name}</h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-500 bg-amber-50 px-2.5 py-1 rounded-lg text-[10px] font-black border border-amber-100/50">
                      <Star size={12} fill="currentColor" />
                      {model.rating}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-8 pt-8 border-t border-slate-50/50">
                    <div className="flex items-center gap-2">
                       <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                          <Zap size={18} strokeWidth={2.5} />
                       </div>
                      <span className="text-2xl font-black text-slate-950 tracking-tighter italic">{model.price}</span>
                    </div>
                    <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[9px] px-6 h-12 shadow-xl shadow-indigo-100 group-hover:scale-105 transition-transform">
                      Unlock
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Featured Banner */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        className="mt-20 bg-gradient-to-r from-indigo-600 to-blue-700 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-lg text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
              <Sparkles size={14} /> Pro Exclusive
            </div>
            <h2 className="text-3xl md:text-5xl font-black italic leading-tight mb-6">
              Unlock All Assets with IMMERSIO Pro
            </h2>
            <p className="text-indigo-100 text-lg mb-8">
              Get access to our entire library of 500+ premium 3D models, environments, and animations for a single monthly price.
            </p>
            <Button className="bg-white text-indigo-600 hover:bg-indigo-50 font-black rounded-2xl h-14 px-8 text-lg shadow-xl">
              Upgrade to Pro <ArrowRight className="ml-2" />
            </Button>
          </div>
          <div className="w-full max-w-xs aspect-square bg-white/10 backdrop-blur-2xl rounded-[2rem] border border-white/20 flex items-center justify-center p-8">
             <Box size={120} className="text-white/40" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
