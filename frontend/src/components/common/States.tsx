import type { LucideIcon } from "lucide-react";
import { Inbox, Loader2, TriangleAlert } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { getErrorMessage } from "@/lib/errors";

export const EmptyState = ({
  icon: Icon = Inbox,
  title,
  description,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
}) => (
  <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
    <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <Icon className="size-5" />
    </span>
    <p className="font-medium">{title}</p>
    {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
  </div>
);

export const ErrorState = ({ error }: { error: unknown }) => (
  <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
    <TriangleAlert className="size-4 shrink-0" /> {getErrorMessage(error)}
  </div>
);

export const FullPageLoader = () => (
  <div className="flex min-h-svh items-center justify-center text-muted-foreground">
    <Loader2 className="size-6 animate-spin" />
  </div>
);

/** Loading / empty / error row for tables. Returns null when there are rows to show. */
export const TableStatusRow = ({
  colSpan,
  isLoading,
  error,
  isEmpty,
  emptyTitle,
  emptyDescription,
}: {
  colSpan: number;
  isLoading: boolean;
  error?: unknown;
  isEmpty: boolean;
  emptyTitle: string;
  emptyDescription?: string;
}) => {
  if (!isLoading && !error && !isEmpty) return null;
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan}>
        {isLoading ? (
          <div className="flex justify-center py-10 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : error ? (
          <ErrorState error={error} />
        ) : (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        )}
      </TableCell>
    </TableRow>
  );
};
