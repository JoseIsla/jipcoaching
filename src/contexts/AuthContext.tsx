import { createContext, forwardRef, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchSessionRequest, loginRequest, type LoginPayload, type UserRole } from "@/services/authApi";
import { AUTH_TOKEN_KEY } from "@/services/api";
import { disableDemoMode } from "@/config/devMode";

type AuthStatus = "checking" | "authenticated" | "unauthenticated";

interface LoginResult {
  success: boolean;
  role?: UserRole;
  userId?: string;
  error?: string;
}

interface AuthContextValue {
  status: AuthStatus;
  role: UserRole | null;
  userId: string | null;
  token: string | null;
  login: (payload: LoginPayload) => Promise<LoginResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = forwardRef<unknown, { children: ReactNode }>(({ children }, _ref) => {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [role, setRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const clearSession = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setRole(null);
    setUserId(null);
    setStatus("unauthenticated");
  }, []);

  const hydrateSession = useCallback(async () => {
    setStatus("checking");
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);

    if (!storedToken) {
      clearSession();
      return;
    }

    const response = await fetchSessionRequest(storedToken);

    if (!response.success || !response.data) {
      clearSession();
      return;
    }

    setToken(response.data.token);
    setRole(response.data.role);
    setUserId(response.data.userId);
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

    setToken(response.data.token);
    setRole(response.data.role);
    setUserId(response.data.userId);
    setStatus("authenticated");

    return { success: true, role: response.data.role, userId: response.data.userId };
  }, [clearSession]);

  const logout = useCallback(async () => {
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({ status, role, userId, token, login, logout }),
    [status, role, userId, token, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
});

AuthProvider.displayName = "AuthProvider";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};
