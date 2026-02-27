/**
 * Types for client media uploads (progress photos & technique videos).
 */

export type PhotoAngle = "front" | "side" | "back";

export interface ProgressPhoto {
  id: string;
  clientId: string;
  angle: PhotoAngle;
  url: string;
  thumbnailUrl?: string;
  sessionDate: string; // ISO date of the photo session (groups 3 photos)
  uploadedAt: string;
}

export interface ProgressPhotoSession {
  date: string; // ISO date
  photos: ProgressPhoto[];
}

export interface TechniqueVideo {
  id: string;
  clientId: string;
  exerciseName: string;
  url: string;
  thumbnailUrl?: string;
  notes?: string;
  uploadedAt: string;
  expiresAt: string; // 7 days after upload
}

export const PHOTO_ANGLES: { key: PhotoAngle; label: string; emoji: string }[] = [
  { key: "front", label: "Frente", emoji: "🧍" },
  { key: "side", label: "Lateral", emoji: "🧍‍♂️" },
  { key: "back", label: "Espalda", emoji: "🔄" },
];

export const MAX_PHOTO_SIZE_MB = 5;
export const MAX_VIDEO_SIZE_MB = 50;
export const PHOTO_INTERVAL_DAYS = 15;
export const VIDEO_EXPIRY_DAYS = 7;
