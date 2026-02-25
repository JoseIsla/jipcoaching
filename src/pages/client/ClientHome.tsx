import ClientLayout from "@/components/client/ClientLayout";
import { useClient } from "@/contexts/ClientContext";
import { Badge } from "@/components/ui/badge";
import { Utensils, Dumbbell, ClipboardList, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { nutritionPlanList } from "@/data/nutritionPlanStore";
import { trainingPlanList } from "@/data/trainingPlanStore";
import { mockQuestionnaireEntries } from "@/data/mockData";

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

  return (
    <ClientLayout>
      <div className="space-y-6 max-w-lg mx-auto animate-fade-in">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Hola, {client.name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tu resumen de hoy
          </p>
        </div>

        {/* Quick status cards */}
        <div className="grid grid-cols-2 gap-3">
          {hasNutrition && (
            <button
              onClick={() => navigate("/client/nutrition")}
              className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/50 transition-colors"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center mb-3">
                <Utensils className="h-4.5 w-4.5 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">Nutrición</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activePlan ? activePlan.planName : "Sin plan activo"}
              </p>
              {activePlan && (
                <Badge className="mt-2 text-[10px] bg-primary/15 text-primary border-0">
                  {activePlan.calories} kcal
                </Badge>
              )}
            </button>
          )}

          {hasTraining && (
            <button
              onClick={() => navigate("/client/training")}
              className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/50 transition-colors"
            >
              <div className="h-9 w-9 rounded-lg bg-accent/15 flex items-center justify-center mb-3">
                <Dumbbell className="h-4.5 w-4.5 text-accent" />
              </div>
              <p className="text-sm font-semibold text-foreground">Entrenamiento</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeTraining ? activeTraining.planName : "Sin plan activo"}
              </p>
              {activeTraining && (
                <Badge variant="outline" className="mt-2 text-[10px]">
                  Sem {activeTraining.currentWeek} · {activeTraining.block}
                </Badge>
              )}
            </button>
          )}

          <button
            onClick={() => navigate("/client/checkins")}
            className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/50 transition-colors"
          >
            <div className="h-9 w-9 rounded-lg bg-yellow-500/15 flex items-center justify-center mb-3">
              <ClipboardList className="h-4.5 w-4.5 text-yellow-500" />
            </div>
            <p className="text-sm font-semibold text-foreground">Check-ins</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pendingCheckins > 0
                ? `${pendingCheckins} pendiente${pendingCheckins > 1 ? "s" : ""}`
                : "Todo al día ✓"}
            </p>
          </button>

          <button
            onClick={() => navigate("/client/progress")}
            className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/50 transition-colors"
          >
            <div className="h-9 w-9 rounded-lg bg-blue-500/15 flex items-center justify-center mb-3">
              <TrendingUp className="h-4.5 w-4.5 text-blue-500" />
            </div>
            <p className="text-sm font-semibold text-foreground">Progreso</p>
            <p className="text-xs text-muted-foreground mt-0.5">Ver métricas</p>
          </button>
        </div>

        {/* Services badges */}
        <div className="flex gap-2">
          {client.services.map((s) => (
            <Badge key={s} variant="outline" className="text-xs capitalize">
              {s === "nutrition" ? "🍎 Nutrición" : "🏋️ Entrenamiento"}
            </Badge>
          ))}
        </div>
      </div>
    </ClientLayout>
  );
};

export default ClientHome;
