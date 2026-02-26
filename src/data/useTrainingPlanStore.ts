import { create } from "zustand";
import { api } from "@/services/api";
import type { ApiTrainingPlan } from "@/types/api";
import { useClientStore } from "./useClientStore";

// Re-export types
export type {
  TrainingMethod,
  IntensityMeasure,
  ExerciseLibraryItem,
  TrainingExerciseEntry,
  TrainingDay,
  TrainingWeek,
  TrainingPlanFull,
} from "@/data/trainingPlanStore";

// Re-export constants that don't need reactivity
export {
  TRAINING_METHOD_LABELS,
  exerciseLibrary,
  addExerciseToLibrary,
} from "@/data/trainingPlanStore";

// Import types for internal use
import type {
  TrainingPlanFull,
  TrainingWeek,
  TrainingDay,
} from "@/data/trainingPlanStore";

export type TrainingBlock = "Hipertrofia" | "Intensificación" | "Peaking" | "Tapering";
export type TrainingModality = "Powerlifting" | "Powerbuilding";

interface TrainingPlanListEntry {
  id: string;
  clientId: string;
  clientName: string;
  planName: string;
  modality: TrainingModality;
  block: TrainingBlock;
  weeksDuration: number;
  currentWeek: number | null;
  active: boolean;
  startDate: string;
  endDate: string | null;
}

const buildEmptyWeek = (planId: string, weekNum: number, daysPerWeek: number, block: TrainingBlock = "Hipertrofia"): TrainingWeek => ({
  id: `tw-${planId}-w${weekNum}`,
  planId,
  weekNumber: weekNum,
  block,
  status: weekNum === 1 ? "active" : "draft",
  days: Array.from({ length: daysPerWeek }, (_, i) => ({
    id: `td-${planId}-w${weekNum}-d${i + 1}`,
    dayNumber: i + 1,
    name: `Día ${i + 1}`,
    warmup: "",
    exercises: [],
  })),
});

interface TrainingPlanState {
  plans: TrainingPlanListEntry[];
  details: Record<string, TrainingPlanFull>;
  loading: boolean;
  error: string | null;

  // API actions
  fetchPlans: (clientId?: string) => Promise<void>;
  fetchPlanDetail: (planId: string) => Promise<TrainingPlanFull | null>;

  // List operations
  togglePlanActive: (planId: string, active: boolean) => void;
  addPlan: (plan: {
    clientId: string;
    clientName: string;
    planName: string;
    modality: TrainingModality;
    block: TrainingBlock;
    daysPerWeek: number;
    weeksDuration: number;
    blockVariants?: string;
  }) => string;

  // Detail operations
  getDetail: (planId: string) => TrainingPlanFull | null;
  saveWeek: (planId: string, week: TrainingWeek) => void;
  addWeek: (planId: string, block: TrainingBlock) => TrainingWeek | null;
  getCurrentBlock: (planId: string) => TrainingBlock | null;

  // Helpers
  getClientsWithService: () => ReturnType<typeof useClientStore.getState>["clients"];
  getActivePlanForClient: (clientId: string) => TrainingPlanListEntry | null;
}

/** Map API plan to our list entry format */
const mapApiPlanToListEntry = (apiPlan: ApiTrainingPlan): TrainingPlanListEntry => ({
  id: apiPlan.id,
  clientId: apiPlan.clientId,
  clientName: "", // API may not include this; will be enriched
  planName: apiPlan.title,
  modality: "Powerlifting" as TrainingModality,
  block: "Hipertrofia" as TrainingBlock,
  weeksDuration: apiPlan.weeks?.length ?? 0,
  currentWeek: apiPlan.weeks?.length ?? null,
  active: true,
  startDate: new Date().toISOString().split("T")[0],
  endDate: null,
});

