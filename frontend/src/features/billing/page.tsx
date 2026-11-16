import { useState } from "react";
import { Building2, CreditCard, Info, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ErrorState } from "@/components/common/States";
import { CycleToggle, PricingPlans } from "@/components/saas/PricingPlans";
import { formatDate, formatMoney } from "@/lib/format";
import { notify } from "@/lib/toast";
import type { BillingCycle, Organization, Plan } from "@/types";
import { useOrganization, useSubscriptionAction, useUpdateOrganization, type SubscriptionAction } from "./api";

const CompanyCard = ({ org }: { org: Organization }) => {
  const [name, setName] = useState(org.name);
  const update = useUpdateOrganization();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Building2 className="size-4" /> Company</CardTitle>
        <CardDescription>Shown in the sidebar for everyone in your workspace.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-1.5">
        <Label htmlFor="org-name">Company name</Label>
        <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} />
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          disabled={update.isLoading || !name.trim() || name.trim() === org.name}
          onClick={() =>
            update.mutate({ name: name.trim() }, {
              onSuccess: () => notify.success("Company name saved"),
              onError: (e) => notify.error(e),
            })
          }
        >
          {update.isLoading && <Loader2 className="animate-spin" />} Save
        </Button>
      </CardFooter>
    </Card>
  );
};

const SubscriptionCard = ({ org, onAction, busy }: { org: Organization; onAction: (a: SubscriptionAction) => void; busy: boolean }) => {
  const seatPct = Math.min(100, (org.seats_used / org.max_employees) * 100);
  const endLabel =
    org.effective_status === "trialing" ? "Trial ends" :
    org.effective_status === "cancelling" ? "Access ends" :
    org.effective_status === "expired" ? "Ended" : "Renews";
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CreditCard className="size-4" /> Subscription</CardTitle>
        <CardDescription>Your plan, status and usage.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Plan</p>
          <p className="text-xl font-bold">{org.plan_name}</p>
          <p className="text-sm text-muted-foreground">
            {formatMoney(org.price)} / {org.billing_cycle === "yearly" ? "year" : "month"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Status</p>
          <StatusBadge status={org.effective_status} />
          <p className="text-sm text-muted-foreground">{endLabel} {formatDate(org.access_ends_at)}</p>
        </div>
        <div className="space-y-2">
          <p className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="size-3.5" /> Active employees</p>
          <p className="text-xl font-bold tabular-nums">{org.seats_used} <span className="text-sm font-normal text-muted-foreground">/ {org.max_employees}</span></p>
          <div className="balance-bar" data-full={seatPct >= 100 || undefined}><span style={{ width: `${seatPct}%` }} /></div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {org.effective_status !== "active" && org.effective_status !== "cancelling" && (
          <Button onClick={() => onAction("activate")} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {org.effective_status === "expired" ? "Renew subscription" : "Activate subscription"}
          </Button>
        )}
        {org.effective_status === "cancelling" && (
          <Button onClick={() => onAction("resume")} disabled={busy}>Keep my subscription</Button>
        )}
        {(org.effective_status === "active" || org.effective_status === "trialing") && (
          <Button variant="ghost" className="text-destructive" onClick={() => onAction("cancel")} disabled={busy}>
            Cancel subscription
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

const BillingPage = () => {
  const { data: org, isLoading, error } = useOrganization();
  const action = useSubscriptionAction();
  const [cycle, setCycle] = useState<BillingCycle | null>(null);

  if (error) return <ErrorState error={error} />;
  if (isLoading || !org)
    return (
      <>
        <PageHeader title="Billing & company" />
        <Skeleton className="h-48" />
      </>
    );

  const shownCycle = cycle ?? org.billing_cycle;

  const run = (a: SubscriptionAction, plan?: Plan) => {
    if (a === "cancel" && !window.confirm("Cancel the subscription? Your team keeps access until the end of the current period.")) return;
    action.mutate(
      { action: a, plan: plan?.code, billing_cycle: plan ? shownCycle : undefined },
      { onSuccess: (res) => notify.success(res.detail), onError: (e) => notify.error(e) },
    );
  };

  const planAction = (plan: Plan) => {
    const isCurrent = plan.code === org.plan && shownCycle === org.billing_cycle;
    if (isCurrent) return <Button variant="outline" className="w-full" disabled>Current plan</Button>;
    const tooSmall = org.seats_used > plan.max_employees;
    const needsActivation = org.effective_status === "expired";
    const label = needsActivation
      ? `Activate ${plan.name}`
      : plan.code === org.plan
        ? `Switch to ${shownCycle} billing`
        : `Switch to ${plan.name}`;
    return (
      <Button
        className="w-full"
        variant={plan.highlight ? "default" : "outline"}
        disabled={action.isLoading || tooSmall}
        title={tooSmall ? `You have ${org.seats_used} active employees` : undefined}
        onClick={() => run(needsActivation ? "activate" : "change_plan", plan)}
      >
        {tooSmall ? "Too many employees" : label}
      </Button>
    );
  };

  return (
    <>
      <PageHeader title="Billing & company" description="Manage your company workspace and subscription." />
      <Alert>
        <Info />
        <AlertDescription>
          Payments aren't connected yet. Activating or changing a plan updates your subscription right away without charging a card.
        </AlertDescription>
      </Alert>
      <div className="grid gap-4 lg:grid-cols-3">
        <SubscriptionCard org={org} onAction={(a) => run(a)} busy={action.isLoading} />
        <CompanyCard key={org.name} org={org} />
      </div>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Plans</h2>
          <CycleToggle value={shownCycle} onChange={setCycle} />
        </div>
        <PricingPlans cycle={shownCycle} selected={org.plan} renderAction={planAction} />
      </div>
    </>
  );
};

export default BillingPage;
