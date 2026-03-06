import { create } from "zustand";
import { api } from "@/services/api";
import type { ApiNutritionPlan } from "@/types/api";
import { DEV_MOCK } from "@/config/devMode";
import { mockNutritionPlanList, mockNutritionDetails, mockSupplements } from "@/data/mockPlans";
import {
  type NutritionPlanDetail,
  type Meal,
  type MealOption,
  type IngredientRow,
  type Supplement,
  type MacroCategory,
} from "@/data/nutritionPlanStore";

// Re-export types for convenience
export type { NutritionPlanDetail, Meal, MealOption, IngredientRow, Supplement, MacroCategory };

// Re-export constants and helpers that don't need to be in the store
export {
  globalFruitTable,
  globalVegetableTable,
  macroCategoryLabels,
  macroCategoryOptions,
  createEmptyMeal,
  createEmptyOption,
  createEmptyRow,
} from "@/data/nutritionPlanStore";

/** Lightweight list entry for admin views (derived from API or local cache) */
export interface NutritionPlanListEntry {
  id: string;
  clientId: string;
  clientName: string;
  planName: string;
  type: string;
  calories: number;
  active: boolean;
  startDate: string;
  endDate: string | null;
}

let nextId = 200;
export const genId = () => `np-${++nextId}`;

interface NutritionPlanState {
  plans: NutritionPlanListEntry[];
  details: Record<string, NutritionPlanDetail>;
  supplements: Supplement[];
  loading: boolean;
  error: string | null;

  // Fetch from API
  fetchPlans: (clientId?: string) => Promise<void>;
  fetchActiveClientPlan: () => Promise<ApiNutritionPlan | null>;

  // Plan list (local for admin — backend doesn't have admin list endpoint yet)
  addPlan: (plan: NutritionPlanListEntry) => void;
  togglePlanActive: (planId: string, activate: boolean) => void;
  deactivateClientPlans: (clientId: string) => void;
  getActivePlanForClient: (clientId: string) => NutritionPlanListEntry | undefined;

  // Plan details
  addDetail: (detail: NutritionPlanDetail) => void;
  updateDetail: (detail: NutritionPlanDetail) => void;
  syncPlanToList: (detail: NutritionPlanDetail) => void;

  // Supplements
  setSupplements: (sups: Supplement[]) => void;
}

/** Map API nutrition plan to list entry + detail */
const mapApiPlanToListEntry = (p: ApiNutritionPlan): NutritionPlanListEntry => ({
  id: p.id,
  clientId: p.clientId,
  clientName: "",
  planName: p.title,
  type: "custom",
  calories: p.kcalMin ?? p.kcalMax ?? 0,
  active: p.isActive,
  startDate: p.createdAt?.split("T")[0] ?? new Date().toISOString().split("T")[0],
  endDate: null,
});

const mapApiPlanToDetail = (p: ApiNutritionPlan): NutritionPlanDetail => {
  let recommendations: string[] = [];
  if (p.recommendations) {
    try { recommendations = JSON.parse(p.recommendations); } catch { recommendations = [p.recommendations]; }
  }
  return {
    id: p.id,
    clientId: p.clientId,
    clientName: "",
    planName: p.title,
    objective: p.recommendations ?? "",
    calories: p.kcalMin ?? p.kcalMax,
    protein: p.proteinG,
    carbs: p.carbsG,
    fats: p.fatsG,
    active: p.isActive,
    startDate: p.createdAt?.split("T")[0] ?? new Date().toISOString().split("T")[0],
    endDate: null,
    meals: (p.meals ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      description: m.notes,
      options: (m.options ?? []).map((o) => ({
        id: o.id,
        name: o.name ?? "",
        notes: o.notes,
        rows: (o.rows ?? []).map((r) => {
          let alts: string[] = [];
          try { alts = typeof r.alternatives === "string" ? JSON.parse(r.alternatives) : r.alternatives ?? []; } catch { alts = []; }
          return {
            id: r.id,
            mainIngredient: r.mainIngredient,
            alternatives: alts,
            macroCategory: (r.macroCategory ?? "") as MacroCategory,
          };
        }),
      })),
    })),
    recommendations,
  };
};

