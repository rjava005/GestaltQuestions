import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { createContext, useContext } from "react";

import { auth } from "../../config/firebaseClient";
import { UserAPI } from "./api";
import { type UserRead } from "./types";

const authBypassEnabled = import.meta.env.VITE_AUTH_BYPASS_ENABLED === "true";
const authBypassToken = import.meta.env.VITE_AUTH_BYPASS_TOKEN ?? "local-dev-bypass";
const localAuthor = {
  uid: "00000000-0000-4000-8000-000000000001",
  email: "local-author@gestalt.invalid",
  displayName: "Local Author",
  getIdToken: async () => authBypassToken,
} as unknown as User;
const localAuthorData: UserRead = {
  first_name: "Local",
  last_name: "Author",
  username: "local_author",
  email: "local-author@gestalt.invalid",
  institution: null,
  roles: ["developer"],
};

export function useStateAuth() {
  const [user, setUser] = useState<User | null>(authBypassEnabled ? localAuthor : null);
  const [userData, setUserData] = useState<UserRead | null>(authBypassEnabled ? localAuthorData : null);
  const [loading, setLoading] = useState<boolean>(!authBypassEnabled);

  useEffect(() => {
    if (authBypassEnabled) return;
    const unSubscribe = onAuthStateChanged(auth, (fbUser) => {
      async function handleUser() {
        if (fbUser) {
          setUser(fbUser);
          setLoading(false);

          try {
            const data = await UserAPI.getUser(fbUser);
            setUserData(data);
          } catch (error) {
            console.error("Error fetching user data:", error);
            setUser(null);
          }
        } else {
          console.log("No User Logged In");
          setUser(null);
          setLoading(false);
        }
      }

      handleUser();
    });

    return () => unSubscribe();
  }, []);

  return { user, userData, loading };
}

type AuthContextType = {
  user: User | null;
  userData: UserRead | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, userData, loading } = useStateAuth();

  const logout = async () => {
    if (authBypassEnabled) return;
    await auth.signOut();
    window.location.reload();
  };
  return (
    <AuthContext.Provider value={{ user, loading, logout, userData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
