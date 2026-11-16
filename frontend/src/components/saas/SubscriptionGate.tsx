import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { CreditCard, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { formatDate } from "@/lib/format";

const BILLING_PATH = "/settings/billing";

/** Blocks the app when the company's subscription has lapsed (admins can still reach billing). */
export const SubscriptionGate = ({ children }: { children: ReactNode }) => {
  const { organization, isAdmin } = useCurrentUser();
  const { pathname } = useLocation();

  if (!organization || organization.has_access || (isAdmin && pathname === BILLING_PATH)) return <>{children}</>;

  return (
    <Card className="mx-auto mt-10 w-full max-w-lg">
      <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted"><Lock className="size-5" /></span>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{organization.name}'s subscription has ended</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "Renew the subscription to give your team access again. All your data is still here."
              : "Your company's administrator needs to renew the subscription. Your data is safe in the meantime."}
          </p>
        </div>
        {isAdmin && (
          <Button render={<Link to={BILLING_PATH} />}><CreditCard /> Go to billing</Button>
        )}
      </CardContent>
    </Card>
  );
};

/** Slim notice in the header area for trials and pending cancellations. */
export const SubscriptionBanner = () => {
  const { organization, isAdmin } = useCurrentUser();
  if (!organization?.has_access) return null;
  const { effective_status, access_ends_at } = organization;
  if (effective_status !== "trialing" && effective_status !== "cancelling") return null;

  const days = access_ends_at ? Math.max(0, Math.ceil((new Date(access_ends_at).getTime() - Date.now()) / 86_400_000)) : 0;
  const text =
    effective_status === "trialing"
      ? `${days} day${days === 1 ? "" : "s"} left in your free trial.`
      : `Your subscription ends on ${formatDate(access_ends_at)}.`;

  return (
    <div className="subscription-banner" data-state={effective_status}>
      <span>{text}</span>
      {isAdmin && (
        <Link to={BILLING_PATH} className="font-medium underline underline-offset-4">
          {effective_status === "trialing" ? "Activate now" : "Keep subscription"}
        </Link>
      )}
    </div>
  );
};