export const useNutritionPlanStore = create<NutritionPlanState>((set, get) => ({
  plans: DEV_MOCK ? mockNutritionPlanList : [],
  details: DEV_MOCK ? mockNutritionDetails : {},
  supplements: DEV_MOCK ? mockSupplements : [],
  loading: false,
  error: null,

  fetchPlans: async (clientId) => {
    if (DEV_MOCK) return;

    set({ loading: true, error: null });
    try {
      const query = clientId ? `?clientId=${clientId}` : "";
      const data = await api.get<ApiNutritionPlan[]>(`/nutrition/plans${query}`);
      const plans = (data ?? []).map(mapApiPlanToListEntry);
      const details: Record<string, NutritionPlanDetail> = {};
      (data ?? []).forEach((p) => { details[p.id] = mapApiPlanToDetail(p); });
      set({ plans, details, loading: false });
    } catch (err: any) {
      set({ error: err?.message ?? "Error al cargar planes", loading: false });
    }
  },

  fetchActiveClientPlan: async () => {
    if (DEV_MOCK) {
      await new Promise((r) => setTimeout(r, 200));
      return null;
    }

    set({ loading: true, error: null });
    try {
      const plan = await api.get<ApiNutritionPlan>("/nutrition/me/active");
      set({ loading: false });
      return plan;
    } catch (err: any) {
      if (err?.status === 404) {
        set({ loading: false });
        return null;
      }
      set({ error: err?.message ?? "Error al cargar plan nutricional", loading: false });
      return null;
    }
  },

  addPlan: (plan) =>
    set((state) => ({ plans: [plan, ...state.plans] })),

  togglePlanActive: (planId, activate) =>
    set((state) => {
      const today = new Date().toISOString().split("T")[0];
      let plans = state.plans;
      const plan = plans.find((p) => p.id === planId);

      if (activate && plan) {
        plans = plans.map((p) =>
          p.clientId === plan.clientId && p.active
            ? { ...p, active: false, endDate: today }
            : p
        );
      }

      plans = plans.map((p) =>
        p.id === planId
          ? { ...p, active: activate, endDate: activate ? null : today }
          : p
      );

      const details = { ...state.details };
      if (activate && plan) {
        Object.keys(details).forEach((k) => {
          if (details[k].clientId === plan.clientId && details[k].active) {
            details[k] = { ...details[k], active: false, endDate: today };
          }
        });
      }
      if (details[planId]) {
        details[planId] = {
          ...details[planId],
          active: activate,
          endDate: activate ? null : today,
        };
      }

      return { plans, details };
    }),

  deactivateClientPlans: (clientId) =>
    set((state) => {
      const today = new Date().toISOString().split("T")[0];
      const plans = state.plans.map((p) =>
        p.clientId === clientId && p.active
          ? { ...p, active: false, endDate: today }
          : p
      );
      const details = { ...state.details };
      Object.keys(details).forEach((k) => {
        if (details[k].clientId === clientId && details[k].active) {
          details[k] = { ...details[k], active: false, endDate: today };
        }
      });
      return { plans, details };
    }),

  getActivePlanForClient: (clientId) =>
    get().plans.find((p) => p.clientId === clientId && p.active),

  addDetail: (detail) =>
    set((state) => ({
      details: { ...state.details, [detail.id]: detail },
    })),

  updateDetail: (detail) =>
    set((state) => ({
      details: { ...state.details, [detail.id]: detail },
    })),

  syncPlanToList: (detail) =>
    set((state) => ({
      plans: state.plans.map((p) =>
        p.id === detail.id
          ? {
              ...p,
              planName: detail.planName,
              calories: detail.calories ?? 0,
              active: detail.active,
              startDate: detail.startDate,
              endDate: detail.endDate,
            }
          : p
      ),
    })),

  setSupplements: (sups) => set({ supplements: sups }),
}));
