import api from "../client";
import type { User } from "firebase/auth";
import { getIdToken } from "firebase/auth";

import type { ValidInstitutions, AllowedRoles } from "../../../types/userTypes";

export type UserBase = {
  first_name: string;
  last_name: string;
  username: string;
  email?: string;
  fb_id?: string;
};

export class UserAPI {
  private static readonly base = "/users";

  static async getCurrentUser(token: string): Promise<UserBase> {
    const response = await api.get<UserBase>(this.base, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }
  // Create a user simple deprecated technically
  static async createUser(data: UserBase, user: User): Promise<UserBase> {
    const token = await getIdToken(user);

    const response = await api.post<UserBase>(this.base, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  static async createUserFull(
    user: User,
    data: UserBase,
    additionalData?: {
      role?: AllowedRoles;
      institution?: ValidInstitutions | null;
    }
  ) {
    const payload = {
      user: data,
      role: additionalData?.role,
      institution: additionalData?.institution,
    };
    const token = await getIdToken(user);
    const response = await api.post<UserBase>(`${this.base}/full`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  static async getUser(user: User): Promise<UserBase> {
    const token = await getIdToken(user);

    const response = await api.get<UserBase>(this.base, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  }

  static async deleteUser(user: User): Promise<UserBase> {
    const token = await getIdToken(user);

    const response = await api.delete<UserBase>(this.base, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  }

  static async updateUser(user: User, data: UserBase): Promise<UserBase> {
    const token = await getIdToken(user);

    const response = await api.put<UserBase>(`${this.base}/`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  }
}
