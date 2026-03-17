import type { useQuestionnaireStore } from "@/data/useQuestionnaireStore";

/** Group check-in adherence by ISO week */
export const computeAdherence = (
  entries: ReturnType<typeof useQuestionnaireStore.getState>["entries"],
  clientId: string
) => {
  const clientEntries = entries.filter((e) => e.clientId === clientId);
  const byWeek: Record<string, { total: number; answered: number }> = {};

  clientEntries.forEach((e) => {
    const key = e.weekLabel;
    if (!byWeek[key]) byWeek[key] = { total: 0, answered: 0 };
    byWeek[key].total += 1;
    if (e.status === "respondido" || e.status === "revisado") byWeek[key].answered += 1;
  });

  return Object.entries(byWeek).map(([week, data]) => ({
    week: week.replace("Semana ", "S"),
    weekFull: week,
    rate: Math.round((data.answered / data.total) * 100),
    answered: data.answered,
    total: data.total,
  }));
};

/** Compute weekly weight deltas */
export const computeWeightDeltas = (weightData: { date: string; weight: number }[]) => {
  if (weightData.length < 2) return [];
  return weightData.slice(1).map((entry, i) => {
    const prev = weightData[i];
    const delta = +(entry.weight - prev.weight).toFixed(1);
    const dt = new Date(entry.date);
    return {
      date: entry.date,
      label: `${dt.getDate()}/${dt.getMonth() + 1}`,
      weight: entry.weight,
      delta,
    };
  });
};
