import ClientLayout from "@/components/client/ClientLayout";
import { useClient } from "@/contexts/ClientContext";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingDown, TrendingUp, Weight, Dumbbell, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import {
  clientWeightHistory,
  clientRMRecords,
  getClientBestRMs,
  getClientTrainingProgress,
} from "@/data/mockData";

const ClientProgress = () => {
  const { client } = useClient();
  const hasNutrition = client.services.includes("nutrition");
  const hasTraining = client.services.includes("training");

  const weightData = clientWeightHistory[client.id] || [];
  const bestRMs = getClientBestRMs(client.id);
  const trainingProgress = getClientTrainingProgress(client.id);

  // Weight delta
  const weightDelta = weightData.length >= 2
    ? (weightData[weightData.length - 1].weight - weightData[0].weight).toFixed(1)
    : null;
  const latestWeight = weightData.length > 0 ? weightData[weightData.length - 1].weight : null;

  // SBD total
  const squat = bestRMs.find((r) => r.exerciseName === "Sentadilla");
  const bench = bestRMs.find((r) => r.exerciseName === "Press Banca");
  const deadlift = bestRMs.find((r) => r.exerciseName === "Peso Muerto");
  const sbdTotal = (squat?.estimated1RM || 0) + (bench?.estimated1RM || 0) + (deadlift?.estimated1RM || 0);

  const defaultTab = hasNutrition ? "nutrition" : "training";

  return (
    <ClientLayout>
      <div className="space-y-5 max-w-lg mx-auto animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Progreso
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Tus métricas y evolución</p>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList className="bg-card border border-border w-full">
            {hasNutrition && <TabsTrigger value="nutrition" className="flex-1 text-xs">🍎 Nutrición</TabsTrigger>}
            {hasTraining && <TabsTrigger value="training" className="flex-1 text-xs">🏋️ Entrenamiento</TabsTrigger>}
          </TabsList>

          {/* ===== NUTRITION ===== */}
          {hasNutrition && (
            <TabsContent value="nutrition" className="space-y-4">
              {/* Weight stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card border border-border rounded-xl p-4 text-center">
                  <Weight className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-2xl font-bold text-foreground">{latestWeight ?? "—"}</p>
                  <p className="text-[10px] text-muted-foreground">Peso actual (kg)</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 text-center">
                  {weightDelta && Number(weightDelta) < 0 ? (
                    <TrendingDown className="h-5 w-5 text-green-500 mx-auto mb-1" />
                  ) : (
                    <TrendingUp className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                  )}
                  <p className="text-2xl font-bold text-foreground">{weightDelta ?? "—"} kg</p>
                  <p className="text-[10px] text-muted-foreground">Delta total</p>
                </div>
              </div>

              {/* Weight chart */}
              {weightData.length > 1 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Evolución de peso</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={weightData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 16%)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: "hsl(0 0% 60%)" }}
                        tickFormatter={(d) => { const dt = new Date(d); return `${dt.getDate()}/${dt.getMonth() + 1}`; }}
                      />
                      <YAxis
                        domain={["dataMin - 1", "dataMax + 1"]}
                        tick={{ fontSize: 10, fill: "hsl(0 0% 60%)" }}
                      />
                      <Tooltip
                        contentStyle={{ background: "hsl(0 0% 7%)", border: "1px solid hsl(0 0% 16%)", borderRadius: 8, fontSize: 12 }}
                        labelFormatter={(d) => new Date(d).toLocaleDateString("es-ES")}
                      />
                      <Line type="monotone" dataKey="weight" stroke="hsl(110 100% 54%)" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {weightData.length <= 1 && (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <p className="text-sm text-muted-foreground">Aún no hay suficientes datos para mostrar la gráfica.</p>
                </div>
              )}
            </TabsContent>
          )}

          {/* ===== TRAINING ===== */}
          {hasTraining && (
            <TabsContent value="training" className="space-y-4">
              {/* SBD Total */}
              {sbdTotal > 0 && (
                <div className="bg-card border border-border rounded-xl p-4 text-center">
                  <Dumbbell className="h-5 w-5 text-accent mx-auto mb-1" />
                  <p className="text-3xl font-black text-foreground">{sbdTotal} kg</p>
                  <p className="text-xs text-muted-foreground">SBD Total estimado</p>
                </div>
              )}

              {/* Best RMs */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Récords personales</h3>
                {bestRMs.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Sin registros aún</p>
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

              {/* Bienestar */}
              {(trainingProgress.latestFatigue != null) && (
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5" /> Último reporte
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-foreground">{trainingProgress.latestFatigue ?? "—"}/10</p>
                      <p className="text-[10px] text-muted-foreground">Fatiga</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{trainingProgress.latestSleep ?? "—"}/10</p>
                      <p className="text-[10px] text-muted-foreground">Sueño</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{trainingProgress.latestMotivation ?? "—"}/10</p>
                      <p className="text-[10px] text-muted-foreground">Motivación</p>
                    </div>
                  </div>
                  {trainingProgress.hasInjury && (
                    <div className="bg-destructive/10 rounded-lg p-2">
                      <p className="text-xs text-destructive">⚠️ Molestia reportada: {trainingProgress.injuryDetail || "Sin detalle"}</p>
                    </div>
                  )}
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
