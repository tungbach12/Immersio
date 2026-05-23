import React, { useState, useEffect } from "react";
import { adminService } from "@/services/admin";
import { UserDto } from "@/services/auth";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  Users, Search, Shield, Ban, Edit2, Loader2, Sparkles, Check, X, ShieldAlert 
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function UsersManagement() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal Edit Subscription State
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [editingTier, setEditingTier] = useState("Basic");
  const [editingCycle, setEditingCycle] = useState("monthly");
  const [updatingSub, setUpdatingSub] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setLoading(true);
    adminService.getUsers()
      .then((data) => setUsers(data))
      .catch((err) => {
        console.error(err);
        setError("Failed to retrieve user registry.");
      })
      .finally(() => setLoading(false));
  };

  const handleSubscriptionUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setUpdatingSub(true);
    try {
      const updated = await adminService.updateUserSubscription(selectedUser.id, editingTier, editingCycle);
      setUsers(users.map(u => u.id === selectedUser.id ? updated : u));
      setSelectedUser(null);
    } catch (err: any) {
      alert(err.message || "Failed to update subscription tier.");
    } finally {
      setUpdatingSub(false);
    }
  };

  const handleBanUser = async (userId: string) => {
    if (!confirm("Are you sure you want to ban this user? They will be soft-deleted from the active registry.")) return;
    try {
      await adminService.banUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err: any) {
      alert(err.message || "Failed to ban user.");
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
        <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Loading user directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic">USER DIRECTORY</h1>
          <p className="text-slate-400 font-bold text-[10px] mt-1 uppercase tracking-[0.2em]">Manage student subscriptions, privileges, and platform security</p>
        </div>

        {/* Search Bar - Premium look */}
        <div className="relative w-full md:w-80">
          <input 
            type="text"
            placeholder="Search by username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 w-full pl-12 pr-4 rounded-2xl border border-white/10 bg-slate-950/45 backdrop-blur-2xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-xs font-semibold text-slate-200 placeholder:text-slate-600"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold px-6 py-4 rounded-2xl leading-relaxed">
          {error}
        </div>
      )}

      {/* Premium Users Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((item) => (
            <Card key={item.id} className="bg-slate-950/45 backdrop-blur-2xl border-white/5 shadow-xl rounded-[1.5rem] overflow-hidden hover:border-indigo-500/20 transition-all">
              <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <Users size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-white uppercase tracking-tight">{item.username}</span>
                      {item.role === "Admin" && (
                        <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[8px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                          <ShieldAlert size={10} /> Admin
                        </span>
                      )}
                      <span className={cn(
                        "text-[8px] font-black uppercase px-2 py-0.5 rounded-md",
                        item.subscriptionTier === "Premium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        item.subscriptionTier === "Plus" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" :
                        "bg-slate-800 text-slate-400"
                      )}>
                        {item.subscriptionTier}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold block truncate mt-1">{item.email}</span>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-slate-600 block mb-1">Streak</span>
                    <span className="text-white text-xs">{item.streakCount} days</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] text-slate-600 block mb-1">XP Points</span>
                    <span className="text-white text-xs">{item.experiencePoints} XP</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] text-slate-600 block mb-1">Hours</span>
                    <span className="text-white text-xs">{Math.round(item.learningHours)} hrs</span>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={() => {
                      setSelectedUser(item);
                      setEditingTier(item.subscriptionTier);
                      setEditingCycle(item.subscriptionExpiresAt ? "monthly" : "free");
                    }}
                    variant="ghost" 
                    className="h-10 px-4 rounded-xl font-bold uppercase tracking-wider text-[10px] border border-white/5 hover:border-indigo-500/20 text-slate-400 hover:text-indigo-400 bg-white/5 hover:bg-indigo-500/10"
                  >
                    <Edit2 size={12} className="mr-1.5" /> Subscription
                  </Button>
                  {item.role !== "Admin" && (
                    <Button 
                      onClick={() => handleBanUser(item.id)}
                      className="h-10 px-4 rounded-xl font-bold uppercase tracking-wider text-[10px] bg-red-950/20 border border-red-500/10 hover:border-red-500/30 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all"
                    >
                      <Ban size={12} className="mr-1.5" /> Ban
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-20 bg-slate-950/30 rounded-3xl border border-white/5">
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">No matching users found.</p>
          </div>
        )}
      </div>

      {/* Subscription Edit Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setSelectedUser(null)} 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
          />
          <div className="bg-slate-950 rounded-[2.5rem] shadow-2xl border border-white/10 w-full max-w-md overflow-hidden relative z-10 p-8 flex flex-col gap-6">
            <button 
              onClick={() => setSelectedUser(null)}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>

            <div>
              <h3 className="text-xl font-black text-white italic tracking-tight uppercase leading-none mb-1">Edit Subscription</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Modify membership tier for user <span className="text-indigo-400">{selectedUser.username}</span></p>
            </div>

            <form onSubmit={handleSubscriptionUpdate} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Subscription Tier</label>
                <select 
                  value={editingTier}
                  onChange={(e) => setEditingTier(e.target.value)}
                  className="h-12 px-4 rounded-xl border border-white/10 bg-slate-900/60 focus:outline-none focus:border-indigo-500 text-xs font-bold text-indigo-400"
                >
                  <option value="Basic">Basic (Free)</option>
                  <option value="Plus">Plus (Premium B2)</option>
                  <option value="Premium">Premium (Elite AI Coach)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Billing Cycle</label>
                <select 
                  value={editingCycle}
                  onChange={(e) => setEditingCycle(e.target.value)}
                  className="h-12 px-4 rounded-xl border border-white/10 bg-slate-900/60 focus:outline-none focus:border-indigo-500 text-xs font-bold text-indigo-400"
                >
                  <option value="free">No expiry (Free)</option>
                  <option value="monthly">Monthly Cycle (+30 days)</option>
                  <option value="yearly">Yearly Cycle (+365 days)</option>
                </select>
              </div>

              <Button 
                type="submit"
                disabled={updatingSub}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-xl shadow-glow flex items-center justify-center gap-2 mt-4"
              >
                {updatingSub ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                Confirm Updates
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
