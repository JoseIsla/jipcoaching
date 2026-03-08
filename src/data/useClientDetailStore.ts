import { create } from "zustand";
import { clientDetailStore as mockStore, type ClientDetail } from "@/data/clientStore";
import { DEV_MOCK } from "@/config/devMode";
import { api, API_BASE_URL } from "@/services/api";

/** Resolve relative upload URLs to full server URLs */
const resolveUrl = (url: string | null | undefined): string | undefined => {
  if (!url || url.startsWith("http") || url.startsWith("blob:")) return url;
  const serverRoot = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${serverRoot}${url}`;
};

// Re-export types
export type { ClientDetail, NutritionIntake, TrainingIntake } from "@/data/clientStore";

/** Map packType → services array */
const packToServices = (pack: string): ClientDetail["services"] => {
  switch (pack) {
    case "NUTRITION": return ["nutrition"];
    case "TRAINING": return ["training"];
    case "FULL": return ["nutrition", "training"];
    default: return [];
  }
};

/** Map API status → UI status */
const mapStatus = (s: string): ClientDetail["status"] => {
  switch (s) {
    case "ACTIVE": return "Activo";
    case "PAUSED": return "Inactivo";
    default: return "Pendiente";
  }
};

/** Map API client detail response → ClientDetail */
const mapApiClient = (c: any): ClientDetail => {
  const lastPaidAt = c.lastPaidAt ? new Date(c.lastPaidAt) : null;
  const lastPaymentDate = lastPaidAt ? lastPaidAt.toISOString().split("T")[0] : "Sin registro";
  const nextPaymentDate = lastPaidAt
    ? new Date(lastPaidAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    : "Pendiente";

  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone ?? "",
    age: c.age ?? undefined,
    sex: c.sex ?? undefined,
    services: packToServices(c.packType),
    plan: c.packType,
    status: mapStatus(c.status),
    startDate: c.startDate ? new Date(c.startDate).toISOString().split("T")[0] : "",
    monthlyRate: c.monthlyFee ?? 0,
    lastPaidAt: c.lastPaidAt ?? undefined,
    lastPaymentDate,
    nextPaymentDate,
    paymentMethod: "",
    notes: c.notes ?? "",
    currentWeight: c.currentWeight ?? undefined,
    targetWeight: c.targetWeight ?? undefined,
    height: c.height ?? undefined,
    weightHistory: c.weightHistory ?? [],
    nutritionIntake: c.nutritionIntake ?? undefined,
    trainingIntake: c.trainingIntake ?? undefined,
  };
};

interface ClientDetailState {
  details: Record<string, ClientDetail>;
  loading: boolean;
  fetchDetail: (clientId: string) => Promise<ClientDetail | undefined>;
  getDetail: (clientId: string) => ClientDetail | undefined;
  updateDetail: (clientId: string, updates: Partial<ClientDetail>) => void;
  addDetail: (detail: ClientDetail) => void;
  deleteDetail: (clientId: string) => void;
}

export const useClientDetailStore = create<ClientDetailState>((set, get) => ({
  details: DEV_MOCK ? { ...mockStore } : {},
  loading: false,

  fetchDetail: async (clientId) => {
    // If DEV_MOCK, just return from mock store
    if (DEV_MOCK) return get().details[clientId];

    // If already fetched, return cached
    const cached = get().details[clientId];
    if (cached) return cached;

    set({ loading: true });
    try {
      const data = await api.get(`/clients/${clientId}`);
      const detail = mapApiClient(data);
      set((state) => ({
        details: { ...state.details, [clientId]: detail },
        loading: false,
      }));
      return detail;
    } catch (err) {
      console.error("Error fetching client detail:", err);
      set({ loading: false });
      return undefined;
    }
  },

  getDetail: (clientId) => get().details[clientId],

  updateDetail: (clientId, updates) =>
    set((state) => ({
      details: {
        ...state.details,
        [clientId]: { ...state.details[clientId], ...updates },
      },
    })),

  addDetail: (detail) =>
    set((state) => ({
      details: { ...state.details, [detail.id]: detail },
    })),

  deleteDetail: (clientId) =>
    set((state) => {
      const { [clientId]: _, ...rest } = state.details;
      return { details: rest };
    }),
}));
