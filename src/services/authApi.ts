export type UserRole = "admin" | "client";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthSession {
  token: string | null;
  role: UserRole;
}

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").trim();

const endpoint = (path: string) => `${API_BASE_URL}${path}`;

const normalizeRole = (role: unknown): UserRole | null => {
  if (typeof role !== "string") return null;

  const value = role.toLowerCase();
  if (value === "admin") return "admin";
  if (value === "client" || value === "cliente" || value === "user") return "client";

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
  if (payload && typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }
  if (payload && typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }
  return fallback;
};

export const loginRequest = async (payload: LoginPayload): Promise<ApiResponse<AuthSession>> => {
  try {
    const response = await fetch(endpoint("/api/auth/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await safeJson(response);

    if (!response.ok) {
      return {
        success: false,
        error: getErrorMessage(data, "Credenciales inválidas."),
      };
    }

    const role = normalizeRole(data?.role ?? data?.user?.role);
    if (!role) {
      return {
        success: false,
        error: "El backend no devolvió un rol válido para el usuario.",
      };
    }

    return {
      success: true,
      data: {
        token: typeof data?.token === "string" ? data.token : null,
        role,
      },
    };
  } catch {
    return {
      success: false,
      error: "No se pudo conectar con el servidor de autenticación.",
    };
  }
};

export const fetchSessionRequest = async (token: string | null): Promise<ApiResponse<AuthSession>> => {
  try {
    const response = await fetch(endpoint("/api/auth/session"), {
      method: "GET",
      credentials: "include",
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
    });

    const data = await safeJson(response);

    if (!response.ok) {
      return {
        success: false,
        error: getErrorMessage(data, "Sesión no válida."),
      };
    }

    const role = normalizeRole(data?.role ?? data?.user?.role);
    if (!role) {
      return {
        success: false,
        error: "No se pudo validar el rol de la sesión.",
      };
    }

    return {
      success: true,
      data: {
        token: typeof data?.token === "string" ? data.token : token,
        role,
      },
    };
  } catch {
    return {
      success: false,
      error: "No se pudo validar la sesión actual.",
    };
  }
};

export const logoutRequest = async (token: string | null): Promise<void> => {
  try {
    await fetch(endpoint("/api/auth/logout"), {
      method: "POST",
      credentials: "include",
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
    });
  } catch {
    // Intencionalmente ignorado para asegurar limpieza local de sesión.
  }
};
