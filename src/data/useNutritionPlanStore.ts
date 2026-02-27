import { create } from "zustand";
import { api } from "@/services/api";
import type { ApiNutritionPlan } from "@/types/api";
import { DEV_MOCK } from "@/config/devMode";
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

export const useNutritionPlanStore = create<NutritionPlanState>((set, get) => ({
  plans: [],
  details: {},
  supplements: [],
  loading: false,
  error: null,

  fetchActiveClientPlan: async () => {
    if (DEV_MOCK) {
      await new Promise((r) => setTimeout(r, 200));
      return null; // No active plan in dev mode by default
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
