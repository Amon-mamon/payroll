import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { fetchMe } from "@/features/auth/api/auth";
import { useAuthStore } from "@/features/auth/store/authStore";
import type { BillingCycle, Organization, Plan, PlanCode } from "@/types";

export const usePlans = () =>
  useQuery({
    queryKey: ["plans"],
    queryFn: async () => (await api.get<Plan[]>("plans/")).data,
    staleTime: Infinity,
  });

export const useOrganization = () =>
  useQuery({
    queryKey: ["organization"],
    queryFn: async () => (await api.get<Organization>("organization/")).data,
  });

/** After billing changes, refresh the signed-in user so the subscription gate updates. */
const useRefreshSession = () => {
  const qc = useQueryClient();
  return async () => {
    qc.invalidateQueries({ queryKey: ["organization"] });
    try {
      useAuthStore.getState().set_user(await fetchMe());
    } catch {
      /* the gate will catch up on the next request */
    }
  };
};

export const useUpdateOrganization = () => {
  const refresh = useRefreshSession();
  return useMutation({
    mutationFn: async (data: { name: string }) => (await api.patch<Organization>("organization/", data)).data,
    onSuccess: refresh,
  });
};

export type SubscriptionAction = "activate" | "change_plan" | "cancel" | "resume";

export const useSubscriptionAction = () => {
  const refresh = useRefreshSession();
  return useMutation({
    mutationFn: async (data: { action: SubscriptionAction; plan?: PlanCode; billing_cycle?: BillingCycle }) =>
      (await api.post<{ detail: string; organization: Organization }>("organization/subscription/", data)).data,
    onSuccess: refresh,
  });
};
