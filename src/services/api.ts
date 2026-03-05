/**
 * Centralized API client
 *
 * - Injects Authorization header from localStorage
 * - Handles 401 (auto-logout), 403, 400 globally
 * - Base URL from VITE_API_URL env var
 */

const AUTH_TOKEN_KEY = "jip_auth_token";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  "https://api.jipcoaching.com/api"
).trim().replace(/\/+$/, "");

const getToken = (): string | null => localStorage.getItem(AUTH_TOKEN_KEY);

const clearSessionAndRedirect = () => {
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

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  skipAuth?: boolean;
}

async function request<T = any>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { body, skipAuth, headers: extraHeaders, ...rest } = opts;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extraHeaders as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Handle global error statuses
  if (response.status === 401) {
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

  if (response.status === 403) {
    throw new ApiError(403, data, "Acceso denegado");
  }

  if (response.status === 400) {
    const msg =
      data?.message ??
      (Array.isArray(data?.errors) ? data.errors.join(", ") : "Error de validación");
    throw new ApiError(400, data, msg);
  }

  if (!response.ok) {
    const msg = data?.message ?? data?.error ?? `Error ${response.status}`;
    throw new ApiError(response.status, data, msg);
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
