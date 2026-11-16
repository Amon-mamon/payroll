import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const DateRange = ({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
}) => (
  <div className="flex items-end gap-2">
    <div className="grid gap-1">
      <Label htmlFor="date-from" className="text-xs text-muted-foreground">From</Label>
      <Input id="date-from" type="date" value={from} max={to || undefined} onChange={(e) => onChange({ from: e.target.value, to })} className="w-40" />
    </div>
    <div className="grid gap-1">
      <Label htmlFor="date-to" className="text-xs text-muted-foreground">To</Label>
      <Input id="date-to" type="date" value={to} min={from || undefined} onChange={(e) => onChange({ from, to: e.target.value })} className="w-40" />
    </div>
  </div>
);
