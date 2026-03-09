// ==================== NUTRITION PLAN DETAIL STORE ====================

export type MacroCategory = "carbohidratos" | "proteinas" | "grasas" | "frutas" | "verduras" | "";

export interface IngredientRow {
  id: string;
  mainIngredient: string;
  alternatives: string[];
  macroCategory: MacroCategory;
}

export interface MealOption {
  id: string;
  name: string; // "Opción 1", "Opción 2"
  rows: IngredientRow[];
  notes?: string; // e.g. "1 porción de Frutas (Tabla 01)"
}

export interface Meal {
  id: string;
  name: string; // "Desayuno", "Snack", "Comida", "Cena"
  description?: string;
  options: MealOption[];
}

export interface Supplement {
  name: string;
  dose: string;
  timing: string;
}

export interface PlanSupplement {
  id?: string;
  name: string;
  dose: string;
  timing: string;
}

export interface NutritionPlanDetail {
  id: string;
  clientId: string;
  clientName: string;
  planName: string;
  objective: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  active: boolean;
  startDate: string;
  endDate: string | null;
  meals: Meal[];
  recommendations: string[];
  planSupplements: PlanSupplement[];
}

// Global reference tables are now fetched from the API via useExerciseLibraryStore
// These legacy exports are kept for backwards compatibility but should not be used
/** @deprecated Use useExerciseLibraryStore().fruits instead */
export const globalFruitTable: string[] = [];

/** @deprecated Use useExerciseLibraryStore().vegetables instead */
export const globalVegetableTable: string[] = [];

// Global supplements are now fetched from the API via useNutritionPlanStore
// This legacy export is kept for backwards compatibility but should not be used
/** @deprecated Use useNutritionPlanStore().supplements instead */
export let globalSupplements: Supplement[] = [];

/** @deprecated Use useNutritionPlanStore actions instead */
export const setGlobalSupplements = (sups: Supplement[]) => {
  globalSupplements = sups;
};
// ---- Helpers ----
let nextId = 100;
export const genId = () => `np-${++nextId}`;
const rowId = () => `r-${++nextId}`;
const optId = () => `o-${++nextId}`;
const mealId = () => `m-${++nextId}`;

// Mutable store keyed by plan id — initialized empty (populated from API)
export const nutritionPlanDetailStore: Record<string, NutritionPlanDetail> = {};

export const addNutritionPlanDetail = (plan: NutritionPlanDetail) => {
  nutritionPlanDetailStore[plan.id] = plan;
};

// ---- Mutable plan list (synced with detail store) ----

// Plan list — initialized empty (populated from API)
export const nutritionPlanList: any[] = [];

export const addNutritionPlanToList = (plan: any) => {
  nutritionPlanList.unshift(plan);
};

export const deactivateClientPlans = (clientId: string): void => {
  const today = new Date().toISOString().split("T")[0];
  // Deactivate in list
  nutritionPlanList.forEach((p) => {
    if (p.clientId === clientId && p.active) {
      p.active = false;
      p.endDate = today;
    }
  });
  // Deactivate in detail store
  Object.values(nutritionPlanDetailStore).forEach((d) => {
    if (d.clientId === clientId && d.active) {
      d.active = false;
      d.endDate = today;
    }
  });
};

export const togglePlanActive = (planId: string, activate: boolean): void => {
  const today = new Date().toISOString().split("T")[0];
  const plan = nutritionPlanList.find((p) => p.id === planId);
  if (!plan) return;

  if (activate) {
    // Deactivate other plans for same client first
    deactivateClientPlans(plan.clientId);
  }

  // Update in list
  const listPlan = nutritionPlanList.find((p) => p.id === planId);
  if (listPlan) {
    listPlan.active = activate;
    listPlan.endDate = activate ? null : today;
  }

  // Update in detail store
  if (nutritionPlanDetailStore[planId]) {
    nutritionPlanDetailStore[planId].active = activate;
    nutritionPlanDetailStore[planId].endDate = activate ? null : today;
  }
};

export const syncPlanToList = (detail: NutritionPlanDetail): void => {
  const listPlan = nutritionPlanList.find((p) => p.id === detail.id);
  if (listPlan) {
    listPlan.planName = detail.planName;
    listPlan.calories = detail.calories ?? 0;
    listPlan.active = detail.active;
    listPlan.startDate = detail.startDate;
    listPlan.endDate = detail.endDate;
  }
};

export const getActivePlanForClient = (clientId: string): any | undefined => {
  return nutritionPlanList.find((p) => p.clientId === clientId && p.active);
};

export const createEmptyMeal = (name: string): Meal => ({
  id: mealId(),
  name,
  description: "",
  options: [createEmptyOption("Opción 1")],
});

export const createEmptyOption = (name: string): MealOption => ({
  id: optId(),
  name,
  rows: [createEmptyRow()],
  notes: "",
});

export const createEmptyRow = (macroCategory: MacroCategory = ""): IngredientRow => ({
  id: rowId(),
  mainIngredient: "",
  alternatives: [],
  macroCategory,
});

export const macroCategoryLabels: Record<MacroCategory, string> = {
  carbohidratos: "🍚 Carbohidratos",
  proteinas: "🥩 Proteínas",
  grasas: "🥑 Grasas",
  frutas: "🍎 Frutas (Tabla 01)",
  verduras: "🥦 Verduras (Tabla 02)",
  "": "Sin categoría",
};

export const macroCategoryOptions: MacroCategory[] = ["carbohidratos", "proteinas", "grasas", "frutas", "verduras"];
