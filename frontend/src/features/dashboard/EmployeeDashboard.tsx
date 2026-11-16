import { Link } from "react-router-dom";
import { CalendarDays, Clock, Hourglass, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/common/StatCard";
import { formatDate, formatMoney, toISODate } from "@/lib/format";
import { ClockCard } from "@/features/attendance/components/ClockCard";
import { AttendanceTable } from "@/features/attendance/components/AttendanceTable";
import { useAttendanceList } from "@/features/attendance/api";
import { useLeaveBalances, useLeaveRequests } from "@/features/leaves/api";
import { usePayslips } from "@/features/payroll/api";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

export const EmployeeDashboard = () => {
  const { hasEmployeeProfile } = useCurrentUser();
  const now = new Date();
  const monthStart = toISODate(new Date(now.getFullYear(), now.getMonth(), 1));

  const month = useAttendanceList({ mine: true, date__gte: monthStart, page_size: 100 });
  const recent = useAttendanceList({ mine: true, page_size: 5, ordering: "-date" });
  const balances = useLeaveBalances({ mine: true, year: now.getFullYear(), page_size: 50 });
  const pending = useLeaveRequests({ mine: true, status: "pending", page_size: 1 });
  const payslip = usePayslips({ mine: true, page_size: 1 });

  const vacation = balances.data?.results.find((b) => b.leave_type_code === "VL");
  const sick = balances.data?.results.find((b) => b.leave_type_code === "SL");
  const latest = payslip.data?.results[0];

  return (
    <>
      <ClockCard />
      {hasEmployeeProfile && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Days present this month"
              value={month.data?.results.filter((r) => r.time_in).length ?? 0}
              hint={`${month.data?.results.filter((r) => r.status === "late").length ?? 0} late`}
              icon={Clock}
              loading={month.isInitialLoading}
            />
            <StatCard
              label="Vacation leave left"
              value={vacation ? `${Number(vacation.remaining)} days` : "—"}
              hint={sick ? `Sick leave: ${Number(sick.remaining)} days` : undefined}
              icon={CalendarDays}
              tone="info"
              loading={balances.isInitialLoading}
            />
            <StatCard label="Pending leave requests" value={pending.data?.count ?? 0} icon={Hourglass} tone="warning" loading={pending.isInitialLoading} />
            <StatCard
              label="Latest net pay"
              value={latest ? formatMoney(latest.net_pay) : "—"}
              hint={latest ? `${formatDate(latest.period_start)} – ${formatDate(latest.period_end)}` : "No payslips yet"}
              icon={Wallet}
              tone="neutral"
              loading={payslip.isInitialLoading}
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Recent attendance</CardTitle>
              <CardAction>
                <Button variant="ghost" size="sm" render={<Link to="/attendance" />}>View all</Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <AttendanceTable rows={recent.data?.results ?? []} isLoading={recent.isInitialLoading} error={recent.error} />
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
};
