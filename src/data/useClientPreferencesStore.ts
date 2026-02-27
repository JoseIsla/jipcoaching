import { create } from "zustand";

interface ClientPreferencesState {
  notificationSound: boolean;
  notificationVibration: boolean;
  /** Set of MediaComment IDs the client has already seen */
  seenCommentIds: Set<string>;
  setNotificationSound: (v: boolean) => void;
  setNotificationVibration: (v: boolean) => void;
  markCommentsSeen: (ids: string[]) => void;
  hasUnseenComment: (id: string) => boolean;
}

export const useClientPreferencesStore = create<ClientPreferencesState>((set, get) => ({
  notificationSound: true,
  notificationVibration: true,
  seenCommentIds: new Set<string>(),
  setNotificationSound: (v) => set({ notificationSound: v }),
  setNotificationVibration: (v) => set({ notificationVibration: v }),
  markCommentsSeen: (ids) =>
    set((s) => {
      const next = new Set(s.seenCommentIds);
      ids.forEach((id) => next.add(id));
      return { seenCommentIds: next };
    }),
  hasUnseenComment: (id) => !get().seenCommentIds.has(id),
}));
