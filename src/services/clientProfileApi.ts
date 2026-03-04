/**
 * Client Profile API Service
 * 
 * This service layer abstracts all client profile-related API calls.
 * Currently uses mock data with simulated delays.
 * 
 * When connecting to your backend, replace the mock
 * implementations with real fetch/axios calls to your API endpoints.
 * 
 * Expected backend endpoints:
 *   GET    /api/client/profile          → fetch client profile
 *   PUT    /api/client/profile          → update name, phone
 *   POST   /api/client/profile/avatar   → upload avatar (multipart/form-data), returns { avatarUrl }
 *   DELETE /api/client/profile/avatar   → delete current avatar
 *   PUT    /api/client/profile/email    → request email change (sends verification)
 *   PUT    /api/client/profile/password → change password
 */

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

// Simulated network delay
const delay = (ms = 600) => new Promise((res) => setTimeout(res, ms));

// In-memory mutable copy (simulates DB state)
let currentProfile: ClientProfile = {
  id: "c1",
  name: "Carlos García",
  email: "carlos@email.com",
  phone: "+34 612 345 678",
  avatarUrl: null,
};

// ── Fetch Profile ──────────────────────────────────────────────
export async function fetchClientProfile(): Promise<ApiResponse<ClientProfile>> {
  await delay(400);
  // TODO: Replace with → GET /api/client/profile (uses JWT from localStorage)
  return { success: true, data: { ...currentProfile } };
}

// ── Update Profile ─────────────────────────────────────────────
export async function updateClientProfile(payload: UpdateClientProfilePayload): Promise<ApiResponse<ClientProfile>> {
  await delay();
  // TODO: Replace with → PUT /api/client/profile { body: payload }
  currentProfile = { ...currentProfile, ...payload };
  return { success: true, data: { ...currentProfile } };
}

// ── Upload Avatar ──────────────────────────────────────────────
export async function uploadClientAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
  await delay(800);

  const MAX_SIZE = 2 * 1024 * 1024; // 2MB
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: "Formato no permitido. Usa JPG, PNG o WebP." };
  }
  if (file.size > MAX_SIZE) {
    return { success: false, error: "El archivo supera el tamaño máximo de 2MB." };
  }

  // TODO: Replace with → POST /api/client/profile/avatar (multipart/form-data)
  const avatarUrl = URL.createObjectURL(file);
  currentProfile = { ...currentProfile, avatarUrl };
  return { success: true, data: { avatarUrl } };
}

// ── Delete Avatar ──────────────────────────────────────────────
export async function deleteClientAvatar(): Promise<ApiResponse> {
  await delay();
  // TODO: Replace with → DELETE /api/client/profile/avatar
  currentProfile = { ...currentProfile, avatarUrl: null };
  return { success: true };
}

// ── Change Email ───────────────────────────────────────────────
export async function changeClientEmail(payload: ChangeEmailPayload): Promise<ApiResponse> {
  await delay();
  // TODO: Replace with → PUT /api/client/profile/email { body: payload }
  // Backend should:
  //   1. Verify currentPassword
  //   2. Send verification email to newEmail
  //   3. Only update email in DB after verification link is clicked

  if (!payload.currentPassword) {
    return { success: false, error: "Contraseña incorrecta." };
  }
  return { success: true };
}

// ── Change Password ────────────────────────────────────────────
export async function changeClientPassword(payload: ChangePasswordPayload): Promise<ApiResponse> {
  await delay();
  // TODO: Replace with → PUT /api/client/profile/password { body: payload }
  // Backend should:
  //   1. Verify currentPassword against bcrypt hash
  //   2. Hash newPassword and update in DB

  if (!payload.currentPassword) {
    return { success: false, error: "Contraseña actual incorrecta." };
  }
  if (payload.newPassword.length < 6) {
    return { success: false, error: "La contraseña debe tener al menos 6 caracteres." };
  }
  return { success: true };
}
