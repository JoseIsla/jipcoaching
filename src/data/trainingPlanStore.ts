import { useClientStore } from "./useClientStore";

export type TrainingBlock = "Hipertrofia" | "Intensificación" | "Peaking" | "Tapering";
export type TrainingModality = "Powerlifting" | "Powerbuilding";

// ==================== TYPES ====================

export type TrainingMethod =
  | "load_drop"
  | "top_set_backoffs"
  | "straight_sets"
  | "ramp"
  | "wave"
  | "custom";

export const TRAINING_METHOD_LABELS: Record<TrainingMethod, string> = {
  load_drop: "Load Drop",
  top_set_backoffs: "Top Set + Back-offs",
  straight_sets: "Straight Sets",
  ramp: "Rampas / Pirámide",
  wave: "Oleadas",
  custom: "Personalizado",
};

export type IntensityMeasure = "RPE" | "RIR";

export interface ExerciseLibraryItem {
  id: string;
  name: string;
  category: "basico" | "variante" | "accesorio";
  muscleGroup?: string;
  parentExerciseId?: string;
}

export interface TrainingExerciseEntry {
  id: string;
  order: number;
  section: "basic" | "accessory";
  exerciseId?: string;
  exerciseName: string;
  exerciseType?: string;
  // For basics/variants with methods
  method?: TrainingMethod;
  topSetReps?: number;
  topSetRPE?: number;
  fatiguePercent?: number;
  backoffRule?: string;
  estimatedSeries?: string;
  backoffSets?: number;
  backoffPercent?: number;
  backoffReps?: string;
  // For straight sets / accessories / general
  sets?: string;
  reps?: string;
  intensityType?: IntensityMeasure;
  intensityValue?: number;
  // Common
  plannedLoad?: string;
  technicalNotes?: string;
  // Custom method
  customMethodName?: string;
  customMethodDescription?: string;
}

export interface TrainingDay {
  id: string;
  dayNumber: number;
  name: string;
  warmup?: string;
  exercises: TrainingExerciseEntry[];
}

export interface TrainingWeek {
  id: string;
  planId: string;
  weekNumber: number;
  block: TrainingBlock;
  status: "draft" | "active" | "completed";
  generalNotes?: string;
  days: TrainingDay[];
}

export interface TrainingPlanFull {
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
  blockVariants?: string;
  daysPerWeek: number;
  weeks: TrainingWeek[];
}

// ==================== EXERCISE LIBRARY ====================

