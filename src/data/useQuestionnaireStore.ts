import { create } from "zustand";
import {
  mockQuestionnaireEntries,
  clientWeightHistory,
  clientRMRecords,
  trainingTemplate,
  type QuestionnaireEntry,
  type WeightEntry,
  type RMRecord,
  type TrainingLogDay,
  type TrainingLogExercise,
} from "@/data/mockData";
import { useTrainingPlanStore } from "@/data/useTrainingPlanStore";

// Re-export types
export type { QuestionnaireEntry, WeightEntry, RMRecord, TrainingLogDay, TrainingLogExercise };

interface QuestionnaireState {
  entries: QuestionnaireEntry[];
  weightHistory: Record<string, WeightEntry[]>;
  rmRecords: Record<string, RMRecord[]>;

  // Questionnaire operations
  submitEntry: (entryId: string, responses: Record<string, string | number | boolean>, trainingLog?: TrainingLogDay[]) => void;
  getPendingCount: (clientId?: string) => number;
  getEntriesForClient: (clientId: string) => QuestionnaireEntry[];

  // Auto-generate training log entry from active plan
  getOrCreateTrainingEntry: (clientId: string, clientName: string) => QuestionnaireEntry | null;

  // Progress helpers
  getWeightHistory: (clientId: string) => WeightEntry[];
  getBestRMs: (clientId: string) => RMRecord[];
  getTrainingProgress: (clientId: string) => {
    latestFatigue?: number;
    latestSleep?: number;
    latestMotivation?: number;
    hasInjury?: boolean;
    injuryDetail?: string;
  };
}

const thisWeekLabel = (() => {
  const now = new Date();
  const day = now.getDate();
  const month = now.toLocaleString("es-ES", { month: "short" });
  return `Sem ${day} ${month}`;
})();

export const useQuestionnaireStore = create<QuestionnaireState>((set, get) => ({
  entries: [...mockQuestionnaireEntries],
  weightHistory: { ...clientWeightHistory },
  rmRecords: { ...clientRMRecords },

  submitEntry: (entryId, responses, trainingLog) =>
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === entryId
          ? {
              ...e,
              status: "respondido" as const,
              responses,
              ...(trainingLog ? { trainingLog } : {}),
            }
          : e
      ),
    })),

  getPendingCount: (clientId) => {
    const entries = get().entries;
    if (clientId) {
      return entries.filter((e) => e.clientId === clientId && e.status === "pendiente").length;
    }
    return entries.filter((e) => e.status === "pendiente").length;
  },

  getEntriesForClient: (clientId) =>
    get().entries.filter((e) => e.clientId === clientId),

  getOrCreateTrainingEntry: (clientId, clientName) => {
    const state = get();

    // Check if there's already a training log entry (with trainingLog data) for this week
    const existing = state.entries.find(
      (e) => e.clientId === clientId && e.category === "training" && e.weekLabel === thisWeekLabel && e.trainingLog && e.trainingLog.length > 0
    );
    if (existing) return existing;

    // Get active training plan
    const activePlan = useTrainingPlanStore.getState().getActivePlanForClient(clientId);
    if (!activePlan) return null;

    const detail = useTrainingPlanStore.getState().getDetail(activePlan.id);
    if (!detail) return null;

    // Find active week, prefer one with exercises
    const activeWeek = detail.weeks.find((w) => w.status === "active");
    if (!activeWeek) return null;

    // If active week has no exercises, fallback to first week that has them (template)
    const hasExercises = activeWeek.days.some((d) => d.exercises.length > 0);
    const sourceWeek = hasExercises
      ? activeWeek
      : detail.weeks.find((w) => w.days.some((d) => d.exercises.length > 0)) || activeWeek;

    // Build training log from the week's exercises
    const trainingLog: TrainingLogDay[] = sourceWeek.days.map((day) => ({
      dayNumber: day.dayNumber,
      dayName: day.name,
      exercises: day.exercises.map((ex): TrainingLogExercise => ({
        exerciseId: ex.exerciseId || ex.id,
        exerciseName: ex.exerciseName,
        section: ex.section,
        plannedSets: ex.sets || ex.estimatedSeries || "—",
        plannedReps: ex.reps || (ex.topSetReps ? `${ex.topSetReps}` : "—"),
        plannedLoad: ex.plannedLoad || "—",
        plannedRPE: ex.intensityValue || ex.topSetRPE,
      })),
    }));

    const todayStr = new Date().toISOString().split("T")[0];
    const newEntry: QuestionnaireEntry = {
      id: `qe-tlog-${clientId}-${Date.now()}`,
      clientId,
      clientName,
      templateId: "tt-weekly",
      templateName: `Registro Semana ${activeWeek.weekNumber}`,
      category: "training",
      weekLabel: thisWeekLabel,
      date: todayStr,
      dayLabel: "Semanal",
      status: "pendiente",
      trainingLog,
      planId: activePlan.id,
      weekNumber: activeWeek.weekNumber,
    };

    // Add to store
    set((s) => ({ entries: [...s.entries, newEntry] }));
    return newEntry;
  },

  getWeightHistory: (clientId) =>
    get().weightHistory[clientId] || [],

  getBestRMs: (clientId) => {
    const records = get().rmRecords[clientId] || [];
    const bestByExercise: Record<string, RMRecord> = {};
    records.forEach((r) => {
      if (!bestByExercise[r.exerciseId] || r.estimated1RM > bestByExercise[r.exerciseId].estimated1RM) {
        bestByExercise[r.exerciseId] = r;
      }
    });
    return Object.values(bestByExercise);
  },

  getTrainingProgress: (clientId) => {
    const entries = get().entries.filter(
      (e) => e.clientId === clientId && e.category === "training" && e.status === "respondido"
    );
    const latest = entries[entries.length - 1];
    return {
      latestFatigue: latest?.responses?.tq1 as number | undefined,
      latestSleep: latest?.responses?.tq4 as number | undefined,
      latestMotivation: latest?.responses?.tq5 as number | undefined,
      hasInjury: latest?.responses?.tq2 as boolean | undefined,
      injuryDetail: latest?.responses?.tq3 as string | undefined,
    };
  },
}));
