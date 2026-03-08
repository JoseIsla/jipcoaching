import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ClientPreferencesState {
  notificationSound: boolean;
  notificationVibration: boolean;
  /** Set of MediaComment IDs the client has already seen */
  seenCommentIds: string[];
  setNotificationSound: (v: boolean) => void;
  setNotificationVibration: (v: boolean) => void;
  markCommentsSeen: (ids: string[]) => void;
  hasUnseenComment: (id: string) => boolean;
}

export const useClientPreferencesStore = create<ClientPreferencesState>()(
  persist(
    (set, get) => ({
      notificationSound: true,
      notificationVibration: true,
      seenCommentIds: [],
      setNotificationSound: (v) => set({ notificationSound: v }),
      setNotificationVibration: (v) => set({ notificationVibration: v }),
      markCommentsSeen: (ids) =>
        set((s) => {
          const next = new Set([...s.seenCommentIds, ...ids]);
          return { seenCommentIds: Array.from(next) };
        }),
      hasUnseenComment: (id) => !get().seenCommentIds.includes(id),
    }),
    {
      name: "client-preferences",
    },
  ),
);
