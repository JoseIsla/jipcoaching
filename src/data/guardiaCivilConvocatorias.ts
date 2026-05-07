/**
 * Guardia Civil convocatoria definitions with marks per age group and gender.
 * Sources: BOE official convocatorias 2022-2025.
 *
 * From 2023 onwards, "Velocidad 60m" was replaced by "Circuito de agilidad"
 * (Orden PCM/286/2023, de 23 de marzo).
 */

export interface GCThreshold {
  testName: string;
  unit: string;
  unitLabel: string;
  lowerIsBetter: boolean;
  /** Minimum mark for APTO — male */
  male: number;
  /** Minimum mark for APTO — female */
  female: number;
}

export interface GCAgeGroup {
  label: string;
  key: string;
  thresholds: GCThreshold[];
}

export interface GCConvocatoria {
  year: number;
  label: string;
  boeRef: string;
  ageGroups: GCAgeGroup[];
}

/**
 * For lowerIsBetter tests (time-based), the threshold is the MAXIMUM allowed value.
 * For higherIsBetter tests (reps), the threshold is the MINIMUM required value.
 */

const TESTS_2023_PLUS = (ageKey: string): GCThreshold[] => {
  if (ageKey === "lt35") {
    return [
      { testName: "Circuito de agilidad", unit: "seconds", unitLabel: "seg", lowerIsBetter: true, male: 14, female: 16 },
      { testName: "Carrera 2000m", unit: "seconds", unitLabel: "seg", lowerIsBetter: true, male: 565, female: 674 },
      { testName: "Flexiones de brazos", unit: "reps", unitLabel: "reps", lowerIsBetter: false, male: 16, female: 11 },
      { testName: "Natación 50m", unit: "seconds", unitLabel: "seg", lowerIsBetter: true, male: 70, female: 81 },
    ];
  }
  if (ageKey === "35to40") {
    return [
      { testName: "Circuito de agilidad", unit: "seconds", unitLabel: "seg", lowerIsBetter: true, male: 14.4, female: 16.4 },
      { testName: "Carrera 2000m", unit: "seconds", unitLabel: "seg", lowerIsBetter: true, male: 588, female: 695 },
      { testName: "Flexiones de brazos", unit: "reps", unitLabel: "reps", lowerIsBetter: false, male: 16, female: 11 },
      { testName: "Natación 50m", unit: "seconds", unitLabel: "seg", lowerIsBetter: true, male: 71, female: 83 },
    ];
  }
  // gte40
  return [
    { testName: "Circuito de agilidad", unit: "seconds", unitLabel: "seg", lowerIsBetter: true, male: 15.1, female: 17.9 },
    { testName: "Carrera 2000m", unit: "seconds", unitLabel: "seg", lowerIsBetter: true, male: 633, female: 769 },
    { testName: "Flexiones de brazos", unit: "reps", unitLabel: "reps", lowerIsBetter: false, male: 14, female: 9 },
    { testName: "Natación 50m", unit: "seconds", unitLabel: "seg", lowerIsBetter: true, male: 73, female: 88 },
  ];
};

const AGE_GROUPS_2023_PLUS: GCAgeGroup[] = [
  { label: "Menor de 35 años", key: "lt35", thresholds: TESTS_2023_PLUS("lt35") },
  { label: "35 a 40 años", key: "35to40", thresholds: TESTS_2023_PLUS("35to40") },
  { label: "40 años o más", key: "gte40", thresholds: TESTS_2023_PLUS("gte40") },
];

