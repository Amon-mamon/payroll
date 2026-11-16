import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/custom/formfield";
import { AppSelect } from "@/components/common/AppSelect";
import { getErrorMessage, getFieldErrors } from "@/lib/errors";
import { DAY_LABELS, toISODate } from "@/lib/format";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import type { Employee, Role } from "@/types";
import { useSaveEmployee, type EmployeeInput } from "../api";

type FormValues = Omit<EmployeeInput, "work_days" | "grace_minutes" | "regularization_date"> & {
  work_days: string[];
  grace_minutes: number | string;
  regularization_date: string;
  password: string;
};

const DAYS = Object.keys(DAY_LABELS);

const toForm = (e?: Employee | null): FormValues => ({
  email: e?.email ?? "",
  password: "",
  role: e?.role ?? "employee",
  employee_no: e?.employee_no ?? "",
  first_name: e?.first_name ?? "",
  last_name: e?.last_name ?? "",
  position: e?.position ?? "",
  department: e?.department ?? "",
  hire_date: e?.hire_date ?? toISODate(new Date()),
  regularization_date: e?.regularization_date ?? "",
  employment_type: e?.employment_type ?? "regular",
  basic_salary: e?.basic_salary ?? "",
  sss_no: e?.sss_no ?? "",
  philhealth_no: e?.philhealth_no ?? "",
  pagibig_no: e?.pagibig_no ?? "",
  tin: e?.tin ?? "",
  bank_account: e?.bank_account ?? "",
  shift_start: e?.shift_start?.slice(0, 5) ?? "08:00",
  shift_end: e?.shift_end?.slice(0, 5) ?? "17:00",
  work_days: e?.work_days?.split(",") ?? ["mon", "tue", "wed", "thu", "fri"],
  grace_minutes: e?.grace_minutes ?? 15,
});

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <fieldset className="grid gap-4">
    <legend className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</legend>
    {children}
  </fieldset>
);

