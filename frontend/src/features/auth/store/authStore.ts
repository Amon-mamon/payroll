import { create } from "zustand";
import type { User } from "../types/auth";

interface AuthState {
  access_token: string | null;
  user: User | null;
  is_authenticated: boolean;
  set_auth: (token: string, user: User) => void;
  set_access_token: (token: string) => void;
  set_user: (user: User) => void;
  /** Called when the API answers 402: the company's subscription has lapsed. */
  mark_subscription_inactive: () => void;
  logout: () => void;
}

// The access token lives only in memory; the refresh token is an HttpOnly cookie.
export const useAuthStore = create<AuthState>()((set) => ({
  access_token: null,
  user: null,
  is_authenticated: false,
  set_auth: (access_token, user) => set({ access_token, user, is_authenticated: true }),
  set_access_token: (access_token) => set({ access_token }),
  set_user: (user) => set({ user }),
  mark_subscription_inactive: () =>
    set((s) =>
      s.user?.organization && s.user.organization.has_access
        ? { user: { ...s.user, organization: { ...s.user.organization, has_access: false, effective_status: "expired" } } }
        : s,
    ),
  logout: () => set({ access_token: null, user: null, is_authenticated: false }),
}));

export const useRole = () => useAuthStore((s) => s.user?.role ?? null);
