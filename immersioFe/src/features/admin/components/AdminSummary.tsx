import { Users, Sparkles, Layers, CreditCard } from "lucide-react";
import type { AdminDashboardStats } from "@/services/admin";

const VND = new Intl.NumberFormat("vi-VN");

export function AdminSummary({ stats }: { stats: AdminDashboardStats }) {
  // Every field is read defensively: the endpoint is the source of truth and a
  // missing field must degrade to a placeholder, never crash the dashboard.
  const totalUsers = stats.totalUsers ?? 0;
  const activeSubscriptions = stats.activeSubscriptions ?? 0;
  const totalRevenueVnd = stats.totalRevenueVnd ?? 0;
  const totalScenarios = stats.totalScenarios ?? 0;

  const metrics = [
    {
      label: "Learners",
      value: totalUsers.toLocaleString(),
      detail: "Registered accounts",
      icon: Users,
    },
    {
      label: "Active plans",
      value: activeSubscriptions.toLocaleString(),
      detail: "Subscriptions currently active",
      icon: Sparkles,
    },
    {
      label: "Scenarios",
      value: totalScenarios.toLocaleString(),
      detail: "Published roleplay scenarios",
      icon: Layers,
    },
    {
      label: "Revenue",
      value: `${VND.format(totalRevenueVnd)} ₫`,
      detail: "Paid memberships",
      icon: CreditCard,
    },
  ];
  return (
    <div className="admin-summary-grid">
      {metrics.map((metric) => (
        <article
          key={metric.label}
          className="learning-paper admin-summary-card"
        >
          <div>
            <span>{metric.label}</span>
            <metric.icon size={18} />
          </div>
          <strong>{metric.value}</strong>
          <small>{metric.detail}</small>
        </article>
      ))}
    </div>
  );
}