export const EmployeeFormDialog = ({
  open,
  onOpenChange,
  employee,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
}) => {
  const isEdit = Boolean(employee);
  const { isAdmin } = useCurrentUser();
  const save = useSaveEmployee();
  const [rootError, setRootError] = useState<string | null>(null);

  const { register, handleSubmit, control, setError, formState: { errors } } = useForm<FormValues>({
    defaultValues: toForm(employee),
  });

  const roleOptions: { value: Role; label: string }[] = isAdmin
    ? employee?.role === "admin"
      ? [{ value: "admin", label: "Admin" }]
      : [
          { value: "employee", label: "Employee" },
          { value: "hr", label: "HR" },
        ]
    : [{ value: "employee", label: "Employee" }];

  const onSubmit = (values: FormValues) => {
    setRootError(null);
    const data: Partial<EmployeeInput> = {
      ...values,
      work_days: values.work_days.join(","),
      grace_minutes: Number(values.grace_minutes),
      regularization_date: values.regularization_date || null,
    };
    if (!values.password) delete data.password;
    if (!isAdmin) data.role = "employee";

    save.mutate(
      { id: employee?.id, data },
      {
        onSuccess: (res) => {
          notify.success(isEdit ? "Employee updated" : "Account created", isEdit ? res.full_name : `${res.full_name} can now sign in with ${res.email}.`);
          onOpenChange(false);
        },
        onError: (err) => {
          const fields = getFieldErrors(err);
          let mapped = false;
          for (const [k, msg] of Object.entries(fields)) {
            if (k in values) {
              setError(k as keyof FormValues, { message: msg });
              mapped = true;
            }
          }
          if (!mapped) setRootError(getErrorMessage(err));
          else setRootError("Please fix the highlighted fields.");
        },
      },
    );
  };

  const req = (label: string) => ({ required: `${label} is required` });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6" noValidate>
          <DialogHeader>
            <DialogTitle>{isEdit ? `Edit ${employee?.full_name}` : isAdmin ? "Create account" : "Create employee account"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update the profile, schedule or login details."
                : "This creates a login and an employee profile. Share the password with the person securely."}
            </DialogDescription>
          </DialogHeader>

          <Section title="Account">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Email (used to sign in)" type="email" {...register("email", req("Email"))} error={errors.email?.message} />
              <FormField
                label={isEdit ? "New password" : "Password"}
                type="password"
                autoComplete="new-password"
                placeholder={isEdit ? "Leave blank to keep current" : "At least 8 characters"}
                {...register("password", isEdit ? {} : { required: "Password is required", minLength: { value: 8, message: "At least 8 characters" } })}
                error={errors.password?.message}
              />
              <div className="grid gap-1.5">
                <Label htmlFor="role">Role</Label>
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <AppSelect id="role" value={field.value} onChange={field.onChange} options={roleOptions} disabled={roleOptions.length === 1} />
                  )}
                />
                {errors.role?.message && <p className="text-xs text-destructive">{errors.role.message}</p>}
                {!isAdmin && <p className="text-xs text-muted-foreground">HR can create employee accounts only.</p>}
              </div>
              <FormField label="Employee no." placeholder="Auto-generated if blank" {...register("employee_no")} error={errors.employee_no?.message} />
            </div>
          </Section>

          <Section title="Personal & job">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="First name" {...register("first_name", req("First name"))} error={errors.first_name?.message} />
              <FormField label="Last name" {...register("last_name", req("Last name"))} error={errors.last_name?.message} />
              <FormField label="Position" {...register("position", req("Position"))} error={errors.position?.message} />
              <FormField label="Department" {...register("department", req("Department"))} error={errors.department?.message} />
              <FormField label="Hire date" type="date" {...register("hire_date", req("Hire date"))} error={errors.hire_date?.message} />
              <FormField label="Regularization date" type="date" {...register("regularization_date")} error={errors.regularization_date?.message} />
              <div className="grid gap-1.5">
                <Label htmlFor="employment_type">Employment type</Label>
                <Controller
                  control={control}
                  name="employment_type"
                  render={({ field }) => (
                    <AppSelect
                      id="employment_type"
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        { value: "regular", label: "Regular" },
                        { value: "probationary", label: "Probationary" },
                        { value: "contractual", label: "Contractual" },
                      ]}
                    />
                  )}
                />
              </div>
              <FormField label="Monthly basic salary (₱)" type="number" min="0" step="0.01" {...register("basic_salary", req("Salary"))} error={errors.basic_salary?.message} />
            </div>
          </Section>

          <Section title="Work schedule">
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="Shift start" type="time" {...register("shift_start", req("Shift start"))} error={errors.shift_start?.message} />
              <FormField label="Shift end" type="time" {...register("shift_end", req("Shift end"))} error={errors.shift_end?.message} />
              <FormField label="Grace period (min)" type="number" min="0" max="120" {...register("grace_minutes")} error={errors.grace_minutes?.message} />
            </div>
            <div className="grid gap-1.5">
              <Label>Work days</Label>
              <Controller
                control={control}
                name="work_days"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((d) => {
                      const on = field.value.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          aria-pressed={on}
                          onClick={() => field.onChange(on ? field.value.filter((x) => x !== d) : [...field.value, d])}
                          className={cn("day-chip", on && "is-on")}
                        >
                          {DAY_LABELS[d]}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
              {errors.work_days?.message && <p className="text-xs text-destructive">{errors.work_days.message}</p>}
            </div>
          </Section>

          <Section title="Government IDs & bank">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="SSS no." {...register("sss_no")} error={errors.sss_no?.message} />
              <FormField label="PhilHealth no." {...register("philhealth_no")} error={errors.philhealth_no?.message} />
              <FormField label="Pag-IBIG no." {...register("pagibig_no")} error={errors.pagibig_no?.message} />
              <FormField label="TIN" {...register("tin")} error={errors.tin?.message} />
              <FormField label="Bank account" {...register("bank_account")} error={errors.bank_account?.message} />
            </div>
          </Section>

          {rootError && <p className="text-sm text-destructive">{rootError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={save.isLoading}>
              {save.isLoading && <Loader2 className="animate-spin" />} {isEdit ? "Save changes" : "Create account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
