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
  TRAINING = "TRAINING",
  FULL = "FULL",
}

export interface NutritionIntakeDto {
  goal?: string;
  goalTimeframe?: string;
  goalMotivation?: string;
  currentWeight?: number;
  targetWeight?: number;
  height?: number;
  age?: number;
  mealsPerDay?: number;
  sleepHours?: number;
  stressLevel?: number;
  occupation?: string;
  supplements?: string;
  excludedFoods?: string;
  allergies?: string;
  pathologies?: string;
  digestiveIssues?: string;
}

export interface TrainingIntakeDto {
  experience?: string;
  sessionsPerWeek?: string;
  intensity?: number;
  otherSports?: string;
  modality?: string;
  goal?: string;
  currentSBD?: string;
  injuries?: string;
}

export interface CreateClientDto {
  name: string;
  email: string;
  password: string;
  packType: PackType;
  status: ClientStatus;
  monthlyFee: number;
  notes?: string;
  nutritionIntake?: NutritionIntakeDto;
  trainingIntake?: TrainingIntakeDto;
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
  avatarUrl?: string | null;
  /** Computed from packType — not from the API */
  services: ServiceType[];
}

/** Derive services array from packType */
export const getServicesFromPack = (packType?: PackType | string): ServiceType[] => {
  if (!packType) return [];
  const pt = String(packType).toUpperCase();
  if (pt === "FULL") return ["nutrition", "training"];
  if (pt === "NUTRITION") return ["nutrition"];
  if (pt === "TRAINING") return ["training"];
  // Fallback: check substrings for legacy data
  const services: ServiceType[] = [];
  if (pt.includes("NUTRITION")) services.push("nutrition");
  if (pt.includes("TRAINING")) services.push("training");
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
  TOP_SET_BACKOFFS = "TOP_SET_BACKOFFS",
  CUSTOM = "CUSTOM",
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
  backoffSets?: number;
  backoffPercent?: number;
  technicalNotes?: string;
  reps?: string;
  plannedLoad?: string;
  estimatedSeries?: string;
  backoffRule?: string;
  customMethodName?: string;
  customMethodDescription?: string;
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
  /** No sessionId in Prisma — ExerciseLog belongs directly to ExercisePrescription */
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

/**
 * Matches Prisma NutritionIngredientRow.
 * Each row belongs to a NutritionMealOption.
 */
export interface ApiNutritionIngredientRow {
  id: string;
  optionId: string;
  mainIngredient: string;
  alternatives: string; // JSON array stored as TEXT
  macroCategory: string;
  order: number;
  createdAt?: string;
}

export interface ApiNutritionMealOption {
  id: string;
  mealId: string;
  name: string;
  notes?: string;
  order: number;
  rows: ApiNutritionIngredientRow[];
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

export interface ApiPlanSupplement {
  id: string;
  planId: string;
  name: string;
  dose: string;
  timing: string;
}

export interface ApiNutritionPlan {
  id: string;
  clientId: string;
  title: string;
  isActive: boolean;
  objective?: string;
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
  planSupplements?: ApiPlanSupplement[];
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

/** @deprecated Use ApiTrainingSessionLog instead */
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

// ── Legacy block-based nutrition types (DEPRECATED) ──
// These were used before the backend settled on the IngredientRow model.
// Keeping only as type aliases for gradual migration.

/** @deprecated Use ApiNutritionIngredientRow instead */
export type ApiNutritionBlockItem = ApiNutritionIngredientRow;

/** @deprecated Block-based nutrition was replaced by row-based model */
export interface ApiNutritionMealBlock {
  id: string;
  optionId: string;
  type: MealBlockType;
  title?: string;
  notes?: string;
  order: number;
  useTable: boolean;
  tableCategory?: FoodCategory;
  items: ApiNutritionIngredientRow[];
  createdAt?: string;
  updatedAt?: string;
}

// ── Labels for UI ──
export const packTypeLabels: Record<string, string> = {
  [PackType.NUTRITION]: "Nutrición",
  [PackType.TRAINING]: "Entrenamiento",
  [PackType.FULL]: "Nutrición + Entrenamiento",
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
  [ApiTrainingMethod.TOP_SET_BACKOFFS]: "Top Set + Backoffs",
  [ApiTrainingMethod.CUSTOM]: "Personalizado",
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
