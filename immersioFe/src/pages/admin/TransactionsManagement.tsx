import { useState, useEffect } from "react";
import { adminService, PaymentTransactionDto } from "@/services/admin";
import { Card, CardContent } from "@/components/ui/Card";
import {
  CreditCard,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  DollarSign,
  TrendingUp,
  Filter,
  User,
  Calendar,
  Hash
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TransactionsManagement() {
  const [transactions, setTransactions] = useState<PaymentTransactionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = () => {
    setLoading(true);
    adminService
      .getTransactions()
      .then((data) => setTransactions(data))
      .catch((err) => {
        console.error(err);
        setError("Không thể tải danh sách giao dịch.");
      })
      .finally(() => setLoading(false));
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.txnRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tier.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      t.status.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  const totalAmount = transactions
    .filter((t) => t.status === "Paid")
    .reduce((sum, t) => sum + t.amount, 0);

  const paidCount = transactions.filter((t) => t.status === "Paid").length;
  const pendingCount = transactions.filter((t) => t.status === "Pending").length;

  const formatCurrency = (val: number) => `${val.toLocaleString("vi-VN")}đ`;
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
        <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">
          Đang tải lịch sử giao dịch...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic">
            TRANSACTION LOGS
          </h1>
          <p className="text-slate-400 font-bold text-[10px] mt-1 uppercase tracking-[0.2em]">
            Quản lý và theo dõi lịch sử thanh toán PayOS của học viên
          </p>
        </div>

        {/* Search Bar & Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Tìm theo mã đơn, user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full pl-11 pr-4 rounded-2xl border border-white/10 bg-slate-950/45 backdrop-blur-2xl focus:outline-none focus:border-indigo-500 text-xs font-semibold text-slate-200 placeholder:text-slate-600"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
          </div>

          <div className="relative w-full sm:w-40">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-12 w-full pl-10 pr-4 rounded-2xl border border-white/10 bg-slate-950/45 backdrop-blur-2xl focus:outline-none focus:border-indigo-500 text-xs font-bold text-indigo-400 appearance-none cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="Paid">Đã thanh toán (Paid)</option>
              <option value="Pending">Đang xử lý (Pending)</option>
              <option value="Failed">Thất bại (Failed)</option>
            </select>
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" size={14} />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold px-6 py-4 rounded-2xl leading-relaxed">
          {error}
        </div>
      )}

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-950/45 backdrop-blur-2xl border-white/5 shadow-2xl relative overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Tổng doanh thu thực tế
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <DollarSign size={18} />
              </div>
            </div>
            <h3 className="text-3xl font-black text-emerald-400 tracking-tight">
              {formatCurrency(totalAmount)}
            </h3>
            <span className="text-[10px] text-emerald-500 font-extrabold flex items-center gap-1 mt-2">
              <TrendingUp size={12} /> {paidCount} giao dịch thành công
            </span>
          </CardContent>
        </Card>

        <Card className="bg-slate-950/45 backdrop-blur-2xl border-white/5 shadow-2xl relative overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Tổng đơn hàng
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <CreditCard size={18} />
              </div>
            </div>
            <h3 className="text-3xl font-black text-white tracking-tight">
              {transactions.length}
            </h3>
            <span className="text-[10px] text-slate-400 font-extrabold mt-2 block">
              Bao gồm cả thành công & đang chờ
            </span>
          </CardContent>
        </Card>

        <Card className="bg-slate-950/45 backdrop-blur-2xl border-white/5 shadow-2xl relative overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Đang xử lý (Pending)
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Clock size={18} />
              </div>
            </div>
            <h3 className="text-3xl font-black text-amber-300 tracking-tight">
              {pendingCount}
            </h3>
            <span className="text-[10px] text-amber-400 font-extrabold mt-2 block">
              Cần kiểm tra lại nếu học viên phản ánh
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List / Grid */}
      <div className="space-y-4">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((item) => {
            const isPaid = item.status === "Paid";
            const isFailed = item.status === "Failed" || item.status === "CANCELLED";

            return (
              <Card
                key={item.id}
                className="bg-slate-950/45 backdrop-blur-2xl border-white/5 shadow-xl rounded-[1.5rem] overflow-hidden hover:border-indigo-500/20 transition-all"
              >
                <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  {/* Left Column: Icon & User Info */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border",
                        isPaid
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : isFailed
                          ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                          : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      )}
                    >
                      {isPaid ? (
                        <CheckCircle2 size={22} />
                      ) : isFailed ? (
                        <XCircle size={22} />
                      ) : (
                        <Clock size={22} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1">
                          <Hash size={12} className="text-slate-600" /> {item.txnRef}
                        </span>
                        <span
                          className={cn(
                            "text-[8px] font-black uppercase px-2 py-0.5 rounded-md border",
                            isPaid
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : isFailed
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          )}
                        >
                          {item.status}
                        </span>
                        <span
                          className={cn(
                            "text-[8px] font-black uppercase px-2 py-0.5 rounded-md border",
                            item.tier === "Premium"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                          )}
                        >
                          Gói {item.tier} ({item.billingCycle === "yearly" ? "Năm" : "Tháng"})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 text-slate-300">
                        <User size={12} className="text-slate-500" />
                        <span className="font-extrabold text-sm text-white">{item.username}</span>
                        <span className="text-[10px] text-slate-500 font-bold">({item.email})</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Amount & Date */}
                  <div className="flex items-center gap-8 justify-between w-full md:w-auto border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                    <div className="flex flex-col text-left md:text-right">
                      <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1 md:justify-end">
                        <Calendar size={10} /> {formatDate(item.createdAt)}
                      </span>
                      {item.paidAt && (
                        <span className="text-[8px] font-bold text-emerald-400/80 mt-0.5">
                          Thanh toán lúc: {formatDate(item.paidAt)}
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-black text-indigo-400 tracking-tight block">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-20 bg-slate-950/30 rounded-3xl border border-white/5">
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">
              Không tìm thấy giao dịch nào phù hợp.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
