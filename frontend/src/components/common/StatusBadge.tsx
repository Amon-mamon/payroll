import { Badge } from "@/components/ui/badge";

const LABELS: Record<string, string> = {
  present: "Present",
  late: "Late",
  absent: "Absent",
  leave: "On leave",
  holiday: "Holiday",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
  draft: "Draft",
  paid: "Paid",
  locked: "Locked",
  admin: "Admin",
  hr: "HR",
  employee: "Employee",
  active: "Active",
  inactive: "Inactive",
  trialing: "Free trial",
  cancelling: "Cancelling",
  expired: "Expired",
};

/** Coloured pill; colours are defined per status in index.css (.status-badge). */
export const StatusBadge = ({ status }: { status: string }) => (
  <Badge variant="outline" className="status-badge" data-status={status}>
    {LABELS[status] ?? status}
  </Badge>
);
