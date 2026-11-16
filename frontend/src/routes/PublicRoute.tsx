import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/authStore";

/** Pages like /login are only for signed-out users. */
export const PublicRoute = () => {
  const isAuthenticated = useAuthStore((s) => s.is_authenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};
