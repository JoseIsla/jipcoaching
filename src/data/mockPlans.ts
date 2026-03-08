/**
 * Mock training & nutrition plans for DEV_MOCK mode.
 * Pre-configured so clients see real content from the start.
 */
import type { NutritionPlanDetail, Meal } from "@/data/nutritionPlanStore";
import type { NutritionPlanListEntry } from "@/data/useNutritionPlanStore";
import type { Supplement } from "@/data/nutritionPlanStore";

// ─── Training plan mock data ───────────────────────────────────

export interface MockTrainingPlanList {
  id: string;
  clientId: string;
  clientName: string;
  planName: string;
  modality: "Powerlifting" | "Powerbuilding";
  block: "Hipertrofia" | "Intensificación" | "Peaking" | "Tapering";
  weeksDuration: number;
  currentWeek: number | null;
  active: boolean;
  startDate: string;
  endDate: string | null;
}

export interface MockTrainingDetail {
  id: string;
  clientId: string;
  clientName: string;
  planName: string;
  modality: "Powerlifting" | "Powerbuilding";
  block: "Hipertrofia" | "Intensificación" | "Peaking" | "Tapering";
  weeksDuration: number;
  currentWeek: number | null;
  active: boolean;
  startDate: string;
  endDate: string | null;
  daysPerWeek: number;
  blockVariants: string;
  weeks: any[];
}

const makeExercise = (
  id: string,
  order: number,
  section: "basic" | "accessory",
  name: string,
  opts: Record<string, any> = {}
) => ({
  id,
  order,
  section,
  exerciseName: name,
  ...opts,
});

const carlosWeek1 = {
  id: "tw-mock-carlos-w1",
  planId: "t-mock-carlos",
  weekNumber: 1,
  block: "Hipertrofia" as const,
  status: "completed" as const,
  generalNotes: "Semana de adaptación. Cargas conservadoras.",
  days: [
    {
      id: "td-mc-w1-d1", dayNumber: 1, name: "Sentadilla + Accesorios",
      warmup: "5 min bike + movilidad de cadera",
      exercises: [
        makeExercise("e1", 1, "basic", "Sentadilla", { method: "top_set_backoffs", topSetReps: 6, topSetRPE: 7, backoffSets: 3, backoffPercent: 85, technicalNotes: "Foco en profundidad y control excéntrico" }),
        makeExercise("e2", 2, "basic", "Sentadilla Pausa", { method: "straight_sets", sets: "3", reps: "4", technicalNotes: "2s pausa abajo" }),
        makeExercise("e3", 3, "accessory", "Prensa Inclinada", { sets: "3", reps: "10-12", intensityType: "RIR", intensityValue: 2 }),
        makeExercise("e4", 4, "accessory", "Curl Femoral Sentado", { sets: "3", reps: "12-15", intensityType: "RIR", intensityValue: 1 }),
        makeExercise("e5", 5, "accessory", "Ab Wheel", { sets: "3", reps: "10", technicalNotes: "Control total, sin colapsar lumbar" }),
      ],
    },
    {
      id: "td-mc-w1-d2", dayNumber: 2, name: "Press Banca + Accesorios",
      warmup: "Rotaciones de hombro + band pull-aparts",
      exercises: [
        makeExercise("e6", 1, "basic", "Press Banca", { method: "top_set_backoffs", topSetReps: 5, topSetRPE: 7, backoffSets: 3, backoffPercent: 82, technicalNotes: "Arco moderado, retracción escapular" }),
        makeExercise("e7", 2, "basic", "Press Banca Estrecho", { method: "straight_sets", sets: "3", reps: "8" }),
        makeExercise("e8", 3, "accessory", "Press Inclinado", { sets: "3", reps: "10", intensityType: "RIR", intensityValue: 2 }),
        makeExercise("e9", 4, "accessory", "Remo Pecho Apoyado", { sets: "4", reps: "10-12", intensityType: "RIR", intensityValue: 1 }),
        makeExercise("e10", 5, "accessory", "Tríceps Polea (cuerda)", { sets: "3", reps: "15" }),
      ],
    },
    {
      id: "td-mc-w1-d3", dayNumber: 3, name: "Peso Muerto + Accesorios",
      warmup: "5 min remo + activación glúteo",
      exercises: [
        makeExercise("e11", 1, "basic", "Peso Muerto", { method: "top_set_backoffs", topSetReps: 5, topSetRPE: 7, backoffSets: 2, backoffPercent: 80, technicalNotes: "Cadena posterior activada, no tirar de espalda" }),
        makeExercise("e12", 2, "basic", "Peso Muerto Déficit", { method: "straight_sets", sets: "3", reps: "5", technicalNotes: "Déficit 5cm" }),
        makeExercise("e13", 3, "accessory", "Hip Thrust", { sets: "3", reps: "10", intensityType: "RIR", intensityValue: 2 }),
        makeExercise("e14", 4, "accessory", "Jalón Polea", { sets: "4", reps: "10-12", intensityType: "RIR", intensityValue: 1 }),
        makeExercise("e15", 5, "accessory", "Pallof Press", { sets: "3", reps: "12/lado" }),
      ],
    },
    {
      id: "td-mc-w1-d4", dayNumber: 4, name: "Volumen Superior",
      warmup: "Band pull-aparts + face pulls ligeros",
      exercises: [
        makeExercise("e16", 1, "basic", "Press Banca", { method: "straight_sets", sets: "4", reps: "8", topSetRPE: 6, technicalNotes: "Trabajo de volumen, técnica impecable" }),
        makeExercise("e17", 2, "accessory", "Elevaciones Laterales", { sets: "4", reps: "15", intensityType: "RIR", intensityValue: 1 }),
        makeExercise("e18", 3, "accessory", "Dominadas / Asistidas", { sets: "3", reps: "8-10" }),
        makeExercise("e19", 4, "accessory", "Curl Bíceps", { sets: "3", reps: "12" }),
        makeExercise("e20", 5, "accessory", "Face Pull / Pájaros", { sets: "3", reps: "15", technicalNotes: "Rotación externa al final del movimiento" }),
      ],
    },
  ],
};

