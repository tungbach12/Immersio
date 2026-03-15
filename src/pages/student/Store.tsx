import { motion } from "motion/react";
import { ShoppingBag, Box, Star, Filter, Search, ArrowRight, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useState } from "react";
import { cn } from "@/lib/utils";

const models = [
  {
    id: "m1",
    name: "Cyberpunk Barista",
    category: "Characters",
    price: "1,200",
    rating: 4.9,
    image: "https://picsum.photos/seed/barista/400/400",
    tag: "New",
  },
  {
    id: "m2",
    name: "Ancient Samurai",
    category: "Characters",
    price: "1,500",
    rating: 4.8,
    image: "https://picsum.photos/seed/samurai/400/400",
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
    name: "Talking Robot",
    category: "Characters",
    price: "900",
    rating: 4.6,
    image: "https://picsum.photos/seed/robot/400/400",
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-widest text-xs mb-3"
          >
            <Box size={16} /> AR Assets Marketplace
          </motion.div>
          <h1 className="text-4xl font-black text-slate-900 italic tracking-tight">
            Asset Store
          </h1>
          <p className="text-slate-500 mt-2">Enhance your AR experience with high-quality 3D models.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-black text-xs">
              <Zap size={14} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Your Balance</p>
              <p className="text-sm font-black text-slate-900">2,450 Credits</p>
            </div>
          </div>
          <Button className="rounded-2xl h-12 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold">
            Buy Credits
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search assets..."
            className="w-full h-14 bg-white border border-slate-200 rounded-2xl pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-6 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all",
                activeCategory === cat 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
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
                <div className="aspect-square relative overflow-hidden bg-slate-100">
                  <img 
                    src={model.image} 
                    alt={model.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {model.tag && (
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-600 shadow-sm">
                      {model.tag}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl h-12">
                      Quick Preview
                    </Button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">{model.category}</p>
                      <h3 className="text-lg font-black text-slate-900">{model.name}</h3>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                      <Star size={14} fill="currentColor" />
                      {model.rating}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-50">
                    <div className="flex items-center gap-1">
                      <Zap size={16} className="text-amber-500" />
                      <span className="text-xl font-black text-slate-900">{model.price}</span>
                    </div>
                    <Button size="sm" className="rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold px-4">
                      Buy Now
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
