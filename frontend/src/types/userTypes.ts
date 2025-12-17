export type UserRole = "admin" | "teacher" | "developer" | "student";
export type AllowedRoles = readonly UserRole[];
export type ValidInstitutions =
  | "University of California, Riverside"
  | "California State Polytechnic University, Pomona"
  | "Norco College";
export const AllowedInstitutions: ValidInstitutions[] = [
  "University of California, Riverside",
  "California State Polytechnic University, Pomona",
  "Norco College",
];
