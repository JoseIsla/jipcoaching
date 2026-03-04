import { create } from "zustand";
import { useNotificationStore } from "./notificationStore";

export interface ContactLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface ContactLeadsStore {
  leads: ContactLead[];
  addLead: (lead: Omit<ContactLead, "id" | "createdAt" | "read">) => void;
  markAsRead: (id: string) => void;
  deleteLead: (id: string) => void;
  getUnreadCount: () => number;
}

export const useContactLeadsStore = create<ContactLeadsStore>((set, get) => ({
  leads: [
    {
      id: "demo-1",
      name: "Laura García",
      email: "laura.garcia@gmail.com",
      phone: "+34 612 345 678",
      message: "Hola, estoy interesada en el plan de nutrición + entrenamiento. ¿Podríamos tener una llamada esta semana?",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: "demo-2",
      name: "Miguel Torres",
      email: "miguel.t@hotmail.com",
      phone: "+34 698 765 432",
      message: "Quiero empezar a entrenar en serio. Vi tu perfil y me gustaría saber más sobre tus servicios de coaching.",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      read: true,
    },
  ],

  addLead: (lead) => {
    set((state) => ({
      leads: [
        {
          ...lead,
          id: `lead-${Date.now()}`,
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...state.leads,
      ],
    }));
    // Also push an admin notification
    useNotificationStore.getState().addNotification({
      type: "client",
      titleKey: "header.notifNewLeadTitle",
      descriptionKey: "header.notifNewLeadDesc",
      descriptionVars: { name: lead.name },
      link: "/admin/leads",
    });
  },

  markAsRead: (id) =>
    set((state) => ({
      leads: state.leads.map((l) => (l.id === id ? { ...l, read: true } : l)),
    })),

  deleteLead: (id) =>
    set((state) => ({
      leads: state.leads.filter((l) => l.id !== id),
    })),

  getUnreadCount: () => get().leads.filter((l) => !l.read).length,
}));
