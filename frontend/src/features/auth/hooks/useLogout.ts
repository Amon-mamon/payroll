import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../api/auth";
import { useAuthStore } from "../store/authStore";

export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: logoutUser,
    // Log out locally even if the server call fails.
    onSettled: () => {
      logout();
      queryClient.clear();
      navigate("/login", { replace: true });
    },
  });
};
