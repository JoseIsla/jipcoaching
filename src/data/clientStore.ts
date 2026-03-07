import { type ServiceType } from "@/types/api";

export interface NutritionIntake {
  goal: string;
  goalTimeframe: string;
  goalMotivation: string;
  targetWeight: number;
  mealsPerDay: number;
  sleepHours: number;
  stressLevel: number;
  occupation: string;
  supplements: string;
  excludedFoods: string;
  allergies: string;
  pathologies: string;
  digestiveIssues: string;
}

export interface TrainingIntake {
  experience: string;
  sessionsPerWeek: string;
  intensity: number;
  otherSports: string;
  modality: string;
  goal: string;
  currentSBD: string;
  injuries: string;
}

export interface ClientDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  age?: number;
  sex?: string;
  services: ServiceType[];
  plan: string;
  status: "Activo" | "Pendiente" | "Inactivo";
  startDate: string;
  monthlyRate: number;
  lastPaymentDate: string;
  lastPaidAt?: string;
  nextPaymentDate: string;
  paymentMethod: string;
  notes: string;
  currentWeight?: number;
  targetWeight?: number;
  height?: number;
  weightHistory?: { date: string; weight: number }[];
  nutritionIntake?: NutritionIntake;
  trainingIntake?: TrainingIntake;
}

