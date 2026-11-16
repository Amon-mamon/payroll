import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { DashboardStats } from "@/types";

export const useDashboardStats = (enabled: boolean) =>
  useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get<DashboardStats>("dashboard/")).data,
    enabled,
    refetchInterval: 60_000,
  });
