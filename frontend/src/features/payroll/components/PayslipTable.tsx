import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableStatusRow } from "@/components/common/States";
import { formatDate, formatMoney } from "@/lib/format";
import type { Payslip } from "@/types";

export const PayslipTable = ({
  rows,
  isLoading,
  error,
  mode,
  onOpen,
}: {
  rows: Payslip[];
  isLoading: boolean;
  error?: unknown;
  mode: "mine" | "run";
  onOpen: (p: Payslip) => void;
}) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>{mode === "mine" ? "Pay period" : "Employee"}</TableHead>
        <TableHead className="text-right">Days absent</TableHead>
        <TableHead className="text-right">Gross</TableHead>
        <TableHead className="text-right">Deductions</TableHead>
        <TableHead className="text-right">Net pay</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableStatusRow
        colSpan={5}
        isLoading={isLoading}
        error={error}
        isEmpty={rows.length === 0}
        emptyTitle={mode === "mine" ? "No payslips yet" : "No payslips computed"}
        emptyDescription={mode === "mine" ? "Payslips appear once a payroll run is approved." : "Click “Compute” to generate payslips for this period."}
      />
      {rows.map((p) => (
        <TableRow key={p.id} className="cursor-pointer" onClick={() => onOpen(p)}>
          <TableCell>
            {mode === "mine" ? (
              <span className="font-medium">{formatDate(p.period_start)} – {formatDate(p.period_end)}</span>
            ) : (
              <>
                <div className="font-medium">{p.employee_name}</div>
                <div className="text-xs text-muted-foreground">{p.employee_no} · {p.department}</div>
              </>
            )}
          </TableCell>
          <TableCell className="text-right tabular-nums">{Number(p.days_absent)}</TableCell>
          <TableCell className="text-right tabular-nums">{formatMoney(p.gross_pay)}</TableCell>
          <TableCell className="text-right tabular-nums text-muted-foreground">{formatMoney(p.total_deductions)}</TableCell>
          <TableCell className="text-right font-semibold tabular-nums">{formatMoney(p.net_pay)}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);
