import { create } from "zustand";
import type { ServiceType } from "@/data/mockData";

export interface ClientNotification {
  id: string;
  type: "nutrition_checkin" | "training_checkin";
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
  /** Generates notifications based on client services and current day */
  generateForClient: (clientId: string, services: ServiceType[], pendingCheckinIds: string[]) => void;
  /** Mark a single notification as read */
  markRead: (id: string) => void;
  /** Mark all as read */
  markAllRead: () => void;
  /** Auto-dismiss: remove notifications whose autoDismissKey matches */
  dismissByKey: (key: string) => void;
  /** Get unread count */
  getUnreadCount: () => number;
  /** Clear all */
  clear: () => void;
}

const getDayOfWeek = () => new Date().getDay(); // 0=Sun, 1=Mon, 2=Tue, ...

const isCheckinDay = (service: ServiceType): boolean => {
  const day = getDayOfWeek();
  if (service === "nutrition") return day === 2 || day === 5; // Tue or Fri
  if (service === "training") return day === 0; // Sun
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

  generateForClient: (clientId, services, pendingCheckinIds) => {
    const existing = get().notifications;
    // Don't regenerate if already generated for this client
    if (existing.length > 0 && existing[0].id.startsWith(`cn-${clientId}`)) return;

    const notifs: ClientNotification[] = [];
    const now = new Date();

    services.forEach((service) => {
      // Always show if there are pending check-ins for this service
      const hasPending = pendingCheckinIds.length > 0;

      if (service === "nutrition") {
        // Check if it's a nutrition day or there are pending nutrition check-ins
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

  clear: () => set({ notifications: [] }),
}));
