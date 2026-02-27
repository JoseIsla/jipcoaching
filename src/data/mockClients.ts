/**
 * Mock client data for dev mode.
 * Returns ApiClient-shaped objects matching the backend schema.
 */
import type { ApiClient } from "@/types/api";

export const mockClients: ApiClient[] = [
  {
    id: "1",
    name: "Carlos Martínez",
    email: "carlos@email.com",
    status: "ACTIVE",
    packType: "FULL",
    services: ["nutrition", "training"],
    notes: "Objetivo: ganar 5kg de masa muscular en 6 meses.",
  },
  {
    id: "2",
    name: "Ana López",
    email: "ana@email.com",
    status: "ACTIVE",
    packType: "NUTRITION",
    services: ["nutrition"],
    notes: "Intolerancia a la lactosa. Dieta sin gluten.",
  },
  {
    id: "3",
    name: "Diego Fernández",
    email: "diego@email.com",
    status: "ACTIVE",
    packType: "TRAINING",
    services: ["training"],
    notes: "Lesión previa en rodilla derecha.",
  },
  {
    id: "4",
    name: "Laura García",
    email: "laura@email.com",
    status: "ACTIVE",
    packType: "FULL",
    services: ["nutrition", "training"],
    notes: "Competidora de CrossFit.",
  },
  {
    id: "5",
    name: "Miguel Torres",
    email: "miguel@email.com",
    status: "PAUSED",
    packType: "NUTRITION",
    services: ["nutrition"],
    notes: "Cliente inactivo desde julio 2025.",
  },
  {
    id: "6",
    name: "Sofía Ruiz",
    email: "sofia@email.com",
    status: "ACTIVE",
    packType: "FULL",
    services: ["nutrition", "training"],
    notes: "Preparación para media maratón en mayo.",
  },
  {
    id: "7",
    name: "Pablo Navarro",
    email: "pablo@email.com",
    status: "ACTIVE",
    packType: "TRAINING",
    services: ["training"],
    notes: "Entrena 5 días por semana.",
  },
  {
    id: "8",
    name: "María Jiménez",
    email: "maria@email.com",
    status: "ACTIVE",
    packType: "FULL",
    services: ["nutrition", "training"],
    notes: "Embarazada, adaptar plan a partir del tercer trimestre.",
  },
];
