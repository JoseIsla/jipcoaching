import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ClientPreferencesState {
  notificationVibration: boolean;
  /** Set of MediaComment IDs the client has already seen */
  seenCommentIds: string[];
  setNotificationVibration: (v: boolean) => void;
  markCommentsSeen: (ids: string[]) => void;
  hasUnseenComment: (id: string) => boolean;
}

export const useClientPreferencesStore = create<ClientPreferencesState>()(
  persist(
    (set, get) => ({
      notificationVibration: true,
      seenCommentIds: [],
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
