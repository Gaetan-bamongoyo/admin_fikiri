"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { api } from "./api-client";
import {
  clearAuth,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
  type AuthUser,
} from "./auth-storage";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  /** Connecte l'utilisateur ; renvoie l'utilisateur en cas de succès. */
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    status: "loading",
  });

  // Hydrate l'état depuis le localStorage au montage (client uniquement). On ne
  // peut pas lire le localStorage au rendu initial sans casser l'hydratation SSR.
  useEffect(() => {
    const token = getToken();
    const storedUser = getStoredUser();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydratation unique depuis le localStorage
    setState(
      token && storedUser
        ? { user: storedUser, status: "authenticated" }
        : { user: null, status: "unauthenticated" }
    );
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<LoginResponse>("/auth/login", {
      email,
      password,
    });
    setToken(res.accessToken);
    setStoredUser(res.user);
    setState({ user: res.user, status: "authenticated" });
    return res.user;
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setState({ user: null, status: "unauthenticated" });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user: state.user, status: state.status, login, logout }),
    [state, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé dans un <AuthProvider>");
  }
  return ctx;
}
