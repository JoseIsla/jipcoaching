/**
 * Client Profile API Service
 *
 * Endpoints:
 *   GET    /api/profile/client          → fetch client profile
 *   PUT    /api/profile/client          → update name, phone
 *   POST   /api/profile/avatar          → upload avatar (multipart/form-data), returns { avatarUrl }
 *   DELETE /api/profile/avatar          → delete current avatar
 *   PUT    /api/profile/email           → change email (requires currentPassword)
 *   PUT    /api/profile/password        → change password
 */

import { api, API_BASE_URL, AUTH_TOKEN_KEY } from "@/services/api";
import { DEV_MOCK } from "@/config/devMode";

export interface ClientProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
}

export interface UpdateClientProfilePayload {
  name: string;
  phone: string;
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

let mockProfile: ClientProfile = {
  id: "c1",
  name: "Carlos García",
  email: "carlos@email.com",
  phone: "+34 612 345 678",
  avatarUrl: null,
};

// ── Fetch Profile ──

export async function fetchClientProfile(): Promise<ApiResponse<ClientProfile>> {
  if (DEV_MOCK) {
    await delay(400);
    return { success: true, data: { ...mockProfile } };
  }

  try {
    const data = await api.get<ClientProfile>("/profile/client");
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Error al obtener perfil" };
  }
}

// ── Update Profile ──

export async function updateClientProfile(payload: UpdateClientProfilePayload): Promise<ApiResponse<ClientProfile>> {
  if (DEV_MOCK) {
    await delay();
    mockProfile = { ...mockProfile, ...payload };
    return { success: true, data: { ...mockProfile } };
  }

  try {
    await api.put("/profile/client", payload);
    const data = await api.get<ClientProfile>("/profile/client");
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Error al actualizar perfil" };
  }
}

// ── Upload Avatar ──

export async function uploadClientAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
  const MAX_SIZE = 2 * 1024 * 1024;
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: "Formato no permitido. Usa JPG, PNG o WebP." };
  }
  if (file.size > MAX_SIZE) {
    return { success: false, error: "El archivo supera el tamaño máximo de 2MB." };
  }

  if (DEV_MOCK) {
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

export async function deleteClientAvatar(): Promise<ApiResponse> {
  if (DEV_MOCK) {
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

export async function changeClientEmail(payload: ChangeEmailPayload): Promise<ApiResponse> {
  if (DEV_MOCK) {
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

export async function changeClientPassword(payload: ChangePasswordPayload): Promise<ApiResponse> {
  if (DEV_MOCK) {
    await delay();
    if (!payload.currentPassword) return { success: false, error: "Contraseña actual incorrecta." };
    if (payload.newPassword.length < 6) return { success: false, error: "La contraseña debe tener al menos 6 caracteres." };
    return { success: true };
  }

  try {
    await api.put("/profile/password", payload);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Error al cambiar contraseña" };
  }
}
