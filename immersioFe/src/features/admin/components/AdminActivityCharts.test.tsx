import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminActivityCharts } from "./AdminActivityCharts";

/**
 * The migration left both charts unbacked: `growthData` / `sessionData` were not
 * on the Java `AdminDashboardStatsDto`, so Recharts received `undefined`. These
 * tests pin both the rebuilt payload and the degraded cases.
 */
const FULL_PAYLOAD = {
  totalUsers: 128,
  activeSubscriptions: 17,
  totalRevenueVnd: 4_250_000,
  totalScenarios: 6,
  totalCards: 240,
  growthData: [
    { name: "2026-10-09", users: 3 },
    { name: "2026-10-10", users: 5 },
  ],
  sessionData: [
    { name: "2026-10-09", sessions: 2 },
    { name: "2026-10-10", sessions: 7 },
  ],
};

describe("AdminActivityCharts", () => {
  it("renders with the series the Java endpoint returns", () => {
    expect(() => render(<AdminActivityCharts stats={FULL_PAYLOAD as never} />)).not.toThrow();
  });

  it("renders when both series are empty (fresh install, no history)", () => {
    const empty = { ...FULL_PAYLOAD, growthData: [], sessionData: [] };
    expect(() => render(<AdminActivityCharts stats={empty as never} />)).not.toThrow();
  });

  it("does not crash when the series are absent entirely", () => {
    const missing = { totalUsers: 1 } as never;
    expect(() => render(<AdminActivityCharts stats={missing} />)).not.toThrow();
  });

  it("renders both chart regions", () => {
    const { container } = render(<AdminActivityCharts stats={FULL_PAYLOAD as never} />);
    expect(container.querySelectorAll(".admin-chart").length).toBe(2);
  });
});