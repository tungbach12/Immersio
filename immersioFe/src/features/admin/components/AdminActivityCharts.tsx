import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useId } from "react";
import { useReducedMotion } from "motion/react";
import type { AdminDashboardStats } from "@/services/admin";

const axisTick = { fill: "var(--slate-400)", fontSize: 10 };
const tooltipStyle = {
  backgroundColor: "var(--surface)",
  borderColor: "var(--slate-700)",
  color: "var(--card-foreground)",
  borderRadius: 12,
  fontSize: 12,
};

export function AdminActivityCharts({ stats }: { stats: AdminDashboardStats }) {
  const gradient = useId();
  const reducedMotion = useReducedMotion();
  // Recharts throws on an undefined series, and the endpoint may legitimately
  // return [] for a fresh install. Fall back to an empty array.
  const growthData = stats.growthData ?? [];
  const sessionData = stats.sessionData ?? [];
  return (
    <div className="admin-charts">
      <section className="learning-paper">
        <h2>A growing learning community.</h2>
        <p>Registered learners over time</p>
        <div
          className="admin-chart"
          role="img"
          aria-label="Learner growth chart"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={growthData}
              margin={{ top: 10, right: 8, left: -18, bottom: 0 }}
            >
              <defs>
                <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7ab996" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#7ab996" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="var(--slate-700)"
                strokeDasharray="3 5"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={axisTick}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={axisTick}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="users"
                name="Learners"
                stroke="#7ab996"
                strokeWidth={2}
                fill={`url(#${gradient})`}
                isAnimationActive={!reducedMotion}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="learning-paper">
        <h2>Conversations, day by day.</h2>
        <p>Practice sessions in the workspace</p>
        <div
          className="admin-chart"
          role="img"
          aria-label="Daily practice session chart"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sessionData}
              margin={{ top: 10, right: 8, left: -18, bottom: 0 }}
            >
              <CartesianGrid
                stroke="var(--slate-700)"
                strokeDasharray="3 5"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={axisTick}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={axisTick}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "var(--surface-hover)" }}
              />
              <Bar
                dataKey="sessions"
                name="Conversations"
                fill="#e5b85c"
                radius={[5, 5, 0, 0]}
                maxBarSize={34}
                isAnimationActive={!reducedMotion}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
