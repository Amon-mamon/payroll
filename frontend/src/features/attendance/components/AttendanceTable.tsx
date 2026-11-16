import type { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TableStatusRow } from "@/components/common/States";
import { formatDate, formatHours, formatTime } from "@/lib/format";
import type { Attendance } from "@/types";

export const AttendanceTable = ({
  rows,
  isLoading,
  error,
  showEmployee = false,
  actions,
}: {
  rows: Attendance[];
  isLoading: boolean;
  error?: unknown;
  showEmployee?: boolean;
  actions?: (row: Attendance) => ReactNode;
}) => {
  const cols = 6 + (showEmployee ? 1 : 0) + (actions ? 1 : 0);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          {showEmployee && <TableHead>Employee</TableHead>}
          <TableHead>Time in</TableHead>
          <TableHead>Time out</TableHead>
          <TableHead className="text-right">Regular</TableHead>
          <TableHead className="text-right">Overtime</TableHead>
          <TableHead>Status</TableHead>
          {actions && <TableHead className="w-0" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableStatusRow
          colSpan={cols}
          isLoading={isLoading}
          error={error}
          isEmpty={rows.length === 0}
          emptyTitle="No attendance records"
          emptyDescription="Records appear here once time is logged."
        />
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-medium">
              {formatDate(r.date, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </TableCell>
            {showEmployee && (
              <TableCell>
                <div className="font-medium">{r.full_name}</div>
                <div className="text-xs text-muted-foreground">{r.employee_no} · {r.department}</div>
              </TableCell>
            )}
            <TableCell>{formatTime(r.time_in)}</TableCell>
            <TableCell>{formatTime(r.time_out)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatHours(r.worked_hours)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatHours(r.overtime_hours)}</TableCell>
            <TableCell><StatusBadge status={r.status} /></TableCell>
            {actions && <TableCell>{actions(r)}</TableCell>}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
