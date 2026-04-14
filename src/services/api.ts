/**
 * Centralized API client
 *
 * - Injects Authorization header from localStorage
 * - Handles 401 (auto-logout), 403, 400 globally
 * - Shows toast notifications on errors
 * - Base URL from VITE_API_URL env var
 */

import { toast } from "@/hooks/use-toast";

const AUTH_TOKEN_KEY = "jip_auth_token";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  "https://api.jipcoaching.com/api"
).trim().replace(/\/+$/, "");

const getToken = (): string | null => localStorage.getItem(AUTH_TOKEN_KEY);

/** Track when a login is in progress to avoid the 401 interceptor clearing the session */
let _loginInProgress = false;
export const setLoginInProgress = (v: boolean) => { _loginInProgress = v; };

const clearSessionAndRedirect = () => {
  // Don't interfere during login flow or on login/landing pages
  if (_loginInProgress) return;
  const path = window.location.pathname;
  if (path === "/login" || path === "/" || path === "/forgot-password" || path === "/reset-password" || path === "/verify-email") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  window.location.href = "/login";
};

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(status: number, body: any, message?: string) {
    super(message ?? `API error ${status}`);
    this.status = status;
    this.body = body;
  }
}

/** Show a toast for API errors (debounced for 401 to avoid spam on redirect) */
const showErrorToast = (error: ApiError) => {
  // Skip toast for 401 — user is being redirected to login
  if (error.status === 401) return;

  const titles: Record<number, string> = {
    400: "Error de validación",
    403: "Acceso denegado",
    404: "No encontrado",
    500: "Error del servidor",
  };

  toast({
    variant: "destructive",
    title: titles[error.status] ?? `Error ${error.status}`,
    description: error.message,
  });
};

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  skipAuth?: boolean;
  /** If true, suppress the global error toast (caller handles errors) */
  silent?: boolean;
}

async function request<T = any>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { body, skipAuth, silent, headers: extraHeaders, ...rest } = opts;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extraHeaders as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    const error = new ApiError(0, null, "No se pudo conectar con el servidor");
    if (!silent) showErrorToast(error);
    throw error;
  }

  // Handle global error statuses
  if (response.status === 401 && !skipAuth) {
    clearSessionAndRedirect();
    throw new ApiError(401, null, "Sesión expirada");
  }

  let data: any = null;
  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : null;
  } catch {
    // non-JSON response
  }

  if (!response.ok) {
    let msg: string;
    if (response.status === 403) {
      msg = "No tienes permisos para esta acción";
    } else if (response.status === 400) {
      msg = data?.message ??
        (Array.isArray(data?.errors) ? data.errors.join(", ") : "Error de validación");
    } else {
      msg = data?.message ?? data?.error ?? `Error ${response.status}`;
    }

    const error = new ApiError(response.status, data, msg);
    if (!silent) showErrorToast(error);
    throw error;
  }

  return data as T;
}

export const api = {
  get: <T = any>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "GET" }),

  post: <T = any>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "POST", body }),

  put: <T = any>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "PUT", body }),

  patch: <T = any>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "PATCH", body }),

  delete: <T = any>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "DELETE" }),
};

export { API_BASE_URL, AUTH_TOKEN_KEY };
