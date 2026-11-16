import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useList, type Params } from "@/lib/query";
import type { Attendance, TodayAttendance } from "@/types";

export const useTodayAttendance = (enabled = true) =>
  useQuery({
    queryKey: ["attendance-today"],
    queryFn: async () => (await api.get<TodayAttendance>("attendance/today/")).data,
    enabled,
    retry: false,
  });

export const useAttendanceList = (params: Params) => useList<Attendance>("attendance", "attendance/", params);

const useInvalidateAttendance = () => {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["attendance"] });
    qc.invalidateQueries({ queryKey: ["attendance-today"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };
};

export const useClock = () => {
  const invalidate = useInvalidateAttendance();
  return useMutation({
    mutationFn: async (action: "in" | "out") =>
      (await api.post<{ detail: string; record: Attendance }>("attendance/clock/", { action })).data,
    onSuccess: invalidate,
  });
};

export type AttendanceInput = Pick<Attendance, "employee" | "date" | "status" | "notes"> & {
  time_in: string | null;
  time_out: string | null;
};

export const useSaveAttendance = () => {
  const invalidate = useInvalidateAttendance();
  return useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: AttendanceInput }) =>
      id
        ? (await api.patch<Attendance>(`attendance/${id}/`, data)).data
        : (await api.post<Attendance>("attendance/", data)).data,
    onSuccess: invalidate,
  });
};

export const useDeleteAttendance = () => {
  const invalidate = useInvalidateAttendance();
  return useMutation({
    mutationFn: (id: string) => api.delete(`attendance/${id}/`),
    onSuccess: invalidate,
  });
};
