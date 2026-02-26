import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { fetchSessionRequest, loginRequest, type LoginPayload, type UserRole } from "@/services/authApi";
import { toast } from "@/hooks/use-toast";

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

const AUTH_TOKEN_KEY = "jip_auth_token";
const MOCK_ROLE_KEY = "jip_mock_role";
const MOCK_USERID_KEY = "jip_mock_userid";
const AuthContext = createContext<AuthContextValue | null>(null);

const getMockRole = (): UserRole | null => {
  const r = localStorage.getItem(MOCK_ROLE_KEY);
  if (r === "admin" || r === "client") return r;
  return null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [role, setRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const clearSession = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(MOCK_ROLE_KEY);
    localStorage.removeItem(MOCK_USERID_KEY);
    setToken(null);
    setRole(null);
    setUserId(null);
    setStatus("unauthenticated");
  }, []);

  const hydrateSession = useCallback(async () => {
    setStatus("checking");
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);

    // Check for mock session first
    const mockRole = getMockRole();
    const mockUserId = localStorage.getItem(MOCK_USERID_KEY);
    if (storedToken && mockRole && mockUserId) {
      setToken(storedToken);
      setRole(mockRole);
      setUserId(mockUserId);
      setStatus("authenticated");
      return;
    }

    // Real session validation
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
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};
