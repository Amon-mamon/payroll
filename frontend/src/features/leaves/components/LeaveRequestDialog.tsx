import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { AppSelect } from "@/components/common/AppSelect";
import { getErrorMessage } from "@/lib/errors";
import { toISODate } from "@/lib/format";
import { notify } from "@/lib/toast";
import type { LeaveBalance } from "@/types";
import { useCreateLeave, useLeaveTypes } from "../api";

const empty = () => ({ leave_type: "", start_date: toISODate(new Date()), end_date: toISODate(new Date()), reason: "" });

export const LeaveRequestDialog = ({ balances }: { balances: LeaveBalance[] }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const types = useLeaveTypes();
  const create = useCreateLeave();

  const options = (types.data ?? []).map((t) => {
    const bal = balances.find((b) => b.leave_type === t.id);
    const suffix = t.is_paid ? (bal ? ` · ${Number(bal.remaining)} left` : " · no balance") : " · unpaid";
    return { value: t.id, label: `${t.name}${suffix}` };
  });

  const set = <K extends keyof ReturnType<typeof empty>>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    create.mutate(form, {
      onSuccess: (res) => {
        notify.success("Leave request submitted", `${Number(res.days)} work day(s) requested.`);
        setOpen(false);
        setForm(empty());
      },
      onError: (err) => setError(getErrorMessage(err)),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setError(null); }}>
      <DialogTrigger render={<Button />}>
        <Plus /> Request leave
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>Request leave</DialogTitle>
            <DialogDescription>Only your scheduled work days are counted against your balance.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="leave-type">Leave type</Label>
            <AppSelect id="leave-type" value={form.leave_type} onChange={(v) => set("leave_type", v)} options={options} placeholder="Choose a leave type" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="leave-start">Start date</Label>
              <Input id="leave-start" type="date" required value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value, end_date: f.end_date < e.target.value ? e.target.value : f.end_date }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="leave-end">End date</Label>
              <Input id="leave-end" type="date" required min={form.start_date} value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="leave-reason">Reason</Label>
            <Textarea id="leave-reason" value={form.reason} onChange={(e) => set("reason", e.target.value)} placeholder="Optional, but helps your approver" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isLoading || !form.leave_type}>
              {create.isLoading && <Loader2 className="animate-spin" />} Submit request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
