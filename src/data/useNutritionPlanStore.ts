import { create } from "zustand";
import {
  mockNutritionPlans,
  type NutritionPlan,
} from "@/data/mockData";
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

// Import the mock detail for seeding
import {
  nutritionPlanDetailStore as mockDetailStore,
  globalSupplements as initialSupplements,
} from "@/data/nutritionPlanStore";

let nextId = 200;
export const genId = () => `np-${++nextId}`;

interface NutritionPlanState {
  plans: NutritionPlan[];
  details: Record<string, NutritionPlanDetail>;
  supplements: Supplement[];

  // Plan list
  addPlan: (plan: NutritionPlan) => void;
  togglePlanActive: (planId: string, activate: boolean) => void;
  deactivateClientPlans: (clientId: string) => void;
  getActivePlanForClient: (clientId: string) => NutritionPlan | undefined;

  // Plan details
  addDetail: (detail: NutritionPlanDetail) => void;
  updateDetail: (detail: NutritionPlanDetail) => void;
  syncPlanToList: (detail: NutritionPlanDetail) => void;

  // Supplements
  setSupplements: (sups: Supplement[]) => void;
}

export const useNutritionPlanStore = create<NutritionPlanState>((set, get) => ({
  plans: [...mockNutritionPlans],
  details: { ...mockDetailStore },
  supplements: [...initialSupplements],

  addPlan: (plan) =>
    set((state) => ({ plans: [plan, ...state.plans] })),

  togglePlanActive: (planId, activate) =>
    set((state) => {
      const today = new Date().toISOString().split("T")[0];
      let plans = state.plans;
      const plan = plans.find((p) => p.id === planId);

      if (activate && plan) {
        // Deactivate other plans for same client first
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
        // Deactivate other details for same client
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
