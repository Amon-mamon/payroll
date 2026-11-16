import api from "@/lib/api";
import type { LoginCredentials } from "@/features/auth/schema/loginSchema";
import type { AuthResponse, User } from "@/features/auth/types/auth";

export const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const { data } = await api.post<{ access: string; user: User }>("auth/login/", credentials);
  return { access_token: data.access, user: data.user };
};

export const fetchMe = async (): Promise<User> => (await api.get<User>("auth/me/")).data;

export const logoutUser = () => api.post("auth/logout/");
