import type { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TableStatusRow } from "@/components/common/States";
import { formatDate } from "@/lib/format";
import type { LeaveRequest } from "@/types";

export const LeaveTable = ({
  rows,
  isLoading,
  error,
  showEmployee,
  actions,
  emptyTitle = "No leave requests",
}: {
  rows: LeaveRequest[];
  isLoading: boolean;
  error?: unknown;
  showEmployee?: boolean;
  actions?: (row: LeaveRequest) => ReactNode;
  emptyTitle?: string;
}) => (
  <Table>
    <TableHeader>
      <TableRow>
        {showEmployee && <TableHead>Employee</TableHead>}
        <TableHead>Type</TableHead>
        <TableHead>Dates</TableHead>
        <TableHead className="text-right">Days</TableHead>
        <TableHead>Reason</TableHead>
        <TableHead>Status</TableHead>
        {actions && <TableHead className="text-right">Actions</TableHead>}
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableStatusRow
        colSpan={5 + (showEmployee ? 1 : 0) + (actions ? 1 : 0)}
        isLoading={isLoading}
        error={error}
        isEmpty={rows.length === 0}
        emptyTitle={emptyTitle}
      />
      {rows.map((r) => (
        <TableRow key={r.id}>
          {showEmployee && (
            <TableCell>
              <div className="font-medium">{r.employee_name}</div>
              <div className="text-xs text-muted-foreground">{r.employee_no}</div>
            </TableCell>
          )}
          <TableCell className="font-medium">{r.leave_type_name}</TableCell>
          <TableCell className="whitespace-nowrap">
            {formatDate(r.start_date)}
            {r.end_date !== r.start_date && <> – {formatDate(r.end_date)}</>}
          </TableCell>
          <TableCell className="text-right tabular-nums">{Number(r.days)}</TableCell>
          <TableCell className="max-w-56 truncate text-muted-foreground" title={r.reason}>{r.reason || "—"}</TableCell>
          <TableCell>
            <StatusBadge status={r.status} />
            {r.approved_by_name && r.status !== "pending" && (
              <div className="mt-1 text-xs text-muted-foreground">by {r.approved_by_name}</div>
            )}
          </TableCell>
          {actions && <TableCell className="text-right">{actions(r)}</TableCell>}
        </TableRow>
      ))}
    </TableBody>
  </Table>
);
