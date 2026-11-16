import { useEffect, useState } from "react";
import { refreshAccessToken } from "@/lib/api";
import { fetchMe } from "../api/auth";
import { useAuthStore } from "../store/authStore";

/**
 * On first load, try to restore the session from the HttpOnly refresh cookie.
 * Resolves to `true` once we know whether the user is logged in or not.
 */
export const useAuthBootstrap = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await refreshAccessToken();
        const user = await fetchMe();
        if (active) useAuthStore.getState().set_auth(token, user);
      } catch {
        if (active) useAuthStore.getState().logout();
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return ready;
};
