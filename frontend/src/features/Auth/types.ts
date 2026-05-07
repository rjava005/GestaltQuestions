export type ValidInstitutions =
  | "University of California, Riverside"
  | "California State Polytechnic University, Pomona";
export const AllowedInstitutions: ValidInstitutions[] = [
  "University of California, Riverside",
  "California State Polytechnic University, Pomona",
];
export type UserRole = "admin" | "developer" | "student" | "teacher";
export type AllowedRoles = readonly UserRole[];

export type UserBase = {
  first_name: string;
  last_name: string;
  username: string;
};

export type UserCreate = {
  first_name: string;
  last_name: string;
  password: string;
  username?: string;
  email: string;
};

export type UserRead = {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  institution: ValidInstitutions | null;
  roles: UserRole[];
};

export type UserUpdate = {
  first_name?: string;
  last_name?: string;
  username?: string;
  email?: string;
};
