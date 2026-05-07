/**
 * Opposition physical test definitions per type and gender.
 * Used by the frontend to show which tests apply to each opposition type.
 *
 * Some tests differ by gender (e.g. Dominadas for men vs Suspensión en barra for women
 * in Policía Nacional). The `gender` field is optional — when absent the test applies to both.
 */
import { OppositionType } from "@/types/api";

export interface OppositionTestDef {
  testName: string;
  unit: string;
  unitLabel: string;
  lowerIsBetter: boolean; // true for time-based tests
  /** If set, the test only applies to this gender. Omit for both genders. */
  gender?: "MALE" | "FEMALE";
}

export const OPPOSITION_TESTS: Record<OppositionType, OppositionTestDef[]> = {
  [OppositionType.POLICIA_NACIONAL]: [
    { testName: "Circuito de agilidad", unit: "seconds", unitLabel: "seg", lowerIsBetter: true },
    { testName: "Dominadas", unit: "reps", unitLabel: "reps", lowerIsBetter: false, gender: "MALE" },
    { testName: "Suspensión en barra", unit: "seconds", unitLabel: "seg", lowerIsBetter: false, gender: "FEMALE" },
    { testName: "Carrera 1000m", unit: "seconds", unitLabel: "seg", lowerIsBetter: true },
  ],
  [OppositionType.POLICIA_LOCAL]: [
    { testName: "Circuito de agilidad", unit: "seconds", unitLabel: "seg", lowerIsBetter: true },
    { testName: "Dominadas", unit: "reps", unitLabel: "reps", lowerIsBetter: false, gender: "MALE" },
    { testName: "Suspensión en barra", unit: "seconds", unitLabel: "seg", lowerIsBetter: false, gender: "FEMALE" },
    { testName: "Carrera 1000m", unit: "seconds", unitLabel: "seg", lowerIsBetter: true },
  ],
  [OppositionType.BOMBEROS]: [
    { testName: "Carrera 60m", unit: "seconds", unitLabel: "seg", lowerIsBetter: true },
    { testName: "Carrera 100m", unit: "seconds", unitLabel: "seg", lowerIsBetter: true },
    { testName: "Carrera 1000m", unit: "seconds", unitLabel: "seg", lowerIsBetter: true },
    { testName: "Carrera 2000m", unit: "seconds", unitLabel: "seg", lowerIsBetter: true },
    { testName: "Natación 50m", unit: "seconds", unitLabel: "seg", lowerIsBetter: true },
    { testName: "Salto vertical", unit: "cm", unitLabel: "cm", lowerIsBetter: false },
    { testName: "Press de banca", unit: "kg", unitLabel: "kg", lowerIsBetter: false },
    { testName: "Dominadas", unit: "reps", unitLabel: "reps", lowerIsBetter: false },
    { testName: "Circuito de agilidad", unit: "seconds", unitLabel: "seg", lowerIsBetter: true },
  ],
  [OppositionType.TROPA_MARINERIA]: [
    { testName: "Salto vertical", unit: "cm", unitLabel: "cm", lowerIsBetter: false },
    { testName: "Flexiones de brazos", unit: "reps", unitLabel: "reps", lowerIsBetter: false },
    { testName: "Course Navette", unit: "periods", unitLabel: "periodos", lowerIsBetter: false },
  ],
};

/** Get the opposition type from a training modality string */
export const getOppositionTypeFromModality = (modality: string): OppositionType | null => {
  if (modality === "Oposiciones - Policía Nacional") return OppositionType.POLICIA_NACIONAL;
  if (modality === "Oposiciones - Policía Local") return OppositionType.POLICIA_LOCAL;
  if (modality === "Oposiciones - Bomberos") return OppositionType.BOMBEROS;
  if (modality === "Oposiciones - Tropa y Marinería") return OppositionType.TROPA_MARINERIA;
  return null;
};

/** Filter tests applicable to a specific gender */
export const getTestsForGender = (
  opType: OppositionType,
  gender: "MALE" | "FEMALE"
): OppositionTestDef[] => {
  return OPPOSITION_TESTS[opType].filter(
    (t) => !t.gender || t.gender === gender
  );
};