export const exerciseLibrary: ExerciseLibraryItem[] = [
  // Básicos
  { id: "ex-sq", name: "Sentadilla", category: "basico", muscleGroup: "Pierna" },
  { id: "ex-bp", name: "Press Banca", category: "basico", muscleGroup: "Pecho" },
  { id: "ex-dl", name: "Peso Muerto", category: "basico", muscleGroup: "Posterior" },
  // Variantes sentadilla
  { id: "ex-ssb", name: "Safety Bar Squat (SSB)", category: "variante", muscleGroup: "Pierna", parentExerciseId: "ex-sq" },
  { id: "ex-sq-pausa", name: "Sentadilla Pausa", category: "variante", muscleGroup: "Pierna", parentExerciseId: "ex-sq" },
  { id: "ex-sq-front", name: "Sentadilla Front", category: "variante", muscleGroup: "Pierna", parentExerciseId: "ex-sq" },
  { id: "ex-sq-tempo", name: "Sentadilla Tempo", category: "variante", muscleGroup: "Pierna", parentExerciseId: "ex-sq" },
  // Variantes banca
  { id: "ex-bp-pausa", name: "Banca Comp. Pausa", category: "variante", muscleGroup: "Pecho", parentExerciseId: "ex-bp" },
  { id: "ex-bp-estrecho", name: "Press Banca Estrecho", category: "variante", muscleGroup: "Pecho", parentExerciseId: "ex-bp" },
  { id: "ex-bp-pausa-larga", name: "Press Banca Pausa Larga", category: "variante", muscleGroup: "Pecho", parentExerciseId: "ex-bp" },
  { id: "ex-bp-larsen", name: "Larsen Press", category: "variante", muscleGroup: "Pecho", parentExerciseId: "ex-bp" },
  // Variantes peso muerto
  { id: "ex-dl-bloques", name: "Peso Muerto Bloques", category: "variante", muscleGroup: "Posterior", parentExerciseId: "ex-dl" },
  { id: "ex-dl-deficit", name: "Peso Muerto Déficit", category: "variante", muscleGroup: "Posterior", parentExerciseId: "ex-dl" },
  { id: "ex-dl-rumano", name: "Peso Muerto Rumano (RDL)", category: "variante", muscleGroup: "Posterior", parentExerciseId: "ex-dl" },
  { id: "ex-dl-sumo", name: "Peso Muerto Sumo", category: "variante", muscleGroup: "Posterior", parentExerciseId: "ex-dl" },
  // Accesorios - Pierna
  { id: "ex-prensa", name: "Prensa Inclinada", category: "accesorio", muscleGroup: "Pierna" },
  { id: "ex-hack", name: "Hack Squat", category: "accesorio", muscleGroup: "Pierna" },
  { id: "ex-ext-quad", name: "Extensión de Cuádriceps", category: "accesorio", muscleGroup: "Pierna" },
  { id: "ex-curl-fem", name: "Curl Femoral Sentado", category: "accesorio", muscleGroup: "Posterior" },
  { id: "ex-curl-fem-t", name: "Curl Femoral Tumbado", category: "accesorio", muscleGroup: "Posterior" },
  { id: "ex-ghd", name: "GHD", category: "accesorio", muscleGroup: "Posterior" },
  { id: "ex-hip-thrust", name: "Hip Thrust", category: "accesorio", muscleGroup: "Glúteo" },
  { id: "ex-gemelos", name: "Gemelos (sentado/pie)", category: "accesorio", muscleGroup: "Pierna" },
  // Accesorios - Pecho/Hombro
  { id: "ex-press-incl", name: "Press Inclinado", category: "accesorio", muscleGroup: "Pecho" },
  { id: "ex-press-maq", name: "Press Máquina Pecho", category: "accesorio", muscleGroup: "Pecho" },
  { id: "ex-elev-lat", name: "Elevaciones Laterales", category: "accesorio", muscleGroup: "Hombro" },
  { id: "ex-face-pull", name: "Face Pull / Pájaros", category: "accesorio", muscleGroup: "Hombro" },
  { id: "ex-press-militar", name: "Press Militar", category: "accesorio", muscleGroup: "Hombro" },
  // Accesorios - Espalda
  { id: "ex-remo-pecho", name: "Remo Pecho Apoyado", category: "accesorio", muscleGroup: "Espalda" },
  { id: "ex-remo-punta", name: "Remo en Punta", category: "accesorio", muscleGroup: "Espalda" },
  { id: "ex-remo-yates", name: "Remo Dorian Yates", category: "accesorio", muscleGroup: "Espalda" },
  { id: "ex-jalon", name: "Jalón Polea", category: "accesorio", muscleGroup: "Espalda" },
  { id: "ex-dominadas", name: "Dominadas / Asistidas", category: "accesorio", muscleGroup: "Espalda" },
  { id: "ex-remo-polea", name: "Remo Polea Baja", category: "accesorio", muscleGroup: "Espalda" },
  // Accesorios - Brazos
  { id: "ex-triceps", name: "Tríceps Polea (cuerda)", category: "accesorio", muscleGroup: "Brazos" },
  { id: "ex-curl-biceps", name: "Curl Bíceps", category: "accesorio", muscleGroup: "Brazos" },
  // Accesorios - Core
  { id: "ex-dead-bug", name: "Dead Bug", category: "accesorio", muscleGroup: "Core" },
  { id: "ex-ab-wheel", name: "Ab Wheel", category: "accesorio", muscleGroup: "Core" },
  { id: "ex-pallof", name: "Pallof Press", category: "accesorio", muscleGroup: "Core" },
  { id: "ex-crunch-polea", name: "Crunch Polea Alta", category: "accesorio", muscleGroup: "Core" },
  { id: "ex-plank", name: "Plank / Side Plank", category: "accesorio", muscleGroup: "Core" },
  // Accesorios - Prehab
  { id: "ex-hiper-ext", name: "Hiperextensiones Suaves", category: "accesorio", muscleGroup: "Prehab" },
  { id: "ex-farmer", name: "Farmer Carry", category: "accesorio", muscleGroup: "Core" },
  { id: "ex-bird-dog", name: "Bird Dog", category: "accesorio", muscleGroup: "Prehab" },
];

export const addExerciseToLibrary = (item: Omit<ExerciseLibraryItem, "id">): ExerciseLibraryItem => {
  const newItem: ExerciseLibraryItem = { ...item, id: `ex-custom-${Date.now()}` };
  exerciseLibrary.push(newItem);
  return newItem;
};

