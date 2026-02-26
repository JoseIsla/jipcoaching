export type UserRole = "admin" | "client";

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

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001").trim();

const endpoint = (path: string) => `${API_BASE_URL}${path}`;

const normalizeRole = (role: unknown): UserRole | null => {
  if (typeof role !== "string") return null;
  const value = role.toUpperCase();
  if (value === "ADMIN") return "admin";
  if (value === "CLIENT" || value === "CLIENTE" || value === "USER") return "client";
  return null;
};

const safeJson = async (response: Response): Promise<any> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const getErrorMessage = (payload: any, fallback: string) => {
  if (payload && typeof payload.error === "string" && payload.error.trim()) return payload.error;
  if (payload && typeof payload.message === "string" && payload.message.trim()) return payload.message;
  return fallback;
};

export const loginRequest = async (payload: LoginPayload): Promise<ApiResponse<AuthSession>> => {
  try {
    const response = await fetch(endpoint("/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await safeJson(response);

    if (!response.ok) {
      return { success: false, error: getErrorMessage(data, "Credenciales inválidas.") };
    }

    const role = normalizeRole(data?.role);
    const token = typeof data?.accessToken === "string" ? data.accessToken : null;

    const userId = typeof data?.userId === "string" ? data.userId : (typeof data?.id === "string" ? data.id : null);

    if (!role || !token || !userId) {
      return { success: false, error: "Respuesta inesperada del servidor." };
    }

    return { success: true, data: { token, role, userId } };
  } catch {
    return { success: false, error: "No se pudo conectar con el servidor." };
  }
};

export const fetchSessionRequest = async (token: string | null): Promise<ApiResponse<AuthSession>> => {
  if (!token) return { success: false };

  try {
    const response = await fetch(endpoint("/me"), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await safeJson(response);

    if (!response.ok) {
      return { success: false, error: getErrorMessage(data, "Sesión no válida.") };
    }

    const role = normalizeRole(data?.role);
    const userId = typeof data?.userId === "string" ? data.userId : (typeof data?.id === "string" ? data.id : null);
    if (!role || !userId) return { success: false, error: "Rol no válido." };

    return { success: true, data: { token, role, userId } };
  } catch {
    return { success: false, error: "No se pudo validar la sesión." };
  }
};
