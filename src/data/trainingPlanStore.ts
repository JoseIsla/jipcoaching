import { mockTrainingPlans, mockClients, type TrainingBlock, type TrainingModality } from "./mockData";

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

// Convert mock list to mutable
export const trainingPlanList = [...mockTrainingPlans];

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

// Pre-populate demo detail for t1 (Carlos's plan) with sample exercises from the doc
const buildDemoPlan = (): void => {
  const day1Exercises: TrainingExerciseEntry[] = [
    {
      id: "te-1", order: 1, section: "basic", exerciseId: "ex-ssb",
      exerciseName: "Safety Bar Squat (SSB)", exerciseType: "Básico/Variante",
      method: "load_drop", topSetReps: 6, topSetRPE: 7, fatiguePercent: 7.5,
      backoffRule: "-7,5% y repetir x6 hasta volver a @7 (parar)", estimatedSeries: "2-5",
      plannedLoad: "Autoreg.", technicalNotes: "Brace 360°, control lumbar neutro",
    },
    {
      id: "te-2", order: 2, section: "basic", exerciseId: "ex-bp-pausa",
      exerciseName: "Banca Comp. Pausa", exerciseType: "Básico",
      method: "load_drop", topSetReps: 8, topSetRPE: 7, fatiguePercent: 7.5,
      backoffRule: "-7,5% y repetir x8 hasta volver a @7 (parar)", estimatedSeries: "2-5",
      plannedLoad: "Autoreg.", technicalNotes: "Pausa real, leg drive estable",
    },
    {
      id: "te-3", order: 3, section: "accessory", exerciseId: "ex-prensa",
      exerciseName: "Prensa Inclinada", exerciseType: "Bilateral accesorio",
      sets: "3-4", reps: "10-15", intensityType: "RIR", intensityValue: 2,
      technicalNotes: "Rango completo sin despegar lumbar",
    },
    {
      id: "te-4", order: 4, section: "accessory", exerciseId: "ex-remo-pecho",
      exerciseName: "Remo Pecho Apoyado", exerciseType: "Espalda",
      sets: "4", reps: "8-12", intensityType: "RIR", intensityValue: 2,
      technicalNotes: "Pausa 1s en contracción",
    },
    {
      id: "te-5", order: 5, section: "accessory", exerciseId: "ex-curl-fem",
      exerciseName: "Curl Femoral Sentado", exerciseType: "Posterior pierna",
      sets: "3", reps: "10-15", intensityType: "RIR", intensityValue: 2,
      technicalNotes: "Control excéntrica",
    },
    {
      id: "te-6", order: 6, section: "accessory", exerciseId: "ex-dead-bug",
      exerciseName: "Core anti-extensión (Dead Bug / Ab Wheel)", exerciseType: "Core",
      sets: "3-4", reps: "—", intensityType: "RIR", intensityValue: 2,
      technicalNotes: "Sin dolor lumbar",
    },
  ];

  const week1: TrainingWeek = {
    id: "tw-t1-w1",
    planId: "t1",
    weekNumber: 1,
    block: "Intensificación",
    status: "completed",
    generalNotes: "Objetivo: volver a meter patrón S/B/D con técnica sólida, RPE moderado, y controlar volumen con %fatiga.",
    days: [
      {
        id: "td-t1-w1-d1", dayNumber: 1, name: "SSB + Banca",
        warmup: "McGill Big 3 (curl-up mod., side plank, bird dog) 1-2 rondas + movilidad cadera suave",
        exercises: day1Exercises,
      },
      {
        id: "td-t1-w1-d2", dayNumber: 2, name: "Bisagra + Torso",
        warmup: "Respiración/brace 2-3 min + bird dog 2x6/lado + bisagra con palo 2x8",
        exercises: [
          {
            id: "te-7", order: 1, section: "basic", exerciseId: "ex-dl-bloques",
            exerciseName: "Peso Muerto Bloques", exerciseType: "Básico/Variante",
            method: "load_drop", topSetReps: 5, topSetRPE: 6, fatiguePercent: 5,
            backoffRule: "-5% y repetir x5 hasta volver a @6 (parar)", estimatedSeries: "1-4",
            technicalNotes: "Bar pegada, empuja desde el suelo, cero prisa",
          },
          {
            id: "te-8", order: 2, section: "accessory", exerciseId: "ex-press-incl",
            exerciseName: "Press Inclinado", sets: "4", reps: "8-12",
            intensityType: "RIR", intensityValue: 2,
          },
          {
            id: "te-9", order: 3, section: "accessory", exerciseId: "ex-jalon",
            exerciseName: "Jalón Polea / Dominadas Asist.", sets: "4", reps: "8-12",
            intensityType: "RIR", intensityValue: 2, technicalNotes: "Depresión escapular",
          },
          {
            id: "te-10", order: 4, section: "accessory", exerciseId: "ex-remo-punta",
            exerciseName: "Remo en Punta / Yates", sets: "3", reps: "8-12",
            intensityType: "RIR", intensityValue: 2,
          },
          {
            id: "te-11", order: 5, section: "accessory", exerciseId: "ex-hiper-ext",
            exerciseName: "Hiperextensiones Suaves", sets: "2-3", reps: "12-15",
            intensityType: "RIR", intensityValue: 3,
            technicalNotes: "Solo bombeo, cero dolor",
          },
          {
            id: "te-12", order: 6, section: "accessory", exerciseId: "ex-pallof",
            exerciseName: "Pallof Press", sets: "3", reps: "10-15/lado",
            intensityType: "RIR", intensityValue: 2,
          },
        ],
      },
      {
        id: "td-t1-w1-d3", dayNumber: 3, name: "Banca énfasis + Pierna",
        warmup: "Movilidad hombro/escápula + Big 3 1 ronda",
        exercises: [
          {
            id: "te-13", order: 1, section: "basic", exerciseId: "ex-bp-pausa",
            exerciseName: "Banca Comp. Pausa", exerciseType: "Básico",
            method: "load_drop", topSetReps: 6, topSetRPE: 7, fatiguePercent: 7.5,
            backoffRule: "-7,5% y repetir x6 hasta volver a @7 (parar)", estimatedSeries: "2-4",
            technicalNotes: "Misma técnica, todas las reps con pausa",
          },
          {
            id: "te-14", order: 2, section: "accessory", exerciseId: "ex-hack",
            exerciseName: "Hack Squat / Baja carga axial", sets: "4", reps: "8-12",
            intensityType: "RIR", intensityValue: 2, technicalNotes: "Profundidad cómoda",
          },
          {
            id: "te-15", order: 3, section: "accessory", exerciseId: "ex-elev-lat",
            exerciseName: "Elevaciones Laterales", sets: "4", reps: "12-20",
            intensityType: "RIR", intensityValue: 2,
          },
          {
            id: "te-16", order: 4, section: "accessory", exerciseId: "ex-triceps",
            exerciseName: "Tríceps Polea (cuerda)", sets: "3-4", reps: "10-15",
            intensityType: "RIR", intensityValue: 1,
          },
          {
            id: "te-17", order: 5, section: "accessory", exerciseId: "ex-face-pull",
            exerciseName: "Face Pull / Pájaros", sets: "3", reps: "15-25",
            intensityType: "RIR", intensityValue: 2,
          },
          {
            id: "te-18", order: 6, section: "accessory", exerciseId: "ex-crunch-polea",
            exerciseName: "Crunch Polea Alta", sets: "3-4", reps: "12-20",
            intensityType: "RIR", intensityValue: 2,
          },
        ],
      },
      {
        id: "td-t1-w1-d4", dayNumber: 4, name: "Posterior + Torso",
        warmup: "Bisagra ligera + activación glúteo (puentes 2x10)",
        exercises: [
          {
            id: "te-19", order: 1, section: "basic", exerciseId: "ex-dl-rumano",
            exerciseName: "Peso Muerto Rumano (RDL)", exerciseType: "Bisagra",
            method: "straight_sets", sets: "4", reps: "8-10",
            intensityType: "RIR", intensityValue: 2,
            technicalNotes: "Espalda larga, control excéntrica",
          },
          {
            id: "te-20", order: 2, section: "accessory", exerciseId: "ex-ghd",
            exerciseName: "GHD / Curl Femoral", sets: "3", reps: "8-12",
            intensityType: "RIR", intensityValue: 2,
          },
          {
            id: "te-21", order: 3, section: "accessory", exerciseId: "ex-press-maq",
            exerciseName: "Press Máquina Pecho Inclinado", sets: "3-4", reps: "10-15",
            intensityType: "RIR", intensityValue: 2,
          },
          {
            id: "te-22", order: 4, section: "accessory", exerciseId: "ex-remo-polea",
            exerciseName: "Remo Polea Baja / Pecho Apoyado", sets: "4", reps: "10-15",
            intensityType: "RIR", intensityValue: 2,
          },
          {
            id: "te-23", order: 5, section: "accessory", exerciseId: "ex-gemelos",
            exerciseName: "Gemelos", sets: "3-4", reps: "10-20",
            intensityType: "RIR", intensityValue: 1,
          },
          {
            id: "te-24", order: 6, section: "accessory", exerciseId: "ex-farmer",
            exerciseName: "Farmer Carry", sets: "—", reps: "6-10 min total",
            technicalNotes: "Sin dolor lumbar",
          },
        ],
      },
    ],
  };

  trainingPlanDetails["t1"] = {
    id: "t1", clientId: "1", clientName: "Carlos Martínez",
    planName: "PL Comp Prep", modality: "Powerlifting", block: "Intensificación",
    weeksDuration: 6, currentWeek: 4, active: true,
    startDate: "2025-02-03", endDate: null, daysPerWeek: 4,
    blockVariants: "SSB, Banca comp. pausa, DL desde bloques (3-5cm)",
    weeks: [
      week1,
      { ...buildEmptyWeek("t1", 2, 4, "Intensificación"), status: "completed" },
      { ...buildEmptyWeek("t1", 3, 4, "Intensificación"), status: "completed" },
      { ...buildEmptyWeek("t1", 4, 4, "Intensificación"), status: "active" },
    ],
  };
};

buildDemoPlan();

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
  mockClients.filter((c) => c.services.includes("training") && c.status !== "Inactivo");

export const getActiveTrainingPlanForClient = (clientId: string) =>
  trainingPlanList.find((p) => p.clientId === clientId && p.active) || null;
