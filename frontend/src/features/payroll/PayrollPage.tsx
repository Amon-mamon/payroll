import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/common/PageHeader";
import { Pager } from "@/components/common/Pager";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TableStatusRow } from "@/components/common/States";
import { getErrorMessage } from "@/lib/errors";
import { formatDate, formatMoney, toISODate } from "@/lib/format";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useCreateRun, usePayrollRuns } from "./api";

const PAGE_SIZE = 15;

/** Default to the current semi-monthly cut-off (1–15 or 16–end of month). */
const currentCutoff = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth();
  return d.getDate() <= 15
    ? { period_start: toISODate(new Date(y, m, 1)), period_end: toISODate(new Date(y, m, 15)) }
    : { period_start: toISODate(new Date(y, m, 16)), period_end: toISODate(new Date(y, m + 1, 0)) };
};

const NewRunDialog = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(currentCutoff);
  const [error, setError] = useState<string | null>(null);
  const create = useCreateRun();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    create.mutate(form, {
      onSuccess: (run) => {
        setOpen(false);
        navigate(`/manage/payroll/${run.id}`);
      },
      onError: (err) => setError(getErrorMessage(err)),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus /> New payroll run
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>New payroll run</DialogTitle>
            <DialogDescription>Choose the pay period. You can compute and review before approval.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="run-start">Period start</Label>
              <Input id="run-start" type="date" required value={form.period_start} onChange={(e) => setForm((f) => ({ ...f, period_start: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="run-end">Period end</Label>
              <Input id="run-end" type="date" required min={form.period_start} value={form.period_end} onChange={(e) => setForm((f) => ({ ...f, period_end: e.target.value }))} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isLoading}>
              {create.isLoading && <Loader2 className="animate-spin" />} Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const PayrollPage = () => {
  const { isAdmin } = useCurrentUser();
  const [page, setPage] = useState(1);
  const { data, isInitialLoading, error } = usePayrollRuns({ page, page_size: PAGE_SIZE, ordering: "-period_start" });

  return (
    <>
      <PageHeader
        title="Payroll"
        description={isAdmin ? "Prepare, approve and release payroll." : "Prepare and compute payroll. An administrator approves each run."}
        actions={<NewRunDialog />}
      />
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pay period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Payslips</TableHead>
                <TableHead className="text-right">Total gross</TableHead>
                <TableHead className="text-right">Total net</TableHead>
                <TableHead>Prepared by</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableStatusRow colSpan={6} isLoading={isInitialLoading} error={error} isEmpty={!data?.results.length} emptyTitle="No payroll runs yet" emptyDescription="Create a run for the current cut-off to get started." />
              {data?.results.map((run) => (
                <TableRow key={run.id}>
                  <TableCell>
                    <Link to={`/manage/payroll/${run.id}`} className="font-medium text-primary hover:underline">
                      {formatDate(run.period_start)} – {formatDate(run.period_end)}
                    </Link>
                  </TableCell>
                  <TableCell><StatusBadge status={run.status} /></TableCell>
                  <TableCell className="text-right tabular-nums">{run.payslip_count}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(run.total_gross ?? 0)}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{formatMoney(run.total_net ?? 0)}</TableCell>
                  <TableCell className="text-muted-foreground">{run.created_by_name ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pager page={page} pageSize={PAGE_SIZE} count={data?.count ?? 0} onPageChange={setPage} />
        </CardContent>
      </Card>
    </>
  );
};

export default PayrollPage;
