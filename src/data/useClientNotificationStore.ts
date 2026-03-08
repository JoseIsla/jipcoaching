import { create } from "zustand";
import type { ServiceType } from "@/types/api";

export type ClientNotificationType =
  | "nutrition_checkin"
  | "training_checkin"
  | "video_comment"
  | "payment"
  | "plan"
  | "system";

export interface ClientNotification {
  id: string;
  type: ClientNotificationType;
  titleKey: string;
  descriptionKey: string;
  titleVars?: Record<string, string | number>;
  descriptionVars?: Record<string, string | number>;
  timestamp: Date;
  read: boolean;
  link: string;
  /** Auto-dismiss key: when this check-in entry id is submitted, dismiss */
  autoDismissKey?: string;
}

interface ClientNotificationState {
  notifications: ClientNotification[];
  /** Tracks last known unread count to detect genuine new notifications */
  _lastKnownUnread: number;
  /** Whether the initial login sound has been played this session */
  _loginSoundPlayed: boolean;
  /** Generates notifications based on client services and current day */
  generateForClient: (clientId: string, services: ServiceType[], pendingCheckinIds: string[]) => void;
  /** Add a single notification (e.g. from admin actions) */
  addNotification: (notification: ClientNotification) => void;
  /** Mark a single notification as read */
  markRead: (id: string) => void;
  /** Mark all as read */
  markAllRead: () => void;
  /** Auto-dismiss: remove notifications whose autoDismissKey matches */
  dismissByKey: (key: string) => void;
  /** Get unread count */
  getUnreadCount: () => number;
  /** Check if sound should play and update tracking. Returns true if sound should play. */
  shouldPlaySound: () => boolean;
  /** Clear all */
  clear: () => void;
}

const getDayOfWeek = () => new Date().getDay();

const isCheckinDay = (service: ServiceType): boolean => {
  const day = getDayOfWeek();
  if (service === "nutrition") return day === 2 || day === 5;
  if (service === "training") return day === 0;
  return false;
};

const getCheckinDayLabel = (service: ServiceType): string => {
  const day = getDayOfWeek();
  if (service === "nutrition") {
    if (day === 2) return "Martes";
    if (day === 5) return "Viernes";
  }
  if (service === "training") return "Domingo";
  return "";
};

export const useClientNotificationStore = create<ClientNotificationState>((set, get) => ({
  notifications: [],
  _lastKnownUnread: 0,
  _loginSoundPlayed: false,

  generateForClient: (clientId, services, pendingCheckinIds) => {
    const existing = get().notifications;
    if (existing.length > 0 && existing[0].id.startsWith(`cn-${clientId}`)) return;

    const notifs: ClientNotification[] = [];
    const now = new Date();

    services.forEach((service) => {
      const hasPending = pendingCheckinIds.length > 0;

      if (service === "nutrition") {
        const isDay = isCheckinDay("nutrition");
        if (isDay || hasPending) {
          notifs.push({
            id: `cn-${clientId}-nutrition-${now.getTime()}`,
            type: "nutrition_checkin",
            titleKey: "clientNotifications.nutritionCheckinTitle",
            descriptionKey: "clientNotifications.nutritionCheckinDesc",
            descriptionVars: { day: getCheckinDayLabel("nutrition") || "hoy" },
            timestamp: now,
            read: false,
            link: "/client/checkins",
          });
        }
      }

      if (service === "training") {
        const isDay = isCheckinDay("training");
        if (isDay || hasPending) {
          notifs.push({
            id: `cn-${clientId}-training-${now.getTime()}`,
            type: "training_checkin",
            titleKey: "clientNotifications.trainingCheckinTitle",
            descriptionKey: "clientNotifications.trainingCheckinDesc",
            timestamp: now,
            read: false,
            link: "/client/checkins",
          });
        }
      }
    });

    set({ notifications: notifs });
  },

  addNotification: (notification) =>
    set((s) => ({
      notifications: [notification, ...s.notifications],
    })),

  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),

  dismissByKey: (key) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.autoDismissKey !== key),
    })),

  getUnreadCount: () => get().notifications.filter((n) => !n.read).length,

  shouldPlaySound: () => {
    const unread = get().getUnreadCount();
    const { _lastKnownUnread, _loginSoundPlayed } = get();

    // First call (login): play once if there are unread
    if (!_loginSoundPlayed) {
      set({ _loginSoundPlayed: true, _lastKnownUnread: unread });
      return unread > 0;
    }

    // Subsequent: only play if unread genuinely increased
    if (unread > _lastKnownUnread) {
      set({ _lastKnownUnread: unread });
      return true;
    }

    // Always sync the tracked count (e.g. if it decreased)
    if (unread !== _lastKnownUnread) {
      set({ _lastKnownUnread: unread });
    }
    return false;
  },

  clear: () => set({ notifications: [], _lastKnownUnread: 0, _loginSoundPlayed: false }),
}));
