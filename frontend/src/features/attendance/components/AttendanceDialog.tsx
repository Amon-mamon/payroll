import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppSelect } from "@/components/common/AppSelect";
import { getErrorMessage } from "@/lib/errors";
import { toISODate } from "@/lib/format";
import { notify } from "@/lib/toast";
import { useEmployeeOptions } from "@/features/employees/api";
import type { Attendance, AttendanceStatus } from "@/types";
import { useSaveAttendance } from "../api";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "absent", label: "Absent" },
  { value: "leave", label: "On leave" },
  { value: "holiday", label: "Holiday" },
];

const hhmm = (t: string | null | undefined) => (t ? t.slice(0, 5) : "");

export const AttendanceDialog = ({
  open,
  onOpenChange,
  record,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: Attendance | null;
}) => {
  const isEdit = Boolean(record);
  const employees = useEmployeeOptions();
  const save = useSaveAttendance();
  const [form, setForm] = useState(() => ({
    employee: record?.employee ?? "",
    date: record?.date ?? toISODate(new Date()),
    time_in: hhmm(record?.time_in),
    time_out: hhmm(record?.time_out),
    status: (record?.status ?? "present") as AttendanceStatus,
    notes: record?.notes ?? "",
  }));
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    save.mutate(
      {
        id: record?.id,
        data: { ...form, time_in: form.time_in || null, time_out: form.time_out || null },
      },
      {
        onSuccess: () => {
          notify.success(isEdit ? "Attendance updated" : "Attendance added");
          onOpenChange(false);
        },
        onError: (err) => setError(getErrorMessage(err)),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit attendance" : "Add attendance"}</DialogTitle>
            <DialogDescription>
              {isEdit ? `${record?.full_name} · ${record?.date}` : "Manually log a day for an employee."}
            </DialogDescription>
          </DialogHeader>

          {!isEdit && (
            <div className="grid gap-1.5">
              <Label htmlFor="att-employee">Employee</Label>
              <AppSelect
                id="att-employee"
                value={form.employee}
                onChange={(v) => set("employee", v)}
                options={employees.data ?? []}
                placeholder={employees.isLoading ? "Loading…" : "Select employee"}
              />
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="att-date">Date</Label>
              <Input id="att-date" type="date" required value={form.date} onChange={(e) => set("date", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="att-status">Status</Label>
              <AppSelect id="att-status" value={form.status} onChange={(v) => set("status", v as AttendanceStatus)} options={STATUS_OPTIONS} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="att-in">Time in</Label>
              <Input id="att-in" type="time" value={form.time_in} onChange={(e) => set("time_in", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="att-out">Time out</Label>
              <Input id="att-out" type="time" value={form.time_out} onChange={(e) => set("time_out", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="att-notes">Notes</Label>
            <Textarea id="att-notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Reason for manual entry (optional)" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={save.isLoading || (!isEdit && !form.employee)}>
              {save.isLoading && <Loader2 className="animate-spin" />} Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
