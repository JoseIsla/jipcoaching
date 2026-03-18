import { create } from "zustand";
import { api, API_BASE_URL, AUTH_TOKEN_KEY } from "@/services/api";
import type { ApiQuestionnaire, ApiSession } from "@/types/api";
import { DEV_MOCK } from "@/config/devMode";
import { mockQuestionnaireEntries, mockWeightHistory, mockRMRecords } from "@/data/mockCheckins";
import { useTrainingPlanStore } from "@/data/useTrainingPlanStore";
import { useClientDetailStore } from "@/data/useClientDetailStore";
import { toast } from "@/hooks/use-toast";
import { parseDecimal } from "@/utils/parseDecimal";

/** Resolve relative upload URLs to full server URLs with auth token for protected files */
const resolveUrl = (url: string | null | undefined): string | undefined => {
  if (!url || url.startsWith("http") || url.startsWith("blob:")) return url || undefined;
  const serverRoot = API_BASE_URL.replace(/\/api\/?$/, "");
  const fullUrl = `${serverRoot}${url}`;
  // Protected paths need auth token as query param for <video>/<img> tags
  if (url.startsWith("/uploads/videos") || url.startsWith("/uploads/progress")) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) return `${fullUrl}?token=${token}`;
  }
  return fullUrl;
};

// ── Types (previously from mockData, now standalone) ──

export interface WeightEntry {
  date: string;
  weight: number;
}

export interface RMRecord {
  id?: string;
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
  method?: string;
  plannedSets: string;
  plannedReps: string;
  plannedLoad: string;
  plannedRPE?: number;
  actualWeight?: number;
  actualRPE?: number;
  actualSets?: string;
  actualReps?: string;
  backoffWeights?: string;
  comment?: string;
}

export interface TrainingLogDay {
  dayNumber: number;
  dayName: string;
  exercises: TrainingLogExercise[];
}

export type QuestionnaireStatus = "pendiente" | "respondido" | "revisado" | "expirado" | "no_enviado";

export interface CheckinVideo {
  id: string;
  exerciseName: string;
  url: string;
  notes?: string;
  uploadedAt: string;
}

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
  techniqueVideos?: CheckinVideo[];
  planId?: string;
  weekNumber?: number;
  templateQuestions?: { id: string; label: string; type: string; required: boolean; options?: string[] }[];
}

// ── Window status helper ──

/** Publication hour for nutrition check-ins (7:00 AM) */
export const NUTRITION_PUBLISH_HOUR = 7;

/** Determine whether a check-in entry's fill window is active, future, or expired. */
export const getEntryWindowStatus = (entry: QuestionnaireEntry): "within" | "future" | "expired" => {
  const now = new Date();
  if (entry.category === "nutrition") {
    // Nutrition: available from publish date at 7:00 AM local for 48 hours
    const [y, m, d] = entry.date.split("-").map(Number);
    const publishDate = new Date(y, m - 1, d, NUTRITION_PUBLISH_HOUR, 0, 0, 0);
    const windowEnd = new Date(publishDate.getTime() + 48 * 60 * 60 * 1000);
    if (now < publishDate) return "future";
    if (now <= windowEnd) return "within";
    return "expired";
  }
  // Training: available from Saturday 7:00 AM until Sunday 23:59:59
  const [y, m, d] = entry.date.split("-").map(Number);
  const entryDate = new Date(y, m - 1, d, 7, 0, 0, 0);
  // Sunday midnight = next day at 00:00 from Saturday perspective
  const windowEnd = new Date(y, m - 1, d + 1, 23, 59, 59, 999);
  if (now < entryDate) return "future";
  if (now <= windowEnd) return "within";
  return "expired";
};

