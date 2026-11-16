import { isAxiosError } from "axios";

type ErrorBody = {
  detail?: string;
  message?: string;
  errors?: unknown;
  [key: string]: unknown;
};

const prettify = (key: string) =>
  key === "non_field_errors" || key === "detail"
    ? ""
    : `${key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())}: `;

function flatten(value: unknown, key = ""): string[] {
  if (value == null) return [];
  if (typeof value === "string") return [`${key ? prettify(key) : ""}${value}`];
  if (Array.isArray(value)) return value.flatMap((v) => flatten(v, key));
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) => flatten(v, k));
  }
  return [];
}

/** Turns DRF errors (wrapped as {success:false, errors:{...}} by the backend) into one readable message. */
export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (isAxiosError(error)) {
    if (!error.response) return "Cannot reach the server. Check your connection.";
    const body = error.response.data as ErrorBody | undefined;
    const payload = body?.errors ?? body;
    const messages = flatten(payload);
    if (messages.length) return messages.join(" ");
    if (error.response.status === 403) return "You don't have permission to do that.";
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/** Field-level errors keyed by field name, for mapping onto form inputs. */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!isAxiosError(error)) return {};
  const body = error.response?.data as ErrorBody | undefined;
  const payload = (body?.errors ?? body) as Record<string, unknown> | undefined;
  if (!payload || typeof payload !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(payload)) {
    const msgs = flatten(v);
    if (msgs.length) out[k] = msgs.join(" ");
  }
  return out;
}
