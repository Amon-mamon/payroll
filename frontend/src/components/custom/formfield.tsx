import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: LucideIcon;
  error?: string;
  hint?: string;
}

/** Label + input + error message. Works with react-hook-form's `register()`. */
export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, icon: Icon, error, hint, id, name, className, ...props }, ref) => {
    const inputId = id ?? name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && <Label htmlFor={inputId}>{label}</Label>}
        <div className="relative">
          {Icon && (
            <Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          )}
          <Input
            ref={ref}
            id={inputId}
            name={name}
            aria-invalid={Boolean(error) || undefined}
            className={cn(Icon && "pl-9", className)}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    );
  },
);
FormField.displayName = "FormField";
