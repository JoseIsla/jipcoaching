import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
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

interface PersistedClientNotificationState {
  _dismissedIds: string[];
}

const dismissedIdsStorage = createJSONStorage<PersistedClientNotificationState>(() => localStorage, {
  reviver: (key, value) => (key === "_dismissedIds" && Array.isArray(value) ? new Set(value) : value),
  replacer: (key, value) => (key === "_dismissedIds" && value instanceof Set ? Array.from(value) : value),
});

interface ClientNotificationState {
  notifications: ClientNotification[];
  /** IDs dismissed locally during the session so navigation/polling doesn't resurrect them */
  _dismissedIds: Set<string>;
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
  /** Remove a notification and remember it was dismissed this session */
  dismissNotification: (id: string) => void;
  /** Auto-dismiss: remove notifications whose autoDismissKey matches */
  dismissByKey: (key: string) => void;
  /** Whether an id has been dismissed locally this session */
  isDismissed: (id: string) => boolean;
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

export const useClientNotificationStore = create<ClientNotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      _dismissedIds: new Set<string>(),
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
        set((s) => {
          if (s._dismissedIds.has(notification.id)) return s;
          if (s.notifications.some((n) => n.id === notification.id)) return s;
          return {
            notifications: [notification, ...s.notifications],
          };
        }),

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

      dismissNotification: (id) =>
        set((s) => {
          const dismissed = new Set(s._dismissedIds);
          dismissed.add(id);
          return {
            notifications: s.notifications.filter((n) => n.id !== id),
            _dismissedIds: dismissed,
          };
        }),

      dismissByKey: (key) =>
        set((s) => {
          const dismissed = new Set(s._dismissedIds);
          const remaining = s.notifications.filter((n) => {
            const match = n.autoDismissKey === key;
            if (match) dismissed.add(n.id);
            return !match;
          });
          return {
            notifications: remaining,
            _dismissedIds: dismissed,
          };
        }),

      isDismissed: (id) => get()._dismissedIds.has(id),

      getUnreadCount: () => get().notifications.filter((n) => !n.read).length,

      shouldPlaySound: () => {
        const unread = get().getUnreadCount();
        const { _lastKnownUnread, _loginSoundPlayed } = get();

        if (!_loginSoundPlayed) {
          set({ _loginSoundPlayed: true, _lastKnownUnread: unread });
          return unread > 0;
        }

        if (unread > _lastKnownUnread) {
          set({ _lastKnownUnread: unread });
          return true;
        }

        if (unread !== _lastKnownUnread) {
          set({ _lastKnownUnread: unread });
        }
        return false;
      },

      clear: () => set({ notifications: [], _dismissedIds: new Set<string>(), _lastKnownUnread: 0, _loginSoundPlayed: false }),
    }),
    {
      name: "jip-client-notification-dismissed",
      storage: dismissedIdsStorage,
      partialize: (state) => ({
        _dismissedIds: Array.from(state._dismissedIds),
      }),
      merge: (persisted, current) => {
        const typedPersisted = persisted as Partial<PersistedClientNotificationState> | undefined;
        return {
          ...current,
          _dismissedIds: new Set(typedPersisted?._dismissedIds ?? []),
        };
      },
    }
  )
);
