import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/States";
import type { LeaveBalance } from "@/types";

export const BalanceCards = ({ balances, isLoading }: { balances: LeaveBalance[]; isLoading: boolean }) => {
  if (isLoading)
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  const shown = balances.filter((b) => Number(b.allocated) > 0);
  if (!shown.length)
    return (
      <Card>
        <CardContent>
          <EmptyState title="No leave balances yet" description="HR generates yearly leave balances. Ask them if this looks wrong." />
        </CardContent>
      </Card>
    );
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {shown.map((b) => {
        const pct = Math.min(100, (Number(b.used) / Number(b.allocated)) * 100);
        return (
          <Card key={b.id} size="sm">
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{b.leave_type_name}</span>
                <span className="text-xs text-muted-foreground">{b.leave_type_code}</span>
              </div>
              <div className="text-2xl font-bold tabular-nums">
                {Number(b.remaining)}
                <span className="text-sm font-normal text-muted-foreground"> / {Number(b.allocated)} days left</span>
              </div>
              <div className="balance-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <span style={{ width: `${pct}%` }} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