export const useTrainingPlanStore = create<TrainingPlanState>((set, get) => ({
  plans: [],
  details: {},
  loading: false,
  error: null,

  fetchPlans: async (clientId) => {
    set({ loading: true, error: null });
    try {
      const query = clientId ? `?clientId=${clientId}` : "";
      const data = await api.get<ApiTrainingPlan[]>(`/training/plans${query}`);
      const plans = (data ?? []).map(mapApiPlanToListEntry);
      set({ plans, loading: false });
    } catch (err: any) {
      set({ error: err?.message ?? "Error al cargar planes", loading: false });
    }
  },

  fetchPlanDetail: async (planId) => {
    set({ loading: true, error: null });
    try {
      const apiPlan = await api.get<ApiTrainingPlan>(`/training/plans/${planId}`);
      if (!apiPlan) {
        set({ loading: false });
        return null;
      }

      const detail: TrainingPlanFull = {
        id: apiPlan.id,
        clientId: apiPlan.clientId,
        clientName: "",
        planName: apiPlan.title,
        modality: "Powerlifting" as TrainingModality,
        block: "Hipertrofia" as TrainingBlock,
        weeksDuration: apiPlan.weeks?.length ?? 0,
        currentWeek: apiPlan.weeks?.length ?? null,
        active: true,
        startDate: new Date().toISOString().split("T")[0],
        endDate: null,
        daysPerWeek: apiPlan.weeks?.[0]?.days?.length ?? 4,
        weeks: (apiPlan.weeks ?? []).map((w, wIdx) => ({
          id: w.id,
          planId: apiPlan.id,
          weekNumber: wIdx + 1,
          block: "Hipertrofia" as TrainingBlock,
          status: wIdx === (apiPlan.weeks?.length ?? 1) - 1 ? "active" as const : "completed" as const,
          days: (w.days ?? []).map((d, dIdx) => ({
            id: d.id,
            dayNumber: dIdx + 1,
            name: d.title,
            warmup: "",
            exercises: (d.exercises ?? []).map((ex, eIdx) => ({
              id: ex.id,
              order: eIdx + 1,
              section: "basic" as const,
              exerciseName: ex.name,
              ...ex,
            })),
          })),
        })),
      };

      set((state) => ({
        details: { ...state.details, [planId]: detail },
        loading: false,
      }));
      return detail;
    } catch (err: any) {
      set({ error: err?.message ?? "Error al cargar plan", loading: false });
      return null;
    }
  },

  togglePlanActive: (planId, active) =>
    set((state) => {
      const today = new Date().toISOString().split("T")[0];
      return {
        plans: state.plans.map((p) =>
          p.id === planId
            ? { ...p, active, endDate: active ? null : today }
            : p
        ),
        details: state.details[planId]
          ? {
              ...state.details,
              [planId]: {
                ...state.details[planId],
                active,
                endDate: active ? null : today,
              },
            }
          : state.details,
      };
    }),

  addPlan: (plan) => {
    const id = `t-${Date.now()}`;
    const startDate = new Date().toISOString().split("T")[0];

    set((state) => {
      const plans = state.plans.map((p) =>
        p.clientId === plan.clientId && p.active
          ? { ...p, active: false, endDate: startDate }
          : p
      );
      const details = { ...state.details };
      Object.keys(details).forEach((k) => {
        if (details[k].clientId === plan.clientId && details[k].active) {
          details[k] = { ...details[k], active: false, endDate: startDate };
        }
      });

      const newEntry: TrainingPlanListEntry = {
        id,
        clientId: plan.clientId,
        clientName: plan.clientName,
        planName: plan.planName,
        modality: plan.modality,
        block: plan.block,
        weeksDuration: plan.weeksDuration,
        currentWeek: 1,
        active: true,
        startDate,
        endDate: null,
      };

      const newDetail: TrainingPlanFull = {
        ...newEntry,
        daysPerWeek: plan.daysPerWeek,
        blockVariants: plan.blockVariants || "",
        weeks: [buildEmptyWeek(id, 1, plan.daysPerWeek, plan.block)],
      };

      return {
        plans: [...plans, newEntry],
        details: { ...details, [id]: newDetail },
      };
    });

    return id;
  },

  getDetail: (planId) => {
    const state = get();
    if (state.details[planId]) return state.details[planId];

    const listEntry = state.plans.find((p) => p.id === planId);
    if (!listEntry) return null;

    const detail: TrainingPlanFull = {
      ...listEntry,
      daysPerWeek: 4,
      blockVariants: "",
      weeks: listEntry.currentWeek
        ? Array.from({ length: listEntry.currentWeek }, (_, i) =>
            buildEmptyWeek(planId, i + 1, 4)
          )
        : [buildEmptyWeek(planId, 1, 4)],
    };

    set((state) => ({
      details: { ...state.details, [planId]: detail },
    }));

    return detail;
  },

  saveWeek: (planId, week) =>
    set((state) => {
      const detail = state.details[planId];
      if (!detail) return state;

      const weeks = [...detail.weeks];
      const idx = weeks.findIndex((w) => w.id === week.id);
      if (idx >= 0) {
        weeks[idx] = week;
      } else {
        weeks.push(week);
      }

      const plans = state.plans.map((p) =>
        p.id === planId ? { ...p, currentWeek: weeks.length } : p
      );

      return {
        plans,
        details: {
          ...state.details,
          [planId]: { ...detail, weeks },
        },
      };
    }),

  addWeek: (planId, block) => {
    const state = get();
    const detail = state.details[planId] || get().getDetail(planId);
    if (!detail) return null;

    const nextWeekNum = detail.weeks.length + 1;
    const weeks = detail.weeks.map((w) =>
      w.status === "active" ? { ...w, status: "completed" as const } : w
    );
    const newWeek = buildEmptyWeek(planId, nextWeekNum, detail.daysPerWeek, block);
    newWeek.status = "active";
    weeks.push(newWeek);

    set((state) => ({
      plans: state.plans.map((p) =>
        p.id === planId
          ? { ...p, currentWeek: nextWeekNum, weeksDuration: nextWeekNum, block }
          : p
      ),
      details: {
        ...state.details,
        [planId]: {
          ...detail,
          weeks,
          weeksDuration: nextWeekNum,
          block,
        },
      },
    }));

    return newWeek;
  },

  getCurrentBlock: (planId) => {
    const detail = get().details[planId];
    if (!detail) return null;
    const activeWeek = detail.weeks.find((w) => w.status === "active");
    return activeWeek?.block || detail.block;
  },

  getClientsWithService: () =>
    useClientStore.getState().clients.filter(
      (c) => c.services.includes("training") && String(c.status ?? "").toUpperCase() !== "PAUSED"
    ),

  getActivePlanForClient: (clientId) =>
    get().plans.find((p) => p.clientId === clientId && p.active) || null,
}));
