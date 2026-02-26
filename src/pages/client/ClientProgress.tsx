import ClientLayout from "@/components/client/ClientLayout";
import { useClient } from "@/contexts/ClientContext";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingDown, TrendingUp, Weight, Dumbbell, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useQuestionnaireStore } from "@/data/useQuestionnaireStore";
import { useTranslation } from "@/i18n/useTranslation";

const ClientProgress = () => {
  const { t } = useTranslation();
  const { client } = useClient();
  const hasNutrition = client.services.includes("nutrition");
  const hasTraining = client.services.includes("training");
  const getWeightHistory = useQuestionnaireStore((s) => s.getWeightHistory);
  const getBestRMs = useQuestionnaireStore((s) => s.getBestRMs);
  const getTrainingProgress = useQuestionnaireStore((s) => s.getTrainingProgress);
  const weightData = getWeightHistory(client.id);
  const bestRMs = getBestRMs(client.id);
  const trainingProgress = getTrainingProgress(client.id);
  const weightDelta = weightData.length >= 2 ? (weightData[weightData.length - 1].weight - weightData[0].weight).toFixed(1) : null;
  const latestWeight = weightData.length > 0 ? weightData[weightData.length - 1].weight : null;
  const squat = bestRMs.find((r) => r.exerciseName === "Sentadilla");
  const bench = bestRMs.find((r) => r.exerciseName === "Press Banca");
  const deadlift = bestRMs.find((r) => r.exerciseName === "Peso Muerto");
  const sbdTotal = (squat?.estimated1RM || 0) + (bench?.estimated1RM || 0) + (deadlift?.estimated1RM || 0);
  const defaultTab = hasNutrition ? "nutrition" : "training";

  return (
    <ClientLayout>
      <div className="space-y-5 max-w-lg mx-auto animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><BarChart3 className="h-5 w-5 text-blue-500" />{t("clientProgress.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("clientProgress.subtitle")}</p>
        </div>
        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList className="bg-card border border-border w-full">
            {hasNutrition && <TabsTrigger value="nutrition" className="flex-1 text-xs">🍎 {t("common.nutrition")}</TabsTrigger>}
            {hasTraining && <TabsTrigger value="training" className="flex-1 text-xs">🏋️ {t("common.training")}</TabsTrigger>}
          </TabsList>
          {hasNutrition && (
            <TabsContent value="nutrition" className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card border border-border rounded-xl p-4 text-center"><Weight className="h-5 w-5 text-primary mx-auto mb-1" /><p className="text-2xl font-bold text-foreground">{latestWeight ?? "—"}</p><p className="text-[10px] text-muted-foreground">{t("clientProgress.currentWeight")}</p></div>
                <div className="bg-card border border-border rounded-xl p-4 text-center">{weightDelta && Number(weightDelta) < 0 ? <TrendingDown className="h-5 w-5 text-primary mx-auto mb-1" /> : <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1" />}<p className="text-2xl font-bold text-foreground">{weightDelta ?? "—"} kg</p><p className="text-[10px] text-muted-foreground">{t("clientProgress.totalDelta")}</p></div>
              </div>
              {weightData.length > 1 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">{t("clientProgress.weightEvolution")}</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={weightData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 16%)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(0 0% 60%)" }} tickFormatter={(d) => { const dt = new Date(d); return `${dt.getDate()}/${dt.getMonth() + 1}`; }} />
                      <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 10, fill: "hsl(0 0% 60%)" }} />
                      <Tooltip contentStyle={{ background: "hsl(0 0% 7%)", border: "1px solid hsl(0 0% 16%)", borderRadius: 8, fontSize: 12 }} labelFormatter={(d) => new Date(d).toLocaleDateString("es-ES")} />
                      <Line type="monotone" dataKey="weight" stroke="hsl(110 100% 54%)" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              {weightData.length <= 1 && <div className="bg-card border border-border rounded-xl p-8 text-center"><p className="text-sm text-muted-foreground">{t("clientProgress.notEnoughData")}</p></div>}
            </TabsContent>
          )}
          {hasTraining && (
            <TabsContent value="training" className="space-y-4">
              {sbdTotal > 0 && <div className="bg-card border border-border rounded-xl p-4 text-center"><Dumbbell className="h-5 w-5 text-accent mx-auto mb-1" /><p className="text-3xl font-black text-foreground">{sbdTotal} kg</p><p className="text-xs text-muted-foreground">{t("clientProgress.sbdTotal")}</p></div>}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("clientProgress.personalRecords")}</h3>
                {bestRMs.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">{t("clientProgress.noRecords")}</p>}
                {bestRMs.map((rm) => (
                  <div key={rm.exerciseId} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                    <div><p className="text-sm font-semibold text-foreground">{rm.exerciseName}</p><p className="text-[10px] text-muted-foreground">{rm.weight}kg × {rm.reps} — {new Date(rm.date).toLocaleDateString("es-ES")}</p></div>
                    <div className="text-right"><p className="text-lg font-bold text-primary">{rm.estimated1RM} kg</p><p className="text-[10px] text-muted-foreground">e1RM</p></div>
                  </div>
                ))}
              </div>
              {(trainingProgress.latestFatigue != null) && (
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Activity className="h-3.5 w-3.5" /> {t("clientProgress.lastReport")}</h3>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div><p className="text-lg font-bold text-foreground">{trainingProgress.latestFatigue ?? "—"}/10</p><p className="text-[10px] text-muted-foreground">{t("clientProgress.fatigueLabel")}</p></div>
                    <div><p className="text-lg font-bold text-foreground">{trainingProgress.latestSleep ?? "—"}/10</p><p className="text-[10px] text-muted-foreground">{t("clientProgress.sleepLabel")}</p></div>
                    <div><p className="text-lg font-bold text-foreground">{trainingProgress.latestMotivation ?? "—"}/10</p><p className="text-[10px] text-muted-foreground">{t("clientProgress.motivationLabel")}</p></div>
                  </div>
                  {trainingProgress.hasInjury && <div className="bg-destructive/10 rounded-lg p-2"><p className="text-xs text-destructive">{t("clientProgress.injuryReported", { detail: trainingProgress.injuryDetail || t("clientProgress.noDetail") })}</p></div>}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </ClientLayout>
  );
};

export default ClientProgress;
