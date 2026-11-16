import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CreditCard, PartyPopper, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { EmployeeDashboard } from "./EmployeeDashboard";
import { ManagerDashboard } from "./ManagerDashboard";

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

const GettingStarted = ({ company }: { company: string }) => (
  <Card className="welcome-card">
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><PartyPopper className="size-5" /> Welcome to Flowify, {company}!</CardTitle>
      <CardDescription>Your free trial has started. Three steps to your first payroll:</CardDescription>
    </CardHeader>
    <CardContent className="grid gap-3 md:grid-cols-3">
      {[
        { icon: UserPlus, title: "Add your HR team", text: "Create HR accounts so they can onboard employees.", to: "/manage/employees", cta: "Create accounts" },
        { icon: Users, title: "Onboard employees", text: "Set each person's salary, shift and work days.", to: "/manage/employees", cta: "Open employees" },
        { icon: CreditCard, title: "Activate your plan", text: "Keep access after the 14-day trial.", to: "/settings/billing", cta: "Billing" },
      ].map(({ icon: Icon, title, text, to, cta }, i) => (
        <div key={title} className="flex flex-col gap-2 rounded-lg border bg-background p-4">
          <span className="step-number size-7 text-xs">{i + 1}</span>
          <div className="flex items-center gap-2 font-medium"><Icon className="size-4" /> {title}</div>
          <p className="flex-1 text-sm text-muted-foreground">{text}</p>
          <Button variant="outline" size="sm" className="w-fit" render={<Link to={to} />}>{cta}</Button>
        </div>
      ))}
    </CardContent>
  </Card>
);

const WELCOME_KEY = "flowify-welcome";

// Pure read (StrictMode may run initializers twice); the flag is cleared in an effect.
const readWelcomeFlag = () => {
  try {
    return sessionStorage.getItem(WELCOME_KEY) === "1";
  } catch {
    return false;
  }
};

const DashboardPage = () => {
  const [welcome] = useState(readWelcomeFlag);
  useEffect(() => {
    try {
      sessionStorage.removeItem(WELCOME_KEY);
    } catch {
      /* ignore */
    }
  }, []);
  const { user, isManager, isAdmin, organization } = useCurrentUser();
  const firstName = user?.first_name || user?.full_name.split(" ")[0] || user?.username;

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description={
          isAdmin ? "Here's the whole company at a glance." : isManager ? "Here's how your team is doing today." : "Here's your day at a glance."
        }
      />
      {isAdmin && welcome && organization && <GettingStarted company={organization.name} />}
      {isManager ? <ManagerDashboard /> : <EmployeeDashboard />}
    </>
  );
};

export default DashboardPage;
