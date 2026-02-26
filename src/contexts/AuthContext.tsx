import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchSessionRequest, loginRequest, logoutRequest, type LoginPayload, type UserRole } from "@/services/authApi";

type AuthStatus = "checking" | "authenticated" | "unauthenticated";

interface LoginResult {
  success: boolean;
  role?: UserRole;
  error?: string;
}

interface AuthContextValue {
  status: AuthStatus;
  role: UserRole | null;
  token: string | null;
  login: (payload: LoginPayload) => Promise<LoginResult>;
  logout: () => Promise<void>;
}

const AUTH_TOKEN_KEY = "jip_auth_token";
const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [role, setRole] = useState<UserRole | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setRole(null);
    setStatus("unauthenticated");
  }, []);

  const hydrateSession = useCallback(async () => {
    setStatus("checking");
    const storedToken = sessionStorage.getItem(AUTH_TOKEN_KEY);
    const response = await fetchSessionRequest(storedToken);

    if (!response.success || !response.data) {
      clearSession();
      return;
    }

    const nextToken = response.data.token ?? storedToken ?? null;
    if (nextToken) {
      sessionStorage.setItem(AUTH_TOKEN_KEY, nextToken);
    } else {
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
    }

    setToken(nextToken);
    setRole(response.data.role);
    setStatus("authenticated");
  }, [clearSession]);

  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

  const login = useCallback(async (payload: LoginPayload): Promise<LoginResult> => {
    const response = await loginRequest(payload);

    if (!response.success || !response.data) {
      clearSession();
      return {
        success: false,
        error: response.error || "No se pudo iniciar sesión.",
      };
    }

    if (response.data.token) {
      sessionStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
    } else {
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
    }

    setToken(response.data.token);
    setRole(response.data.role);
    setStatus("authenticated");

    return {
      success: true,
      role: response.data.role,
    };
  }, [clearSession]);

  const logout = useCallback(async () => {
    await logoutRequest(token);
    clearSession();
  }, [clearSession, token]);

  const value = useMemo(
    () => ({ status, role, token, login, logout }),
    [status, role, token, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};