// Mutable store — will be replaced by DB later
export const clientDetailStore: Record<string, ClientDetail> = {
  "1": {
    id: "1", name: "Carlos Martínez", email: "carlos@email.com", phone: "+34 612 345 678",
    services: ["nutrition", "training"], plan: "Volumen", status: "Activo", startDate: "2025-01-15",
    monthlyRate: 120, lastPaymentDate: "2026-02-01", nextPaymentDate: "2026-03-01",
    paymentMethod: "Tarjeta ****4521", notes: "Objetivo: ganar 5kg de masa muscular en 6 meses.",
    currentWeight: 78.5, targetWeight: 83, height: 178, age: 28, sex: "Masculino",
    weightHistory: [
      { date: "2025-01-15", weight: 75.2 }, { date: "2025-02-15", weight: 76.1 },
      { date: "2025-03-15", weight: 76.8 }, { date: "2025-04-15", weight: 77.3 },
      { date: "2025-05-15", weight: 77.9 }, { date: "2026-01-15", weight: 78.1 },
      { date: "2026-02-15", weight: 78.5 },
    ],
    nutritionIntake: {
      goal: "Ganar músculo", goalTimeframe: "6 meses", goalMotivation: "Mejorar rendimiento en competición de powerlifting",
      targetWeight: 83, mealsPerDay: 5, sleepHours: 7.5, stressLevel: 4, occupation: "Ingeniero informático",
      supplements: "Proteína whey, creatina, vitamina D", excludedFoods: "Ninguno",
      allergies: "", pathologies: "", digestiveIssues: "",
    },
    trainingIntake: {
      experience: "4-7 años", sessionsPerWeek: "5 días", intensity: 8, otherSports: "No",
      modality: "Powerlifting", goal: "Preparar competición", currentSBD: "185/125/215", injuries: "",
    },
  },
  "2": {
    id: "2", name: "Ana López", email: "ana@email.com", phone: "+34 623 456 789",
    services: ["nutrition"], plan: "Definición", status: "Activo", startDate: "2025-02-01",
    monthlyRate: 80, lastPaymentDate: "2026-02-05", nextPaymentDate: "2026-03-05",
    paymentMethod: "Bizum", notes: "Intolerancia a la lactosa. Dieta sin gluten.",
    currentWeight: 62.3, targetWeight: 58, height: 165, age: 31, sex: "Femenino",
    weightHistory: [
      { date: "2025-02-01", weight: 67.0 }, { date: "2025-03-01", weight: 66.1 },
      { date: "2025-04-01", weight: 65.2 }, { date: "2025-05-01", weight: 64.5 },
      { date: "2026-01-01", weight: 63.0 }, { date: "2026-02-01", weight: 62.3 },
    ],
    nutritionIntake: {
      goal: "Perder grasa", goalTimeframe: "4 meses", goalMotivation: "Sentirse más cómoda y mejorar composición corporal",
      targetWeight: 58, mealsPerDay: 4, sleepHours: 7, stressLevel: 6, occupation: "Diseñadora gráfica",
      supplements: "Proteína vegana", excludedFoods: "Lácteos, gluten",
      allergies: "Intolerancia a la lactosa, celiaquía", pathologies: "", digestiveIssues: "Hinchazón ocasional",
    },
  },
  "3": {
    id: "3", name: "Diego Fernández", email: "diego@email.com", phone: "+34 634 567 890",
    services: ["training"], plan: "Fuerza", status: "Pendiente", startDate: "2025-02-10",
    monthlyRate: 70, lastPaymentDate: "2026-01-10", nextPaymentDate: "2026-02-10",
    paymentMethod: "Transferencia bancaria", notes: "Lesión previa en rodilla derecha.", age: 25, sex: "Masculino",
    trainingIntake: {
      experience: "2-4 años", sessionsPerWeek: "4 días", intensity: 7, otherSports: "Fútbol sala los viernes",
      modality: "Powerlifting", goal: "Ganar fuerza", currentSBD: "120/80/150", injuries: "Lesión de menisco rodilla derecha (2023), recuperada",
    },
  },
  "4": {
    id: "4", name: "Laura García", email: "laura@email.com", phone: "+34 645 678 901",
    services: ["nutrition", "training"], plan: "Volumen", status: "Activo", startDate: "2025-01-20",
    monthlyRate: 120, lastPaymentDate: "2026-02-01", nextPaymentDate: "2026-03-01",
    paymentMethod: "Tarjeta ****8832", notes: "Competidora de CrossFit.",
    currentWeight: 65.0, targetWeight: 68, height: 170, age: 27, sex: "Femenino",
    weightHistory: [
      { date: "2025-01-20", weight: 62.5 }, { date: "2025-03-20", weight: 63.4 },
      { date: "2025-05-20", weight: 64.1 }, { date: "2026-01-20", weight: 64.8 },
      { date: "2026-02-20", weight: 65.0 },
    ],
    nutritionIntake: {
      goal: "Ganar músculo", goalTimeframe: "1 año", goalMotivation: "Mejorar rendimiento en competiciones",
      targetWeight: 68, mealsPerDay: 5, sleepHours: 8, stressLevel: 3, occupation: "Fisioterapeuta",
      supplements: "Creatina, proteína whey, omega 3", excludedFoods: "Ninguno",
      allergies: "", pathologies: "", digestiveIssues: "",
    },
    trainingIntake: {
      experience: "4-7 años", sessionsPerWeek: "5 días", intensity: 9, otherSports: "CrossFit",
      modality: "Powerbuilding", goal: "Hipertrofia", currentSBD: "105/57.5/120", injuries: "",
    },
  },
  "5": {
    id: "5", name: "Miguel Torres", email: "miguel@email.com", phone: "+34 656 789 012",
    services: ["nutrition"], plan: "Pérdida de grasa", status: "Inactivo", startDate: "2024-11-05",
    monthlyRate: 80, lastPaymentDate: "2025-06-05", nextPaymentDate: "-",
    paymentMethod: "Bizum", notes: "Cliente inactivo desde julio 2025.",
    currentWeight: 92.0, targetWeight: 82, height: 182, age: 35, sex: "Masculino",
    weightHistory: [
      { date: "2024-11-05", weight: 98.3 }, { date: "2025-01-05", weight: 96.1 },
      { date: "2025-03-05", weight: 94.2 }, { date: "2025-05-05", weight: 92.0 },
    ],
    nutritionIntake: {
      goal: "Perder grasa", goalTimeframe: "8 meses", goalMotivation: "Salud y mejorar tensión arterial",
      targetWeight: 82, mealsPerDay: 3, sleepHours: 6, stressLevel: 7, occupation: "Comercial",
      supplements: "Multivitamínico", excludedFoods: "Ninguno",
      allergies: "", pathologies: "Hipertensión leve", digestiveIssues: "Reflujo",
    },
  },
  "6": {
    id: "6", name: "Sofía Ruiz", email: "sofia@email.com", phone: "+34 667 890 123",
    services: ["nutrition", "training"], plan: "Recomposición", status: "Activo", startDate: "2025-02-18",
    monthlyRate: 120, lastPaymentDate: "2026-02-18", nextPaymentDate: "2026-03-18",
    paymentMethod: "Tarjeta ****1290", notes: "Preparación para media maratón en mayo.",
    currentWeight: 58.7, targetWeight: 57, height: 163, age: 24, sex: "Femenino",
    weightHistory: [
      { date: "2025-02-18", weight: 60.2 }, { date: "2025-06-18", weight: 59.5 },
      { date: "2026-01-18", weight: 59.0 }, { date: "2026-02-18", weight: 58.7 },
    ],
    nutritionIntake: {
      goal: "Recomposición corporal", goalTimeframe: "6 meses", goalMotivation: "Rendir mejor en la media maratón sin perder masa muscular",
      targetWeight: 57, mealsPerDay: 4, sleepHours: 7.5, stressLevel: 5, occupation: "Estudiante universitaria",
      supplements: "Proteína whey, cafeína", excludedFoods: "Mariscos",
      allergies: "Alergia al marisco", pathologies: "", digestiveIssues: "",
    },
    trainingIntake: {
      experience: "1-2 años", sessionsPerWeek: "4 días", intensity: 7, otherSports: "Running",
      modality: "Powerlifting", goal: "Ganar fuerza", currentSBD: "80/45/100", injuries: "",
    },
  },
  "7": {
    id: "7", name: "Pablo Navarro", email: "pablo@email.com", phone: "+34 678 901 234",
    services: ["training"], plan: "Hipertrofia", status: "Activo", startDate: "2025-01-28",
    monthlyRate: 70, lastPaymentDate: "2026-02-01", nextPaymentDate: "2026-03-01",
    paymentMethod: "Transferencia bancaria", notes: "Entrena 5 días por semana.", age: 30, sex: "Masculino",
    trainingIntake: {
      experience: "4-7 años", sessionsPerWeek: "5 días", intensity: 8, otherSports: "No",
      modality: "Powerbuilding", goal: "Hipertrofia", currentSBD: "155/95/190", injuries: "",
    },
  },
  "8": {
    id: "8", name: "María Jiménez", email: "maria@email.com", phone: "+34 689 012 345",
    services: ["nutrition", "training"], plan: "Mantenimiento", status: "Activo", startDate: "2024-12-10",
    monthlyRate: 120, lastPaymentDate: "2026-02-10", nextPaymentDate: "2026-03-10",
    paymentMethod: "Tarjeta ****7743", notes: "Embarazada, adaptar plan a partir del tercer trimestre.",
    currentWeight: 70.2, targetWeight: 68, height: 172, age: 33, sex: "Femenino",
    weightHistory: [
      { date: "2024-12-10", weight: 66.5 }, { date: "2025-03-10", weight: 67.2 },
      { date: "2025-06-10", weight: 68.0 }, { date: "2025-09-10", weight: 69.1 },
      { date: "2026-02-10", weight: 70.2 },
    ],
    nutritionIntake: {
      goal: "Mantenimiento", goalTimeframe: "Indefinido", goalMotivation: "Mantener peso saludable durante el embarazo",
      targetWeight: 68, mealsPerDay: 5, sleepHours: 6.5, stressLevel: 5, occupation: "Abogada",
      supplements: "Ácido fólico, hierro, vitamina D", excludedFoods: "Pescado crudo",
      allergies: "", pathologies: "Embarazo", digestiveIssues: "Náuseas matutinas",
    },
    trainingIntake: {
      experience: "2-4 años", sessionsPerWeek: "4 días", intensity: 6, otherSports: "Yoga",
      modality: "Powerlifting", goal: "Mejorar técnica", currentSBD: "110/62.5/135", injuries: "Molestia lumbar ocasional",
    },
  },
};

export const addClientToStore = (detail: ClientDetail) => {
  clientDetailStore[detail.id] = detail;
};
