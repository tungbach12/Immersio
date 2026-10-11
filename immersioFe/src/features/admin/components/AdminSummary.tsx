import { Users, Play, Clock, CreditCard } from "lucide-react";
import type { AdminDashboardStats } from "@/services/admin";

export function AdminSummary({ stats }: { stats: AdminDashboardStats }) {
  const metrics = [
    {
      label: "Learners",
      value: stats.totalUsers.toLocaleString(),
      detail: "Registered accounts",
      icon: Users,
    },
    {
      label: "Active conversations",
      value: stats.activeSessions.toLocaleString(),
      detail: "Current practice sessions",
      icon: Play,
    },
    {
      label: "Average practice",
      value: stats.averageDuration,
      detail: "Time per session",
      icon: Clock,
    },
    {
      label: "Revenue",
      value: stats.revenue,
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
