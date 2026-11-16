import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Check, Loader2, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { FormField } from "@/components/custom/formfield";
import { CycleToggle, planPrice } from "@/components/saas/PricingPlans";
import api from "@/lib/api";
import { getErrorMessage, getFieldErrors } from "@/lib/errors";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/features/auth/store/authStore";
import type { User } from "@/features/auth/types/auth";
import { usePlans } from "@/features/billing/api";
import type { BillingCycle, PlanCode } from "@/types";

const schema = z.object({
  company_name: z.string().trim().min(2, "Enter your company name"),
  first_name: z.string().trim().min(1, "Required"),
  last_name: z.string().trim().min(1, "Required"),
  position: z.string().trim().optional(),
  email: z.email("Enter a valid work email"),
  password: z.string().min(8, "At least 8 characters"),
});
type FormValues = z.infer<typeof schema>;

const isPlan = (v: string | null): v is PlanCode => v === "starter" || v === "growth" || v === "business";

const SignupPage = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const [plan, setPlan] = useState<PlanCode>(isPlan(params.get("plan")) ? (params.get("plan") as PlanCode) : "growth");
  const [cycle, setCycle] = useState<BillingCycle>(params.get("cycle") === "yearly" ? "yearly" : "monthly");
  const plans = usePlans();
  const selected = plans.data?.find((p) => p.code === plan);

  const { register, handleSubmit, setError, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { company_name: "", first_name: "", last_name: "", position: "", email: "", password: "" },
  });

  const signup = useMutation({
    mutationFn: async (values: FormValues) =>
      (await api.post<{ access: string; user: User }>("signup/", { ...values, plan, billing_cycle: cycle })).data,
    onSuccess: (data) => {
      qc.clear();
      try {
        sessionStorage.setItem("flowify-welcome", "1");
      } catch {
        /* storage unavailable: the welcome card is optional */
      }
      useAuthStore.getState().set_auth(data.access, data.user);
      navigate("/dashboard", { replace: true });
    },
    onError: (err) => {
      const fields = getFieldErrors(err);
      let mapped = false;
      for (const [k, msg] of Object.entries(fields)) {
        if (k in schema.shape) {
          setError(k as keyof FormValues, { message: msg });
          mapped = true;
        }
      }
      setError("root", { message: mapped ? "Please fix the highlighted fields." : getErrorMessage(err) });
    },
  });

  return (
    <div className="grid min-h-svh lg:grid-cols-[1fr_1.1fr]">
      {/* Plan summary */}
      <aside className="auth-hero flex flex-col gap-8 p-6 md:p-10">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold">
          <span className="brand-mark">F</span> Flowify Payroll
        </Link>
        <div className="max-w-md space-y-6">
          <div>
            <h1 className="text-3xl leading-tight font-bold">Start your 14-day free trial</h1>
            <p className="mt-2 text-sm opacity-90">No credit card needed. You'll be the administrator of your company's workspace.</p>
          </div>

          <div className="space-y-3">
            <CycleToggle value={cycle} onChange={setCycle} />
            <div className="grid gap-2" role="radiogroup" aria-label="Plan">
              {plans.isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-16 bg-white/20" />)}
              {plans.data?.map((p) => (
                <button
                  key={p.code}
                  type="button"
                  role="radio"
                  aria-checked={plan === p.code}
                  onClick={() => setPlan(p.code)}
                  className={cn("plan-option", plan === p.code && "is-on")}
                >
                  <span className="plan-option-dot">{plan === p.code && <Check className="size-3" />}</span>
                  <span className="flex-1 text-left">
                    <span className="block font-semibold">{p.name}</span>
                    <span className="block text-xs opacity-80">Up to {p.max_employees} employees</span>
                  </span>
                  <span className="text-right">
                    <span className="block font-semibold">{formatMoney(planPrice(p, cycle))}</span>
                    <span className="block text-xs opacity-80">per month</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {selected && (
            <ul className="space-y-2 text-sm">
              {selected.features.map((f) => (
                <li key={f} className="flex gap-2 opacity-90"><Check className="mt-0.5 size-4 shrink-0" /> {f}</li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Account form */}
      <main className="flex items-center justify-center p-6">
        <form onSubmit={handleSubmit((v) => signup.mutate(v))} className="w-full max-w-md space-y-5" noValidate>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Create your company</h2>
            <p className="text-sm text-muted-foreground">
              Already subscribed? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </div>

          <FormField label="Company name" icon={Building2} placeholder="Acme Trading Inc." {...register("company_name")} error={errors.company_name?.message} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="First name" autoComplete="given-name" {...register("first_name")} error={errors.first_name?.message} />
            <FormField label="Last name" autoComplete="family-name" {...register("last_name")} error={errors.last_name?.message} />
          </div>
          <FormField label="Your position" placeholder="e.g. Owner, HR Manager (optional)" {...register("position")} error={errors.position?.message} />
          <FormField label="Work email" type="email" icon={Mail} autoComplete="email" placeholder="you@company.com" {...register("email")} error={errors.email?.message} />
          <FormField label="Password" type="password" icon={LockKeyhole} autoComplete="new-password" placeholder="At least 8 characters" {...register("password")} error={errors.password?.message} />

          {errors.root && (
            <Alert variant="destructive"><AlertDescription>{errors.root.message}</AlertDescription></Alert>
          )}

          <Button type="submit" size="lg" className="h-11 w-full" disabled={signup.isLoading || !selected}>
            {signup.isLoading && <Loader2 className="animate-spin" />}
            Start free trial{selected ? ` of ${selected.name}` : ""}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            After the trial, {selected ? `${formatMoney(planPrice(selected, cycle))}/month${cycle === "yearly" ? ", billed yearly" : ""}` : "your plan's price applies"} when you activate. You can change plans anytime.
          </p>
        </form>
      </main>
    </div>
  );
};

export default SignupPage;
