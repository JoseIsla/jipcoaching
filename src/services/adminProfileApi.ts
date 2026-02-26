/**
 * Admin Profile API Service
 * 
 * This service layer abstracts all profile-related API calls.
 * Currently uses mock data with simulated delays.
 * 
 * When connecting to your PostgreSQL backend, replace the mock
 * implementations with real fetch/axios calls to your API endpoints.
 * 
 * Expected backend endpoints:
 *   GET    /api/admin/profile          → fetch profile
 *   PUT    /api/admin/profile          → update name, phone, timezone, language, notifications
 *   POST   /api/admin/profile/avatar   → upload avatar (multipart/form-data), returns { avatarUrl }
 *   DELETE /api/admin/profile/avatar   → delete current avatar
 *   PUT    /api/admin/profile/email    → request email change (sends verification)
 *   PUT    /api/admin/profile/password → change password
 */

export interface AdminProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
  avatarUrl: string | null;
  timezone: string;
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    newClient: boolean;
    paymentReminder: boolean;
  };
}

const adminProfile: AdminProfile = {
  name: "Javier Ibáñez",
  email: "javier@jipcoaching.com",
  phone: "+34 600 123 456",
  role: "Coach",
  avatarUrl: null,
  timezone: "Europe/Madrid",
  language: "Español",
  notifications: {
    email: true,
    push: true,
    newClient: true,
    paymentReminder: true,
  },
};

// Simulated network delay
const delay = (ms = 600) => new Promise((res) => setTimeout(res, ms));

// In-memory mutable copy (simulates DB state)
let currentProfile: AdminProfile = { ...adminProfile };

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

// ── Fetch Profile ──────────────────────────────────────────────
export async function fetchAdminProfile(): Promise<ApiResponse<AdminProfile>> {
  await delay(400);
  // TODO: Replace with → GET /api/admin/profile
  return { success: true, data: { ...currentProfile } };
}

// ── Update Profile ─────────────────────────────────────────────
export async function updateAdminProfile(payload: UpdateProfilePayload): Promise<ApiResponse<AdminProfile>> {
  await delay();
  // TODO: Replace with → PUT /api/admin/profile { body: payload }
  currentProfile = { ...currentProfile, ...payload };
  return { success: true, data: { ...currentProfile } };
}

// ── Upload Avatar ──────────────────────────────────────────────
export async function uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
  await delay(800);

  // Validate file before sending
  const MAX_SIZE = 2 * 1024 * 1024; // 2MB
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: "Formato no permitido. Usa JPG, PNG o WebP." };
  }
  if (file.size > MAX_SIZE) {
    return { success: false, error: "El archivo supera el tamaño máximo de 2MB." };
  }

  // TODO: Replace with → POST /api/admin/profile/avatar (multipart/form-data)
  // The backend should:
  //   1. Delete the old avatar file from storage
  //   2. Save the new file
  //   3. Return the new URL
  const avatarUrl = URL.createObjectURL(file); // mock: use object URL
  currentProfile = { ...currentProfile, avatarUrl };
  return { success: true, data: { avatarUrl } };
}

// ── Delete Avatar ──────────────────────────────────────────────
export async function deleteAvatar(): Promise<ApiResponse> {
  await delay();
  // TODO: Replace with → DELETE /api/admin/profile/avatar
  currentProfile = { ...currentProfile, avatarUrl: null };
  return { success: true };
}

// ── Change Email ───────────────────────────────────────────────
export async function changeEmail(payload: ChangeEmailPayload): Promise<ApiResponse> {
  await delay();
  // TODO: Replace with → PUT /api/admin/profile/email { body: payload }
  // The backend should:
  //   1. Verify currentPassword
  //   2. Send verification email to newEmail
  //   3. Only update email in DB after verification link is clicked
  
  // Mock: simulate password check
  if (!payload.currentPassword) {
    return { success: false, error: "Contraseña incorrecta." };
  }
  return { success: true };
}

// ── Change Password ────────────────────────────────────────────
export async function changePassword(payload: ChangePasswordPayload): Promise<ApiResponse> {
  await delay();
  // TODO: Replace with → PUT /api/admin/profile/password { body: payload }
  // The backend should:
  //   1. Verify currentPassword against bcrypt hash
  //   2. Hash newPassword and update in DB
  
  // Mock: simulate password check
  if (!payload.currentPassword) {
    return { success: false, error: "Contraseña actual incorrecta." };
  }
  return { success: true };
}
