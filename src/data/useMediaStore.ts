/**
 * Zustand store for client media (progress photos & technique videos).
 * Uses mock data in DEV_MOCK mode, real API otherwise.
 */
import { create } from "zustand";
import { api } from "@/services/api";
import { DEV_MOCK } from "@/config/devMode";
import type { ProgressPhoto, ProgressPhotoSession, TechniqueVideo, MediaComment } from "@/types/media";
import { PHOTO_INTERVAL_DAYS } from "@/types/media";

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

const mockComments: MediaComment[] = [
  {
    id: "mc-1", targetType: "photo_session", targetId: "2026-02-15",
    clientId: "1", authorName: "Javier Ibáñez",
    text: "Buen progreso en la espalda. Se nota más definición en los dorsales.",
    createdAt: "2026-02-16T09:00:00Z",
  },
  {
    id: "mc-2", targetType: "video", targetId: "vid-1",
    clientId: "1", authorName: "Javier Ibáñez",
    text: "La profundidad ha mejorado. Intenta mantener las rodillas más abiertas en la fase concéntrica.",
    createdAt: "2026-02-25T08:00:00Z",
  },
  {
    id: "mc-3", targetType: "video", targetId: "tv-mock-1",
    clientId: "1", authorName: "Javier Ibáñez",
    text: "Buena profundidad en la sentadilla del check-in. Sigue trabajando la posición de rodillas.",
    createdAt: "2026-01-27T10:00:00Z",
  },
];

// ── Store ──

interface MediaState {
  photos: ProgressPhoto[];
  videos: TechniqueVideo[];
  comments: MediaComment[];
  loading: boolean;

  // Fetch from API
  fetchPhotos: (clientId: string) => Promise<void>;
  fetchVideos: (clientId: string) => Promise<void>;
  fetchComments: (clientId: string) => Promise<void>;

  // Computed helpers
  getPhotoSessions: (clientId: string) => ProgressPhotoSession[];
  getActiveVideos: (clientId: string) => TechniqueVideo[];
  canUploadPhotos: (clientId: string) => boolean;
  getNextPhotoDate: (clientId: string) => string | null;
  getComments: (targetType: MediaComment["targetType"], targetId: string) => MediaComment[];

  // Actions
  addPhoto: (photo: ProgressPhoto) => void;
  addPhotoBatch: (photos: ProgressPhoto[]) => void;
  removePhoto: (photoId: string) => void;
  addVideo: (video: TechniqueVideo) => void;
  removeVideo: (videoId: string) => void;
  addComment: (comment: MediaComment) => void;
  removeComment: (commentId: string) => void;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  photos: DEV_MOCK ? mockPhotos : [],
  videos: DEV_MOCK ? mockVideos : [],
  comments: DEV_MOCK ? mockComments : [],
  loading: false,

  fetchPhotos: async (clientId) => {
    if (DEV_MOCK) return;
    set({ loading: true });
    try {
      const data = await api.get<ProgressPhoto[]>(`/clients/${clientId}/media/photos`);
      set((s) => ({
        photos: [
          ...s.photos.filter((p) => p.clientId !== clientId),
          ...(data ?? []),
        ],
        loading: false,
      }));
    } catch (err: any) {
      console.warn("Failed to fetch photos:", err?.message);
      set({ loading: false });
    }
  },

  fetchVideos: async (clientId) => {
    if (DEV_MOCK) return;
    set({ loading: true });
    try {
      const data = await api.get<TechniqueVideo[]>(`/clients/${clientId}/media/videos`);
      set((s) => ({
        videos: [
          ...s.videos.filter((v) => v.clientId !== clientId),
          ...(data ?? []),
        ],
        loading: false,
      }));
    } catch (err: any) {
      console.warn("Failed to fetch videos:", err?.message);
      set({ loading: false });
    }
  },

  fetchComments: async (clientId) => {
    if (DEV_MOCK) return;
    try {
      const data = await api.get<MediaComment[]>(`/media/comments?clientId=${clientId}`);
      set((s) => ({
        comments: [
          ...s.comments.filter((c) => c.clientId !== clientId),
          ...(data ?? []),
        ],
      }));
    } catch (err: any) {
      console.warn("Failed to fetch comments:", err?.message);
    }
  },

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

  getComments: (targetType, targetId) =>
    get().comments
      .filter((c) => c.targetType === targetType && c.targetId === targetId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

  addPhoto: (photo) => set((s) => ({ photos: [...s.photos, photo] })),
  addPhotoBatch: (photos) => set((s) => ({ photos: [...s.photos, ...photos] })),
  removePhoto: (photoId) => {
    set((s) => ({ photos: s.photos.filter((p) => p.id !== photoId) }));
    if (!DEV_MOCK) {
      api.delete(`/media/photos/${photoId}`).catch(() => {});
    }
  },
  addVideo: (video) => set((s) => ({ videos: [...s.videos, video] })),
  removeVideo: (videoId) => {
    set((s) => ({ videos: s.videos.filter((v) => v.id !== videoId) }));
    if (!DEV_MOCK) {
      api.delete(`/media/videos/${videoId}`).catch(() => {});
    }
  },
  addComment: (comment) => {
    set((s) => ({ comments: [...s.comments, comment] }));
    if (!DEV_MOCK) {
      // Post to API — server will generate id/createdAt
      api.post<MediaComment>("/media/comments", {
        targetType: comment.targetType,
        targetId: comment.targetId,
        clientId: comment.clientId,
        authorName: comment.authorName,
        text: comment.text,
      }).then((saved) => {
        if (saved?.id) {
          // Replace local placeholder with server response
          set((s) => ({
            comments: s.comments.map((c) => c.id === comment.id ? { ...comment, ...saved } : c),
          }));
        }
      }).catch(() => {});
    }
  },
  removeComment: (commentId) => {
    set((s) => ({ comments: s.comments.filter((c) => c.id !== commentId) }));
    if (!DEV_MOCK) {
      api.delete(`/media/comments/${commentId}`).catch(() => {});
    }
  },
}));
