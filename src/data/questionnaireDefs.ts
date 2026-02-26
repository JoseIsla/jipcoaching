/**
 * Questionnaire definitions & templates.
 * Extracted from mockData — these are structural definitions, not mock data.
 */

export type QuestionType = "text" | "number" | "scale" | "yesno" | "select";

export interface QuestionDefinition {
  id: string;
  label: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
}

export interface NutritionTemplate {
  id: string;
  name: string;
  dayOfWeek: number;
  dayLabel: string;
  questions: QuestionDefinition[];
}

export interface TrainingExercise {
  id: string;
  name: string;
  isVariant: boolean;
  parentExercise?: string;
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

// ── Default templates ──

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

const defaultExercises: TrainingExercise[] = [
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
