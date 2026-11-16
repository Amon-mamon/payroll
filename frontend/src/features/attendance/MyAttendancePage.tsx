import { useState } from "react";
import { Clock, Timer, TrendingUp, CalendarX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { Pager } from "@/components/common/Pager";
import { StatCard } from "@/components/common/StatCard";
import { DateRange } from "@/components/common/DateRange";
import { toISODate } from "@/lib/format";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { ClockCard } from "./components/ClockCard";
import { AttendanceTable } from "./components/AttendanceTable";
import { useAttendanceList } from "./api";

const PAGE_SIZE = 15;

const monthStart = () => {
  const d = new Date();
  return toISODate(new Date(d.getFullYear(), d.getMonth(), 1));
};

const MyAttendancePage = () => {
  const { hasEmployeeProfile } = useCurrentUser();
  const [range, setRange] = useState({ from: monthStart(), to: toISODate(new Date()) });
  const [page, setPage] = useState(1);

  const params = { mine: true, date__gte: range.from, date__lte: range.to, page, page_size: PAGE_SIZE };
  const { data, isInitialLoading, error } = useAttendanceList(params);
  // Summary over the whole range (first 100 records is plenty for a month view)
  const summary = useAttendanceList({ mine: true, date__gte: range.from, date__lte: range.to, page_size: 100 });

  const rows = summary.data?.results ?? [];
  const sum = (key: "worked_hours" | "overtime_hours") => rows.reduce((acc, r) => acc + Number(r[key]), 0);

  return (
    <>
      <PageHeader title="Time clock" description="Record your time in and out, and review your attendance." />
      <ClockCard />

      {hasEmployeeProfile && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Days present" value={rows.filter((r) => r.time_in).length} icon={Clock} loading={summary.isInitialLoading} />
            <StatCard label="Late arrivals" value={rows.filter((r) => r.status === "late").length} icon={CalendarX} tone="warning" loading={summary.isInitialLoading} />
            <StatCard label="Regular hours" value={sum("worked_hours").toFixed(1)} icon={Timer} tone="info" loading={summary.isInitialLoading} />
            <StatCard label="Overtime hours" value={sum("overtime_hours").toFixed(1)} icon={TrendingUp} tone="neutral" loading={summary.isInitialLoading} />
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <CardTitle>Attendance history</CardTitle>
              <DateRange from={range.from} to={range.to} onChange={(r) => { setRange(r); setPage(1); }} />
            </CardHeader>
            <CardContent>
              <AttendanceTable rows={data?.results ?? []} isLoading={isInitialLoading} error={error} />
              <Pager page={page} pageSize={PAGE_SIZE} count={data?.count ?? 0} onPageChange={setPage} />
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
};

export default MyAttendancePage;