const makeWeekFromBase = (weekNum: number, status: "completed" | "active" | "draft", rpeOffset: number, notes: string) => ({
  id: `tw-mock-carlos-w${weekNum}`,
  planId: "t-mock-carlos",
  weekNumber: weekNum,
  block: "Hipertrofia" as const,
  status,
  generalNotes: notes,
  days: carlosWeek1.days.map((d) => ({
    ...d,
    id: d.id.replace("w1", `w${weekNum}`),
    exercises: d.exercises.map((e: any) => ({
      ...e,
      id: `${e.id}-w${weekNum}`,
      topSetRPE: e.topSetRPE ? e.topSetRPE + rpeOffset : undefined,
    })),
  })),
});

const carlosWeek2 = makeWeekFromBase(2, "completed", 1, "Subimos RPE a 8. Mantener técnica.");
const carlosWeek3 = makeWeekFromBase(3, "completed", 1.5, "Semana 3: consolidación de cargas.");
const carlosWeek4 = makeWeekFromBase(4, "completed", 2, "Semana fuerte. RPEs altos pero controlados.");
const carlosWeek5 = makeWeekFromBase(5, "active", 2, "Semana 5: última subida antes de deload.");

export const mockTrainingPlans: MockTrainingPlanList[] = [
  {
    id: "t-mock-carlos",
    clientId: "1",
    clientName: "Carlos Martínez",
    planName: "Fuerza Powerlifting Q1 2026",
    modality: "Powerlifting",
    block: "Hipertrofia",
    weeksDuration: 8,
    currentWeek: 5,
    active: true,
    startDate: "2026-01-20",
    endDate: null,
  },
  {
    id: "t-mock-laura",
    clientId: "4",
    clientName: "Laura García",
    planName: "Powerbuilding Volumen",
    modality: "Powerbuilding",
    block: "Hipertrofia",
    weeksDuration: 6,
    currentWeek: 1,
    active: true,
    startDate: "2026-02-10",
    endDate: null,
  },
  {
    id: "t-mock-pablo",
    clientId: "7",
    clientName: "Pablo Navarro",
    planName: "Hipertrofia Bloque 2",
    modality: "Powerbuilding",
    block: "Hipertrofia",
    weeksDuration: 6,
    currentWeek: 1,
    active: true,
    startDate: "2026-02-03",
    endDate: null,
  },
];

