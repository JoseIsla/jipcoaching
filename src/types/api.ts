/**
 * Types matching the real backend DTOs and responses.
 * Only fields confirmed by the backend are included.
 */

// ── Auth ──
export type UserRole = "admin" | "client";

export interface MeResponse {
  id: string;
  email: string;
  role: "ADMIN" | "CLIENT";
}

export interface LoginResponse {
  access_token: string;
}

// ── Clients ──
export enum ClientStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
}

export enum PackType {
  NUTRITION = "NUTRITION",
  TRAINING_PB = "TRAINING_PB",
  TRAINING_PL = "TRAINING_PL",
  TRAINING_PL_COMP = "TRAINING_PL_COMP",
  NUTRITION_TRAINING_PB = "NUTRITION_TRAINING_PB",
  NUTRITION_TRAINING_PL = "NUTRITION_TRAINING_PL",
}

export interface CreateClientDto {
  name: string;
  email: string;
  password: string;
  packType: PackType;
  status: ClientStatus;
  monthlyFee: number;
  notes?: string;
}

export type ServiceType = "nutrition" | "training";

/** Response from GET /clients */
export interface ApiClient {
  id: string;
  name: string;
  email: string;
  packType?: PackType | string;
  status?: ClientStatus | string;
  monthlyFee?: number;
  notes?: string;
  /** Computed from packType — not from the API */
  services: ServiceType[];
}

/** Derive services array from packType */
export const getServicesFromPack = (packType?: PackType | string): ServiceType[] => {
  if (!packType) return [];
  const pt = String(packType).toUpperCase();
  const hasNutrition = pt.includes("NUTRITION");
  const hasTraining = pt.includes("TRAINING");
  const services: ServiceType[] = [];
  if (hasNutrition) services.push("nutrition");
  if (hasTraining) services.push("training");
  return services;
};

/** Check if client is active */
export const isClientActive = (status?: ClientStatus | string): boolean => {
  if (!status) return false;
  return String(status).toUpperCase() === "ACTIVE";
};

/** Get display status label */
export const getStatusLabel = (status?: ClientStatus | string): string => {
  if (!status) return "Desconocido";
  const s = String(status).toUpperCase();
  if (s === "ACTIVE") return "Activo";
  if (s === "PAUSED") return "Pausado";
  return status as string;
};

// ── Enums matching Prisma ──

export enum BillingStatus {
  PENDING = "PENDING",
  PAID = "PAID",
}

export enum PaymentMethod {
  CASH = "CASH",
  BIZUM = "BIZUM",
  TRANSFER = "TRANSFER",
  OTHER = "OTHER",
}

export enum ApiTrainingMethod {
  STRAIGHT_SETS = "STRAIGHT_SETS",
  RIR_SETS = "RIR_SETS",
  LOAD_DROP = "LOAD_DROP",
  REPEATS = "REPEATS",
  REPS_DROP = "REPS_DROP",
  LOAD_REPS_DROP = "LOAD_REPS_DROP",
}

export enum ExerciseType {
  BASIC = "BASIC",
  VARIANT = "VARIANT",
  ACCESSORY = "ACCESSORY",
}

export enum QuestionType {
  SCALE_0_10 = "SCALE_0_10",
  YES_NO = "YES_NO",
  NUMBER = "NUMBER",
  TEXT = "TEXT",
  SELECT = "SELECT",
}

export enum QuestionnaireScope {
  GLOBAL = "GLOBAL",
  CLIENT = "CLIENT",
}

export enum FoodCategory {
  CARB = "CARB",
  PROTEIN = "PROTEIN",
  FAT = "FAT",
  FRUIT = "FRUIT",
  VEG = "VEG",
  SUPPLEMENT = "SUPPLEMENT",
  OTHER = "OTHER",
}

export enum MealBlockType {
  CARB = "CARB",
  PROTEIN = "PROTEIN",
  FAT = "FAT",
  FRUIT = "FRUIT",
  VEG = "VEG",
  TEXT = "TEXT",
}

// ── Exercise Library ──
export enum ExerciseCategory {
  BASIC = "BASIC",
  VARIANT = "VARIANT",
  ACCESSORY = "ACCESSORY",
}

export interface ApiExercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscleGroup?: string;
  videoUrl?: string;
  notes?: string;
  parentExerciseId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateExerciseDto {
  name: string;
  category: ExerciseCategory;
  muscleGroup?: string;
  videoUrl?: string;
  notes?: string;
  parentExerciseId?: string;
}