// ==================== PLAN STORE ====================

// Plan list — initialized empty (populated from API)
export const trainingPlanList: any[] = [];

// Detailed plans store (keyed by plan id)
const trainingPlanDetails: Record<string, TrainingPlanFull> = {};

// Build a default week 1 for demo plans
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

// Details store — initialized empty (populated from API)
// No demo data.

// ==================== CRUD HELPERS ====================

export const getTrainingPlanDetail = (planId: string): TrainingPlanFull | null => {
  if (trainingPlanDetails[planId]) return trainingPlanDetails[planId];
  // Auto-create from list entry
  const listEntry = trainingPlanList.find((p) => p.id === planId);
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
  trainingPlanDetails[planId] = detail;
  return detail;
};

export const saveTrainingWeek = (planId: string, week: TrainingWeek): void => {
  const detail = getTrainingPlanDetail(planId);
  if (!detail) return;
  const idx = detail.weeks.findIndex((w) => w.id === week.id);
  if (idx >= 0) {
    detail.weeks[idx] = week;
  } else {
    detail.weeks.push(week);
  }
  // Sync current week to list
  const listEntry = trainingPlanList.find((p) => p.id === planId);
  if (listEntry) {
    listEntry.currentWeek = detail.weeks.length;
  }
};

export const addTrainingPlanToList = (plan: {
  clientId: string;
  clientName: string;
  planName: string;
  modality: TrainingModality;
  block: TrainingBlock;
  daysPerWeek: number;
  weeksDuration: number;
  blockVariants?: string;
}): string => {
  const id = `t-${Date.now()}`;
  const startDate = new Date().toISOString().split("T")[0];

  // Deactivate previous active plans for same client
  trainingPlanList.forEach((p) => {
    if (p.clientId === plan.clientId && p.active) {
      p.active = false;
      p.endDate = startDate;
      if (trainingPlanDetails[p.id]) {
        trainingPlanDetails[p.id].active = false;
        trainingPlanDetails[p.id].endDate = startDate;
      }
    }
  });

  const newListEntry = {
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
  trainingPlanList.push(newListEntry);

  const detail: TrainingPlanFull = {
    ...newListEntry,
    daysPerWeek: plan.daysPerWeek,
    blockVariants: plan.blockVariants || "",
    weeks: [buildEmptyWeek(id, 1, plan.daysPerWeek, plan.block)],
  };
  trainingPlanDetails[id] = detail;

  return id;
};

export const addWeekToPlan = (planId: string, block: TrainingBlock): TrainingWeek | null => {
  const detail = getTrainingPlanDetail(planId);
  if (!detail) return null;
  const nextWeekNum = detail.weeks.length + 1;
  // Mark previous active week as completed
  detail.weeks.forEach((w) => {
    if (w.status === "active") w.status = "completed";
  });
  const newWeek = buildEmptyWeek(planId, nextWeekNum, detail.daysPerWeek, block);
  newWeek.status = "active";
  detail.weeks.push(newWeek);
  detail.weeksDuration = nextWeekNum;
  // Update block to current
  detail.block = block;
  const listEntry = trainingPlanList.find((p) => p.id === planId);
  if (listEntry) {
    listEntry.currentWeek = nextWeekNum;
    listEntry.weeksDuration = nextWeekNum;
    listEntry.block = block;
  }
  return newWeek;
};

export const getCurrentBlockForPlan = (planId: string): TrainingBlock | null => {
  const detail = trainingPlanDetails[planId];
  if (!detail) return null;
  const activeWeek = detail.weeks.find((w) => w.status === "active");
  return activeWeek?.block || detail.block;
};

export const toggleTrainingPlanActive = (planId: string, active: boolean): void => {
  const listEntry = trainingPlanList.find((p) => p.id === planId);
  if (listEntry) {
    listEntry.active = active;
    if (!active) listEntry.endDate = new Date().toISOString().split("T")[0];
  }
  if (trainingPlanDetails[planId]) {
    trainingPlanDetails[planId].active = active;
    if (!active) trainingPlanDetails[planId].endDate = new Date().toISOString().split("T")[0];
  }
};

export const getTrainingClientsWithService = () =>
  useClientStore.getState().clients.filter((c) => c.services.includes("training") && String(c.status ?? "").toUpperCase() !== "PAUSED");

export const getActiveTrainingPlanForClient = (clientId: string) =>
  trainingPlanList.find((p) => p.clientId === clientId && p.active) || null;
