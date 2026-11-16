const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

export const formatMoney = (value: string | number | null | undefined) =>
  value == null || value === "" ? "—" : peso.format(Number(value));

export const formatDate = (value: string | null | undefined, opts?: Intl.DateTimeFormatOptions) => {
  if (!value) return "—";
  // Plain dates (YYYY-MM-DD) are parsed as local dates to avoid TZ shifts.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  return d.toLocaleDateString("en-PH", opts ?? { month: "short", day: "numeric", year: "numeric" });
};

/** "08:05:00" -> "8:05 AM" */
export const formatTime = (value: string | null | undefined) => {
  if (!value) return "—";
  const [h, m] = value.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${suffix}`;
};

export const formatHours = (value: string | number | null | undefined) =>
  value == null ? "—" : `${Number(value).toFixed(2)} h`;

/** Local date as YYYY-MM-DD */
export const toISODate = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

export const DAY_LABELS: Record<string, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
};

export const formatWorkDays = (value: string) =>
  value.split(",").filter(Boolean).map((d) => DAY_LABELS[d] ?? d).join(", ");
