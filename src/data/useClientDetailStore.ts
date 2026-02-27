import { create } from "zustand";
import { clientDetailStore as initialStore, type ClientDetail } from "@/data/clientStore";

// Re-export types
export type { ClientDetail, NutritionIntake, TrainingIntake } from "@/data/clientStore";

interface ClientDetailState {
  details: Record<string, ClientDetail>;
  getDetail: (clientId: string) => ClientDetail | undefined;
  updateDetail: (clientId: string, updates: Partial<ClientDetail>) => void;
  addDetail: (detail: ClientDetail) => void;
  deleteDetail: (clientId: string) => void;
}

export const useClientDetailStore = create<ClientDetailState>((set, get) => ({
  details: { ...initialStore },

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