/** Map frontend category to API enum */
export const exerciseCategoryToApi = (cat: "basico" | "variante" | "accesorio"): ExerciseCategory => {
  const map: Record<string, ExerciseCategory> = {
    basico: ExerciseCategory.BASIC,
    variante: ExerciseCategory.VARIANT,
    accesorio: ExerciseCategory.ACCESSORY,
  };
  return map[cat] ?? ExerciseCategory.BASIC;
};

/** Map API enum to frontend category */
export const exerciseCategoryFromApi = (cat: ExerciseCategory | string): "basico" | "variante" | "accesorio" => {
  const map: Record<string, "basico" | "variante" | "accesorio"> = {
    BASIC: "basico",
    VARIANT: "variante",
    ACCESSORY: "accesorio",
  };
  return map[String(cat).toUpperCase()] ?? "basico";
};

// ── Training ──

export interface ApiExercisePrescription {
  id: string;
  dayId: string;
  name: string;
  type: ExerciseType;
  method: ApiTrainingMethod;
  topSetReps?: number;
  topSetRpe?: number;
  fatiguePct?: number;
  dropLoadPct?: number;
  dropReps?: number;
  setsMin?: number;
  setsMax?: number;
  rirMin?: number;
  rirMax?: number;
  restSec?: number;
  notes?: string;
  videoRequired: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiTrainingDay {
  id: string;
  weekId: string;
  dayNumber: number;
  title?: string;
  notes?: string;
  warmup?: string;
  exercises: ApiExercisePrescription[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiTrainingWeek {
  id: string;
  planId: string;
  weekNumber: number;
  notes?: string;
  block?: string;
  status: string;
  days: ApiTrainingDay[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiTrainingPlan {
  id: string;
  clientId: string;
  title: string;
  isActive: boolean;
  modality?: string;
  block?: string;
  daysPerWeek: number;
  blockVariants?: string;
  weeks: ApiTrainingWeek[];
  createdAt?: string;
  updatedAt?: string;
}

// ── Training Session Logs ──

export interface ApiExerciseLog {
  id: string;
  prescriptionId: string;
  sessionId: string;
  topKg?: number;
  topReps?: number;
  topRpe?: number;
  backoffKg?: number;
  backoffReps?: number;
  backoffRpe?: number;
  backoffSetsCount?: number;
  notes?: string;
  createdAt?: string;
}

export interface ApiTrainingSessionLog {
  id: string;
  clientId: string;
  weekId?: string;
  dayId?: string;
  date: string;
  sleepHours?: number;
  sleepQuality?: number;
  stress?: number;
  fatigue?: number;
  pain?: number;
  painArea?: string;
  notes?: string;
  exerciseLogs: ApiExerciseLog[];
  questionnaireResponses?: ApiQuestionnaireResponse[];
  createdAt?: string;
  updatedAt?: string;
}

// ── Nutrition ──

export interface ApiNutritionBlockItem {
  id: string;
  blockId: string;
  portionId?: string;
  freeText?: string;
  order: number;
  createdAt?: string;
}

export interface ApiNutritionMealBlock {
  id: string;
  optionId: string;
  type: MealBlockType;
  title?: string;
  notes?: string;
  order: number;
  useTable: boolean;
  tableCategory?: FoodCategory;
  items: ApiNutritionBlockItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiNutritionMealOption {
  id: string;
  mealId: string;
  name: string;
  notes?: string;
  order: number;
  blocks: ApiNutritionMealBlock[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiNutritionMeal {
  id: string;
  planId: string;
  name: string;
  order: number;
  notes?: string;
  options: ApiNutritionMealOption[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiNutritionSection {
  id: string;
  planId: string;
  title: string;
  content: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiFoodPortion {
  id: string;
  planId: string;
  foodItemId: string;
  grams?: number;
  quantity?: number;
  unit?: string;
  label?: string;
  createdAt?: string;
}

export interface ApiFoodItem {
  id: string;
  planId: string;
  category: FoodCategory;
  name: string;
  portions: ApiFoodPortion[];
  createdAt?: string;
}

export interface ApiNutritionPlan {
  id: string;
  clientId: string;
  title: string;
  isActive: boolean;
  recommendations?: string;
  kcalMin?: number;
  kcalMax?: number;
  proteinG?: number;
  carbsG?: number;
  fatsG?: number;
  version: number;
  sections: ApiNutritionSection[];
  meals: ApiNutritionMeal[];
  foodItems?: ApiFoodItem[];
  portions?: ApiFoodPortion[];
  createdAt?: string;
  updatedAt?: string;
}

// ── Nutrition Selection (Client) ──

export interface ApiNutritionSelectionChoice {
  id: string;
  selectionId: string;
  mealId: string;
  optionId: string;
  blockId: string;
  portionId?: string;
  createdAt?: string;
}

export interface ApiNutritionSelectionDay {
  id: string;
  clientId: string;
  date: string;
  isCompleted: boolean;
  choices: ApiNutritionSelectionChoice[];
  createdAt?: string;
}

// ── Billing ──

export interface ApiBillingMonth {
  id: string;
  billingAccountId: string;
  month: string;
  amount: number;
  status: BillingStatus;
  method: PaymentMethod;
  paidAt?: string;
  notes?: string;
  createdAt?: string;
}

export interface ApiBillingAccount {
  id: string;
  payerUserId: string;
  monthlyFee: number;
  notes?: string;
  members?: ApiClient[];
  billings?: ApiBillingMonth[];
  createdAt?: string;
  updatedAt?: string;
}

// ── Sessions (legacy — now TrainingSessionLog) ──
export interface ApiSession {
  id: string;
  date: string;
  notes?: string;
  [key: string]: unknown;
}

// ── Questionnaires ──

export interface ApiQuestionnaireQuestion {
  id: string;
  templateId: string;
  type: QuestionType;
  label: string;
  required: boolean;
  order: number;
  optionsJson?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiQuestionnaireTemplate {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  scope: QuestionnaireScope;
  clientId?: string;
  version: number;
  questions: ApiQuestionnaireQuestion[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiQuestionnaireResponse {
  id: string;
  sessionId: string;
  templateId: string;
  questionId: string;
  value: string;
  createdAt?: string;
}

/** @deprecated Use ApiQuestionnaireTemplate instead */
export interface ApiQuestionnaire {
  id: string;
  templateId: string;
  description: string;
  questions: ApiQuestionnaireQuestion[];
}

// ── Labels for UI ──
export const packTypeLabels: Record<string, string> = {
  [PackType.NUTRITION]: "Nutrición",
  [PackType.TRAINING_PB]: "Entrenamiento PB",
  [PackType.TRAINING_PL]: "Entrenamiento PL",
  [PackType.TRAINING_PL_COMP]: "Entrenamiento PL Comp",
  [PackType.NUTRITION_TRAINING_PB]: "Nutrición + Entrenamiento PB",
  [PackType.NUTRITION_TRAINING_PL]: "Nutrición + Entrenamiento PL",
};

export const clientStatusLabels: Record<string, string> = {
  [ClientStatus.ACTIVE]: "Activo",
  [ClientStatus.PAUSED]: "Pausado",
};

export const trainingMethodLabels: Record<ApiTrainingMethod, string> = {
  [ApiTrainingMethod.STRAIGHT_SETS]: "Series fijas",
  [ApiTrainingMethod.RIR_SETS]: "Series RIR/RPE",
  [ApiTrainingMethod.LOAD_DROP]: "Load Drop",
  [ApiTrainingMethod.REPEATS]: "Repeticiones",
  [ApiTrainingMethod.REPS_DROP]: "Reps Drop",
  [ApiTrainingMethod.LOAD_REPS_DROP]: "Load + Reps Drop",
};

export const foodCategoryLabels: Record<FoodCategory, string> = {
  [FoodCategory.CARB]: "Carbohidratos",
  [FoodCategory.PROTEIN]: "Proteínas",
  [FoodCategory.FAT]: "Grasas",
  [FoodCategory.FRUIT]: "Frutas",
  [FoodCategory.VEG]: "Verduras",
  [FoodCategory.SUPPLEMENT]: "Suplementos",
  [FoodCategory.OTHER]: "Otros",
};

export const mealBlockTypeLabels: Record<MealBlockType, string> = {
  [MealBlockType.CARB]: "🍚 Carbohidratos",
  [MealBlockType.PROTEIN]: "🥩 Proteínas",
  [MealBlockType.FAT]: "🥑 Grasas",
  [MealBlockType.FRUIT]: "🍎 Frutas",
  [MealBlockType.VEG]: "🥦 Verduras",
  [MealBlockType.TEXT]: "📝 Texto",
};
