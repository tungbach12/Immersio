import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { LearningPlan } from "../plans";

interface PlanCardProps {
  plan: LearningPlan;
  price: string;
  current: boolean;
  processing: boolean;
  disabled: boolean;
  onSelect: () => void;
}

export function PlanCard({
  plan,
  price,
  current,
  processing,
  disabled,
  onSelect,
}: PlanCardProps) {
  return (
    <article
      className={`learning-paper subscription-plan ${plan.popular ? "is-popular" : ""} ${current ? "is-current" : ""}`}
    >
      <div className="subscription-plan-heading">
        <plan.icon size={22} />
        <span>
          {current
            ? "Your current plan"
            : plan.popular
              ? "A popular next step"
              : ""}
        </span>
      </div>
      <h2>{plan.name}</h2>
      <p className="subscription-price">
        <strong>{price}</strong>
        {plan.price !== "Free" && <span>/ month</span>}
      </p>
      <p className="subscription-plan-description">{plan.description}</p>
      <ul>
        {plan.features.map((feature) => (
          <li key={feature}>
            <Check size={14} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Button
        variant={plan.popular ? "default" : "outline"}
        disabled={current || disabled}
        onClick={onSelect}
      >
        {processing ? (
          <>
            <Loader2 size={16} className="animate-spin mr-2" />
            Opening checkout…
          </>
        ) : current ? (
          "Your current plan"
        ) : plan.name === "Basic" ? (
          "Switch to Basic"
        ) : (
          plan.buttonText
        )}
      </Button>
    </article>
  );
}
