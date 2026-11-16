import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck, Calculator, Banknote, Loader2, Search, Trash2, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/common/PageHeader";
import { Pager } from "@/components/common/Pager";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ErrorState } from "@/components/common/States";
import { formatDate, formatMoney } from "@/lib/format";
import { notify } from "@/lib/toast";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import type { Payslip } from "@/types";
import { PayslipDialog } from "./components/PayslipDialog";
import { PayslipTable } from "./components/PayslipTable";
import { useDeleteRun, usePayrollRun, usePayslips, useRunAction } from "./api";

const PAGE_SIZE = 20;

const PayrollRunDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<Payslip | null>(null);

  const run = usePayrollRun(id);
  const payslips = usePayslips({ payroll_run: id, page, page_size: PAGE_SIZE, search }, Boolean(id));
  const action = useRunAction();
  const remove = useDeleteRun();

  if (run.error) return <ErrorState error={run.error} />;
  const r = run.data;

  const doAction = (act: "compute" | "approve" | "mark_paid") =>
    action.mutate(
      { id: id!, action: act },
      { onSuccess: (res) => notify.success(res.detail), onError: (e) => notify.error(e) },
    );

  const onDelete = () => {
    if (!window.confirm("Delete this draft payroll run and its payslips?")) return;
    remove.mutate(id!, {
      onSuccess: () => { notify.success("Payroll run deleted"); navigate("/manage/payroll"); },
      onError: (e) => notify.error(e),
    });
  };

  return (
    <>
      <Link to="/manage/payroll" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All payroll runs
      </Link>
      <PageHeader
        title={r ? `${formatDate(r.period_start)} – ${formatDate(r.period_end)}` : "Payroll run"}
        description={r ? `Prepared by ${r.created_by_name ?? "—"}${r.approved_by_name ? ` · approved by ${r.approved_by_name}` : ""}` : undefined}
        actions={
          r && (
            <>
              <StatusBadge status={r.status} />
              {r.status === "draft" && (
                <>
                  <Button variant="ghost" onClick={onDelete} disabled={remove.isLoading}><Trash2 /> Delete</Button>
                  <Button variant="outline" onClick={() => doAction("compute")} disabled={action.isLoading}>
                    {action.isLoading ? <Loader2 className="animate-spin" /> : <Calculator />}
                    {r.payslip_count ? "Recompute" : "Compute"}
                  </Button>
                  {isAdmin && (
                    <Button onClick={() => doAction("approve")} disabled={action.isLoading || !r.payslip_count}>
                      <BadgeCheck /> Approve
                    </Button>
                  )}
                </>
              )}
              {r.status === "approved" && isAdmin && (
                <Button onClick={() => doAction("mark_paid")} disabled={action.isLoading}>
                  <Banknote /> Mark as paid
                </Button>
              )}
            </>
          )
        }
      />
      {r?.status === "draft" && !isAdmin && (
        <p className="-mt-3 text-sm text-muted-foreground">Employees will see their payslips once an administrator approves this run.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Payslips" value={r?.payslip_count ?? 0} icon={Users} tone="info" loading={run.isLoading} />
        <StatCard label="Total gross" value={formatMoney(r?.total_gross ?? 0)} icon={Wallet} tone="neutral" loading={run.isLoading} />
        <StatCard label="Total net pay" value={formatMoney(r?.total_net ?? 0)} icon={Banknote} loading={run.isLoading} />
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search employee" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <PayslipTable mode="run" rows={payslips.data?.results ?? []} isLoading={payslips.isInitialLoading} error={payslips.error} onOpen={setOpen} />
          <Pager page={page} pageSize={PAGE_SIZE} count={payslips.data?.count ?? 0} onPageChange={setPage} />
        </CardContent>
      </Card>
      <PayslipDialog payslip={open} onClose={() => setOpen(null)} />
    </>
  );
};

export default PayrollRunDetailPage;
