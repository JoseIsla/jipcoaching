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

// ── Nutrition ──
export interface ApiNutritionMeal {
  id: string;
  name: string;
}

export interface ApiNutritionSection {
  id: string;
  name: string;
  meals: ApiNutritionMeal[];
}

export interface ApiNutritionPlan {
  id: string;
  title: string;
  isActive: boolean;
  sections: ApiNutritionSection[];
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
export interface ApiTrainingExercise {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface ApiTrainingDay {
  id: string;
  title: string;
  exercises: ApiTrainingExercise[];
}

export interface ApiTrainingWeek {
  id: string;
  days: ApiTrainingDay[];
}

export interface ApiTrainingPlan {
  id: string;
  clientId: string;
  title: string;
  weeks: ApiTrainingWeek[];
}

// ── Sessions ──
export interface ApiSession {
  id: string;
  date: string;
  notes?: string;
  [key: string]: unknown;
}

// ── Questionnaires ──
export interface ApiQuestionnaireQuestion {
  id: string;
  type: string;
  text: string;
}

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
