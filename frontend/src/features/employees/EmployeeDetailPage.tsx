import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorState } from "@/components/common/States";
import { Pager } from "@/components/common/Pager";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate, formatMoney, formatTime, formatWorkDays, initials } from "@/lib/format";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { AttendanceTable } from "@/features/attendance/components/AttendanceTable";
import { useAttendanceList } from "@/features/attendance/api";
import { LeaveTable } from "@/features/leaves/components/LeaveTable";
import { useLeaveRequests } from "@/features/leaves/api";
import { PayslipTable } from "@/features/payroll/components/PayslipTable";
import { PayslipDialog } from "@/features/payroll/components/PayslipDialog";
import { usePayslips } from "@/features/payroll/api";
import type { Employee, Payslip } from "@/types";
import { EmployeeFormDialog } from "./components/EmployeeFormDialog";
import { useEmployee } from "./api";

const Info = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="space-y-0.5">
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="text-sm font-medium">{value || "—"}</dd>
  </div>
);

const Overview = ({ e }: { e: Employee }) => (
  <div className="grid gap-4 lg:grid-cols-3">
    <Card>
      <CardHeader><CardTitle>Employment</CardTitle></CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-4">
          <Info label="Employee no." value={e.employee_no} />
          <Info label="Type" value={<span className="capitalize">{e.employment_type}</span>} />
          <Info label="Position" value={e.position} />
          <Info label="Department" value={e.department} />
          <Info label="Hire date" value={formatDate(e.hire_date)} />
          <Info label="Regularized" value={formatDate(e.regularization_date)} />
          <Info label="Monthly salary" value={formatMoney(e.basic_salary)} />
          <Info label="Daily rate" value={formatMoney(Number(e.basic_salary) / 22)} />
        </dl>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle>Schedule</CardTitle></CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-4">
          <Info label="Shift" value={`${formatTime(e.shift_start)} – ${formatTime(e.shift_end)}`} />
          <Info label="Grace period" value={`${e.grace_minutes} min`} />
          <div className="col-span-2"><Info label="Work days" value={formatWorkDays(e.work_days)} /></div>
        </dl>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle>Government IDs</CardTitle></CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-4">
          <Info label="SSS" value={e.sss_no} />
          <Info label="PhilHealth" value={e.philhealth_no} />
          <Info label="Pag-IBIG" value={e.pagibig_no} />
          <Info label="TIN" value={e.tin} />
          <div className="col-span-2"><Info label="Bank account" value={e.bank_account} /></div>
        </dl>
      </CardContent>
    </Card>
  </div>
);

const AttendanceTab = ({ id }: { id: string }) => {
  const [page, setPage] = useState(1);
  const { data, isInitialLoading, error } = useAttendanceList({ employee: id, page, page_size: 15, ordering: "-date" });
  return (
    <Card><CardContent>
      <AttendanceTable rows={data?.results ?? []} isLoading={isInitialLoading} error={error} />
      <Pager page={page} pageSize={15} count={data?.count ?? 0} onPageChange={setPage} />
    </CardContent></Card>
  );
};

const LeavesTab = ({ id }: { id: string }) => {
  const [page, setPage] = useState(1);
  const { data, isInitialLoading, error } = useLeaveRequests({ employee: id, page, page_size: 15, ordering: "-created_at" });
  return (
    <Card><CardContent>
      <LeaveTable rows={data?.results ?? []} isLoading={isInitialLoading} error={error} />
      <Pager page={page} pageSize={15} count={data?.count ?? 0} onPageChange={setPage} />
    </CardContent></Card>
  );
};

const PayslipsTab = ({ id }: { id: string }) => {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<Payslip | null>(null);
  const { data, isInitialLoading, error } = usePayslips({ employee: id, page, page_size: 15 });
  return (
    <Card><CardContent>
      <PayslipTable mode="mine" rows={data?.results ?? []} isLoading={isInitialLoading} error={error} onOpen={setOpen} />
      <Pager page={page} pageSize={15} count={data?.count ?? 0} onPageChange={setPage} />
      <PayslipDialog payslip={open} onClose={() => setOpen(null)} />
    </CardContent></Card>
  );
};

const EmployeeDetailPage = () => {
  const { id } = useParams();
  const { isAdmin } = useCurrentUser();
  const { data: e, isLoading, error } = useEmployee(id);
  const [editing, setEditing] = useState(false);

  if (error) return <ErrorState error={error} />;

  return (
    <>
      <Link to="/manage/employees" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All employees
      </Link>

      {isLoading || !e ? (
        <Skeleton className="h-20 w-full" />
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="size-14 text-lg">
              <AvatarFallback>{initials(e.full_name)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{e.full_name}</h1>
                <StatusBadge status={e.role} />
                {!e.is_active && <StatusBadge status="inactive" />}
              </div>
              <p className="text-sm text-muted-foreground">{e.position} · {e.department} · {e.email}</p>
            </div>
          </div>
          {(isAdmin || e.role === "employee") && (
            <Button variant="outline" onClick={() => setEditing(true)}><Pencil /> Edit</Button>
          )}
        </div>
      )}

      {e && (
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="leaves">Leaves</TabsTrigger>
            <TabsTrigger value="payslips">Payslips</TabsTrigger>
          </TabsList>
          <TabsContent value="overview"><Overview e={e} /></TabsContent>
          <TabsContent value="attendance"><AttendanceTab id={e.id} /></TabsContent>
          <TabsContent value="leaves"><LeavesTab id={e.id} /></TabsContent>
          <TabsContent value="payslips"><PayslipsTab id={e.id} /></TabsContent>
        </Tabs>
      )}

      {editing && e && <EmployeeFormDialog open={editing} onOpenChange={setEditing} employee={e} />}
    </>
  );
};

export default EmployeeDetailPage;
