import { create } from "zustand";
import { api } from "@/services/api";
import { DEV_MOCK, isLocalMode } from "@/config/devMode";

export type NotificationType = "checkin" | "client" | "plan" | "system";

export interface Notification {
  id: string;
  type: NotificationType;
  titleKey: string;
  descriptionKey: string;
  titleVars?: Record<string, string | number>;
  descriptionVars?: Record<string, string | number>;
  timestamp: Date;
  read: boolean;
  link?: string;
}

/** Map backend notification to frontend format */
const mapApiNotification = (n: any): Notification => ({
  id: n.id,
  type: (n.type || "system") as NotificationType,
  titleKey: n.title ?? "",
  descriptionKey: n.message ?? "",
  timestamp: new Date(n.createdAt),
  read: n.read ?? false,
  link: n.link ?? undefined,
});

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  /** IDs dismissed locally — survives until page reload so polling doesn't resurrect them */
  _dismissedIds: Set<string>;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
}

const initialNotifications: Notification[] = [
  {
    id: "n1",
    type: "checkin",
    titleKey: "header.notifCheckinTitle",
    descriptionKey: "header.notifCheckinDesc",
    descriptionVars: { name: "Carlos Martínez" },
    timestamp: new Date(Date.now() - 1000 * 60 * 12),
    read: false,
    link: "/admin/checkins",
  },
  {
    id: "n2",
    type: "client",
    titleKey: "header.notifNewClientTitle",
    descriptionKey: "header.notifNewClientDesc",
    descriptionVars: { name: "Sofía Ruiz", plan: "Recomposición" },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: false,
    link: "/admin/clients/6",
  },
  {
    id: "n3",
    type: "checkin",
    titleKey: "header.notifCheckinPendingTitle",
    descriptionKey: "header.notifCheckinPendingDesc",
    descriptionVars: { name: "Ana López" },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    read: false,
    link: "/admin/checkins",
  },
  {
    id: "n4",
    type: "plan",
    titleKey: "header.notifPlanEndingTitle",
    descriptionKey: "header.notifPlanEndingDesc",
    descriptionVars: { name: "María Jiménez", plan: "Peaking Meet", days: 1 },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    read: false,
    link: "/admin/training/t9",
  },
  {
    id: "n5",
    type: "system",
    titleKey: "header.notifSystemUpdateTitle",
    descriptionKey: "header.notifSystemUpdateDesc",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true,
  },
];

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: DEV_MOCK ? initialNotifications : [],
  unreadCount: DEV_MOCK ? initialNotifications.filter((n) => !n.read).length : 0,
  loading: false,
  _dismissedIds: new Set<string>(),

  fetchNotifications: async () => {
    if (isLocalMode()) {
      // Seed mock notifications if store is empty (demo mode)
      if (get().notifications.length === 0) {
        set({ notifications: initialNotifications, unreadCount: initialNotifications.filter((n) => !n.read).length });
      }
      return;
    }
    set({ loading: true });
    try {
      const data = await api.get<any[]>("/notifications");
      const dismissed = get()._dismissedIds;
      const notifications = (data ?? [])
        .map(mapApiNotification)
        .filter((n) => !dismissed.has(n.id));
      set({
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
        loading: false,
      });
    } catch (err: any) {
      console.warn("Failed to fetch notifications:", err?.message);
      set({ loading: false });
    }
  },

  markAsRead: (id) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return { notifications: updated, unreadCount: updated.filter((n) => !n.read).length };
    });

    if (!isLocalMode()) {
      api.patch(`/notifications/${id}/read`).catch(() => {});
    }
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));

    if (!isLocalMode()) {
      api.patch("/notifications/read-all").catch(() => {});
    }
  },

  removeNotification: (id) => {
    set((state) => {
      const dismissed = new Set(state._dismissedIds);
      dismissed.add(id);
      const updated = state.notifications.filter((n) => n.id !== id);
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
        _dismissedIds: dismissed,
      };
    });

    if (!isLocalMode()) {
      api.delete(`/notifications/${id}`).catch(() => {});
    }
  },

  clearAll: () => {
    const ids = get().notifications.map((n) => n.id);
    set((state) => {
      const dismissed = new Set(state._dismissedIds);
      ids.forEach((id) => dismissed.add(id));
      return { notifications: [], unreadCount: 0, _dismissedIds: dismissed };
    });

    if (!isLocalMode()) {
      ids.forEach((id) => api.delete(`/notifications/${id}`).catch(() => {}));
    }
  },

  addNotification: (notification) =>
    set((state) => {
      const newNotif: Notification = {
        ...notification,
        id: `n-${Date.now()}`,
        timestamp: new Date(),
        read: false,
      };
      return {
        notifications: [newNotif, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    }),
}));
