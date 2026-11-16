import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate, formatMoney } from "@/lib/format";
import type { Payslip } from "@/types";

const Row = ({ label, value, negative, strong }: { label: string; value: string; negative?: boolean; strong?: boolean }) => (
  <div className={`flex justify-between py-1 ${strong ? "font-semibold" : ""}`}>
    <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
    <span className="tabular-nums">{negative && Number(value) > 0 ? "−" : ""}{formatMoney(value)}</span>
  </div>
);

export const PayslipDialog = ({ payslip, onClose }: { payslip: Payslip | null; onClose: () => void }) => (
  <Dialog open={Boolean(payslip)} onOpenChange={(o) => !o && onClose()}>
    <DialogContent className="sm:max-w-lg">
      {payslip && (
        <>
          <DialogHeader>
            <DialogTitle>Payslip</DialogTitle>
            <DialogDescription>
              {formatDate(payslip.period_start)} – {formatDate(payslip.period_end)}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start justify-between gap-4 rounded-lg bg-muted p-3 text-sm">
            <div>
              <div className="font-semibold">{payslip.employee_name}</div>
              <div className="text-muted-foreground">{payslip.employee_no} · {payslip.position}, {payslip.department}</div>
            </div>
            <StatusBadge status={payslip.run_status} />
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {[
              ["Present", payslip.days_present],
              ["On leave", payslip.days_on_leave],
              ["Absent", payslip.days_absent],
              ["OT hours", payslip.overtime_hours],
            ].map(([l, v]) => (
              <div key={l} className="rounded-md border p-2">
                <div className="text-base font-semibold tabular-nums">{Number(v)}</div>
                <div className="text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>

          <div className="text-sm">
            <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Earnings</p>
            <Row label="Basic pay (semi-monthly)" value={payslip.basic_pay} />
            <Row label="Absences" value={payslip.absence_deduction} negative />
            <Row label="Overtime pay" value={payslip.overtime_pay} />
            <Row label="Gross pay" value={payslip.gross_pay} strong />
            <Separator className="my-2" />
            <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Deductions</p>
            <Row label="SSS" value={payslip.sss_deduction} negative />
            <Row label="PhilHealth" value={payslip.philhealth_deduction} negative />
            <Row label="Pag-IBIG" value={payslip.pagibig_deduction} negative />
            <Row label="Withholding tax" value={payslip.tax_deduction} negative />
            <Row label="Total deductions" value={payslip.total_deductions} strong />
          </div>

          <div className="net-pay flex items-center justify-between rounded-lg p-4">
            <span className="font-medium">Net pay</span>
            <span className="text-2xl font-bold tabular-nums">{formatMoney(payslip.net_pay)}</span>
          </div>
        </>
      )}
    </DialogContent>
  </Dialog>
);
