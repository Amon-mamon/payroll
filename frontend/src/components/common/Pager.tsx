import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Pager = ({
  page,
  pageSize,
  count,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  count: number;
  onPageChange: (page: number) => void;
}) => {
  const pages = Math.max(1, Math.ceil(count / pageSize));
  if (count <= pageSize) return null;
  return (
    <div className="flex items-center justify-between gap-2 pt-4 text-sm text-muted-foreground">
      <span>
        Page {page} of {pages} · {count} total
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft /> Prev
        </Button>
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
          Next <ChevronRight />
        </Button>
      </div>
    </div>
  );
};