/** Returns true if a pending entry can actually be filled right now. */
export const isActionablePending = (entry: QuestionnaireEntry): boolean => {
  if (entry.status !== "pendiente") return false;
  return getEntryWindowStatus(entry) === "within";
};

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
  fetchEntries: (clientId?: string) => Promise<void>;
  fetchWeightHistory: (clientId: string) => Promise<void>;
  fetchRMRecords: (clientId: string) => Promise<void>;
  fetchSessions: () => Promise<void>;
  createSession: (data: Record<string, unknown>) => Promise<ApiSession | null>;
  fetchActiveQuestionnaire: () => Promise<ApiQuestionnaire | null>;
  submitQuestionnaire: (sessionId: string, answers: Record<string, unknown>) => Promise<void>;
  generateMyCheckins: () => Promise<void>;
  generateWeeklyCheckins: () => Promise<number>;
  markAsReviewed: (entryId: string) => Promise<void>;

  // Legacy local actions (kept for UI compat)
  submitEntry: (entryId: string, responses: Record<string, string | number | boolean>, trainingLog?: TrainingLogDay[]) => Promise<boolean>;
  addVideoToEntry: (entryId: string, video: CheckinVideo) => void;
  removeVideoFromEntry: (entryId: string, videoId: string) => void;
  getPendingCount: (clientId?: string) => number;
  getSubmittedCount: () => number;
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

  fetchEntries: async (clientId) => {
    if (DEV_MOCK) return;
    set({ loading: true, error: null });
    try {
      const query = clientId ? `?clientId=${clientId}` : "";
      const data = await api.get<QuestionnaireEntry[]>(`/checkins${query}`);
      // Resolve video URLs
      const resolved = (data ?? []).map((e) => ({
        ...e,
        techniqueVideos: e.techniqueVideos?.map((v) => ({
          ...v,
          url: resolveUrl(v.url) || v.url,
        })),
      }));
      set((s) => {
        // Merge API entries with any locally-generated auto-entries (training).
        // If the API already returned a real entry for the same client+date+category,
        // drop the local auto one to avoid showing inconsistent templates/questions.
        const autoEntries = s.entries.filter((e) => e.id.startsWith("qe-t-auto-"));
        const apiKeys = new Set(resolved.map((e) => `${e.clientId}|${e.date}|${e.category}`));
        const nonDuplicateAuto = autoEntries.filter(
          (e) => !apiKeys.has(`${e.clientId}|${e.date}|${e.category}`)
        );
        return { entries: [...resolved, ...nonDuplicateAuto], loading: false };
      });
    } catch (err: any) {
      set({ error: err?.message ?? "Error al cargar check-ins", loading: false });
    }
  },

  fetchWeightHistory: async (clientId) => {
    if (DEV_MOCK) return;
    try {
      const data = await api.get<WeightEntry[]>(`/checkins/weight/${clientId}`);
      set((s) => ({
        weightHistory: { ...s.weightHistory, [clientId]: data ?? [] },
      }));
    } catch (err: any) {
      console.error("Error fetching weight history:", err);
    }
  },

  fetchRMRecords: async (clientId) => {
    if (DEV_MOCK) return;
    try {
      const data = await api.get<RMRecord[]>(`/checkins/rm/${clientId}`);
      set((s) => ({
        rmRecords: { ...s.rmRecords, [clientId]: data ?? [] },
      }));
    } catch (err: any) {
      console.error("Error fetching RM records:", err);
    }
  },

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

  generateMyCheckins: async () => {
    if (DEV_MOCK) return;
    try {
      await api.post("/checkins/generate-mine", {});
    } catch (err: any) {
      console.warn("Error generating my checkins:", err?.message);
    }
  },

  generateWeeklyCheckins: async () => {
    if (DEV_MOCK) return 0;
    try {
      const result = await api.post<{ created: number }>("/checkins/generate-weekly", {});
      return result?.created ?? 0;
    } catch (err: any) {
      console.warn("Error generating weekly checkins:", err?.message);
      return 0;
    }
  },

  markAsReviewed: async (entryId) => {
    // Optimistically update local state
    set((s) => ({
      entries: s.entries.map((e) =>
        e.id === entryId ? { ...e, status: "revisado" as const } : e
      ),
    }));
    if (!DEV_MOCK) {
      try {
        await api.patch(`/checkins/${entryId}/review`, {});
      } catch (err: any) {
        console.error("Error marking check-in as reviewed:", err);
        // Revert on error
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === entryId ? { ...e, status: "respondido" as const } : e
          ),
        }));
      }
    }
  },

  // ── Legacy local actions ──

  submitEntry: async (entryId, responses, trainingLog) => {
    const state = get();
    const entry = state.entries.find((e) => e.id === entryId);

    // Submit to API and confirm before updating local state
    if (!DEV_MOCK && entry) {
      try {
        await api.post(`/checkins/${entryId}/submit`, { responses, trainingLog });
      } catch (err: any) {
        console.error("Error submitting check-in to API:", err);
        toast({ title: "Error al enviar", description: err?.message || "No se pudo enviar el check-in. Inténtalo de nuevo.", variant: "destructive" });
        return false;
      }
    }

    set((s) => {
      const updatedEntries = s.entries.map((e) =>
        e.id === entryId
          ? {
              ...e,
              status: "respondido" as const,
              responses,
              ...(trainingLog ? { trainingLog } : {}),
            }
          : e
      );

      // If this is a nutrition check-in with weight, update weightHistory
      // Find weight question: first NUMBER question with "peso"/"weight" in label, or fallback to "q1"
      const updatedWeightHistory = { ...s.weightHistory };
      if (entry && entry.category === "nutrition") {
        const weightQ = entry.templateQuestions?.find(
          (q) => q.type.toLowerCase() === "number" &&
            (q.label.toLowerCase().includes("peso") || q.label.toLowerCase().includes("weight"))
        ) || entry.templateQuestions?.find((q) => q.type.toLowerCase() === "number");
        const weightKey = weightQ?.id || "q1";
        const rawWeight = responses[weightKey];

        if (rawWeight != null) {
          const weight = parseDecimal(rawWeight as any, 0);
          if (!isNaN(weight) && weight > 0) {
            const clientHistory = [...(updatedWeightHistory[entry.clientId] || [])];
            const today = new Date().toISOString().slice(0, 10);
            const existingIdx = clientHistory.findIndex((w) => w.date === today);
            if (existingIdx >= 0) {
              clientHistory[existingIdx] = { date: today, weight };
            } else {
              clientHistory.push({ date: today, weight });
            }
            clientHistory.sort((a, b) => a.date.localeCompare(b.date));
            updatedWeightHistory[entry.clientId] = clientHistory;

            // Sync weight to client detail store
            const detailStore = useClientDetailStore.getState();
            const existingDetail = detailStore.getDetail(entry.clientId);
            if (existingDetail) {
              const history = [...(existingDetail.weightHistory || [])];
              const idx = history.findIndex((w) => w.date === today);
              if (idx >= 0) history[idx] = { date: today, weight };
              else history.push({ date: today, weight });
              history.sort((a, b) => a.date.localeCompare(b.date));
              detailStore.updateDetail(entry.clientId, { currentWeight: weight, weightHistory: history });
            }
          }
        }
      }

      return { entries: updatedEntries, weightHistory: updatedWeightHistory };
    });
    return true;
  },

  addVideoToEntry: (entryId, video) =>
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === entryId
          ? { ...e, techniqueVideos: [...(e.techniqueVideos || []), { ...video, url: resolveUrl(video.url) || video.url }] }
          : e
      ),
    })),

  removeVideoFromEntry: (entryId, videoId) =>
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === entryId
          ? { ...e, techniqueVideos: (e.techniqueVideos || []).filter((v) => v.id !== videoId) }
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

  getSubmittedCount: () => {
    return get().entries.filter((e) => e.status === "respondido").length;
  },

  getEntriesForClient: (clientId) =>
    get().entries.filter((e) => e.clientId === clientId),

  getOrCreateTrainingEntry: (clientId, clientName) => {
    const state = get();

    // Training check-ins should only exist on Saturday or Sunday (the fill window)
    const now = new Date();
    const todayDay = now.getDay(); // 0=Sun, 6=Sat
    if (todayDay !== 0 && todayDay !== 6) return null;

    const tpStore = useTrainingPlanStore.getState();
    const activePlan = tpStore.getActivePlanForClient(clientId);
    if (!activePlan) return null;

    const detail = tpStore.getDetail(activePlan.id);
    if (!detail || detail.weeks.length === 0) return null;

    const activeWeek = detail.weeks.find((w) => w.status === "active") ?? detail.weeks[detail.weeks.length - 1];

    const autoId = `qe-t-auto-${activePlan.id}-w${activeWeek.weekNumber}`;
    const existingEntry = state.entries.find((e) => e.id === autoId);
    if (existingEntry) return existingEntry;

    const trainingLog: TrainingLogDay[] = activeWeek.days
      .filter((day) => day.exercises.some((ex) => ex.section === "basic" || (ex.section as string) === "variant"))
      .map((day) => ({
        dayNumber: day.dayNumber,
        dayName: day.name,
        exercises: [...day.exercises]
          .sort((a, b) => a.order - b.order)
          .filter((ex) => ex.section === "basic" || (ex.section as string) === "variant")
          .map((ex) => ({
            exerciseId: ex.exerciseId ?? ex.id,
            exerciseName: ex.exerciseName,
            section: "basic" as const,
            method: ex.method,
            plannedSets: ex.method === "top_set_backoffs"
              ? `1+${ex.backoffSets ?? 3}`
              : ex.method === "load_drop"
              ? (ex as any).estimatedSeries ?? "—"
              : ex.sets ?? "—",
            plannedReps: (ex.method === "top_set_backoffs" || ex.method === "load_drop")
              ? String(ex.topSetReps ?? "—")
              : ex.reps ?? "—",
            plannedLoad: ex.plannedLoad ?? "—",
            plannedRPE: ex.topSetRPE,
          })),
      }));

    if (trainingLog.length === 0) return null;

    // Use Saturday as the entry date
    const saturday = new Date(now);
    if (todayDay === 0) {
      saturday.setDate(now.getDate() - 1); // Sunday → previous Saturday
    }
    const dateStr = saturday.toISOString().split("T")[0];

    const newEntry: QuestionnaireEntry = {
      id: autoId,
      clientId,
      clientName,
      templateId: "tt-weekly",
      templateName: "Registro Semanal de Entrenamiento",
      category: "training",
      weekLabel: `Semana ${activeWeek.weekNumber}`,
      date: dateStr,
      dayLabel: "Sábado",
      status: "pendiente",
      trainingLog,
      planId: activePlan.id,
      weekNumber: activeWeek.weekNumber,
    };

    set((s) => ({ entries: [...s.entries, newEntry] }));
    return newEntry;
  },

  getWeightHistory: (clientId) =>
    get().weightHistory[clientId] || [],

  getBestRMs: (clientId) => {
    const records = get().rmRecords[clientId] || [];
    const bestByExercise: Record<string, RMRecord> = {};
    records.forEach((r) => {
      const key = r.exerciseName || r.exerciseId;
      if (!bestByExercise[key] || r.estimated1RM > bestByExercise[key].estimated1RM) {
        bestByExercise[key] = r;
      }
    });
    return Object.values(bestByExercise);
  },

  getTrainingProgress: (clientId) => {
    const entries = get().entries.filter(
      (e) => e.clientId === clientId && e.category === "training" && (e.status === "respondido" || e.status === "revisado")
    );
    const latest = entries[entries.length - 1];
    if (!latest?.responses) {
      return { latestFatigue: undefined, latestSleep: undefined, latestMotivation: undefined, hasInjury: undefined, injuryDetail: undefined };
    }

    const r = latest.responses;
    const qs = latest.templateQuestions || [];

    // Helper: find response by label keyword match, fallback to legacy mock ID
    const findVal = (keywords: string[], fallbackId: string) => {
      const q = qs.find((q) => keywords.some((k) => q.label.toLowerCase().includes(k)));
      return r[q?.id || fallbackId];
    };

    return {
      latestFatigue: findVal(["fatiga", "fatigue"], "tq1") as number | undefined,
      latestSleep: findVal(["sueño", "sleep", "descanso"], "tq4") as number | undefined,
      latestMotivation: findVal(["motivación", "motivation", "ánimo"], "tq5") as number | undefined,
      hasInjury: findVal(["molestia", "dolor", "injury", "pain"], "tq2") as boolean | undefined,
      injuryDetail: findVal(["describe", "detalle", "detail"], "tq3") as string | undefined,
    };
  },
}));