const buildSimpleWeek = (planId: string, weekNum: number, daysPerWeek: number, block: string, status: string) => ({
  id: `tw-${planId}-w${weekNum}`,
  planId,
  weekNumber: weekNum,
  block,
  status,
  days: Array.from({ length: daysPerWeek }, (_, i) => ({
    id: `td-${planId}-w${weekNum}-d${i + 1}`,
    dayNumber: i + 1,
    name: `Día ${i + 1}`,
    warmup: "",
    exercises: [],
  })),
});

export const mockTrainingDetails: Record<string, MockTrainingDetail> = {
  "t-mock-carlos": {
    id: "t-mock-carlos",
    clientId: "1",
    clientName: "Carlos Martínez",
    planName: "Fuerza Powerlifting Q1 2026",
    modality: "Powerlifting",
    block: "Hipertrofia",
    weeksDuration: 8,
    currentWeek: 2,
    active: true,
    startDate: "2026-01-20",
    endDate: null,
    daysPerWeek: 4,
    blockVariants: "",
    weeks: [carlosWeek1, carlosWeek2],
  },
  "t-mock-laura": {
    id: "t-mock-laura",
    clientId: "4",
    clientName: "Laura García",
    planName: "Powerbuilding Volumen",
    modality: "Powerbuilding",
    block: "Hipertrofia",
    weeksDuration: 6,
    currentWeek: 1,
    active: true,
    startDate: "2026-02-10",
    endDate: null,
    daysPerWeek: 5,
    blockVariants: "",
    weeks: [buildSimpleWeek("t-mock-laura", 1, 5, "Hipertrofia", "active")],
  },
  "t-mock-pablo": {
    id: "t-mock-pablo",
    clientId: "7",
    clientName: "Pablo Navarro",
    planName: "Hipertrofia Bloque 2",
    modality: "Powerbuilding",
    block: "Hipertrofia",
    weeksDuration: 6,
    currentWeek: 1,
    active: true,
    startDate: "2026-02-03",
    endDate: null,
    daysPerWeek: 5,
    blockVariants: "",
    weeks: [buildSimpleWeek("t-mock-pablo", 1, 5, "Hipertrofia", "active")],
  },
};

// ─── Nutrition plan mock data ──────────────────────────────────

export const mockNutritionPlanList: NutritionPlanListEntry[] = [
  {
    id: "np-mock-carlos",
    clientId: "1",
    clientName: "Carlos Martínez",
    planName: "Volumen Limpio 3200 kcal",
    type: "Volumen",
    calories: 3200,
    active: true,
    startDate: "2026-01-20",
    endDate: null,
  },
  {
    id: "np-mock-ana",
    clientId: "2",
    clientName: "Ana López",
    planName: "Déficit Controlado 1650 kcal",
    type: "Definición",
    calories: 1650,
    active: true,
    startDate: "2026-02-01",
    endDate: null,
  },
  {
    id: "np-mock-laura",
    clientId: "4",
    clientName: "Laura García",
    planName: "Volumen CrossFit 2800 kcal",
    type: "Volumen",
    calories: 2800,
    active: true,
    startDate: "2026-02-10",
    endDate: null,
  },
  {
    id: "np-mock-sofia",
    clientId: "6",
    clientName: "Sofía Ruiz",
    planName: "Recomposición 2100 kcal",
    type: "Recomposición",
    calories: 2100,
    active: true,
    startDate: "2026-02-18",
    endDate: null,
  },
];

