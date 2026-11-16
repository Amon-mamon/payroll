import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useList, type Params } from "@/lib/query";
import type { PayrollRun, Payslip } from "@/types";

export const usePayrollRuns = (params: Params) => useList<PayrollRun>("payroll-runs", "payroll-runs/", params);
export const usePayslips = (params: Params, enabled = true) => useList<Payslip>("payslips", "payslips/", params, enabled);

export const usePayrollRun = (id: string | undefined) =>
  useQuery({
    queryKey: ["payroll-runs", "detail", id],
    queryFn: async () => (await api.get<PayrollRun>(`payroll-runs/${id}/`)).data,
    enabled: Boolean(id),
  });

const useInvalidatePayroll = () => {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["payroll-runs"] });
    qc.invalidateQueries({ queryKey: ["payslips"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };
};

export const useCreateRun = () => {
  const invalidate = useInvalidatePayroll();
  return useMutation({
    mutationFn: async (data: { period_start: string; period_end: string }) =>
      (await api.post<PayrollRun>("payroll-runs/", data)).data,
    onSuccess: invalidate,
  });
};

export const useRunAction = () => {
  const invalidate = useInvalidatePayroll();
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "compute" | "approve" | "mark_paid" }) =>
      (await api.post<{ detail: string }>(`payroll-runs/${id}/${action}/`)).data,
    onSuccess: invalidate,
  });
};

export const useDeleteRun = () => {
  const invalidate = useInvalidatePayroll();
  return useMutation({ mutationFn: (id: string) => api.delete(`payroll-runs/${id}/`), onSuccess: invalidate });
};
