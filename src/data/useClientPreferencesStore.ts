import { create } from "zustand";

interface ClientPreferencesState {
  notificationSound: boolean;
  notificationVibration: boolean;
  setNotificationSound: (v: boolean) => void;
  setNotificationVibration: (v: boolean) => void;
}

export const useClientPreferencesStore = create<ClientPreferencesState>((set) => ({
  notificationSound: true,
  notificationVibration: true,
  setNotificationSound: (v) => set({ notificationSound: v }),
  setNotificationVibration: (v) => set({ notificationVibration: v }),
}));
