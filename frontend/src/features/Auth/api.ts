import type { User } from "firebase/auth";
import { getIdToken } from "firebase/auth";

import api from "../../services/client";
import type {
  AllowedRoles,
  UserBase,
  UserCreate,
  UserRead,
  ValidInstitutions,
} from "./types";

export class UserAPI {
  private static readonly base = "/users";

  static async createUser(
    data: UserCreate,
    additionalData?: {
      role?: AllowedRoles;
      institution?: ValidInstitutions | null;
    },
  ) {
    const payload = {
      user: data,
      role: additionalData?.role,
      institution: additionalData?.institution,
    };
    const response = await api.post<UserBase>(`${this.base}`, payload, {
      // headers: {
      //   Authorization: `Bearer ${token}`,
      // },
    });
    return response.data;
  }
  static async getUser(user: User): Promise<UserRead> {
    const token = await getIdToken(user);

    const response = await api.get<UserRead>(this.base, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  }
}
