import { useState } from "react";
import { MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/common/PageHeader";
import { Pager } from "@/components/common/Pager";
import { AppSelect } from "@/components/common/AppSelect";
import { DateRange } from "@/components/common/DateRange";
import { toISODate } from "@/lib/format";
import { notify } from "@/lib/toast";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import type { Attendance } from "@/types";
import { AttendanceTable } from "./components/AttendanceTable";
import { AttendanceDialog } from "./components/AttendanceDialog";
import { useAttendanceList, useDeleteAttendance } from "./api";

const PAGE_SIZE = 20;
const STATUS_FILTER = [
  { value: "all", label: "All statuses" },
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "absent", label: "Absent" },
  { value: "leave", label: "On leave" },
  { value: "holiday", label: "Holiday" },
];

const ManageAttendancePage = () => {
  const { user, isAdmin } = useCurrentUser();
  const today = toISODate(new Date());
  const [range, setRange] = useState({ from: today, to: today });
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<{ open: boolean; record: Attendance | null }>({ open: false, record: null });
  const remove = useDeleteAttendance();

  const { data, isInitialLoading, error } = useAttendanceList({
    date__gte: range.from,
    date__lte: range.to,
    status: status === "all" ? undefined : status,
    search,
    page,
    page_size: PAGE_SIZE,
    ordering: "-date",
  });

  const canEdit = (r: Attendance) => isAdmin || r.employee !== user?.employee_id;

  const onDelete = (r: Attendance) => {
    if (!window.confirm(`Delete ${r.full_name}'s record for ${r.date}?`)) return;
    remove.mutate(r.id, {
      onSuccess: () => notify.success("Record deleted"),
      onError: (e) => notify.error(e, "Could not delete"),
    });
  };

  return (
    <>
      <PageHeader
        title="Attendance"
        description={isAdmin ? "Every employee's time records." : "Time records of the employees you manage."}
        actions={
          <Button onClick={() => setDialog({ open: true, record: null })}>
            <Plus /> Add record
          </Button>
        }
      />
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search by name or employee no." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <AppSelect className="lg:w-44" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={STATUS_FILTER} />
            <DateRange from={range.from} to={range.to} onChange={(r) => { setRange(r); setPage(1); }} />
          </div>
          <AttendanceTable
            rows={data?.results ?? []}
            isLoading={isInitialLoading}
            error={error}
            showEmployee
            actions={(r) =>
              canEdit(r) && (
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Actions" />}>
                    <MoreHorizontal />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setDialog({ open: true, record: r })}>
                      <Pencil /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onClick={() => onDelete(r)}>
                      <Trash2 /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            }
          />
          <Pager page={page} pageSize={PAGE_SIZE} count={data?.count ?? 0} onPageChange={setPage} />
        </CardContent>
      </Card>
      {dialog.open && (
        <AttendanceDialog
          key={dialog.record?.id ?? "new"}
          open={dialog.open}
          onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
          record={dialog.record}
        />
      )}
    </>
  );
};

export default ManageAttendancePage;
