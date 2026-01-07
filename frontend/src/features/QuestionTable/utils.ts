import { type questionRel } from "../../types/questionTypes";

export function isRelArray(value: unknown): value is questionRel[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    typeof value[0] === "object" &&
    value[0] !== null &&
    "name" in value[0]
  );
}
export function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && (value.length === 0 || typeof value === "string")
  );
}
export function formatRelationshipField(
  value?: string[] | questionRel[]
): string {
  if (!value || value.length === 0) return "-";

  if (isStringArray(value)) {
    return value.join(", ");
  }
  if (isRelArray(value)) {
    return value.map((v) => v.name).join(", ");
  }
  return "—";
}
