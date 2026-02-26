import ClientLayout from "@/components/client/ClientLayout";
import { useClient } from "@/contexts/ClientContext";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ResponsiveContainer, LineChart, Line, YAxis, Tooltip } from "recharts";
import {
  Utensils,
  Dumbbell,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Scale,
  Target,
  ChevronRight,
  Flame,
  Calendar,
  Trophy,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { nutritionPlanList } from "@/data/nutritionPlanStore";
import { trainingPlanList } from "@/data/trainingPlanStore";
import {
  mockQuestionnaireEntries,
  clientWeightHistory,
  getClientBestRMs,
} from "@/data/mockData";

const ClientHome = () => {
  const { client } = useClient();
  const navigate = useNavigate();

  const hasNutrition = client.services.includes("nutrition");
  const hasTraining = client.services.includes("training");

  const activePlan = hasNutrition
    ? nutritionPlanList.find((p) => p.clientId === client.id && p.active)
    : null;
  const activeTraining = hasTraining
    ? trainingPlanList.find((p) => p.clientId === client.id && p.active)
    : null;

  const pendingCheckins = mockQuestionnaireEntries.filter(
    (e) => e.clientId === client.id && e.status === "pendiente"
  ).length;

  // Weight data
  const weightHistory = clientWeightHistory[client.id] || [];
  const latestWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1] : null;
  const prevWeight = weightHistory.length > 1 ? weightHistory[weightHistory.length - 2] : null;
  const weightDiff = latestWeight && prevWeight ? +(latestWeight.weight - prevWeight.weight).toFixed(1) : null;
  const firstWeight = weightHistory.length > 0 ? weightHistory[0] : null;
  const totalDiff = latestWeight && firstWeight ? +(latestWeight.weight - firstWeight.weight).toFixed(1) : null;

  // Best RMs
  const bestRMs = hasTraining ? getClientBestRMs(client.id) : [];
  const mainLifts = bestRMs.filter((r) =>
    ["Sentadilla", "Press Banca", "Peso Muerto"].includes(r.exerciseName)
  );
  const totalRM = mainLifts.reduce((sum, r) => sum + r.estimated1RM, 0);

  // Training progress
  const trainingWeekProgress = activeTraining
    ? Math.round(((activeTraining.currentWeek ?? 0) / activeTraining.weeksDuration) * 100)
    : 0;

  // Next checkin
  const nextCheckin = mockQuestionnaireEntries.find(
    (e) => e.clientId === client.id && e.status === "pendiente"
  );

  return (
    <ClientLayout>
      <div className="space-y-5 max-w-lg mx-auto animate-fade-in">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Hola, {client.name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tu resumen de hoy
          </p>
        </div>

        {/* Weight card — only if nutrition */}
        {hasNutrition && latestWeight && (
          <button
            onClick={() => navigate("/client/progress")}
            className="w-full bg-card border border-border rounded-xl p-4 text-left hover:border-primary/40 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Scale className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground">Peso corporal</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-3xl font-bold text-foreground tracking-tight">
                  {latestWeight.weight}
                  <span className="text-base font-normal text-muted-foreground ml-1">kg</span>
                </p>
                <div className="flex gap-3 mt-1">
                  {weightDiff !== null && (
                    <div className="flex items-center gap-1">
                      {weightDiff < 0 ? (
                        <TrendingDown className="h-3.5 w-3.5 text-primary" />
                      ) : weightDiff > 0 ? (
                        <TrendingUp className="h-3.5 w-3.5 text-destructive" />
                      ) : null}
                      <span
                        className={`text-xs font-medium ${
                          weightDiff < 0
                            ? "text-primary"
                            : weightDiff > 0
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }`}
                      >
                        {weightDiff > 0 ? "+" : ""}
                        {weightDiff} sem
                      </span>
                    </div>
                  )}
                  {totalDiff !== null && (
                    <span className="text-xs text-muted-foreground">
                      {totalDiff > 0 ? "+" : ""}
                      {totalDiff} total
                    </span>
                  )}
                </div>
              </div>
              {/* Sparkline */}
              {weightHistory.length >= 3 && (
                <div className="w-28 h-12 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightHistory}>
                      <YAxis hide domain={["dataMin - 0.5", "dataMax + 0.5"]} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.[0]) return null;
                          const d = payload[0].payload as { date: string; weight: number };
                          return (
                            <div className="bg-card border border-border rounded-lg px-2.5 py-1.5 shadow-lg">
                              <p className="text-xs font-semibold text-foreground">{d.weight} kg</p>
                              <p className="text-[10px] text-muted-foreground">{d.date}</p>
                            </div>
                          );
                        }}
                        cursor={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="hsl(110, 100%, 54%)"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 3, fill: "hsl(110, 100%, 54%)", strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </button>
        )}

        {/* Main service cards */}
        <div className="grid grid-cols-2 gap-3">
          {hasNutrition && (
            <button
              onClick={() => navigate("/client/nutrition")}
              className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/40 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Utensils className="h-4 w-4 text-primary" />
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-sm font-semibold text-foreground">Nutrición</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {activePlan ? activePlan.planName : "Sin plan activo"}
              </p>
              {activePlan && (
                <div className="flex items-center gap-1.5 mt-2">
                  <Flame className="h-3 w-3 text-primary" />
                  <span className="text-xs font-medium text-primary">
                    {activePlan.calories} kcal
                  </span>
                </div>
              )}
            </button>
          )}

          {hasTraining && (
            <button
              onClick={() => navigate("/client/training")}
              className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/40 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="h-9 w-9 rounded-lg bg-accent/15 flex items-center justify-center">
                  <Dumbbell className="h-4 w-4 text-accent" />
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
              <p className="text-sm font-semibold text-foreground">Entrenamiento</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {activeTraining ? activeTraining.planName : "Sin plan activo"}
              </p>
              {activeTraining && activeTraining.currentWeek && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      Sem {activeTraining.currentWeek}/{activeTraining.weeksDuration}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{trainingWeekProgress}%</span>
                  </div>
                  <Progress value={trainingWeekProgress} className="h-1.5" />
                </div>
              )}
            </button>
          )}
        </div>

        {/* Best lifts — only if training */}
        {hasTraining && mainLifts.length > 0 && (
          <button
            onClick={() => navigate("/client/progress")}
            className="w-full bg-card border border-border rounded-xl p-4 text-left hover:border-primary/40 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-accent/15 flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-accent" />
                </div>
                <span className="text-sm font-semibold text-foreground">Mejores marcas</span>
              </div>
              {totalRM > 0 && (
                <Badge variant="outline" className="text-[10px] border-accent/30 text-accent">
                  Total: {totalRM} kg
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {mainLifts.map((lift) => (
                <div
                  key={lift.exerciseId}
                  className="bg-muted rounded-lg p-2.5 text-center"
                >
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                    {lift.exerciseName === "Sentadilla"
                      ? "SQ"
                      : lift.exerciseName === "Press Banca"
                      ? "BP"
                      : "DL"}
                  </p>
                  <p className="text-lg font-bold text-foreground mt-0.5">
                    {lift.estimated1RM}
                    <span className="text-[10px] font-normal text-muted-foreground ml-0.5">kg</span>
                  </p>
                </div>
              ))}
            </div>
          </button>
        )}

        {/* Bottom row: Check-ins + Progress */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/client/checkins")}
            className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/40 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
                <ClipboardList className="h-4 w-4 text-foreground" />
              </div>
              {pendingCheckins > 0 && (
                <span className="h-5 min-w-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                  {pendingCheckins}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-foreground">Check-ins</p>
            {nextCheckin ? (
              <div className="flex items-center gap-1 mt-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground truncate">
                  {nextCheckin.dayLabel} · {nextCheckin.templateName}
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">Todo al día ✓</p>
            )}
          </button>

          <button
            onClick={() => navigate("/client/progress")}
            className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/40 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
                <Target className="h-4 w-4 text-foreground" />
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="text-sm font-semibold text-foreground">Progreso</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {weightHistory.length > 0
                ? `${weightHistory.length} registros`
                : "Ver métricas"}
            </p>
          </button>
        </div>
      </div>
    </ClientLayout>
  );
};

export default ClientHome;
