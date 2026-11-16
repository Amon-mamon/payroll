import { useQuery } from "@tanstack/react-query";
import api from "./api";
import type { Paginated } from "@/types";

export type Params = Record<string, string | number | boolean | undefined | null>;

const clean = (params: Params) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""));

export const fetchList = async <T,>(url: string, params: Params = {}) =>
  (await api.get<Paginated<T>>(url, { params: clean(params) })).data;

/** Paginated DRF list endpoint. */
export const useList = <T,>(key: string, url: string, params: Params = {}, enabled = true) =>
  useQuery({
    queryKey: [key, clean(params)],
    queryFn: () => fetchList<T>(url, params),
    keepPreviousData: true,
    enabled,
  });
