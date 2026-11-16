import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LogIn, LogOut, CheckCircle2, Loader2, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatHours, formatTime, formatWorkDays } from "@/lib/format";
import { notify } from "@/lib/toast";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useClock, useTodayAttendance } from "../api";

const useNow = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
};

export const ClockCard = ({ compact = false }: { compact?: boolean }) => {
  const { hasEmployeeProfile, isAdmin } = useCurrentUser();
  const now = useNow();
  const { data, isLoading } = useTodayAttendance(hasEmployeeProfile);
  const clock = useClock();

  if (!hasEmployeeProfile) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
          <UserX className="size-5 shrink-0" />
          <span>
            Your account has no employee profile, so the time clock is unavailable.
            {isAdmin && (
              <>
                {" "}
                You can create one from <Link className="text-primary underline" to="/manage/employees">Employees</Link>.
              </>
            )}
          </span>
        </CardContent>
      </Card>
    );
  }

  const record = data?.record;
  const clockedIn = Boolean(record?.time_in);
  const clockedOut = Boolean(record?.time_out);
  const nextAction: "in" | "out" | null = !clockedIn ? "in" : !clockedOut ? "out" : null;

  const onClock = () => {
    if (!nextAction) return;
    clock.mutate(nextAction, {
      onSuccess: (res) => notify.success(res.detail),
      onError: (err) => notify.error(err, "Could not record time"),
    });
  };

  return (
    <Card className="clock-card">
      <CardHeader>
        <CardTitle>Time clock</CardTitle>
        <CardDescription>
          {data
            ? `Shift ${formatTime(data.schedule.shift_start)} – ${formatTime(data.schedule.shift_end)} · ${formatWorkDays(data.schedule.work_days)}`
            : "Loading your schedule…"}
        </CardDescription>
      </CardHeader>
      <CardContent className={compact ? "space-y-4" : "grid gap-6 md:grid-cols-[1fr_auto] md:items-center"}>
        <div className="space-y-4">
          <div className="clock-display" aria-live="off">
            {now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
          {isLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : (
            <dl className="grid grid-cols-3 gap-3 text-sm">
              <div className="clock-stat">
                <dt>Time in</dt>
                <dd>{formatTime(record?.time_in)}</dd>
              </div>
              <div className="clock-stat">
                <dt>Time out</dt>
                <dd>{formatTime(record?.time_out)}</dd>
              </div>
              <div className="clock-stat">
                <dt>Worked</dt>
                <dd>{clockedOut ? formatHours(record?.worked_hours) : "—"}</dd>
              </div>
            </dl>
          )}
        </div>

        <div className="flex flex-col items-stretch gap-2 md:min-w-48">
          {record && <div className="self-start md:self-center"><StatusBadge status={record.status} /></div>}
          {nextAction ? (
            <Button
              size="lg"
              className="clock-button"
              data-action={nextAction}
              onClick={onClock}
              disabled={clock.isLoading || isLoading}
            >
              {clock.isLoading ? <Loader2 className="animate-spin" /> : nextAction === "in" ? <LogIn /> : <LogOut />}
              {nextAction === "in" ? "Time in" : "Time out"}
            </Button>
          ) : (
            !isLoading && (
              <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-primary" /> Done for today
              </div>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
};
