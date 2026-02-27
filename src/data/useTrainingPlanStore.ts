import { create } from "zustand";
import { api } from "@/services/api";
import type { ApiTrainingPlan, ApiExercisePrescription } from "@/types/api";
import { useClientStore } from "./useClientStore";
import { DEV_MOCK } from "@/config/devMode";
import { mockTrainingPlans, mockTrainingDetails } from "@/data/mockPlans";

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

/** Map an API exercise prescription to our frontend TrainingExerciseEntry */
const mapApiExerciseToEntry = (ex: ApiExercisePrescription, idx: number) => ({
  id: ex.id,
  order: ex.order ?? idx + 1,
  section: (ex.type === "BASIC" || ex.type === "VARIANT" ? "basic" : "accessory") as "basic" | "accessory",
  exerciseName: ex.name,
  exerciseType: ex.type,
  method: undefined, // frontend uses its own TrainingMethod type
  topSetReps: ex.topSetReps,
  topSetRPE: ex.topSetRpe,
  fatiguePercent: ex.fatiguePct,
  sets: ex.setsMin != null && ex.setsMax != null ? `${ex.setsMin}-${ex.setsMax}` : undefined,
  intensityValue: ex.rirMin,
  technicalNotes: ex.notes,
});

/** Map API plan to our list entry format */
const mapApiPlanToListEntry = (apiPlan: ApiTrainingPlan): TrainingPlanListEntry => ({
  id: apiPlan.id,
  clientId: apiPlan.clientId,
  clientName: "",
  planName: apiPlan.title,
  modality: (apiPlan.modality as TrainingModality) || "Powerlifting",
  block: (apiPlan.block as TrainingBlock) || "Hipertrofia",
  weeksDuration: apiPlan.weeks?.length ?? 0,
  currentWeek: apiPlan.weeks?.length ?? null,
  active: apiPlan.isActive ?? true,
  startDate: apiPlan.createdAt?.split("T")[0] ?? new Date().toISOString().split("T")[0],
  endDate: null,
});

export const useTrainingPlanStore = create<TrainingPlanState>((set, get) => ({
  plans: DEV_MOCK ? (mockTrainingPlans as any[]) : [],
  details: DEV_MOCK ? (mockTrainingDetails as any) : {},
  loading: false,
  error: null,

  fetchPlans: async (clientId) => {
    set({ loading: true, error: null });

    if (DEV_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      // Seed with mock plans if store is empty
      const current = get().plans;
      if (current.length === 0) {
        set({ plans: mockTrainingPlans as any[], details: mockTrainingDetails as any, loading: false });
      } else {
        set({ loading: false });
      }
      return;
    }

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
    if (DEV_MOCK) {
      // In dev mode, return from local details cache
      const cached = get().details[planId];
      if (cached) return cached;
      return null;
    }

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
        modality: (apiPlan.modality as TrainingModality) || "Powerlifting",
        block: (apiPlan.block as TrainingBlock) || "Hipertrofia",
        weeksDuration: apiPlan.weeks?.length ?? 0,
        currentWeek: apiPlan.weeks?.length ?? null,
        active: apiPlan.isActive ?? true,
        startDate: apiPlan.createdAt?.split("T")[0] ?? new Date().toISOString().split("T")[0],
        endDate: null,
        daysPerWeek: apiPlan.daysPerWeek ?? apiPlan.weeks?.[0]?.days?.length ?? 4,
        blockVariants: apiPlan.blockVariants,
        weeks: (apiPlan.weeks ?? []).map((w) => ({
          id: w.id,
          planId: apiPlan.id,
          weekNumber: w.weekNumber,
          block: (w.block as TrainingBlock) || (apiPlan.block as TrainingBlock) || "Hipertrofia",
          status: w.status as "draft" | "active" | "completed" || "draft",
          generalNotes: w.notes,
          days: (w.days ?? []).map((d) => ({
            id: d.id,
            dayNumber: d.dayNumber,
            name: d.title ?? `Día ${d.dayNumber}`,
            warmup: d.warmup ?? "",
            exercises: (d.exercises ?? []).map((ex, eIdx) => mapApiExerciseToEntry(ex, eIdx)),
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
