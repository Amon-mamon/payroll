import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, MoreHorizontal, Pencil, Search, UserMinus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/common/PageHeader";
import { Pager } from "@/components/common/Pager";
import { AppSelect } from "@/components/common/AppSelect";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TableStatusRow } from "@/components/common/States";
import { formatMoney, formatTime, formatWorkDays, initials } from "@/lib/format";
import { notify } from "@/lib/toast";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import type { Employee } from "@/types";
import { EmployeeFormDialog } from "./components/EmployeeFormDialog";
import { useDeleteEmployee, useDepartments, useEmployees } from "./api";

const PAGE_SIZE = 15;

const EmployeesPage = () => {
  const { user, isAdmin } = useCurrentUser();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [role, setRole] = useState("all");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<{ open: boolean; employee: Employee | null }>({ open: false, employee: null });
  const departments = useDepartments();
  const remove = useDeleteEmployee();

  const { data, isInitialLoading, error } = useEmployees({
    search,
    department: department === "all" ? undefined : department,
    user__role: role === "all" ? undefined : role,
    page,
    page_size: PAGE_SIZE,
  });

  // HR can manage regular employees only; nobody edits their own record here except admins.
  const canManage = (e: Employee) => isAdmin || e.role === "employee";
  const canRemove = (e: Employee) => canManage(e) && e.user_id !== user?.id;

  const onRemove = (e: Employee) => {
    if (!window.confirm(`Deactivate ${e.full_name}? They will no longer be able to sign in.`)) return;
    remove.mutate(e.id, {
      onSuccess: () => notify.success("Employee deactivated", e.full_name),
      onError: (err) => notify.error(err),
    });
  };

  return (
    <>
      <PageHeader
        title="Employees"
        description={isAdmin ? "Every profile in the company, including HR staff." : "Employee profiles, schedules and pay details."}
        actions={
          <Button onClick={() => setForm({ open: true, employee: null })}>
            <UserPlus /> {isAdmin ? "Create account" : "Add employee"}
          </Button>
        }
      />
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search name, email, position or employee no." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <AppSelect
              className="md:w-48"
              value={department}
              onChange={(v) => { setDepartment(v); setPage(1); }}
              options={[{ value: "all", label: "All departments" }, ...(departments.data ?? []).map((d) => ({ value: d, label: d }))]}
            />
            {isAdmin && (
              <AppSelect
                className="md:w-40"
                value={role}
                onChange={(v) => { setRole(v); setPage(1); }}
                options={[
                  { value: "all", label: "All roles" },
                  { value: "employee", label: "Employees" },
                  { value: "hr", label: "HR" },
                  { value: "admin", label: "Admins" },
                ]}
              />
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead className="text-right">Monthly salary</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableStatusRow colSpan={6} isLoading={isInitialLoading} error={error} isEmpty={!data?.results.length} emptyTitle="No employees found" emptyDescription="Try a different search, or create the first account." />
              {data?.results.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <Link to={`/manage/employees/${e.id}`} className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback>{initials(e.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate font-medium hover:underline">{e.full_name}</div>
                        <div className="truncate text-xs text-muted-foreground">{e.employee_no} · {e.email}</div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div>{e.position}</div>
                    <div className="text-xs text-muted-foreground">{e.department}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{formatTime(e.shift_start)} – {formatTime(e.shift_end)}</div>
                    <div className="text-xs text-muted-foreground">{formatWorkDays(e.work_days)}</div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(e.basic_salary)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <StatusBadge status={e.role} />
                      {!e.is_active && <StatusBadge status="inactive" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Actions" />}>
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem render={<Link to={`/manage/employees/${e.id}`} />}>
                          <Eye /> View details
                        </DropdownMenuItem>
                        {canManage(e) && (
                          <DropdownMenuItem onClick={() => setForm({ open: true, employee: e })}>
                            <Pencil /> Edit
                          </DropdownMenuItem>
                        )}
                        {canRemove(e) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => onRemove(e)}>
                              <UserMinus /> Deactivate
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pager page={page} pageSize={PAGE_SIZE} count={data?.count ?? 0} onPageChange={setPage} />
        </CardContent>
      </Card>
      {form.open && (
        <EmployeeFormDialog
          key={form.employee?.id ?? "new"}
          open={form.open}
          onOpenChange={(open) => setForm((f) => ({ ...f, open }))}
          employee={form.employee}
        />
      )}
    </>
  );
};

export default EmployeesPage;
