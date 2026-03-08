/**
 * Mock check-in entries, weight history, and RM records for DEV_MOCK mode.
 */
import type { QuestionnaireEntry, WeightEntry, RMRecord, TrainingLogDay } from "@/data/useQuestionnaireStore";

// ─── Weight history for Carlos (id "1") ────────────────────────

export const mockWeightHistory: Record<string, WeightEntry[]> = {
  "1": [
    { date: "2026-01-20", weight: 77.8 },
    { date: "2026-01-27", weight: 78.0 },
    { date: "2026-02-03", weight: 78.3 },
    { date: "2026-02-10", weight: 78.1 },
    { date: "2026-02-17", weight: 78.6 },
    { date: "2026-02-24", weight: 78.9 },
  ],
};

// ─── RM records for Carlos ─────────────────────────────────────

export const mockRMRecords: Record<string, RMRecord[]> = {
  "1": [
    { exerciseId: "ex-sq", exerciseName: "Sentadilla", weight: 170, date: "2026-02-17", reps: 3, estimated1RM: 185 },
    { exerciseId: "ex-sq", exerciseName: "Sentadilla", weight: 160, date: "2026-01-27", reps: 5, estimated1RM: 180 },
    { exerciseId: "ex-bp", exerciseName: "Press Banca", weight: 115, date: "2026-02-17", reps: 3, estimated1RM: 125 },
    { exerciseId: "ex-bp", exerciseName: "Press Banca", weight: 110, date: "2026-01-27", reps: 4, estimated1RM: 120 },
    { exerciseId: "ex-dl", exerciseName: "Peso Muerto", weight: 200, date: "2026-02-17", reps: 2, estimated1RM: 215 },
    { exerciseId: "ex-dl", exerciseName: "Peso Muerto", weight: 190, date: "2026-01-27", reps: 3, estimated1RM: 207 },
  ],
};

// ─── Questionnaire entries for Carlos ──────────────────────────

const makeTrainingLog = (weekNum: number): TrainingLogDay[] => [
  {
    dayNumber: 1,
    dayName: "Sentadilla + Acc.",
    exercises: [
      {
        exerciseId: "e1", exerciseName: "Sentadilla", section: "basic",
        plannedSets: "1+3", plannedReps: "6", plannedLoad: "—", plannedRPE: 7 + weekNum,
        actualWeight: 155 + weekNum * 5, actualRPE: 7.5 + weekNum * 0.5, actualSets: "1+3", actualReps: "6",
      },
      {
        exerciseId: "e2", exerciseName: "Sentadilla Pausa", section: "basic",
        plannedSets: "3", plannedReps: "4", plannedLoad: "—", plannedRPE: undefined,
        actualWeight: 130 + weekNum * 5, actualRPE: 7, actualSets: "3", actualReps: "4",
      },
    ],
  },
  {
    dayNumber: 2,
    dayName: "Press Banca + Acc.",
    exercises: [
      {
        exerciseId: "e4", exerciseName: "Press Banca", section: "basic",
        plannedSets: "1+3", plannedReps: "5", plannedLoad: "—", plannedRPE: 7 + weekNum,
        actualWeight: 105 + weekNum * 2.5, actualRPE: 7 + weekNum * 0.5, actualSets: "1+3", actualReps: "5",
      },
      {
        exerciseId: "e5", exerciseName: "Press Banca Estrecho", section: "basic",
        plannedSets: "3", plannedReps: "8", plannedLoad: "—",
        actualWeight: 85 + weekNum * 2.5, actualRPE: 7, actualSets: "3", actualReps: "8",
      },
    ],
  },
  {
    dayNumber: 3,
    dayName: "Peso Muerto + Acc.",
    exercises: [
      {
        exerciseId: "e7", exerciseName: "Peso Muerto", section: "basic",
        plannedSets: "1+2", plannedReps: "5", plannedLoad: "—", plannedRPE: 7 + weekNum,
        actualWeight: 190 + weekNum * 5, actualRPE: 8 + weekNum * 0.5, actualSets: "1+2", actualReps: "5",
      },
      {
        exerciseId: "e8", exerciseName: "Peso Muerto Déficit", section: "basic",
        plannedSets: "3", plannedReps: "5", plannedLoad: "—",
        actualWeight: 150 + weekNum * 5, actualRPE: 7.5, actualSets: "3", actualReps: "5",
      },
    ],
  },
];

