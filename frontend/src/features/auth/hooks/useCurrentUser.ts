import { useAuthStore } from "../store/authStore";

export const useCurrentUser = () => {
  const user = useAuthStore((s) => s.user);
  return {
    user,
    role: user?.role ?? null,
    isAdmin: user?.role === "admin",
    isHR: user?.role === "hr",
    isManager: user?.role === "admin" || user?.role === "hr",
    hasEmployeeProfile: Boolean(user?.employee_id),
    organization: user?.organization ?? null,
    hasAccess: Boolean(user?.organization?.has_access),
  };
};
