import { Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/States";
import { usePlans } from "@/features/billing/api";
import { cn } from "@/lib/utils";
import type { BillingCycle, Plan, PlanCode } from "@/types";

const peso = (n: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);

export const CycleToggle = ({ value, onChange }: { value: BillingCycle; onChange: (c: BillingCycle) => void }) => (
  <div className="cycle-toggle" role="radiogroup" aria-label="Billing cycle">
    {(["monthly", "yearly"] as const).map((c) => (
      <button key={c} type="button" role="radio" aria-checked={value === c} className={cn(value === c && "is-on")} onClick={() => onChange(c)}>
        {c === "monthly" ? "Monthly" : "Yearly"}
        {c === "yearly" && <span className="cycle-save">2 months free</span>}
      </button>
    ))}
  </div>
);

export const planPrice = (plan: Plan, cycle: BillingCycle) =>
  cycle === "yearly" ? Number(plan.price_yearly) / 12 : Number(plan.price_monthly);

/**
 * Plan cards. `renderAction` decides the button for each plan so the same
 * cards work on the landing page, at signup and on the billing page.
 */
export const PricingPlans = ({
  cycle,
  selected,
  renderAction,
  onCardClick,
}: {
  cycle: BillingCycle;
  selected?: PlanCode;
  renderAction: (plan: Plan) => React.ReactNode;
  onCardClick?: (plan: Plan) => void;
}) => {
  const { data: plans, isLoading, error } = usePlans();

  if (error) return <ErrorState error={error} />;
  if (isLoading || !plans)
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-96 rounded-2xl" />)}
      </div>
    );

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((plan) => {
        const isSelected = selected === plan.code;
        return (
          <div
            key={plan.code}
            className={cn("plan-card", plan.highlight && "is-featured", isSelected && "is-selected", onCardClick && "cursor-pointer")}
            onClick={onCardClick ? () => onCardClick(plan) : undefined}
          >
            {plan.highlight && <span className="plan-ribbon">Most popular</span>}
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="text-sm text-muted-foreground">{plan.tagline}</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight">{peso(planPrice(plan, cycle))}</span>
              <span className="text-sm text-muted-foreground">/ month</span>
            </div>
            <p className="-mt-3 text-xs text-muted-foreground">
              {cycle === "yearly" ? `${peso(Number(plan.price_yearly))} billed yearly` : "Billed monthly"}
            </p>
            <ul className="flex-1 space-y-2.5 text-sm">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {f}
                </li>
              ))}
            </ul>
            {renderAction(plan)}
          </div>
        );
      })}
    </div>
  );
};