const TESTS_2022 = (ageKey: string): GCThreshold[] => {
  if (ageKey === "lt35") {
    return [
      { testName: "Velocidad 60m", unit: "seconds", unitLabel: "seg", lowerIsBetter: true, male: 9.4, female: 10.6 },
      { testName: "Carrera 2000m", unit: "seconds", unitLabel: "seg", lowerIsBetter: true, male: 565, female: 674 },
      { testName: "Flexiones de brazos", unit: "reps", unitLabel: "reps", lowerIsBetter: false, male: 16, female: 11 },
      { testName: "Natación 50m", unit: "seconds", unitLabel: "seg", lowerIsBetter: true, male: 70, female: 81 },
    ];
  }
  if (ageKey === "35to40") {
    return [
      { testName: "Velocidad 60m", unit: "seconds", unitLabel: "seg", lowerIsBetter: true, male: 9.7, female: 11.0 },
      { testName: "Carrera 2000m", unit: "seconds", unitLabel: "seg", lowerIsBetter: true, male: 588, female: 695 },
      { testName: "Flexiones de brazos", unit: "reps", unitLabel: "reps", lowerIsBetter: false, male: 16, female: 11 },
      { testName: "Natación 50m", unit: "seconds", unitLabel: "seg", lowerIsBetter: true, male: 71, female: 83 },
    ];
  }
  // gte40
  return [
    { testName: "Velocidad 60m", unit: "seconds", unitLabel: "seg", lowerIsBetter: true, male: 10.2, female: 11.8 },
    { testName: "Carrera 2000m", unit: "seconds", unitLabel: "seg", lowerIsBetter: true, male: 633, female: 769 },
    { testName: "Flexiones de brazos", unit: "reps", unitLabel: "reps", lowerIsBetter: false, male: 14, female: 9 },
    { testName: "Natación 50m", unit: "seconds", unitLabel: "seg", lowerIsBetter: true, male: 73, female: 88 },
  ];
};

const AGE_GROUPS_2022: GCAgeGroup[] = [
  { label: "Menor de 35 años", key: "lt35", thresholds: TESTS_2022("lt35") },
  { label: "35 a 40 años", key: "35to40", thresholds: TESTS_2022("35to40") },
  { label: "40 años o más", key: "gte40", thresholds: TESTS_2022("gte40") },
];

export const GC_CONVOCATORIAS: GCConvocatoria[] = [
  {
    year: 2025,
    label: "Convocatoria 2025 (Prom. 131)",
    boeRef: "BOE Resolución 160/38240/2025, 28 mayo 2025",
    ageGroups: AGE_GROUPS_2023_PLUS,
  },
  {
    year: 2024,
    label: "Convocatoria 2024 (Prom. 130)",
    boeRef: "BOE Resolución 160/38262/2024, 26 junio 2024",
    ageGroups: AGE_GROUPS_2023_PLUS,
  },
  {
    year: 2023,
    label: "Convocatoria 2023 (Prom. 129)",
    boeRef: "BOE Resolución 160/38261/2023 — primera con circuito de agilidad",
    ageGroups: AGE_GROUPS_2023_PLUS,
  },
  {
    year: 2022,
    label: "Convocatoria 2022 (Prom. 128)",
    boeRef: "BOE Resolución 160/38262/2022, 24 junio 2022",
    ageGroups: AGE_GROUPS_2022,
  },
];

/** Get apto status for a specific test value given a convocatoria, age group and gender */
export const getGCApto = (
  convocatoria: GCConvocatoria,
  ageGroupKey: string,
  gender: "MALE" | "FEMALE",
  testName: string,
  value: number
): boolean => {
  const ageGroup = convocatoria.ageGroups.find(ag => ag.key === ageGroupKey);
  if (!ageGroup) return false;
  const threshold = ageGroup.thresholds.find(t => t.testName === testName);
  if (!threshold) return false;
  const limit = gender === "MALE" ? threshold.male : threshold.female;
  return threshold.lowerIsBetter ? value <= limit : value >= limit;
};

/** Get the threshold value for display */
export const getGCThresholdValue = (
  convocatoria: GCConvocatoria,
  ageGroupKey: string,
  gender: "MALE" | "FEMALE",
  testName: string
): number | null => {
  const ageGroup = convocatoria.ageGroups.find(ag => ag.key === ageGroupKey);
  if (!ageGroup) return null;
  const threshold = ageGroup.thresholds.find(t => t.testName === testName);
  if (!threshold) return null;
  return gender === "MALE" ? threshold.male : threshold.female;
};