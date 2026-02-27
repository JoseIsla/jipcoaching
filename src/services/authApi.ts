import { api, AUTH_TOKEN_KEY } from "@/services/api";
import type { LoginResponse, MeResponse, UserRole } from "@/types/api";
import { DEV_MOCK, DEV_USERS } from "@/config/devMode";

export type { UserRole };

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthSession {
  token: string;
  role: UserRole;
  userId: string;
}

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

const normalizeRole = (role: string | undefined): UserRole | null => {
  if (!role) return null;
  const v = role.toUpperCase();
  if (v === "ADMIN") return "admin";
  if (v === "CLIENT" || v === "CLIENTE" || v === "USER") return "client";
  return null;
};

// ── Dev mock login ──
const mockLogin = (payload: LoginPayload): ApiResponse<AuthSession> => {
  const admin = DEV_USERS.admin;
  const client = DEV_USERS.client;

  if (payload.email === admin.email && payload.password === admin.password) {
    return { success: true, data: { token: "dev-token-admin", role: "admin", userId: admin.userId } };
  }
  if (payload.email === client.email && payload.password === client.password) {
    return { success: true, data: { token: "dev-token-client", role: "client", userId: client.userId } };
  }
  return { success: false, error: "Credenciales incorrectas. Usa admin@jipcoaching.com / admin123 o carlos@email.com / client123" };
};

export const loginRequest = async (payload: LoginPayload): Promise<ApiResponse<AuthSession>> => {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    const result = mockLogin(payload);
    if (result.success && result.data) {
      localStorage.setItem(AUTH_TOKEN_KEY, result.data.token);
    }
    return result;
  }

  try {
    const data = await api.post<LoginResponse>("/auth/login", payload, { skipAuth: true });
    const token = data?.access_token;
    if (!token) return { success: false, error: "Respuesta inesperada del servidor." };

    localStorage.setItem(AUTH_TOKEN_KEY, token);
    const me = await api.get<MeResponse>("/me");
    const role = normalizeRole(me?.role);
    const userId = me?.id;

    if (!role || !userId) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      return { success: false, error: "Rol no válido." };
    }

    return { success: true, data: { token, role, userId } };
  } catch (err: any) {
    return { success: false, error: err?.message || "No se pudo conectar con el servidor." };
  }
};

export const fetchSessionRequest = async (token: string | null): Promise<ApiResponse<AuthSession>> => {
  if (!token) return { success: false };

  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    if (token === "dev-token-admin") {
      return { success: true, data: { token, role: "admin", userId: DEV_USERS.admin.userId } };
    }
    if (token === "dev-token-client") {
      return { success: true, data: { token, role: "client", userId: DEV_USERS.client.userId } };
    }
    return { success: false };
  }

  try {
    const me = await api.get<MeResponse>("/me");
    const role = normalizeRole(me?.role);
    const userId = me?.id;
    if (!role || !userId) return { success: false, error: "Rol no válido." };
    return { success: true, data: { token, role, userId } };
  } catch {
    return { success: false, error: "No se pudo validar la sesión." };
  }
};
