import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminSummary } from "./AdminSummary";

/**
 * Regression guard for the .NET -> Java migration.
 *
 * `AdminDashboardStatsDto` (Java) returns exactly these five fields:
 *   totalUsers, activeSubscriptions, totalRevenueVnd, totalScenarios, totalCards
 *
 * The component previously read `activeSessions`, `averageDuration`, `revenue`,
 * `growthData` and `sessionData`, none of which the Java backend sends. With no
 * null guard, `stats.activeSessions.toLocaleString()` threw a TypeError and took
 * the whole admin dashboard down with it.
 *
 * The fixture below is the real envelope: `authService.fetchWithAuth` unwraps
 * `{ success, data }` and hands the component the `data` object verbatim.
 */
const JAVA_STATS_PAYLOAD = {
  totalUsers: 128,
  activeSubscriptions: 17,
  totalRevenueVnd: 4_250_000,
  totalScenarios: 6,
  totalCards: 240,
};

describe("AdminSummary", () => {
  it("renders without throwing on the payload the Java backend actually returns", () => {
    expect(() =>
      render(<AdminSummary stats={JAVA_STATS_PAYLOAD as never} />),
    ).not.toThrow();
  });

  it("shows the user count", () => {
    render(<AdminSummary stats={JAVA_STATS_PAYLOAD as never} />);
    expect(screen.getByText("128")).toBeInTheDocument();
  });

  it("shows the active subscription count, the field the backend actually sends", () => {
    render(<AdminSummary stats={JAVA_STATS_PAYLOAD as never} />);
    expect(screen.getByText(/^17$/)).toBeInTheDocument();
  });

  it("shows the scenario count", () => {
    render(<AdminSummary stats={JAVA_STATS_PAYLOAD as never} />);
    expect(screen.getByText(/^6$/)).toBeInTheDocument();
  });

  it("formats revenue as VND", () => {
    render(<AdminSummary stats={JAVA_STATS_PAYLOAD as never} />);
    expect(screen.getByText(/₫/)).toBeInTheDocument();
  });

  it("does not crash when every optional field is absent", () => {
    const minimal = { totalUsers: 1 };
    expect(() => render(<AdminSummary stats={minimal as never} />)).not.toThrow();
  });
});