const makeMeal = (id: string, name: string, rows: { main: string; alts: string[]; cat: string }[]): Meal => ({
  id,
  name,
  description: "",
  options: [
    {
      id: `${id}-opt1`,
      name: "Opción 1",
      notes: "",
      rows: rows.map((r, i) => ({
        id: `${id}-r${i}`,
        mainIngredient: r.main,
        alternatives: r.alts,
        macroCategory: r.cat as any,
      })),
    },
  ],
});

export const mockNutritionDetails: Record<string, NutritionPlanDetail> = {
  "np-mock-carlos": {
    id: "np-mock-carlos",
    clientId: "1",
    clientName: "Carlos Martínez",
    planName: "Volumen Limpio 3200 kcal",
    objective: "Ganar masa muscular de forma progresiva, priorizando alimentos densos en nutrientes.",
    calories: 3200,
    protein: 180,
    carbs: 380,
    fats: 95,
    active: true,
    startDate: "2026-01-20",
    endDate: null,
    meals: [
      makeMeal("m-carlos-1", "Desayuno", [
        { main: "Avena (100g) con leche", alts: ["Tostadas integrales (80g)", "Arroz inflado (60g)"], cat: "carbohidratos" },
        { main: "Claras de huevo (200g) + 2 enteros", alts: ["Proteína whey (1 scoop)"], cat: "proteinas" },
        { main: "Plátano (1 ud)", alts: ["Arándanos (150g)"], cat: "frutas" },
      ]),
      makeMeal("m-carlos-2", "Snack mañana", [
        { main: "Yogur griego (200g)", alts: ["Queso fresco batido (250g)"], cat: "proteinas" },
        { main: "Almendras (30g)", alts: ["Nueces (25g)", "Crema de cacahuete (15g)"], cat: "grasas" },
        { main: "Manzana (1 ud)", alts: [], cat: "frutas" },
      ]),
      makeMeal("m-carlos-3", "Comida", [
        { main: "Arroz basmati (120g en seco)", alts: ["Patata (350g)", "Pasta integral (100g)"], cat: "carbohidratos" },
        { main: "Pechuga de pollo (200g)", alts: ["Ternera magra (200g)", "Pavo (200g)"], cat: "proteinas" },
        { main: "Ensalada variada", alts: ["Verduras salteadas"], cat: "verduras" },
        { main: "Aceite de oliva (15ml)", alts: ["Aguacate (50g)"], cat: "grasas" },
      ]),
      makeMeal("m-carlos-4", "Snack pre-entreno", [
        { main: "Tortitas de arroz (4 uds) + miel", alts: ["Pan blanco (60g) + mermelada"], cat: "carbohidratos" },
        { main: "Proteína whey (1 scoop)", alts: ["Jamón serrano (50g)"], cat: "proteinas" },
      ]),
      makeMeal("m-carlos-5", "Cena", [
        { main: "Boniato (250g)", alts: ["Arroz (80g en seco)", "Quinoa (80g)"], cat: "carbohidratos" },
        { main: "Salmón (180g)", alts: ["Lubina (200g)", "Merluza (200g) + AOVE"], cat: "proteinas" },
        { main: "Brócoli y espárragos", alts: ["Judías verdes", "Calabacín"], cat: "verduras" },
      ]),
    ],
    recommendations: [
      "Beber al menos 3L de agua al día.",
      "Priorizar carbohidratos complejos alrededor del entrenamiento.",
      "Comer la comida más calórica 2–3h antes de entrenar.",
      "Si hay hinchazón, reducir fibra insoluble en la cena.",
      "Suplementar con creatina 5g/día y vitamina D 2000UI/día.",
    ],
  },
};

export const mockSupplements: Supplement[] = [
  { name: "Creatina monohidrato", dose: "5 g/día", timing: "A cualquier hora con agua" },
  { name: "Proteína whey isolate", dose: "1 scoop (30g)", timing: "Post-entreno o entre comidas" },
  { name: "Vitamina D3 + K2", dose: "2000 UI/día", timing: "Con comida rica en grasa" },
  { name: "Magnesio bisglicinato", dose: "400 mg", timing: "Antes de dormir" },
  { name: "Omega-3 (EPA+DHA)", dose: "2 cápsulas", timing: "Con comida principal" },
];
