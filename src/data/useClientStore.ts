import { create } from "zustand";
import { api, API_BASE_URL } from "@/services/api";
import type { ApiClient, CreateClientDto, ServiceType } from "@/types/api";
import { isClientActive, getServicesFromPack } from "@/types/api";
import { DEV_MOCK } from "@/config/devMode";
import { mockClients } from "@/data/mockClients";

/** Resolve relative upload URLs to full server URLs */
const resolveUrl = (url: string | null | undefined): string | undefined => {
  if (!url || url.startsWith("http") || url.startsWith("blob:")) return url;
  const serverRoot = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${serverRoot}${url}`;
};

/** Enrich raw API response with computed `services` field */
const enrichClient = (raw: any): ApiClient => ({
  ...raw,
  name: raw.name ?? "Sin nombre",
  email: raw.email ?? "",
  avatarUrl: resolveUrl(raw.avatarUrl),
  services: getServicesFromPack(raw.packType),
});

interface ClientStore {
  clients: ApiClient[];
  loading: boolean;
  error: string | null;
  fetchClients: () => Promise<void>;
  addClient: (dto: CreateClientDto) => Promise<ApiClient>;
  updateClient: (id: string, updates: Partial<ApiClient>) => void;
  updateClientStatus: (id: string, status: string) => void;
  deleteClient: (id: string) => void;
  getClient: (id: string) => ApiClient | undefined;
  getActiveClients: () => ApiClient[];
  getRetentionRate: () => number;
}

export const useClientStore = create<ClientStore>((set, get) => ({
  clients: [],
  loading: false,
  error: null,

  fetchClients: async (forceRefresh = false) => {
    // If already loaded and not forcing, skip re-fetch
    if (!forceRefresh && get().clients.length > 0) {
      return;
    }

    set({ loading: true, error: null });

    if (DEV_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      set({ clients: mockClients, loading: false });
      return;
    }

    try {
      const data = await api.get<any[]>("/clients");
      set({ clients: (data ?? []).map(enrichClient), loading: false });
    } catch (err: any) {
      set({ error: err?.message ?? "Error al cargar clientes", loading: false });
    }
  },

  addClient: async (dto: CreateClientDto) => {
    if (DEV_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      const created: ApiClient = {
        id: `mock-${Date.now()}`,
        name: dto.name,
        email: dto.email,
        packType: dto.packType,
        status: dto.status,
        monthlyFee: dto.monthlyFee,
        notes: dto.notes,
        services: getServicesFromPack(dto.packType),
      };
      set((state) => ({ clients: [created, ...state.clients] }));
      return created;
    }
    const raw = await api.post<any>("/clients", dto);
    const created = enrichClient(raw);
    set((state) => ({ clients: [created, ...state.clients] }));
    return created;
  },

  updateClient: (id, updates) => {
    set((state) => ({
      clients: state.clients.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
    // Persist to API
    if (!DEV_MOCK) {
      api.put(`/clients/${id}`, updates).catch((err) => {
        console.error("Failed to update client:", err);
      });
    }
  },

  updateClientStatus: (id, status) => {
    // Optimistically update local state
    set((state) => ({
      clients: state.clients.map((c) =>
        c.id === id ? { ...c, status } : c
      ),
    }));
    // Persist to API
    api.patch(`/clients/${id}/status`, { status }).catch((err) => {
      console.error("Failed to update client status:", err);
    });
  },

  deleteClient: (id) => {
    set((state) => ({
      clients: state.clients.filter((c) => c.id !== id),
    }));
    // Persist to API
    api.delete(`/clients/${id}`).catch((err) => {
      console.error("Failed to delete client:", err);
    });
  },

  getClient: (id) => get().clients.find((c) => c.id === id),

  getActiveClients: () => get().clients.filter((c) => isClientActive(c.status)),

  getRetentionRate: () => {
    const all = get().clients;
    const total = all.length;
    if (total === 0) return 0;
    const active = all.filter((c) => isClientActive(c.status)).length;
    return Math.round((active / total) * 100);
  },
}));
