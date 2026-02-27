/**
 * Zustand store for client media (progress photos & technique videos).
 * Provides mock data for development and API integration hooks.
 */
import { create } from "zustand";
import type { ProgressPhoto, ProgressPhotoSession, TechniqueVideo, PhotoAngle } from "@/types/media";
import { PHOTO_INTERVAL_DAYS, VIDEO_EXPIRY_DAYS } from "@/types/media";

// ── Mock Data ──

const mockPhotos: ProgressPhoto[] = [
  {
    id: "ph-1", clientId: "1", angle: "front",
    url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50a?w=400&h=600&fit=crop",
    sessionDate: "2026-01-15", uploadedAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "ph-2", clientId: "1", angle: "side",
    url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50a?w=400&h=600&fit=crop",
    sessionDate: "2026-01-15", uploadedAt: "2026-01-15T10:01:00Z",
  },
  {
    id: "ph-3", clientId: "1", angle: "back",
    url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50a?w=400&h=600&fit=crop",
    sessionDate: "2026-01-15", uploadedAt: "2026-01-15T10:02:00Z",
  },
  {
    id: "ph-4", clientId: "1", angle: "front",
    url: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=600&fit=crop",
    sessionDate: "2026-02-01", uploadedAt: "2026-02-01T09:00:00Z",
  },
  {
    id: "ph-5", clientId: "1", angle: "side",
    url: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=600&fit=crop",
    sessionDate: "2026-02-01", uploadedAt: "2026-02-01T09:01:00Z",
  },
  {
    id: "ph-6", clientId: "1", angle: "back",
    url: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=600&fit=crop",
    sessionDate: "2026-02-01", uploadedAt: "2026-02-01T09:02:00Z",
  },
  {
    id: "ph-7", clientId: "1", angle: "front",
    url: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=600&fit=crop",
    sessionDate: "2026-02-15", uploadedAt: "2026-02-15T08:30:00Z",
  },
  {
    id: "ph-8", clientId: "1", angle: "side",
    url: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=600&fit=crop",
    sessionDate: "2026-02-15", uploadedAt: "2026-02-15T08:31:00Z",
  },
  {
    id: "ph-9", clientId: "1", angle: "back",
    url: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=600&fit=crop",
    sessionDate: "2026-02-15", uploadedAt: "2026-02-15T08:32:00Z",
  },
];

const mockVideos: TechniqueVideo[] = [
  {
    id: "vid-1", clientId: "1", exerciseName: "Sentadilla",
    url: "https://www.w3schools.com/html/mov_bbb.mp4",
    notes: "Revisión de profundidad",
    uploadedAt: "2026-02-24T14:00:00Z",
    expiresAt: "2026-03-03T14:00:00Z",
  },
  {
    id: "vid-2", clientId: "1", exerciseName: "Peso Muerto",
    url: "https://www.w3schools.com/html/mov_bbb.mp4",
    notes: "Posición de espalda en el setup",
    uploadedAt: "2026-02-25T10:00:00Z",
    expiresAt: "2026-03-04T10:00:00Z",
  },
];

// ── Store ──

interface MediaState {
  photos: ProgressPhoto[];
  videos: TechniqueVideo[];

  // Computed helpers
  getPhotoSessions: (clientId: string) => ProgressPhotoSession[];
  getActiveVideos: (clientId: string) => TechniqueVideo[];
  canUploadPhotos: (clientId: string) => boolean;
  getNextPhotoDate: (clientId: string) => string | null;

  // Actions
  addPhoto: (photo: ProgressPhoto) => void;
  addPhotoBatch: (photos: ProgressPhoto[]) => void;
  removePhoto: (photoId: string) => void;
  addVideo: (video: TechniqueVideo) => void;
  removeVideo: (videoId: string) => void;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  photos: mockPhotos,
  videos: mockVideos,

  getPhotoSessions: (clientId) => {
    const photos = get().photos.filter((p) => p.clientId === clientId);
    const byDate: Record<string, ProgressPhoto[]> = {};
    photos.forEach((p) => {
      if (!byDate[p.sessionDate]) byDate[p.sessionDate] = [];
      byDate[p.sessionDate].push(p);
    });
    return Object.entries(byDate)
      .map(([date, photos]) => ({ date, photos: photos.sort((a, b) => a.angle.localeCompare(b.angle)) }))
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  getActiveVideos: (clientId) => {
    const now = new Date().toISOString();
    return get().videos.filter((v) => v.clientId === clientId && v.expiresAt > now);
  },

  canUploadPhotos: (clientId) => {
    const sessions = get().getPhotoSessions(clientId);
    if (sessions.length === 0) return true;
    const lastDate = new Date(sessions[0].date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= PHOTO_INTERVAL_DAYS;
  },

  getNextPhotoDate: (clientId) => {
    const sessions = get().getPhotoSessions(clientId);
    if (sessions.length === 0) return null;
    const lastDate = new Date(sessions[0].date);
    lastDate.setDate(lastDate.getDate() + PHOTO_INTERVAL_DAYS);
    return lastDate.toISOString().split("T")[0];
  },

  addPhoto: (photo) => set((s) => ({ photos: [...s.photos, photo] })),
  addPhotoBatch: (photos) => set((s) => ({ photos: [...s.photos, ...photos] })),
  removePhoto: (photoId) => set((s) => ({ photos: s.photos.filter((p) => p.id !== photoId) })),
  addVideo: (video) => set((s) => ({ videos: [...s.videos, video] })),
  removeVideo: (videoId) => set((s) => ({ videos: s.videos.filter((v) => v.id !== videoId) })),
}));
