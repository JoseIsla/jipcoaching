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
