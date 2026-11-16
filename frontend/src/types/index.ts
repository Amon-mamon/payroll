export type Role = "admin" | "hr" | "employee";

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Employee {
  id: string;
  user_id: number;
  employee_no: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  role: Role;
  is_active: boolean;
  position: string;
  department: string;
  hire_date: string;
  regularization_date: string | null;
  employment_type: "regular" | "probationary" | "contractual";
  basic_salary: string;
  sss_no: string;
  philhealth_no: string;
  pagibig_no: string;
  tin: string;
  bank_account: string;
  shift_start: string;
  shift_end: string;
  work_days: string;
  grace_minutes: number;
  created_at: string;
  updated_at: string;
}

export type AttendanceStatus = "present" | "late" | "absent" | "leave" | "holiday";

export interface Attendance {
  id: string;
  employee: string;
  full_name: string;
  employee_no: string;
  department: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  worked_hours: string;
  overtime_hours: string;
  status: AttendanceStatus;
  notes: string;
}

export interface TodayAttendance {
  record: Attendance | null;
  schedule: { shift_start: string; shift_end: string; work_days: string; grace_minutes: number };
  server_time: string;
}

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  default_days_per_year: string;
  is_paid: boolean;
}

export interface LeaveBalance {
  id: string;
  employee: string;
  full_name: string;
  leave_type: string;
  leave_type_name: string;
  leave_type_code: string;
  year: number;
  allocated: string;
  used: string;
  remaining: string;
}

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface LeaveRequest {
  id: string;
  employee: string;
  employee_name: string;
  employee_no: string;
  leave_type: string;
  leave_type_name: string;
  start_date: string;
  end_date: string;
  days: string;
  reason: string;
  status: LeaveStatus;
  approved_by_name: string | null;
  approved_at: string | null;
  created_at: string;
}

export type PayrollStatus = "draft" | "approved" | "paid" | "locked";

export interface PayrollRun {
  id: string;
  period_start: string;
  period_end: string;
  status: PayrollStatus;
  created_by_name: string | null;
  approved_by_name: string | null;
  payslip_count: number;
  total_gross: string | null;
  total_net: string | null;
  created_at: string;
}

export interface Payslip {
  id: string;
  payroll_run: string;
  period_start: string;
  period_end: string;
  run_status: PayrollStatus;
  employee: string;
  employee_name: string;
  employee_no: string;
  department: string;
  position: string;
  days_present: string;
  days_on_leave: string;
  days_absent: string;
  overtime_hours: string;
  basic_pay: string;
  absence_deduction: string;
  overtime_pay: string;
  gross_pay: string;
  sss_deduction: string;
  philhealth_deduction: string;
  pagibig_deduction: string;
  tax_deduction: string;
  total_deductions: string;
  net_pay: string;
}

export interface Account {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: Role;
  is_superuser: boolean;
  is_active: boolean;
  employee_id: string | null;
  date_joined: string;
  last_login: string | null;
}

export interface DashboardStats {
  today: string;
  employees_total: number;
  attendance_today: { present: number; late: number; on_leave: number; clocked_out: number };
  pending_leaves: number;
  departments: { department: string; count: number }[];
  latest_payroll: {
    id: string;
    period_start: string;
    period_end: string;
    status: PayrollStatus;
    total_net: string | number;
    payslip_count: number;
  } | null;
  accounts_by_role?: Partial<Record<Role, number>>;
}

export type PlanCode = "starter" | "growth" | "business";
export type BillingCycle = "monthly" | "yearly";
export type SubscriptionState = "trialing" | "active" | "cancelling" | "expired";

export interface Plan {
  code: PlanCode;
  name: string;
  tagline: string;
  price_monthly: string;
  price_yearly: string;
  max_employees: number;
  features: string[];
  highlight: boolean;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  plan: PlanCode;
  status: "trialing" | "active" | "cancelled";
  effective_status: SubscriptionState;
  has_access: boolean;
  access_ends_at: string | null;
}

export interface Organization extends OrganizationSummary {
  slug: string;
  plan_name: string;
  billing_cycle: BillingCycle;
  price: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  max_employees: number;
  seats_used: number;
  created_at: string;
}
