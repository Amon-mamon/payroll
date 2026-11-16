import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/authStore";
import type { Role } from "@/types";

export const RoleRoute = ({ allowed }: { allowed: Role[] }) => {
  const role = useAuthStore((s) => s.user?.role);
  return role && allowed.includes(role) ? <Outlet /> : <Navigate to="/dashboard" replace />;
};
