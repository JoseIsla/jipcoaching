import { create } from "zustand";
import { mockClients, type Client } from "./mockData";

interface ClientStore {
  clients: Client[];
  addClient: (client: Client) => void;
  toggleStatus: (clientId: string) => { name: string; newStatus: string } | null;
  getActiveClients: () => Client[];
  getNewClientsThisMonth: () => Client[];
  getRetentionRate: () => number;
}

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export const useClientStore = create<ClientStore>((set, get) => ({
  clients: [...mockClients],

  addClient: (client) =>
    set((state) => ({ clients: [client, ...state.clients] })),

  toggleStatus: (clientId) => {
    let result: { name: string; newStatus: string } | null = null;
    set((state) => ({
      clients: state.clients.map((c) => {
        if (c.id !== clientId) return c;
        const newStatus = c.status === "Inactivo" ? "Activo" : "Inactivo";
        result = { name: c.name, newStatus };
        return { ...c, status: newStatus as Client["status"] };
      }),
    }));
    return result;
  },

  getActiveClients: () => get().clients.filter((c) => c.status === "Activo"),

  getNewClientsThisMonth: () =>
    get().clients.filter((c) => c.joinedMonth === getCurrentMonth()),

  getRetentionRate: () => {
    const all = get().clients;
    const total = all.length;
    const active = all.filter((c) => c.status !== "Inactivo").length;
    return total > 0 ? Math.round((active / total) * 100) : 0;
  },
}));
