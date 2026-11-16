import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useList, type Params } from "@/lib/query";
import type { LeaveBalance, LeaveRequest, LeaveType } from "@/types";

export const useLeaveTypes = () =>
  useQuery({
    queryKey: ["leave-types"],
    queryFn: async () => (await api.get<LeaveType[]>("leave-types/")).data,
    staleTime: 5 * 60_000,
  });

export const useLeaveBalances = (params: Params) => useList<LeaveBalance>("leave-balances", "leave-balances/", params);
export const useLeaveRequests = (params: Params) => useList<LeaveRequest>("leave-requests", "leave-requests/", params);

const useInvalidateLeaves = () => {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["leave-requests"] });
    qc.invalidateQueries({ queryKey: ["leave-balances"] });
    qc.invalidateQueries({ queryKey: ["attendance"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };
};

export interface LeaveInput {
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
}

export const useCreateLeave = () => {
  const invalidate = useInvalidateLeaves();
  return useMutation({
    mutationFn: async (data: LeaveInput) => (await api.post<LeaveRequest>("leave-requests/", data)).data,
    onSuccess: invalidate,
  });
};

export const useLeaveAction = () => {
  const invalidate = useInvalidateLeaves();
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "approve" | "reject" | "cancel" }) =>
      (await api.post<LeaveRequest>(`leave-requests/${id}/${action}/`)).data,
    onSuccess: invalidate,
  });
};

export const useGenerateBalances = () => {
  const invalidate = useInvalidateLeaves();
  return useMutation({
    mutationFn: async (year: number) =>
      (await api.post<{ detail: string }>("leave-balances/generate_yearly/", { year })).data,
    onSuccess: invalidate,
  });
};
