import { create } from "zustand";
import {
  mockQuestionnaireEntries,
  clientWeightHistory,
  clientRMRecords,
  type QuestionnaireEntry,
  type WeightEntry,
  type RMRecord,
} from "@/data/mockData";

// Re-export types
export type { QuestionnaireEntry, WeightEntry, RMRecord };

interface QuestionnaireState {
  entries: QuestionnaireEntry[];
  weightHistory: Record<string, WeightEntry[]>;
  rmRecords: Record<string, RMRecord[]>;

  // Questionnaire operations
  submitEntry: (entryId: string, responses: Record<string, string | number | boolean>) => void;
  getPendingCount: (clientId?: string) => number;
  getEntriesForClient: (clientId: string) => QuestionnaireEntry[];

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

export const useQuestionnaireStore = create<QuestionnaireState>((set, get) => ({
  entries: [...mockQuestionnaireEntries],
  weightHistory: { ...clientWeightHistory },
  rmRecords: { ...clientRMRecords },

  submitEntry: (entryId, responses) =>
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === entryId
          ? { ...e, status: "respondido" as const, responses }
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
