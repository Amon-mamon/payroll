import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginUser } from "../api/auth";
import type { LoginCredentials } from "../schema/loginSchema";
import { useAuthStore } from "../store/authStore";

export const useLogin = () => {
  const queryClient = useQueryClient();
  const set_auth = useAuthStore((s) => s.set_auth);

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => loginUser(credentials),
    onSuccess: (data) => {
      queryClient.clear(); // never show a previous user's cached data
      set_auth(data.access_token, data.user);
    },
  });
};
