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

/** API supplement shape (has id) */
export interface ApiSupplement extends Supplement {
  id: string;
}

interface NutritionPlanState {
  plans: NutritionPlanListEntry[];
  details: Record<string, NutritionPlanDetail>;
  supplements: ApiSupplement[];
  loading: boolean;
  error: string | null;

  // Fetch from API
  fetchPlans: (clientId?: string) => Promise<void>;
  fetchActiveClientPlan: () => Promise<ApiNutritionPlan | null>;
  fetchSupplements: () => Promise<void>;

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
  setSupplements: (sups: ApiSupplement[]) => void;
  createSupplement: (sup: Supplement) => Promise<ApiSupplement | null>;
  updateSupplementApi: (id: string, sup: Supplement) => Promise<void>;
  deleteSupplementApi: (id: string) => Promise<void>;
  saveSupplements: (sups: ApiSupplement[]) => Promise<void>;
}

/** Map API nutrition plan to list entry + detail */
const getClientName = (p: any): string =>
  p?.client?.user?.name ?? p?.clientName ?? "";

const mapApiPlanToListEntry = (p: ApiNutritionPlan): NutritionPlanListEntry => ({
  id: p.id,
  clientId: p.clientId,
  clientName: getClientName(p),
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
    try {
      const parsed = JSON.parse(p.recommendations);
      if (Array.isArray(parsed)) {
        recommendations = parsed;
      } else if (typeof parsed === "object" && parsed !== null) {
        // Object like { descanso: "...", hidratacion: "..." } → convert to labeled strings
        recommendations = Object.entries(parsed).map(
          ([key, val]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${val}`
        );
      } else {
        recommendations = [String(parsed)];
      }
    } catch {
      recommendations = [p.recommendations];
    }
  }
  return {
    id: p.id,
    clientId: p.clientId,
    clientName: getClientName(p),
    planName: p.title,
    objective: (p as any).objective ?? "",
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
      description: (m as any).description ?? m.notes,
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
    planSupplements: (p.planSupplements ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      dose: s.dose,
      timing: s.timing,
    })),
  };
};

export const useNutritionPlanStore = create<NutritionPlanState>((set, get) => ({
  plans: DEV_MOCK ? mockNutritionPlanList : [],
  details: DEV_MOCK ? mockNutritionDetails : {},
  supplements: DEV_MOCK ? mockSupplements.map((s, i) => ({ ...s, id: `mock-sup-${i}` })) : [],
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

  fetchSupplements: async () => {
    if (DEV_MOCK) return;
    try {
      const data = await api.get<ApiSupplement[]>("/supplements");
      set({ supplements: data ?? [] });
    } catch (err: any) {
      console.error("fetchSupplements error:", err);
    }
  },

  createSupplement: async (sup) => {
    try {
      const created = await api.post<ApiSupplement>("/supplements", sup);
      set((s) => ({ supplements: [...s.supplements, created] }));
      return created;
    } catch {
      return null;
    }
  },

  updateSupplementApi: async (id, sup) => {
    try {
      const updated = await api.put<ApiSupplement>(`/supplements/${id}`, sup);
      set((s) => ({
        supplements: s.supplements.map((x) => (x.id === id ? updated : x)),
      }));
    } catch { /* toast handled by api client */ }
  },

  deleteSupplementApi: async (id) => {
    try {
      await api.delete(`/supplements/${id}`);
      set((s) => ({
        supplements: s.supplements.filter((x) => x.id !== id),
      }));
    } catch { /* toast handled by api client */ }
  },

  /** Diff-based sync: compare local edits with store and persist changes */
  saveSupplements: async (edited) => {
    if (DEV_MOCK) {
      set({ supplements: edited });
      return;
    }

    const current = get().supplements;
    const currentIds = new Set(current.map((s) => s.id));
    const editedIds = new Set(edited.filter((s) => s.id).map((s) => s.id));

    // Deleted
    for (const s of current) {
      if (!editedIds.has(s.id)) {
        await api.delete(`/supplements/${s.id}`, { silent: true }).catch(() => {});
      }
    }

    // Created or updated
    const final: ApiSupplement[] = [];
    for (const s of edited) {
      if (!s.id || !currentIds.has(s.id)) {
        // New
        try {
          const created = await api.post<ApiSupplement>("/supplements", { name: s.name, dose: s.dose, timing: s.timing });
          final.push(created);
        } catch { /* skip */ }
      } else {
        // Possibly updated
        const old = current.find((c) => c.id === s.id);
        if (old && (old.name !== s.name || old.dose !== s.dose || old.timing !== s.timing)) {
          try {
            const updated = await api.put<ApiSupplement>(`/supplements/${s.id}`, { name: s.name, dose: s.dose, timing: s.timing });
            final.push(updated);
          } catch { final.push(s); }
        } else {
          final.push(s);
        }
      }
    }

    set({ supplements: final });
  },
}));
