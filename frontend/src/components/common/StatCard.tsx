import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Tone = "primary" | "info" | "warning" | "danger" | "neutral";

export const StatCard = ({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
  loading,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: LucideIcon;
  tone?: Tone;
  loading?: boolean;
}) => (
  <Card className="stat-card" data-tone={tone}>
    <CardContent className="flex items-start justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        {loading ? <Skeleton className="h-8 w-20" /> : <p className="truncate text-2xl font-bold">{value}</p>}
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <span className={cn("stat-icon flex size-10 shrink-0 items-center justify-center rounded-lg")}>
        <Icon className="size-5" />
      </span>
    </CardContent>
  </Card>
);
