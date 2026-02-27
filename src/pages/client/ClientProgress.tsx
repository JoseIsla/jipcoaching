import { useMemo } from "react";
import ClientLayout from "@/components/client/ClientLayout";
import { useClient } from "@/contexts/ClientContext";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingDown, TrendingUp, Weight, Dumbbell, Activity, CheckCircle2 } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell, ReferenceLine,
} from "recharts";
import { useQuestionnaireStore } from "@/data/useQuestionnaireStore";
import { useTranslation } from "@/i18n/useTranslation";
import ProgressPhotosSection from "@/components/client/ProgressPhotosSection";


/** Group check-in adherence by ISO week */
const computeAdherence = (
  entries: ReturnType<typeof useQuestionnaireStore.getState>["entries"],
  clientId: string
) => {
  const clientEntries = entries.filter((e) => e.clientId === clientId);
  const byWeek: Record<string, { total: number; answered: number }> = {};

  clientEntries.forEach((e) => {
    const key = e.weekLabel;
    if (!byWeek[key]) byWeek[key] = { total: 0, answered: 0 };
    byWeek[key].total += 1;
    if (e.status === "respondido") byWeek[key].answered += 1;
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
const computeWeightDeltas = (weightData: { date: string; weight: number }[]) => {
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

const ClientProgress = () => {
  const { t } = useTranslation();
  const { client } = useClient();
  const hasNutrition = client.services.includes("nutrition");
  const hasTraining = client.services.includes("training");
  const getWeightHistory = useQuestionnaireStore((s) => s.getWeightHistory);
  const getBestRMs = useQuestionnaireStore((s) => s.getBestRMs);
  const getTrainingProgress = useQuestionnaireStore((s) => s.getTrainingProgress);
  const allEntries = useQuestionnaireStore((s) => s.entries);

  const weightData = getWeightHistory(client.id);
  const bestRMs = getBestRMs(client.id);
  const trainingProgress = getTrainingProgress(client.id);
  const weightDelta = weightData.length >= 2 ? (weightData[weightData.length - 1].weight - weightData[0].weight).toFixed(1) : null;
  const latestWeight = weightData.length > 0 ? weightData[weightData.length - 1].weight : null;
  const weeklyWeight = weightData.length >= 2
    ? (weightData[weightData.length - 1].weight - weightData[weightData.length - 2].weight).toFixed(1)
    : null;

  const squat = bestRMs.find((r) => r.exerciseName === "Sentadilla");
  const bench = bestRMs.find((r) => r.exerciseName === "Press Banca");
  const deadlift = bestRMs.find((r) => r.exerciseName === "Peso Muerto");
  const sbdTotal = (squat?.estimated1RM || 0) + (bench?.estimated1RM || 0) + (deadlift?.estimated1RM || 0);
  const defaultTab = hasNutrition ? "nutrition" : "training";

  const weightDeltas = useMemo(() => computeWeightDeltas(weightData), [weightData]);
  const adherenceData = useMemo(() => computeAdherence(allEntries, client.id), [allEntries, client.id]);
  const avgAdherence = adherenceData.length > 0
    ? Math.round(adherenceData.reduce((s, d) => s + d.rate, 0) / adherenceData.length)
    : 0;

  return (
    <ClientLayout>
      <div className="space-y-5 max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {t("clientProgress.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("clientProgress.subtitle")}</p>
        </div>

        {/* ── Adherence Card (always visible) ── */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              Adherencia a check-ins
            </h3>
            <Badge variant="outline" className="text-primary border-primary/30 text-[10px]">
              {avgAdherence}% media
            </Badge>
          </div>
          {adherenceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={adherenceData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 16%)" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(0 0% 60%)" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(0 0% 60%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <ReferenceLine y={100} stroke="hsl(110 100% 54%)" strokeDasharray="3 3" strokeOpacity={0.3} />
                <Tooltip
                  contentStyle={{ background: "hsl(0 0% 7%)", border: "1px solid hsl(0 0% 16%)", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number, _name: string, props: any) => [`${value}% (${props.payload.answered}/${props.payload.total})`, props.payload.weekFull]}
                  labelFormatter={() => ""}
                />
                <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                  {adherenceData.map((entry, i) => (
                    <Cell key={i} fill={entry.rate === 100 ? "hsl(110 100% 54%)" : entry.rate >= 50 ? "hsl(45 100% 55%)" : "hsl(0 70% 55%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Sin datos de adherencia aún.</p>
          )}
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList className="bg-card border border-border w-full">
            {hasNutrition && <TabsTrigger value="nutrition" className="flex-1 text-xs">🍎 {t("common.nutrition")}</TabsTrigger>}
            {hasTraining && <TabsTrigger value="training" className="flex-1 text-xs">🏋️ {t("common.training")}</TabsTrigger>}
          </TabsList>

          {/* ── Nutrition Tab ── */}
          {hasNutrition && (
            <TabsContent value="nutrition" className="space-y-4">
              {/* Stats cards - full width */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-card border border-border rounded-xl p-3 text-center">
                  <Weight className="h-4 w-4 text-primary mx-auto mb-1" />
                  <p className="text-xl font-bold text-foreground">{latestWeight ?? "—"}</p>
                  <p className="text-[9px] text-muted-foreground">{t("clientProgress.currentWeight")}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-3 text-center">
                  {weeklyWeight && Number(weeklyWeight) < 0
                    ? <TrendingDown className="h-4 w-4 text-primary mx-auto mb-1" />
                    : <TrendingUp className="h-4 w-4 text-primary mx-auto mb-1" />}
                  <p className="text-xl font-bold text-foreground">{weeklyWeight ? `${Number(weeklyWeight) > 0 ? "+" : ""}${weeklyWeight}` : "—"}</p>
                  <p className="text-[9px] text-muted-foreground">Δ semanal</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-3 text-center">
                  {weightDelta && Number(weightDelta) < 0
                    ? <TrendingDown className="h-4 w-4 text-primary mx-auto mb-1" />
                    : <TrendingUp className="h-4 w-4 text-primary mx-auto mb-1" />}
                  <p className="text-xl font-bold text-foreground">{weightDelta ? `${Number(weightDelta) > 0 ? "+" : ""}${weightDelta}` : "—"}</p>
                  <p className="text-[9px] text-muted-foreground">{t("clientProgress.totalDelta")}</p>
                </div>
              </div>

              {/* Charts in 2-column grid on desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Weight evolution chart */}
                {weightData.length > 1 && (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
                      {t("clientProgress.weightEvolution")}
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={weightData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 16%)" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: "hsl(0 0% 60%)" }}
                          tickFormatter={(d) => { const dt = new Date(d); return `${dt.getDate()}/${dt.getMonth() + 1}`; }}
                        />
                        <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 10, fill: "hsl(0 0% 60%)" }} />
                        <Tooltip
                          contentStyle={{ background: "hsl(0 0% 7%)", border: "1px solid hsl(0 0% 16%)", borderRadius: 8, fontSize: 12 }}
                          labelFormatter={(d) => new Date(d).toLocaleDateString("es-ES")}
                        />
                        <Line type="monotone" dataKey="weight" stroke="hsl(110 100% 54%)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Weekly weight delta bar chart */}
                {weightDeltas.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
                      Variación semanal de peso
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={weightDeltas}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 16%)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(0 0% 60%)" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "hsl(0 0% 60%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}kg`} />
                        <ReferenceLine y={0} stroke="hsl(0 0% 30%)" />
                        <Tooltip
                          contentStyle={{ background: "hsl(0 0% 7%)", border: "1px solid hsl(0 0% 16%)", borderRadius: 8, fontSize: 12 }}
                          formatter={(value: number) => [`${value > 0 ? "+" : ""}${value} kg`, "Variación"]}
                          labelFormatter={(label) => `Semana ${label}`}
                        />
                        <Bar dataKey="delta" radius={[4, 4, 0, 0]}>
                          {weightDeltas.map((entry, i) => (
                            <Cell key={i} fill={entry.delta > 0 ? "hsl(110 100% 54%)" : entry.delta < 0 ? "hsl(0 70% 55%)" : "hsl(0 0% 40%)"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {weightData.length <= 1 && (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <p className="text-sm text-muted-foreground">{t("clientProgress.notEnoughData")}</p>
                </div>
              )}
              {/* Progress Photos */}
              <ProgressPhotosSection clientId={client.id} />
            </TabsContent>
          )}

          {/* ── Training Tab ── */}
          {hasTraining && (
            <TabsContent value="training" className="space-y-4">
              {sbdTotal > 0 && (
                <div className="bg-card border border-border rounded-xl p-4 text-center">
                  <Dumbbell className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-3xl font-black text-foreground">{sbdTotal} kg</p>
                  <p className="text-xs text-muted-foreground">{t("clientProgress.sbdTotal")}</p>
                </div>
              )}

              {/* 2-column grid on desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("clientProgress.personalRecords")}
                  </h3>
                  {bestRMs.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">{t("clientProgress.noRecords")}</p>
                  )}
                  {bestRMs.map((rm) => (
                    <div key={rm.exerciseId} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{rm.exerciseName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {rm.weight}kg × {rm.reps} — {new Date(rm.date).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">{rm.estimated1RM} kg</p>
                        <p className="text-[10px] text-muted-foreground">e1RM</p>
                      </div>
                    </div>
                  ))}
                </div>

                {trainingProgress.latestFatigue != null && (
                  <div className="bg-card border border-border rounded-xl p-4 space-y-3 h-fit">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Activity className="h-3.5 w-3.5" /> {t("clientProgress.lastReport")}
                    </h3>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold text-foreground">{trainingProgress.latestFatigue ?? "—"}/10</p>
                        <p className="text-[10px] text-muted-foreground">{t("clientProgress.fatigueLabel")}</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{trainingProgress.latestSleep ?? "—"}/10</p>
                        <p className="text-[10px] text-muted-foreground">{t("clientProgress.sleepLabel")}</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{trainingProgress.latestMotivation ?? "—"}/10</p>
                        <p className="text-[10px] text-muted-foreground">{t("clientProgress.motivationLabel")}</p>
                      </div>
                    </div>
                    {trainingProgress.hasInjury && (
                      <div className="bg-destructive/10 rounded-lg p-2">
                        <p className="text-xs text-destructive">
                          {t("clientProgress.injuryReported", { detail: trainingProgress.injuryDetail || t("clientProgress.noDetail") })}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </TabsContent>
          )}
        </Tabs>
      </div>
    </ClientLayout>
  );
};

export default ClientProgress;