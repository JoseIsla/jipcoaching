import { prisma } from "../server";

/**
 * Resolve the score (0-10 or pass/fail 0/5) for a given mark on an opposition test.
 * Looks up `physical_test_scales` rows where:
 *   value is within [minValue, maxValue] (inclusive)
 *   matching oppositionType + testName + gender (case-insensitive)
 * Returns the highest score that matches (covers overlapping ranges).
 */
export async function scoreFromMark(params: {
  oppositionType: string;
  testName: string;
  gender: string; // "MALE" | "FEMALE"
  value: number;
}): Promise<number | null> {
  const { oppositionType, testName, gender, value } = params;
  if (!oppositionType || !testName || !gender || !Number.isFinite(value)) return null;

  try {
    const rows = await prisma.physicalTestScale.findMany({
      where: {
        oppositionType: oppositionType as any,
        testName,
        gender,
        minValue: { lte: value },
        maxValue: { gte: value },
      },
      orderBy: { score: "desc" },
      take: 1,
    });
    return rows[0]?.score ?? null;
  } catch (err) {
    console.warn("scoreFromMark error", err);
    return null;
  }
}

/** Derive the client's opposition type from their TrainingIntake or active plan modality. */
export function modalityToOppositionType(modality?: string | null): string | null {
  if (!modality) return null;
  const m = modality.toLowerCase();
  if (m.includes("policía nacional") || m.includes("policia nacional")) return "POLICIA_NACIONAL";
  if (m.includes("policía local") || m.includes("policia local")) return "POLICIA_LOCAL";
  if (m.includes("bombero")) return "BOMBEROS";
  if (m.includes("tropa") || m.includes("mariner")) return "TROPA_MARINERIA";
  if (m.includes("guardia civil")) return "GUARDIA_CIVIL";
  return null;
}