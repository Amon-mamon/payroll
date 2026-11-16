import { Link } from "react-router-dom";
import { AlarmClock, CalendarCheck, ClipboardList, Plane, ShieldCheck, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState, ErrorState } from "@/components/common/States";
import { formatDate, formatMoney, toISODate } from "@/lib/format";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { ClockCard } from "@/features/attendance/components/ClockCard";
import { AttendanceTable } from "@/features/attendance/components/AttendanceTable";
import { useAttendanceList } from "@/features/attendance/api";
import { LeaveTable } from "@/features/leaves/components/LeaveTable";
import { useLeaveRequests } from "@/features/leaves/api";
import { useDashboardStats } from "./api";

export const ManagerDashboard = () => {
  const { isAdmin, hasEmployeeProfile } = useCurrentUser();
  const stats = useDashboardStats(true);
  const today = toISODate(new Date());
  const todayAttendance = useAttendanceList({ date: today, page_size: 8, ordering: "-time_in" });
  const pending = useLeaveRequests({ status: "pending", page_size: 5, ordering: "start_date" });
  const s = stats.data;

  if (stats.error) return <ErrorState error={stats.error} />;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={isAdmin ? "Active employees" : "Employees you manage"} value={s?.employees_total ?? 0} icon={Users} tone="info" loading={stats.isLoading} />
        <StatCard
          label="Present today"
          value={s ? `${s.attendance_today.present} / ${s.employees_total}` : 0}
          hint={s ? `${s.attendance_today.clocked_out} clocked out` : undefined}
          icon={CalendarCheck}
          loading={stats.isLoading}
        />
        <StatCard label="Late today" value={s?.attendance_today.late ?? 0} hint={s ? `${s.attendance_today.on_leave} on leave` : undefined} icon={AlarmClock} tone="warning" loading={stats.isLoading} />
        <StatCard label="Pending leave requests" value={s?.pending_leaves ?? 0} icon={ClipboardList} tone="danger" loading={stats.isLoading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {hasEmployeeProfile ? <ClockCard /> : (
            <Card><CardContent><EmptyState icon={Plane} title="No personal time clock" description="Your account has no employee profile." /></CardContent></Card>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Latest payroll</CardTitle>
            <CardDescription>{s?.latest_payroll ? `${formatDate(s.latest_payroll.period_start)} – ${formatDate(s.latest_payroll.period_end)}` : "No runs yet"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {s?.latest_payroll ? (
              <>
                <div className="flex items-center justify-between">
                  <StatusBadge status={s.latest_payroll.status} />
                  <span className="text-sm text-muted-foreground">{s.latest_payroll.payslip_count} payslips</span>
                </div>
                <div className="text-3xl font-bold tabular-nums">{formatMoney(s.latest_payroll.total_net)}</div>
                <Button variant="outline" className="w-full" render={<Link to={`/manage/payroll/${s.latest_payroll.id}`} />}>
                  <Wallet /> Open payroll run
                </Button>
              </>
            ) : (
              <Button className="w-full" render={<Link to="/manage/payroll" />}>Start a payroll run</Button>
            )}
            {isAdmin && s?.accounts_by_role && (
              <div className="grid grid-cols-3 gap-2 border-t pt-3 text-center text-xs">
                {(["admin", "hr", "employee"] as const).map((r) => (
                  <div key={r}>
                    <div className="text-lg font-semibold">{s.accounts_by_role?.[r] ?? 0}</div>
                    <div className="text-muted-foreground capitalize">{r === "hr" ? "HR" : `${r}s`}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today's attendance</CardTitle>
            <CardAction><Button variant="ghost" size="sm" render={<Link to="/manage/attendance" />}>View all</Button></CardAction>
          </CardHeader>
          <CardContent>
            <AttendanceTable rows={todayAttendance.data?.results ?? []} isLoading={todayAttendance.isInitialLoading} error={todayAttendance.error} showEmployee />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Awaiting approval</CardTitle>
            <CardAction><Button variant="ghost" size="sm" render={<Link to="/manage/leaves" />}>Review</Button></CardAction>
          </CardHeader>
          <CardContent>
            <LeaveTable rows={pending.data?.results ?? []} isLoading={pending.isInitialLoading} error={pending.error} showEmployee emptyTitle="No pending requests" />
          </CardContent>
        </Card>
      </div>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="size-4" /> Administration</CardTitle>
            <CardDescription>Create HR and employee accounts, and review every login in the system.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button render={<Link to="/manage/employees" />}>Create account</Button>
            <Button variant="outline" render={<Link to="/admin/accounts" />}>Manage accounts</Button>
          </CardContent>
        </Card>
      )}
    </>
  );
};
