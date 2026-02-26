import { api, AUTH_TOKEN_KEY } from "@/services/api";
import type { LoginResponse, MeResponse, UserRole } from "@/types/api";

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

export const loginRequest = async (payload: LoginPayload): Promise<ApiResponse<AuthSession>> => {
  try {
    const data = await api.post<LoginResponse>("/auth/login", payload, { skipAuth: true });

    const token = data?.access_token;
    if (!token) {
      return { success: false, error: "Respuesta inesperada del servidor." };
    }

    // Save token so /me request can use it
    localStorage.setItem(AUTH_TOKEN_KEY, token);

    // Fetch user profile to get role and id
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
