/**
 * Admin Profile API Service
 *
 * Endpoints:
 *   GET    /api/profile/admin          → fetch profile
 *   PUT    /api/profile/admin          → update name, phone, timezone, language, notifications
 *   POST   /api/profile/avatar         → upload avatar (multipart/form-data), returns { avatarUrl }
 *   DELETE /api/profile/avatar         → delete current avatar
 *   PUT    /api/profile/email          → change email (requires currentPassword)
 *   PUT    /api/profile/password       → change password
 */

import { api, API_BASE_URL, AUTH_TOKEN_KEY } from "@/services/api";
import { DEV_MOCK, isLocalMode } from "@/config/devMode";

export interface AdminProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
  avatarUrl: string | null;
  timezone: string;
  language: string;
  theme: string;
  notifications: {
    email: boolean;
    push: boolean;
    newClient: boolean;
    paymentReminder: boolean;
  };
}

export interface UpdateProfilePayload {
  name: string;
  phone: string;
  timezone: string;
  language: string;
  notifications: AdminProfile["notifications"];
}

export interface ChangeEmailPayload {
  newEmail: string;
  currentPassword: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ── Dev mock fallbacks ──

const delay = (ms = 600) => new Promise((res) => setTimeout(res, ms));

let mockProfile: AdminProfile = {
  name: "Javier Ibáñez",
  email: "javier@jipcoaching.com",
  phone: "+34 600 123 456",
  role: "Coach",
  avatarUrl: null,
  timezone: "Europe/Madrid",
  language: "Español",
  theme: "dark",
  notifications: { email: true, push: true, newClient: true, paymentReminder: true },
};

// ── Fetch Profile ──

export async function fetchAdminProfile(): Promise<ApiResponse<AdminProfile>> {
  if (isLocalMode()) {
    await delay(400);
    return { success: true, data: { ...mockProfile } };
  }

  try {
    const data = await api.get<AdminProfile>("/profile/admin");
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Error al obtener perfil" };
  }
}

// ── Update Profile ──

export async function updateAdminProfile(payload: UpdateProfilePayload): Promise<ApiResponse<AdminProfile>> {
  if (isLocalMode()) {
    await delay();
    mockProfile = { ...mockProfile, ...payload };
    return { success: true, data: { ...mockProfile } };
  }

  try {
    await api.put("/profile/admin", payload);
    // Re-fetch to get updated data
    const data = await api.get<AdminProfile>("/profile/admin");
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Error al actualizar perfil" };
  }
}

// ── Upload Avatar ──

export async function uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: "Formato no permitido. Usa JPG, PNG o WebP." };
  }

  if (isLocalMode()) {
    await delay(800);
    const avatarUrl = URL.createObjectURL(file);
    mockProfile = { ...mockProfile, avatarUrl };
    return { success: true, data: { avatarUrl } };
  }

  try {
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    const res = await fetch(`${API_BASE_URL}/profile/avatar`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { success: false, error: body?.message ?? "Error al subir avatar" };
    }

    const data = await res.json();
    return { success: true, data: { avatarUrl: data.avatarUrl } };
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Error al subir avatar" };
  }
}

// ── Delete Avatar ──

export async function deleteAvatar(): Promise<ApiResponse> {
  if (isLocalMode()) {
    await delay();
    mockProfile = { ...mockProfile, avatarUrl: null };
    return { success: true };
  }

  try {
    await api.delete("/profile/avatar");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Error al eliminar avatar" };
  }
}

// ── Change Email ──

export async function changeEmail(payload: ChangeEmailPayload): Promise<ApiResponse> {
  if (isLocalMode()) {
    await delay();
    if (!payload.currentPassword) return { success: false, error: "Contraseña incorrecta." };
    return { success: true };
  }

  try {
    await api.put("/profile/email", payload);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Error al cambiar email" };
  }
}

// ── Change Password ──

export async function changePassword(payload: ChangePasswordPayload): Promise<ApiResponse> {
  if (isLocalMode()) {
    await delay();
    if (!payload.currentPassword) return { success: false, error: "Contraseña actual incorrecta." };
    return { success: true };
  }

  try {
    await api.put("/profile/password", payload);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Error al cambiar contraseña" };
  }
}
