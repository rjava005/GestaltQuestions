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

export type UserBase = {
  first_name: string;
  last_name: string;
  username: string;
  email?: string;
  fb_id?: string;
};

export type UserRead = {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  institution: ValidInstitutions | null;
  role: UserRole;
};

export type UserUpdate = {
  first_name?: string;
  last_name?: string;
  username?: string;
  email?: string;
};
