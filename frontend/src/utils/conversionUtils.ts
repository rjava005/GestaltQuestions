export function normalizeValue(v: any) {
  if (typeof v === "boolean") return v ? "True" : "False";
  if (Array.isArray(v)) return v.join(", ");
  if (v && typeof v === "object") return JSON.stringify(v);
  return String(v ?? "");
}

export function toStringSafe(value: any) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

// Converst value to a boolean
export function trueish(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v != 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes" || s === "y" || s === "on";
  }
  return false;
}
