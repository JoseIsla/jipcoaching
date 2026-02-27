import { create } from "zustand";
import { api } from "@/services/api";
import type { ApiQuestionnaire, ApiSession } from "@/types/api";
import { DEV_MOCK } from "@/config/devMode";
import { mockQuestionnaireEntries, mockWeightHistory, mockRMRecords } from "@/data/mockCheckins";
import { useTrainingPlanStore } from "@/data/useTrainingPlanStore";

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

  getOrCreateTrainingEntry: (clientId, clientName) => {
    const state = get();

    // Get active training plan and its detail
    const tpStore = useTrainingPlanStore.getState();
    const activePlan = tpStore.getActivePlanForClient(clientId);
    if (!activePlan) return null;

    const detail = tpStore.getDetail(activePlan.id);
    if (!detail || detail.weeks.length === 0) return null;

    // Find the active week, fall back to the last week
    const activeWeek = detail.weeks.find((w) => w.status === "active") ?? detail.weeks[detail.weeks.length - 1];

    // Check if we already auto-generated an entry for this plan + week
    const autoId = `qe-t-auto-${activePlan.id}-w${activeWeek.weekNumber}`;
    const existingEntry = state.entries.find((e) => e.id === autoId);
    if (existingEntry) return existingEntry;

    // Build trainingLog from the week's days, filtering only basic/variant exercises
    const trainingLog: TrainingLogDay[] = activeWeek.days
      .filter((day) => day.exercises.some((ex) => ex.section === "basic"))
      .map((day) => ({
        dayNumber: day.dayNumber,
        dayName: day.name,
        exercises: day.exercises
          .filter((ex) => ex.section === "basic") // basic section includes BASIC + VARIANT types
          .map((ex) => ({
            exerciseId: ex.exerciseId ?? ex.id,
            exerciseName: ex.exerciseName,
            section: "basic" as const,
            plannedSets: ex.method === "top_set_backoffs"
              ? `1+${ex.backoffSets ?? 3}`
              : ex.sets ?? "—",
            plannedReps: ex.method === "top_set_backoffs"
              ? String(ex.topSetReps ?? "—")
              : ex.reps ?? "—",
            plannedLoad: ex.plannedLoad ?? "—",
            plannedRPE: ex.topSetRPE,
          })),
      }));

    if (trainingLog.length === 0) return null;

    // Determine date: use Sunday of the current ISO week
    const now = new Date();
    const day = now.getDay();
    const diffToSun = day === 0 ? 0 : 7 - day;
    const sunday = new Date(now);
    sunday.setDate(now.getDate() + diffToSun);
    const dateStr = sunday.toISOString().split("T")[0];

    const newEntry: QuestionnaireEntry = {
      id: `qe-t-auto-${activePlan.id}-w${activeWeek.weekNumber}`,
      clientId,
      clientName,
      templateId: "tt-weekly",
      templateName: "Registro Semanal de Entrenamiento",
      category: "training",
      weekLabel: `Semana ${activeWeek.weekNumber}`,
      date: dateStr,
      dayLabel: "Domingo",
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