export const mockQuestionnaireEntries: QuestionnaireEntry[] = [
  // ── Week 1 nutrition check-ins (responded) ──
  {
    id: "qe-n1-w1",
    clientId: "1",
    clientName: "Carlos Martínez",
    templateId: "nt-tue",
    templateName: "Check-in Martes",
    category: "nutrition",
    weekLabel: "Semana 1",
    date: "2026-01-20",
    dayLabel: "Martes",
    status: "respondido",
    responses: {
      q1: 77.8, q2: 7, q3: false, q4: "", q5: true, q6: 1, q7: 4, q8: 7.5,
    },
  },
  {
    id: "qe-n2-w1",
    clientId: "1",
    clientName: "Carlos Martínez",
    templateId: "nt-fri",
    templateName: "Check-in Viernes",
    category: "nutrition",
    weekLabel: "Semana 1",
    date: "2026-01-23",
    dayLabel: "Viernes",
    status: "respondido",
    responses: {
      q1: 78.0, q9: true, q10: "Cena", q11: 8, q12: "Poca", q13: "",
    },
  },
  // ── Week 2 nutrition check-ins (responded) ──
  {
    id: "qe-n1-w2",
    clientId: "1",
    clientName: "Carlos Martínez",
    templateId: "nt-tue",
    templateName: "Check-in Martes",
    category: "nutrition",
    weekLabel: "Semana 2",
    date: "2026-01-27",
    dayLabel: "Martes",
    status: "respondido",
    responses: {
      q1: 78.3, q2: 8, q3: false, q4: "", q5: false, q6: 0, q7: 3, q8: 8,
    },
  },
  {
    id: "qe-n2-w2",
    clientId: "1",
    clientName: "Carlos Martínez",
    templateId: "nt-fri",
    templateName: "Check-in Viernes",
    category: "nutrition",
    weekLabel: "Semana 2",
    date: "2026-01-30",
    dayLabel: "Viernes",
    status: "respondido",
    responses: {
      q1: 78.1, q9: true, q10: "Ninguna", q11: 9, q12: "Nada", q13: "Me siento muy bien esta semana.",
    },
  },
  // ── Week 3-5 nutrition (responded) ──
  {
    id: "qe-n1-w3",
    clientId: "1",
    clientName: "Carlos Martínez",
    templateId: "nt-tue",
    templateName: "Check-in Martes",
    category: "nutrition",
    weekLabel: "Semana 3",
    date: "2026-02-03",
    dayLabel: "Martes",
    status: "respondido",
    responses: { q1: 78.3, q2: 7, q3: false, q4: "", q5: true, q6: 2, q7: 5, q8: 7 },
  },
  {
    id: "qe-n1-w4",
    clientId: "1",
    clientName: "Carlos Martínez",
    templateId: "nt-tue",
    templateName: "Check-in Martes",
    category: "nutrition",
    weekLabel: "Semana 4",
    date: "2026-02-10",
    dayLabel: "Martes",
    status: "respondido",
    responses: { q1: 78.6, q2: 8, q3: false, q4: "", q5: false, q6: 0, q7: 3, q8: 7.5 },
  },
  {
    id: "qe-n1-w5",
    clientId: "1",
    clientName: "Carlos Martínez",
    templateId: "nt-tue",
    templateName: "Check-in Martes",
    category: "nutrition",
    weekLabel: "Semana 5",
    date: "2026-02-17",
    dayLabel: "Martes",
    status: "respondido",
    responses: { q1: 78.9, q2: 9, q3: false, q4: "", q5: false, q6: 0, q7: 3, q8: 8 },
  },
  // ── Current week nutrition (pending) ──
  {
    id: "qe-n1-w6",
    clientId: "1",
    clientName: "Carlos Martínez",
    templateId: "nt-tue",
    templateName: "Check-in Martes",
    category: "nutrition",
    weekLabel: "Semana 6",
    date: "2026-02-24",
    dayLabel: "Martes",
    status: "pendiente",
  },
  {
    id: "qe-n2-w6",
    clientId: "1",
    clientName: "Carlos Martínez",
    templateId: "nt-fri",
    templateName: "Check-in Viernes",
    category: "nutrition",
    weekLabel: "Semana 6",
    date: "2026-02-27",
    dayLabel: "Viernes",
    status: "pendiente",
  },
  // ── Training check-ins (responded) ──
  {
    id: "qe-t-w1",
    clientId: "1",
    clientName: "Carlos Martínez",
    templateId: "tt-weekly",
    templateName: "Registro Semanal de Entrenamiento",
    category: "training",
    weekLabel: "Semana 1",
    date: "2026-01-24",
    dayLabel: "Sábado",
    status: "respondido",
    responses: {
      tq1: 5, tq2: false, tq3: "", tq4: 8, tq5: 9, tq6: "Buen inicio de ciclo, cargas manejables.",
    },
    trainingLog: makeTrainingLog(0),
    techniqueVideos: [
      { id: "tv-mock-1", exerciseName: "Sentadilla", url: "https://www.w3schools.com/html/mov_bbb.mp4", notes: "Revisión de profundidad", uploadedAt: "2026-01-24T10:30:00Z" },
      { id: "tv-mock-2", exerciseName: "Press Banca", url: "https://www.w3schools.com/html/mov_bbb.mp4", notes: "Arco y retracción escapular", uploadedAt: "2026-01-24T11:00:00Z" },
    ],
    planId: "t-mock-carlos",
    weekNumber: 1,
  },
  {
    id: "qe-t-w2",
    clientId: "1",
    clientName: "Carlos Martínez",
    templateId: "tt-weekly",
    templateName: "Registro Semanal de Entrenamiento",
    category: "training",
    weekLabel: "Semana 2",
    date: "2026-01-31",
    dayLabel: "Sábado",
    status: "respondido",
    responses: {
      tq1: 6, tq2: false, tq3: "", tq4: 7, tq5: 8, tq6: "Subimos peso en sentadilla sin problemas.",
    },
    trainingLog: makeTrainingLog(1),
    planId: "t-mock-carlos",
    weekNumber: 2,
  },
  {
    id: "qe-t-w3",
    clientId: "1",
    clientName: "Carlos Martínez",
    templateId: "tt-weekly",
    templateName: "Registro Semanal de Entrenamiento",
    category: "training",
    weekLabel: "Semana 3",
    date: "2026-02-07",
    dayLabel: "Sábado",
    status: "respondido",
    responses: {
      tq1: 6, tq2: false, tq3: "", tq4: 7, tq5: 8, tq6: "Buen progreso en press banca.",
    },
    trainingLog: makeTrainingLog(2),
    planId: "t-mock-carlos",
    weekNumber: 3,
  },
  {
    id: "qe-t-w4",
    clientId: "1",
    clientName: "Carlos Martínez",
    templateId: "tt-weekly",
    templateName: "Registro Semanal de Entrenamiento",
    category: "training",
    weekLabel: "Semana 4",
    date: "2026-02-14",
    dayLabel: "Sábado",
    status: "respondido",
    responses: {
      tq1: 7, tq2: false, tq3: "", tq4: 7, tq5: 9, tq6: "Semana fuerte, RPEs altos pero controlados.",
    },
    trainingLog: makeTrainingLog(3),
    planId: "t-mock-carlos",
    weekNumber: 4,
  },
  // Current training week is now auto-generated from the active plan — no mock needed.
];
