import { PageHeading } from "@/components/learning/PageHeading";
import { PlanCard } from "@/features/subscription/components/PlanCard";
import { PlanComparison } from "@/features/subscription/components/PlanComparison";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";
import { plans } from "@/features/subscription/plans";

export default function Subscription() {
  const subscription = useSubscription();
  return (
    <div>
      <PageHeading
        eyebrow="Room for a little more possibility"
        title="Find a plan for your next chapter."
        description="Choose the practice that fits your day. Your learning journey can grow at your own pace."
      />
      <div
        className="subscription-billing"
        role="group"
        aria-label="Billing cycle"
      >
        <button
          type="button"
          aria-pressed={subscription.billingCycle === "monthly"}
          disabled={subscription.disabled}
          onClick={() => subscription.setBillingCycle("monthly")}
        >
          Monthly
        </button>
        <button
          type="button"
          aria-pressed={subscription.billingCycle === "yearly"}
          disabled={subscription.disabled}
          onClick={() => subscription.setBillingCycle("yearly")}
        >
          Yearly <span>Save 20%</span>
        </button>
      </div>
      {subscription.billingCycle === "yearly" && (
        <p className="subscription-billing-note">
          Prices below are per month, with yearly billing.
        </p>
      )}
      {subscription.error && (
        <p className="learning-inline-error mb-5" role="alert">
          {subscription.error}
        </p>
      )}
      <div className="subscription-plan-grid">
        {plans.map((plan) => (
          <PlanCard
            key={plan.name}
            plan={plan}
            price={subscription.formatPrice(plan)}
            current={
              plan.name.toLowerCase() === subscription.activeTier.toLowerCase()
            }
            processing={subscription.processingPlan === plan.name}
            disabled={subscription.disabled}
            onSelect={() => subscription.selectPlan(plan)}
          />
        ))}
      </div>
      <PlanComparison />
    </div>
  );
}
