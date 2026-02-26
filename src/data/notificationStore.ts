import { create } from "zustand";

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

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
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
    link: "/admin/questionnaires",
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
    link: "/admin/questionnaires",
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

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: initialNotifications,
  unreadCount: initialNotifications.filter((n) => !n.read).length,
  markAsRead: (id) =>
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return { notifications: updated, unreadCount: updated.filter((n) => !n.read).length };
    }),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  removeNotification: (id) =>
    set((state) => {
      const updated = state.notifications.filter((n) => n.id !== id);
      return { notifications: updated, unreadCount: updated.filter((n) => !n.read).length };
    }),
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
