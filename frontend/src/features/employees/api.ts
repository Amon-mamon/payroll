import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { fetchList, useList, type Params } from "@/lib/query";
import type { Employee } from "@/types";

export const useEmployees = (params: Params) => useList<Employee>("employees", "employees/", params);

export const useEmployee = (id: string | undefined) =>
  useQuery({
    queryKey: ["employees", "detail", id],
    queryFn: async () => (await api.get<Employee>(`employees/${id}/`)).data,
    enabled: Boolean(id),
  });

/** All visible employees as select options (for pickers). */
export const useEmployeeOptions = () =>
  useQuery({
    queryKey: ["employees", "options"],
    queryFn: async () => {
      const data = await fetchList<Employee>("employees/", { page_size: 100, ordering: "last_name" });
      return data.results.map((e) => ({ value: e.id, label: `${e.full_name} (${e.employee_no})` }));
    },
    staleTime: 60_000,
  });

export const useDepartments = () =>
  useQuery({
    queryKey: ["employees", "departments"],
    queryFn: async () => (await api.get<string[]>("employees/departments/")).data,
    staleTime: 60_000,
  });

export type EmployeeInput = Omit<
  Employee,
  "id" | "user_id" | "full_name" | "is_active" | "created_at" | "updated_at" | "regularization_date"
> & { password?: string; regularization_date?: string | null };

export const useSaveEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: Partial<EmployeeInput> }) =>
      id
        ? (await api.patch<Employee>(`employees/${id}/`, data)).data
        : (await api.post<Employee>("employees/", data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useDeleteEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`employees/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
};
