import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import React, { useState, useEffect } from 'react';
import { adminService, AdminDashboardStats } from '@/services/admin';
import { Loader2, TrendingUp, Users, Play, Clock, DollarSign } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = () => {
    setLoading(true);
    setError("");
    adminService.getDashboardStats()
      .then((data) => {
        setStats(data);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load real-time analytics. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
        <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Loading system analytics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 text-center max-w-xl mx-auto my-12">
        <p className="text-red-400 font-bold mb-4">{error || "An unexpected error occurred."}</p>
        <button 
          onClick={loadStats}
          className="px-6 py-2.5 bg-red-500/20 text-red-300 font-semibold rounded-2xl border border-red-500/30 hover:bg-red-500/30 transition-all text-xs"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-4xl font-black text-white tracking-tighter italic">ADMIN OVERVIEW</h1>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Real-time statistics & business diagnostics</p>
      </div>
      
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-950/45 backdrop-blur-2xl border-white/5 shadow-2xl relative overflow-hidden group">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl -mr-8 -mt-8" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Users</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Users size={16} />
              </div>
            </div>
            <h3 className="text-3xl font-black text-white tracking-tight">{stats.totalUsers}</h3>
            <span className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-1 mt-2">
              <TrendingUp size={12} /> Live platform accounts
            </span>
          </CardContent>
        </Card>

        <Card className="bg-slate-950/45 backdrop-blur-2xl border-white/5 shadow-2xl relative overflow-hidden group">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl -mr-8 -mt-8" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Sessions</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Play size={16} />
              </div>
            </div>
            <h3 className="text-3xl font-black text-white tracking-tight">{stats.activeSessions}</h3>
            <span className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-1 mt-2">
              <TrendingUp size={12} /> Active roleplay turns
            </span>
          </CardContent>
        </Card>

        <Card className="bg-slate-950/45 backdrop-blur-2xl border-white/5 shadow-2xl relative overflow-hidden group">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl -mr-8 -mt-8" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avg. Duration</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Clock size={16} />
              </div>
            </div>
            <h3 className="text-3xl font-black text-white tracking-tight">{stats.averageDuration}</h3>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-2 block">Per complete session</span>
          </CardContent>
        </Card>

        <Card className="bg-slate-950/45 backdrop-blur-2xl border-white/5 shadow-2xl relative overflow-hidden group">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-2xl -mr-8 -mt-8" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Revenue</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <DollarSign size={16} />
              </div>
            </div>
            <h3 className="text-3xl font-black text-indigo-300 tracking-tight">{stats.revenue}</h3>
            <span className="text-[10px] text-indigo-400 font-extrabold flex items-center gap-1 mt-2">
              From Plus & Premium Tiers
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-slate-950/45 backdrop-blur-2xl border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-xl font-black text-white italic tracking-tight uppercase">User Accumulation</CardTitle>
          </CardHeader>
          <CardContent className="p-8 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.growthData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 'bold'}} />
                <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }} />
                <Area type="monotone" dataKey="users" stroke="#6366F1" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-950/45 backdrop-blur-2xl border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-xl font-black text-white italic tracking-tight uppercase">Daily Conversation Loads</CardTitle>
          </CardHeader>
          <CardContent className="p-8 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.sessionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 'bold'}} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#020617', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }} />
                <Bar dataKey="sessions" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
