import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/authStore";

export const PrivateRoute = () => {
  const isAuthenticated = useAuthStore((s) => s.is_authenticated);
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
};
