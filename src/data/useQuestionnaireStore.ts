import { create } from "zustand";
import { api } from "@/services/api";
import type { ApiQuestionnaire, ApiSession } from "@/types/api";
import { DEV_MOCK } from "@/config/devMode";
import { mockQuestionnaireEntries, mockWeightHistory, mockRMRecords } from "@/data/mockCheckins";

// ── Types (previously from mockData, now standalone) ──

export interface WeightEntry {
  date: string;
  weight: number;
}

export interface RMRecord {
  exerciseId: string;
  exerciseName: string;
  weight: number;
  date: string;
  reps: number;
  estimated1RM: number;
}

export interface TrainingLogExercise {
  exerciseId: string;
  exerciseName: string;
  section: "basic" | "variant" | "accessory";
  plannedSets: string;
  plannedReps: string;
  plannedLoad: string;
  plannedRPE?: number;
  actualWeight?: number;
  actualRPE?: number;
  actualSets?: string;
  actualReps?: string;
}

export interface TrainingLogDay {
  dayNumber: number;
  dayName: string;
  exercises: TrainingLogExercise[];
}

export type QuestionnaireStatus = "pendiente" | "respondido" | "no_enviado";

export interface QuestionnaireEntry {
  id: string;
  clientId: string;
  clientName: string;
  templateId: string;
  templateName: string;
  category: "nutrition" | "training";
  weekLabel: string;
  date: string;
  dayLabel: string;
  status: QuestionnaireStatus;
  responses?: Record<string, string | number | boolean>;
  liftLogs?: { exerciseId: string; exerciseName: string; sets: string; weight: number; rpe?: number }[];
  trainingLog?: TrainingLogDay[];
  planId?: string;
  weekNumber?: number;
}

// ── Store ──

interface QuestionnaireState {
  entries: QuestionnaireEntry[];
  sessions: ApiSession[];
  activeQuestionnaire: ApiQuestionnaire | null;
  weightHistory: Record<string, WeightEntry[]>;
  rmRecords: Record<string, RMRecord[]>;
  loading: boolean;
  error: string | null;

  // API actions
  fetchSessions: () => Promise<void>;
  createSession: (data: Record<string, unknown>) => Promise<ApiSession | null>;
  fetchActiveQuestionnaire: () => Promise<ApiQuestionnaire | null>;
  submitQuestionnaire: (sessionId: string, answers: Record<string, unknown>) => Promise<void>;

  // Legacy local actions (kept for UI compat until backend supports full questionnaire flow)
  submitEntry: (entryId: string, responses: Record<string, string | number | boolean>, trainingLog?: TrainingLogDay[]) => void;
  getPendingCount: (clientId?: string) => number;
  getEntriesForClient: (clientId: string) => QuestionnaireEntry[];
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

export const useQuestionnaireStore = create<QuestionnaireState>((set, get) => ({
  entries: DEV_MOCK ? mockQuestionnaireEntries : [],
  sessions: [],
  activeQuestionnaire: null,
  weightHistory: DEV_MOCK ? mockWeightHistory : {},
  rmRecords: DEV_MOCK ? mockRMRecords : {},
  loading: false,
  error: null,

  // ── API actions ──

  fetchSessions: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.get<ApiSession[]>("/sessions/me");
      set({ sessions: data ?? [], loading: false });
    } catch (err: any) {
      set({ error: err?.message ?? "Error al cargar sesiones", loading: false });
    }
  },

  createSession: async (data) => {
    try {
      const session = await api.post<ApiSession>("/sessions", data);
      set((s) => ({ sessions: [session, ...s.sessions] }));
      return session;
    } catch (err: any) {
      set({ error: err?.message ?? "Error al crear sesión" });
      return null;
    }
  },

  fetchActiveQuestionnaire: async () => {
    set({ loading: true, error: null });
    try {
      const q = await api.get<ApiQuestionnaire>("/questionnaires/me/active");
      set({ activeQuestionnaire: q, loading: false });
      return q;
    } catch (err: any) {
      if (err?.status === 404) {
        set({ activeQuestionnaire: null, loading: false });
        return null;
      }
      set({ error: err?.message ?? "Error al cargar cuestionario", loading: false });
      return null;
    }
  },

  submitQuestionnaire: async (sessionId, answers) => {
    await api.post(`/questionnaires/sessions/${sessionId}/submit`, answers);
  },

  // ── Legacy local actions ──

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

  getOrCreateTrainingEntry: (_clientId, _clientName) => {
    // This previously auto-generated entries from mock training plans.
    // Now returns null — the backend handles questionnaire generation.
    return null;
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
