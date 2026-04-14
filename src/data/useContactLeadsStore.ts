import { create } from "zustand";
import { api } from "@/services/api";
import { DEV_MOCK, isLocalMode } from "@/config/devMode";
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
  loading: boolean;
  fetchLeads: () => Promise<void>;
  addLead: (lead: Omit<ContactLead, "id" | "createdAt" | "read">) => void;
  markAsRead: (id: string) => void;
  deleteLead: (id: string) => void;
  getUnreadCount: () => number;
}

const mockLeads: ContactLead[] = [
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
];

export const useContactLeadsStore = create<ContactLeadsStore>((set, get) => ({
  leads: DEV_MOCK ? mockLeads : [],
  loading: false,

  fetchLeads: async () => {
    if (isLocalMode()) {
      // Seed mock leads if store is empty (demo mode)
      if (get().leads.length === 0) {
        set({ leads: mockLeads });
      }
      return;
    }

    set({ loading: true });
    try {
      const data = await api.get<any[]>("/leads");
      set({
        leads: (data ?? []).map((l) => ({
          id: l.id,
          name: l.name,
          email: l.email,
          phone: l.phone ?? "",
          message: l.message,
          createdAt: l.createdAt,
          read: l.read ?? false,
        })),
        loading: false,
      });
    } catch (err: any) {
      console.warn("Failed to fetch leads:", err?.message);
      set({ loading: false });
    }
  },

  addLead: (lead) => {
    if (isLocalMode()) {
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
      useNotificationStore.getState().addNotification({
        type: "client",
        titleKey: "header.notifNewLeadTitle",
        descriptionKey: "header.notifNewLeadDesc",
        descriptionVars: { name: lead.name },
        link: "/admin/leads",
      });
      return;
    }

    // In production, the landing page form calls POST /api/leads directly (public)
    // The lead appears when admin fetches /api/leads
    api.post("/leads", lead).then(() => {
      get().fetchLeads();
    }).catch((err) => {
      console.warn("Failed to submit lead:", err?.message);
    });
  },

  markAsRead: (id) => {
    set((state) => ({
      leads: state.leads.map((l) => (l.id === id ? { ...l, read: true } : l)),
    }));

    if (!isLocalMode()) {
      api.patch(`/leads/${id}/read`).catch(() => {});
    }
  },

  deleteLead: (id) => {
    set((state) => ({
      leads: state.leads.filter((l) => l.id !== id),
    }));

    if (!isLocalMode()) {
      api.delete(`/leads/${id}`).catch(() => {});
    }
  },

  getUnreadCount: () => get().leads.filter((l) => !l.read).length,
}));
