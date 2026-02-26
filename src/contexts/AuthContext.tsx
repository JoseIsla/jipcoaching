import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { fetchSessionRequest, loginRequest, type LoginPayload, type UserRole } from "@/services/authApi";
import { toast } from "@/hooks/use-toast";

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
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setRole(null);
    setStatus("unauthenticated");
  }, []);

  const hydrateSession = useCallback(async () => {
    setStatus("checking");
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const response = await fetchSessionRequest(storedToken);

    if (!response.success || !response.data) {
      clearSession();
      return;
    }

    setToken(response.data.token);
    setRole(response.data.role);
    setStatus("authenticated");
  }, [clearSession]);

  // Listen for 401 responses globally to handle token expiration
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401 && status === "authenticated") {
        clearSession();
        toast({
          title: "Sesión expirada",
          description: "Tu sesión ha caducado. Por favor, inicia sesión de nuevo.",
          variant: "destructive",
        });
      }
      return response;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, [status, clearSession]);

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

    localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
    setToken(response.data.token);
    setRole(response.data.role);
    setStatus("authenticated");

    return { success: true, role: response.data.role };
  }, [clearSession]);

  const logout = useCallback(async () => {
    clearSession();
  }, [clearSession]);

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
