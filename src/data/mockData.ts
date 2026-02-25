export interface AdminProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
  avatarUrl: string | null;
  timezone: string;
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    newClient: boolean;
    paymentReminder: boolean;
  };
}

export const adminProfile: AdminProfile = {
  name: "Javier Ibáñez",
  email: "javier@jipcoaching.com",
  phone: "+34 600 123 456",
  role: "Coach",
  avatarUrl: null,
  timezone: "Europe/Madrid",
  language: "Español",
  notifications: {
    email: true,
    push: true,
    newClient: true,
    paymentReminder: true,
  },
};

export type ServiceType = "nutrition" | "training";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  services: ServiceType[];
  plan: string;
  status: "Activo" | "Pendiente" | "Inactivo";
  startDate: string;
  joinedMonth: string; // "YYYY-MM"
}

export interface NutritionPlan {
  id: string;
  clientId: string;
  clientName: string;
  planName: string;
  type: string;
  calories: number;
  active: boolean;
  startDate: string;
  endDate: string | null;
}

export type TrainingBlock = "Hipertrofia" | "Intensificación" | "Peaking" | "Tapering";
export type TrainingModality = "Powerlifting" | "Powerbuilding";

export interface TrainingPlan {
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

export const mockClients: Client[] = [
  { id: "1", name: "Carlos Martínez", email: "carlos@email.com", phone: "+34 612 345 678", services: ["nutrition", "training"], plan: "Volumen", status: "Activo", startDate: "2025-01-15", joinedMonth: "2025-01" },
  { id: "2", name: "Ana López", email: "ana@email.com", phone: "+34 623 456 789", services: ["nutrition"], plan: "Definición", status: "Activo", startDate: "2025-02-01", joinedMonth: "2025-02" },
  { id: "3", name: "Diego Fernández", email: "diego@email.com", phone: "+34 634 567 890", services: ["training"], plan: "Fuerza", status: "Pendiente", startDate: "2025-02-10", joinedMonth: "2025-02" },
  { id: "4", name: "Laura García", email: "laura@email.com", phone: "+34 645 678 901", services: ["nutrition", "training"], plan: "Volumen", status: "Activo", startDate: "2025-01-20", joinedMonth: "2025-01" },
  { id: "5", name: "Miguel Torres", email: "miguel@email.com", phone: "+34 656 789 012", services: ["nutrition"], plan: "Pérdida de grasa", status: "Inactivo", startDate: "2024-11-05", joinedMonth: "2024-11" },
  { id: "6", name: "Sofía Ruiz", email: "sofia@email.com", phone: "+34 667 890 123", services: ["nutrition", "training"], plan: "Recomposición", status: "Activo", startDate: "2025-02-18", joinedMonth: "2025-02" },
  { id: "7", name: "Pablo Navarro", email: "pablo@email.com", phone: "+34 678 901 234", services: ["training"], plan: "Hipertrofia", status: "Activo", startDate: "2025-01-28", joinedMonth: "2025-01" },
  { id: "8", name: "María Jiménez", email: "maria@email.com", phone: "+34 689 012 345", services: ["nutrition", "training"], plan: "Mantenimiento", status: "Activo", startDate: "2024-12-10", joinedMonth: "2024-12" },
];

export const mockNutritionPlans: NutritionPlan[] = [
  { id: "p1", clientId: "1", clientName: "Carlos Martínez", planName: "Volumen Fase 1", type: "Volumen", calories: 3200, active: true, startDate: "2025-02-01", endDate: null },
  { id: "p2", clientId: "1", clientName: "Carlos Martínez", planName: "Definición Verano", type: "Definición", calories: 2400, active: false, startDate: "2024-09-01", endDate: "2025-01-31" },
  { id: "p3", clientId: "2", clientName: "Ana López", planName: "Definición Q1", type: "Definición", calories: 1800, active: true, startDate: "2025-02-01", endDate: null },
  { id: "p4", clientId: "2", clientName: "Ana López", planName: "Mantenimiento Inicial", type: "Mantenimiento", calories: 2000, active: false, startDate: "2024-06-15", endDate: "2025-01-31" },
  { id: "p5", clientId: "4", clientName: "Laura García", planName: "Volumen Controlado", type: "Volumen", calories: 2600, active: true, startDate: "2025-01-20", endDate: null },
  { id: "p6", clientId: "5", clientName: "Miguel Torres", planName: "Pérdida de grasa", type: "Pérdida de grasa", calories: 1700, active: false, startDate: "2024-11-05", endDate: "2025-01-15" },
  { id: "p7", clientId: "6", clientName: "Sofía Ruiz", planName: "Recomposición Activa", type: "Recomposición", calories: 2200, active: true, startDate: "2025-02-18", endDate: null },
  { id: "p8", clientId: "8", clientName: "María Jiménez", planName: "Mantenimiento Plus", type: "Mantenimiento", calories: 2100, active: true, startDate: "2024-12-10", endDate: null },
  { id: "p9", clientId: "8", clientName: "María Jiménez", planName: "Volumen Off-Season", type: "Volumen", calories: 2800, active: false, startDate: "2024-06-01", endDate: "2024-12-09" },
];

export const mockTrainingPlans: TrainingPlan[] = [
  { id: "t1", clientId: "1", clientName: "Carlos Martínez", planName: "PL Comp Prep", modality: "Powerlifting", block: "Intensificación", weeksDuration: 6, currentWeek: 4, active: true, startDate: "2025-02-03", endDate: null },
  { id: "t2", clientId: "1", clientName: "Carlos Martínez", planName: "Off-season Hipertrofia", modality: "Powerbuilding", block: "Hipertrofia", weeksDuration: 8, currentWeek: null, active: false, startDate: "2024-10-01", endDate: "2025-01-31" },
  { id: "t3", clientId: "3", clientName: "Diego Fernández", planName: "Inicio Fuerza", modality: "Powerlifting", block: "Hipertrofia", weeksDuration: 8, currentWeek: 2, active: true, startDate: "2025-02-10", endDate: null },
  { id: "t4", clientId: "4", clientName: "Laura García", planName: "PB Volumen", modality: "Powerbuilding", block: "Hipertrofia", weeksDuration: 10, currentWeek: 6, active: true, startDate: "2025-01-20", endDate: null },
  { id: "t5", clientId: "4", clientName: "Laura García", planName: "Peaking Comp Dic", modality: "Powerlifting", block: "Peaking", weeksDuration: 4, currentWeek: null, active: false, startDate: "2024-11-15", endDate: "2024-12-15" },
  { id: "t6", clientId: "6", clientName: "Sofía Ruiz", planName: "PL Base Building", modality: "Powerlifting", block: "Hipertrofia", weeksDuration: 8, currentWeek: 1, active: true, startDate: "2025-02-18", endDate: null },
  { id: "t7", clientId: "7", clientName: "Pablo Navarro", planName: "PB Intensificación", modality: "Powerbuilding", block: "Intensificación", weeksDuration: 5, currentWeek: 3, active: true, startDate: "2025-02-01", endDate: null },
  { id: "t8", clientId: "7", clientName: "Pablo Navarro", planName: "Hipertrofia Gen", modality: "Powerbuilding", block: "Hipertrofia", weeksDuration: 8, currentWeek: null, active: false, startDate: "2024-09-01", endDate: "2025-01-31" },
  { id: "t9", clientId: "8", clientName: "María Jiménez", planName: "PL Peaking Meet", modality: "Powerlifting", block: "Peaking", weeksDuration: 4, currentWeek: 3, active: true, startDate: "2025-02-10", endDate: null },
  { id: "t10", clientId: "8", clientName: "María Jiménez", planName: "Tapering Meet Prep", modality: "Powerlifting", block: "Tapering", weeksDuration: 2, currentWeek: null, active: false, startDate: "2024-12-01", endDate: "2024-12-14" },
  { id: "t11", clientId: "8", clientName: "María Jiménez", planName: "Intensificación Q3", modality: "Powerlifting", block: "Intensificación", weeksDuration: 6, currentWeek: null, active: false, startDate: "2024-08-01", endDate: "2024-11-30" },
];

// Dynamic stats helpers
export const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export const getActiveClients = () => mockClients.filter((c) => c.status === "Activo");
export const getNewClientsThisMonth = () => mockClients.filter((c) => c.joinedMonth === getCurrentMonth());
export const getActiveNutritionPlans = () => mockNutritionPlans.filter((p) => p.active);
export const getActiveTrainingPlans = () => mockTrainingPlans.filter((p) => p.active);
export const getRetentionRate = () => {
  const total = mockClients.length;
  const active = mockClients.filter((c) => c.status !== "Inactivo").length;
  return total > 0 ? Math.round((active / total) * 100) : 0;
};

// ==================== QUESTIONNAIRES ====================

export type QuestionType = "text" | "number" | "scale" | "yesno" | "select";

export interface QuestionDefinition {
  id: string;
  label: string;
  type: QuestionType;
  options?: string[]; // for select type
  required: boolean;
}

export interface NutritionTemplate {
  id: string;
  name: string;
  dayOfWeek: number; // 0=Sun, 1=Mon, 2=Tue, ..., 5=Fri
  dayLabel: string;
  questions: QuestionDefinition[];
}

export interface TrainingExercise {
  id: string;
  name: string;
  isVariant: boolean;
  parentExercise?: string; // id of the main lift it's a variant of
}

export interface TrainingTemplate {
  id: string;
  name: string;
  exercises: TrainingExercise[];
  rpeQuestion: boolean;
  fatigueQuestion: boolean;
  notesQuestion: boolean;
  questions: QuestionDefinition[];
}

export type QuestionnaireStatus = "pendiente" | "respondido" | "no_enviado";

export interface QuestionnaireEntry {
  id: string;
  clientId: string;
  clientName: string;
  templateId: string;
  templateName: string;
  category: "nutrition" | "training";
  weekLabel: string; // e.g. "Sem 24 Feb"
  date: string;
  dayLabel: string;
  status: QuestionnaireStatus;
  responses?: Record<string, string | number | boolean>;
  liftLogs?: { exerciseId: string; exerciseName: string; sets: string; weight: number; rpe?: number }[];
}

// ----- Nutrition Templates -----
export const nutritionTemplates: NutritionTemplate[] = [
  {
    id: "nt-tue",
    name: "Check-in Martes",
    dayOfWeek: 2,
    dayLabel: "Martes",
    questions: [
      { id: "q1", label: "Peso en ayunas (kg)", type: "number", required: true },
      { id: "q2", label: "¿Cómo te has sentido con la dieta esta semana?", type: "scale", required: true },
      { id: "q3", label: "¿Has tenido malestares digestivos?", type: "yesno", required: true },
      { id: "q4", label: "Describe los malestares si los hubo", type: "text", required: false },
      { id: "q5", label: "¿Has comido libre esta semana?", type: "yesno", required: true },
      { id: "q6", label: "Nº de comidas libres", type: "number", required: false },
      { id: "q7", label: "Nivel de hambre general (1-10)", type: "scale", required: true },
      { id: "q8", label: "Horas de sueño media", type: "number", required: true },
    ],
  },
  {
    id: "nt-fri",
    name: "Check-in Viernes",
    dayOfWeek: 5,
    dayLabel: "Viernes",
    questions: [
      { id: "q1", label: "Peso en ayunas (kg)", type: "number", required: true },
      { id: "q9", label: "¿Has seguido el plan al 100%?", type: "yesno", required: true },
      { id: "q10", label: "¿Qué comida te ha costado más?", type: "select", options: ["Desayuno", "Comida", "Merienda", "Cena", "Ninguna"], required: true },
      { id: "q11", label: "Nivel de energía en los entrenos (1-10)", type: "scale", required: true },
      { id: "q12", label: "Retención de líquidos percibida", type: "select", options: ["Nada", "Poca", "Moderada", "Mucha"], required: true },
      { id: "q13", label: "Comentarios adicionales", type: "text", required: false },
    ],
  },
];

// ----- Training Template & Exercises -----
export const defaultExercises: TrainingExercise[] = [
  { id: "e1", name: "Sentadilla", isVariant: false },
  { id: "e2", name: "Sentadilla Pausa", isVariant: true, parentExercise: "e1" },
  { id: "e3", name: "Sentadilla Front", isVariant: true, parentExercise: "e1" },
  { id: "e4", name: "Press Banca", isVariant: false },
  { id: "e5", name: "Press Banca Estrecho", isVariant: true, parentExercise: "e4" },
  { id: "e6", name: "Press Banca Pausa Larga", isVariant: true, parentExercise: "e4" },
  { id: "e7", name: "Peso Muerto", isVariant: false },
  { id: "e8", name: "Peso Muerto Déficit", isVariant: true, parentExercise: "e7" },
  { id: "e9", name: "Peso Muerto Rumano", isVariant: true, parentExercise: "e7" },
];

export const trainingTemplate: TrainingTemplate = {
  id: "tt-weekly",
  name: "Registro Semanal de Entrenamiento",
  exercises: defaultExercises,
  rpeQuestion: true,
  fatigueQuestion: true,
  notesQuestion: true,
  questions: [
    { id: "tq1", label: "Fatiga general de la semana (1-10)", type: "scale", required: true },
    { id: "tq2", label: "¿Has tenido alguna molestia o dolor?", type: "yesno", required: true },
    { id: "tq3", label: "Describe la molestia", type: "text", required: false },
    { id: "tq4", label: "Calidad del sueño esta semana (1-10)", type: "scale", required: true },
    { id: "tq5", label: "Motivación para entrenar (1-10)", type: "scale", required: true },
    { id: "tq6", label: "Comentarios para el coach", type: "text", required: false },
  ],
};

// ----- Mock Entries (current week) -----
const thisWeekLabel = (() => {
  const now = new Date();
  const day = now.getDate();
  const month = now.toLocaleString("es-ES", { month: "short" });
  return `Sem ${day} ${month}`;
})();

const getDateOfDay = (dayOfWeek: number) => {
  const now = new Date();
  const diff = dayOfWeek - now.getDay();
  const d = new Date(now);
  d.setDate(now.getDate() + diff);
  return d.toISOString().split("T")[0];
};

export const mockQuestionnaireEntries: QuestionnaireEntry[] = [
  // Nutrition - Tuesday
  { id: "qe1", clientId: "1", clientName: "Carlos Martínez", templateId: "nt-tue", templateName: "Check-in Martes", category: "nutrition", weekLabel: thisWeekLabel, date: getDateOfDay(2), dayLabel: "Martes", status: "respondido", responses: { q1: 82.5, q2: 7, q3: false, q5: true, q6: 1, q7: 4, q8: 7.5 } },
  { id: "qe2", clientId: "2", clientName: "Ana López", templateId: "nt-tue", templateName: "Check-in Martes", category: "nutrition", weekLabel: thisWeekLabel, date: getDateOfDay(2), dayLabel: "Martes", status: "respondido", responses: { q1: 58.2, q2: 8, q3: false, q5: false, q7: 3, q8: 8 } },
  { id: "qe3", clientId: "4", clientName: "Laura García", templateId: "nt-tue", templateName: "Check-in Martes", category: "nutrition", weekLabel: thisWeekLabel, date: getDateOfDay(2), dayLabel: "Martes", status: "pendiente" },
  { id: "qe4", clientId: "6", clientName: "Sofía Ruiz", templateId: "nt-tue", templateName: "Check-in Martes", category: "nutrition", weekLabel: thisWeekLabel, date: getDateOfDay(2), dayLabel: "Martes", status: "pendiente" },
  { id: "qe5", clientId: "8", clientName: "María Jiménez", templateId: "nt-tue", templateName: "Check-in Martes", category: "nutrition", weekLabel: thisWeekLabel, date: getDateOfDay(2), dayLabel: "Martes", status: "respondido", responses: { q1: 63.0, q2: 6, q3: true, q4: "Hinchazón leve", q5: true, q6: 2, q7: 5, q8: 6.5 } },
  // Nutrition - Friday
  { id: "qe6", clientId: "1", clientName: "Carlos Martínez", templateId: "nt-fri", templateName: "Check-in Viernes", category: "nutrition", weekLabel: thisWeekLabel, date: getDateOfDay(5), dayLabel: "Viernes", status: "pendiente" },
  { id: "qe7", clientId: "2", clientName: "Ana López", templateId: "nt-fri", templateName: "Check-in Viernes", category: "nutrition", weekLabel: thisWeekLabel, date: getDateOfDay(5), dayLabel: "Viernes", status: "pendiente" },
  { id: "qe8", clientId: "4", clientName: "Laura García", templateId: "nt-fri", templateName: "Check-in Viernes", category: "nutrition", weekLabel: thisWeekLabel, date: getDateOfDay(5), dayLabel: "Viernes", status: "no_enviado" },
  // Training - Weekly
  { id: "qe9", clientId: "1", clientName: "Carlos Martínez", templateId: "tt-weekly", templateName: "Registro Semanal", category: "training", weekLabel: thisWeekLabel, date: getDateOfDay(0), dayLabel: "Domingo", status: "respondido", responses: { tq1: 7, tq2: false, tq4: 7, tq5: 8 }, liftLogs: [{ exerciseId: "e1", exerciseName: "Sentadilla", sets: "5x3", weight: 180, rpe: 8 }, { exerciseId: "e4", exerciseName: "Press Banca", sets: "5x3", weight: 120, rpe: 8.5 }, { exerciseId: "e7", exerciseName: "Peso Muerto", sets: "3x3", weight: 210, rpe: 9 }] },
  { id: "qe10", clientId: "3", clientName: "Diego Fernández", templateId: "tt-weekly", templateName: "Registro Semanal", category: "training", weekLabel: thisWeekLabel, date: getDateOfDay(0), dayLabel: "Domingo", status: "pendiente" },
  { id: "qe11", clientId: "4", clientName: "Laura García", templateId: "tt-weekly", templateName: "Registro Semanal", category: "training", weekLabel: thisWeekLabel, date: getDateOfDay(0), dayLabel: "Domingo", status: "respondido", responses: { tq1: 6, tq2: true, tq3: "Molestia leve rodilla izquierda", tq4: 8, tq5: 9 }, liftLogs: [{ exerciseId: "e1", exerciseName: "Sentadilla", sets: "4x5", weight: 100, rpe: 7 }, { exerciseId: "e4", exerciseName: "Press Banca", sets: "4x5", weight: 55, rpe: 7.5 }] },
  { id: "qe12", clientId: "6", clientName: "Sofía Ruiz", templateId: "tt-weekly", templateName: "Registro Semanal", category: "training", weekLabel: thisWeekLabel, date: getDateOfDay(0), dayLabel: "Domingo", status: "pendiente" },
  { id: "qe13", clientId: "7", clientName: "Pablo Navarro", templateId: "tt-weekly", templateName: "Registro Semanal", category: "training", weekLabel: thisWeekLabel, date: getDateOfDay(0), dayLabel: "Domingo", status: "respondido", responses: { tq1: 8, tq2: false, tq4: 6, tq5: 7 }, liftLogs: [{ exerciseId: "e1", exerciseName: "Sentadilla", sets: "5x5", weight: 150, rpe: 8 }, { exerciseId: "e5", exerciseName: "Press Banca Estrecho", sets: "4x6", weight: 80, rpe: 7 }, { exerciseId: "e7", exerciseName: "Peso Muerto", sets: "4x4", weight: 185, rpe: 8.5 }] },
  { id: "qe14", clientId: "8", clientName: "María Jiménez", templateId: "tt-weekly", templateName: "Registro Semanal", category: "training", weekLabel: thisWeekLabel, date: getDateOfDay(0), dayLabel: "Domingo", status: "pendiente" },
];
