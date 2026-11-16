import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface Option {
  label: string;
  value: string;
}

/** Thin wrapper over the shadcn (Base UI) Select with a simple value/onChange API. */
export const AppSelect = ({
  value,
  onChange,
  options,
  placeholder = "Select…",
  className,
  id,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}) => (
  <Select
    items={options}
    value={value || null}
    onValueChange={(v) => onChange((v as string | null) ?? "")}
    disabled={disabled}
  >
    <SelectTrigger id={id} className={cn("w-full", className)}>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {options.map((o) => (
        <SelectItem key={o.value} value={o.value}>
          {o.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
