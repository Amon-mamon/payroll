import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Clock,
  Landmark,
  Menu,
  ReceiptText,
  ShieldCheck,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CycleToggle, PricingPlans } from "@/components/saas/PricingPlans";
import { useAuthStore } from "@/features/auth/store/authStore";
import { cn } from "@/lib/utils";
import type { BillingCycle } from "@/types";
import { ProductPreview } from "./components/ProductPreview";

const NAV = [
  { href: "#features", label: "Features" },
  { href: "#roles", label: "Roles" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

const FEATURES = [
  { icon: Clock, title: "Web time clock", text: "Employees time in and out from any browser. Late arrivals are flagged against each person's own shift and grace period." },
  { icon: CalendarDays, title: "Leave management", text: "Standard PH leave types out of the box. Balances are tracked per year and approvals update attendance automatically." },
  { icon: ReceiptText, title: "Semi-monthly payroll", text: "Compute a cut-off in one click: basic pay, absences, overtime and government deductions, ready for review." },
  { icon: UserCog, title: "Three clear roles", text: "Admins, HR and employees each get their own workspace, with exactly the access they need and nothing more." },
  { icon: Building2, title: "Your company, isolated", text: "Every subscription is its own workspace. Your people, schedules and salaries are never visible to other companies." },
  { icon: Landmark, title: "Built for the Philippines", text: "Peso amounts, SSS, PhilHealth, Pag-IBIG and withholding tax lines on every payslip." },
];

const ROLES = [
  { icon: Users, title: "Employees", points: ["Time in and time out", "See their own attendance", "File and track leave", "View every payslip"] },
  { icon: UserCog, title: "HR", points: ["Create employee accounts", "Manage schedules and profiles", "Approve leave, fix attendance", "Prepare and compute payroll"] },
  { icon: ShieldCheck, title: "Admins", points: ["Everything HR can do, company-wide", "Create HR and employee accounts", "Approve and release payroll", "Manage the subscription"] },
];

const STEPS = [
  { title: "Subscribe", text: "Pick a plan and create your company. Your 14-day free trial starts immediately." },
  { title: "Add your team", text: "Create HR and employee accounts with their schedules and salaries." },
  { title: "Run payroll", text: "Attendance and leave flow into each cut-off. Review, approve, done." },
];

const FAQ = [
  { q: "Do I need a credit card to start?", a: "No. Every plan starts with a 14-day free trial. Activate the subscription from Billing whenever you're ready." },
  { q: "Can several people from my company use it?", a: "Yes. The admin who subscribes can create HR and employee accounts, and HR can create employee accounts. Each person signs in with their own email." },
  { q: "Is our data separate from other companies?", a: "Yes. Each subscription is a separate workspace. Users only ever see records from their own company." },
  { q: "What happens if we outgrow our plan?", a: "Plans are sized by active employees. Upgrade from the Billing page at any time; the new limit applies immediately." },
  { q: "What if the subscription lapses?", a: "Your data stays put. Team members can't use the app until an admin renews, and admins can always reach the Billing page to do so." },
];

const LandingPage = () => {
  const isAuthenticated = useAuthStore((s) => s.is_authenticated);
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="landing min-h-svh bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="brand-mark">F</span> Flowify Payroll
          </Link>
          <nav className="hidden flex-1 items-center gap-6 text-sm text-muted-foreground md:flex">
            {NAV.map((n) => <a key={n.href} href={n.href} className="hover:text-foreground">{n.label}</a>)}
          </nav>
          <div className="ml-auto hidden items-center gap-2 md:flex">
            {isAuthenticated ? (
              <Button render={<Link to="/dashboard" />}>Open app <ArrowRight /></Button>
            ) : (
              <>
                <Button variant="ghost" render={<Link to="/login" />}>Sign in</Button>
                <Button render={<Link to="/signup" />}>Start free trial</Button>
              </>
            )}
          </div>
          <Button variant="ghost" size="icon" className="ml-auto md:hidden" aria-label="Menu" onClick={() => setMenuOpen((o) => !o)}>
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </div>
        {menuOpen && (
          <div className="border-t px-4 py-3 md:hidden">
            <nav className="grid gap-1 text-sm">
              {NAV.map((n) => <a key={n.href} href={n.href} className="rounded-md px-2 py-2 hover:bg-muted" onClick={() => setMenuOpen(false)}>{n.label}</a>)}
            </nav>
            <div className="mt-3 grid gap-2">
              {isAuthenticated ? (
                <Button render={<Link to="/dashboard" />}>Open app</Button>
              ) : (
                <>
                  <Button variant="outline" render={<Link to="/login" />}>Sign in</Button>
                  <Button render={<Link to="/signup" />}>Start free trial</Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="hero-bg">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:py-24 lg:grid-cols-2">
          <div className="space-y-6">
            <span className="eyebrow">Attendance · Leave · Payroll</span>
            <h1 className="text-4xl leading-[1.1] font-bold tracking-tight md:text-5xl">
              Payroll your whole team can run from one place.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Flowify connects the time clock, leave requests and semi-monthly payroll for Philippine companies.
              Subscribe once, then give every employee, HR officer and admin their own login.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="h-11 px-5" render={<Link to="/signup" />}>Start 14-day free trial <ArrowRight /></Button>
              <Button size="lg" variant="outline" className="h-11 px-5" render={<a href="#pricing" />}>See pricing</Button>
            </div>
            <p className="text-sm text-muted-foreground">No credit card required · Cancel anytime</p>
          </div>
          <ProductPreview />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl space-y-3 text-center">
            <span className="eyebrow">Features</span>
            <h2 className="text-3xl font-bold tracking-tight">Everything between "time in" and "payday"</h2>
            <p className="text-muted-foreground">Attendance feeds leave, and both feed payroll, so nobody re-types anything.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="feature-card">
                <span className="feature-icon"><Icon className="size-5" /></span>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="scroll-mt-20 border-y bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl space-y-3 text-center">
            <span className="eyebrow">One subscription, every role</span>
            <h2 className="text-3xl font-bold tracking-tight">A workspace for each person in your company</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {ROLES.map(({ icon: Icon, title, points }) => (
              <div key={title} className="rounded-2xl border bg-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <span className="feature-icon"><Icon className="size-5" /></span>
                  <h3 className="text-lg font-semibold">{title}</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {points.map((p) => <li key={p} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />{p}</li>)}
                </ul>
              </div>
            ))}
          </div>

          <ol className="mt-16 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="step-number">{i + 1}</span>
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl space-y-3 text-center">
            <span className="eyebrow">Pricing</span>
            <h2 className="text-3xl font-bold tracking-tight">Simple plans, sized by headcount</h2>
            <p className="text-muted-foreground">Every plan includes all three roles and a 14-day free trial.</p>
          </div>
          <div className="mt-8 flex justify-center"><CycleToggle value={cycle} onChange={setCycle} /></div>
          <div className="mt-10">
            <PricingPlans
              cycle={cycle}
              renderAction={(plan) => (
                <Button
                  size="lg"
                  variant={plan.highlight ? "default" : "outline"}
                  className="w-full"
                  render={<Link to={`/signup?plan=${plan.code}&cycle=${cycle}`} />}
                >
                  Start free trial
                </Button>
              )}
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 border-t bg-muted/40 py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">Questions</h2>
          <div className="space-y-3">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="faq-item">
                <summary>{q}</summary>
                <p className="mt-2 text-sm text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="cta-band mx-auto max-w-5xl px-6 py-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Run your next cut-off on Flowify</h2>
          <p className="mx-auto mt-3 max-w-xl opacity-90">Set up your company in a few minutes. Your team can be clocking in today.</p>
          <Button size="lg" variant="secondary" className="mt-6 h-11 px-6" render={<Link to="/signup" />}>Start free trial <ArrowRight /></Button>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className={cn("mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground sm:flex-row")}>
          <span className="flex items-center gap-2"><span className="brand-mark size-6 text-xs">F</span> © {new Date().getFullYear()} Flowify Payroll</span>
          <div className="flex gap-5">
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <Link to="/login" className="hover:text-foreground">Sign in</Link>
            <Link to="/signup" className="hover:text-foreground">Start free trial</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
