/**
 * API service for client media uploads.
 * Ready to connect to NestJS backend endpoints.
 */
import { api, API_BASE_URL, AUTH_TOKEN_KEY } from "./api";
import type { ProgressPhoto, TechniqueVideo } from "@/types/media";

const getToken = (): string | null => localStorage.getItem(AUTH_TOKEN_KEY);

/** Upload a file using multipart/form-data (bypasses JSON api client) */
async function uploadFile<T>(path: string, file: File, extraFields?: Record<string, string>): Promise<T> {
  const formData = new FormData();
  formData.append("file", file);
  if (extraFields) {
    Object.entries(extraFields).forEach(([k, v]) => formData.append(k, v));
  }

  const token = getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Upload failed (${res.status})`);
  }

  return res.json();
}

// ── Progress Photos ──

export const mediaApi = {
  /** Upload a progress photo */
  uploadProgressPhoto: (clientId: string, file: File, angle: string, sessionDate: string) =>
    uploadFile<ProgressPhoto>(`/clients/${clientId}/media/photos`, file, { angle, sessionDate }),

  /** Get all photo sessions for a client */
  getProgressPhotos: (clientId: string) =>
    api.get<ProgressPhoto[]>(`/clients/${clientId}/media/photos`),

  /** Delete a progress photo */
  deleteProgressPhoto: (clientId: string, photoId: string) =>
    api.delete(`/clients/${clientId}/media/photos/${photoId}`),

  // ── Technique Videos ──

  /** Upload a technique video (standalone, not linked to a check-in) */
  uploadTechniqueVideo: (clientId: string, file: File, exerciseName: string, notes?: string) =>
    uploadFile<TechniqueVideo>(`/clients/${clientId}/media/videos`, file, {
      exerciseName,
      ...(notes ? { notes } : {}),
    }),

  /** Get all active videos for a client */
  getTechniqueVideos: (clientId: string) =>
    api.get<TechniqueVideo[]>(`/clients/${clientId}/media/videos`),

  /** Delete a technique video */
  deleteTechniqueVideo: (clientId: string, videoId: string) =>
    api.delete(`/clients/${clientId}/media/videos/${videoId}`),

  // ── Check-in Videos (linked to a specific check-in) ──

  /** Upload a technique video linked to a check-in */
  uploadCheckinVideo: (checkinId: string, file: File, exerciseName: string, notes?: string) =>
    uploadFile<{ id: string; techniqueVideoId: string; exerciseName: string; url: string; notes?: string; uploadedAt: string }>(
      `/checkins/${checkinId}/videos`, file, {
        exerciseName,
        ...(notes ? { notes } : {}),
      }),

  /** Delete a check-in video */
  deleteCheckinVideo: (checkinId: string, videoId: string) =>
    api.delete(`/checkins/${checkinId}/videos/${videoId}`),
};
