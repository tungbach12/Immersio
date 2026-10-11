import { useState } from "react";
import { useWorkspaceUser } from "@/components/layout/WorkspaceUserContext";
import { authService, API_BASE, type UserDto } from "@/services/auth";
import { subscriptionService } from "@/services/subscription";
import type { LearningPlan } from "../plans";

export function useSubscription() {
  const { user, setUser, loading } = useWorkspaceUser();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [error, setError] = useState("");
  const activeTier = user?.subscriptionTier || "Basic";

  function formatPrice(plan: LearningPlan) {
    if (plan.price === "Free") return "Free";
    const monthly = parseInt(plan.price.replace(/\D/g, ""));
    const amount =
      billingCycle === "yearly" ? Math.round(monthly * 0.8) : monthly;
    return `${amount.toLocaleString("vi-VN")}đ`;
  }

  async function selectPlan(plan: LearningPlan) {
    if (
      processingPlan ||
      loading ||
      !user ||
      plan.name.toLowerCase() === activeTier.toLowerCase()
    )
      return;
    setProcessingPlan(plan.name);
    setError("");
    try {
      if (plan.name === "Basic") {
        const response = await authService.fetchWithAuth(
          `${API_BASE}/api/subscription/upgrade`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tier: "Basic", billingCycle: "free" }),
          },
        );
        if (!response.ok) throw new Error("Your plan could not be changed.");
        const updated: UserDto = await response.json();
        authService.updateUser(updated);
        setUser(updated);
        setProcessingPlan(null);
      } else {
        const paymentUrl = await subscriptionService.createPayment(
          plan.name,
          billingCycle,
        );
        window.location.href = paymentUrl;
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Your plan could not be updated. Please try again.",
      );
      setProcessingPlan(null);
    }
  }
  return {
    billingCycle,
    setBillingCycle,
    activeTier,
    processingPlan,
    error,
    formatPrice,
    selectPlan,
    disabled: loading || !user || !!processingPlan,
  };
}
