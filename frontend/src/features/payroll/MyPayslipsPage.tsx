import { useState } from "react";
import { Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { Pager } from "@/components/common/Pager";
import { StatCard } from "@/components/common/StatCard";
import { formatDate, formatMoney } from "@/lib/format";
import type { Payslip } from "@/types";
import { PayslipDialog } from "./components/PayslipDialog";
import { PayslipTable } from "./components/PayslipTable";
import { usePayslips } from "./api";

const PAGE_SIZE = 12;

const MyPayslipsPage = () => {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<Payslip | null>(null);
  const { data, isInitialLoading, error } = usePayslips({ mine: true, page, page_size: PAGE_SIZE });
  const latest = page === 1 ? data?.results[0] : undefined;

  return (
    <>
      <PageHeader title="My payslips" description="Your pay for every approved payroll period." />
      {latest && (
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="Latest net pay" value={formatMoney(latest.net_pay)} hint={`${formatDate(latest.period_start)} – ${formatDate(latest.period_end)}`} icon={Wallet} />
          <StatCard label="Latest gross pay" value={formatMoney(latest.gross_pay)} hint={`Deductions ${formatMoney(latest.total_deductions)}`} icon={Wallet} tone="info" />
        </div>
      )}
      <Card>
        <CardHeader><CardTitle>Payslip history</CardTitle></CardHeader>
        <CardContent>
          <PayslipTable mode="mine" rows={data?.results ?? []} isLoading={isInitialLoading} error={error} onOpen={setOpen} />
          <Pager page={page} pageSize={PAGE_SIZE} count={data?.count ?? 0} onPageChange={setPage} />
        </CardContent>
      </Card>
      <PayslipDialog payslip={open} onClose={() => setOpen(null)} />
    </>
  );
};

export default MyPayslipsPage;
