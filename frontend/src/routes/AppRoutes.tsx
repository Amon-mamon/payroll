import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuthBootstrap } from "@/features/auth/hooks/useAuthBootstrap";
import AuthPage from "@/features/auth/page";
import RootLayout from "@/layout/RootLayout";
import DashboardPage from "@/features/dashboard/page";
import MyAttendancePage from "@/features/attendance/MyAttendancePage";
import ManageAttendancePage from "@/features/attendance/ManageAttendancePage";
import MyLeavesPage from "@/features/leaves/MyLeavesPage";
import ManageLeavesPage from "@/features/leaves/ManageLeavesPage";
import MyPayslipsPage from "@/features/payroll/MyPayslipsPage";
import PayrollPage from "@/features/payroll/PayrollPage";
import PayrollRunDetailPage from "@/features/payroll/PayrollRunDetailPage";
import { EmployeeDetailPage, EmployeesPage } from "@/features/employees";
import AccountsPage from "@/features/users/page";
import LandingPage from "@/features/landing/page";
import SignupPage from "@/features/signup/page";
import BillingPage from "@/features/billing/page";
import { FullPageLoader } from "@/components/common/States";
import { PrivateRoute } from "./PrivateRoute";
import { PublicRoute } from "./PublicRoute";
import { RoleRoute } from "./RoleRoute";

export const AppRoutes = () => {
  const ready = useAuthBootstrap();
  if (!ready) return <FullPageLoader />;

  return (
    <BrowserRouter>
      <Routes>
        {/* Marketing site: open to everyone */}
        <Route path="/" element={<LandingPage />} />

        {/* Signed-out only */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        {/* Signed-in */}
        <Route element={<PrivateRoute />}>
          <Route element={<RootLayout />}>
            {/* Every role: personal workspace */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/attendance" element={<MyAttendancePage />} />
            <Route path="/leaves" element={<MyLeavesPage />} />
            <Route path="/payslips" element={<MyPayslipsPage />} />

            {/* HR + Admin */}
            <Route element={<RoleRoute allowed={["hr", "admin"]} />}>
              <Route path="/manage/employees" element={<EmployeesPage />} />
              <Route path="/manage/employees/:id" element={<EmployeeDetailPage />} />
              <Route path="/manage/attendance" element={<ManageAttendancePage />} />
              <Route path="/manage/leaves" element={<ManageLeavesPage />} />
              <Route path="/manage/payroll" element={<PayrollPage />} />
              <Route path="/manage/payroll/:id" element={<PayrollRunDetailPage />} />
            </Route>

            {/* Admin only */}
            <Route element={<RoleRoute allowed={["admin"]} />}>
              <Route path="/admin/accounts" element={<AccountsPage />} />
              <Route path="/settings/billing" element={<BillingPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
