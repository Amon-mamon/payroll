import {
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Clock,
  CreditCard,
  LayoutDashboard,
  ReceiptText,
  ShieldCheck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/types";

export interface NavItem {
  title: string;
  to: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  roles: Role[];
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "My workspace",
    roles: ["employee", "hr", "admin"],
    items: [
      { title: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
      { title: "Time clock", to: "/attendance", icon: Clock },
      { title: "My leaves", to: "/leaves", icon: CalendarDays },
      { title: "My payslips", to: "/payslips", icon: ReceiptText },
    ],
  },
  {
    label: "Management",
    roles: ["hr", "admin"],
    items: [
      { title: "Employees", to: "/manage/employees", icon: Users },
      { title: "Attendance", to: "/manage/attendance", icon: CalendarCheck },
      { title: "Leave requests", to: "/manage/leaves", icon: ClipboardList },
      { title: "Payroll", to: "/manage/payroll", icon: Wallet },
    ],
  },
  {
    label: "Administration",
    roles: ["admin"],
    items: [
      { title: "Accounts", to: "/admin/accounts", icon: ShieldCheck },
      { title: "Billing & company", to: "/settings/billing", icon: CreditCard },
    ],
  },
];

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrator",
  hr: "Human Resources",
  employee: "Employee",
};
