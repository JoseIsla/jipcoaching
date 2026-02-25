import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Utensils, Dumbbell, TrendingUp, Activity, Plus, ArrowRight, Weight, Trophy, Brain, Heart, AlertTriangle } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  mockClients,
  getActiveClients,
  getNewClientsThisMonth,
  getActiveNutritionPlans,
  getActiveTrainingPlans,
  getRetentionRate,
  clientWeightHistory,
  getClientBestRMs,
  getClientTrainingProgress,
  type Client,
} from "@/data/mockData";

// ── Progress Review Dialog ──────────────────────────────
const ClientProgressDialog = ({ client, open, onClose }: { client: Client | null; open: boolean; onClose: () => void }) => {
  if (!client) return null;

  const hasNutrition = client.services.includes("nutrition");
  const hasTraining = client.services.includes("training");
  const weightHistory = hasNutrition ? clientWeightHistory[client.id] || [] : [];
  const bestRMs = hasTraining ? getClientBestRMs(client.id) : [];
  const trainingProgress = hasTraining ? getClientTrainingProgress(client.id) : null;

  const weightDelta = weightHistory.length >= 2
    ? (weightHistory[weightHistory.length - 1].weight - weightHistory[0].weight).toFixed(1)
    : null;

  const defaultTab = hasNutrition ? "nutrition" : "training";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Progreso — {client.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mt-1">
          {hasNutrition && <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-xs">Nutrición</Badge>}
          {hasTraining && <Badge variant="outline" className="border-accent/30 text-accent bg-accent/10 text-xs">Entrenamiento</Badge>}
        </div>

        <Tabs defaultValue={defaultTab} className="mt-3">
          <TabsList className="bg-muted border border-border">
            {hasNutrition && (
              <TabsTrigger value="nutrition" className="data-[state=active]:bg-card data-[state=active]:text-primary">
                <Utensils className="h-4 w-4 mr-1.5" /> Nutrición
              </TabsTrigger>
            )}
            {hasTraining && (
              <TabsTrigger value="training" className="data-[state=active]:bg-card data-[state=active]:text-primary">
                <Dumbbell className="h-4 w-4 mr-1.5" /> Entrenamiento
              </TabsTrigger>
            )}
          </TabsList>

          {/* Nutrition Progress */}
          {hasNutrition && (
            <TabsContent value="nutrition" className="space-y-4 mt-4">
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Evolución de Peso en Ayunas</p>
                {weightHistory.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-foreground">{weightHistory[weightHistory.length - 1].weight} kg</p>
                        <p className="text-xs text-muted-foreground">Último registro</p>
                      </div>
                      {weightDelta && (
                        <div className={`text-right`}>
                          <p className={`text-lg font-bold ${Number(weightDelta) < 0 ? "text-primary" : Number(weightDelta) > 0 ? "text-accent" : "text-muted-foreground"}`}>
                            {Number(weightDelta) > 0 ? "+" : ""}{weightDelta} kg
                          </p>
                          <p className="text-xs text-muted-foreground">Desde inicio</p>
                        </div>
                      )}
                    </div>
                    {/* Mini weight chart as bars */}
                    <div className="space-y-1.5">
                      {weightHistory.map((entry, idx) => {
                        const min = Math.min(...weightHistory.map((w) => w.weight));
                        const max = Math.max(...weightHistory.map((w) => w.weight));
                        const range = max - min || 1;
                        const pct = ((entry.weight - min) / range) * 60 + 40;
                        return (
                          <div key={idx} className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-20 shrink-0">{entry.date.slice(5)}</span>
                            <div className="flex-1 h-5 bg-muted/50 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary/30 rounded-full flex items-center justify-end pr-2"
                                style={{ width: `${pct}%` }}
                              >
                                <span className="text-[10px] font-mono font-medium text-primary">{entry.weight}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">Sin datos de peso aún</p>
                )}
              </div>
            </TabsContent>
          )}

          {/* Training Progress */}
          {hasTraining && (
            <TabsContent value="training" className="space-y-5 mt-4">
              {/* Best RMs */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5" /> Mejores RMs Estimados
                </p>
                {bestRMs.length > 0 ? (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50 text-left">
                          <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Ejercicio</th>
                          <th className="px-3 py-2 text-xs font-medium text-muted-foreground text-right">Peso</th>
                          <th className="px-3 py-2 text-xs font-medium text-muted-foreground text-right">e1RM</th>
                          <th className="px-3 py-2 text-xs font-medium text-muted-foreground text-right">Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bestRMs
                          .filter((r) => ["e1", "e4", "e7"].includes(r.exerciseId))
                          .map((rm) => (
                            <tr key={rm.exerciseId} className="border-t border-border/50">
                              <td className="px-3 py-2.5 text-sm font-medium text-foreground">{rm.exerciseName}</td>
                              <td className="px-3 py-2.5 text-sm text-muted-foreground text-right font-mono">{rm.weight} kg</td>
                              <td className="px-3 py-2.5 text-sm text-primary text-right font-mono font-bold">{rm.estimated1RM} kg</td>
                              <td className="px-3 py-2.5 text-xs text-muted-foreground text-right">{rm.date.slice(5)}</td>
                            </tr>
                          ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-border bg-muted/30">
                          <td className="px-3 py-2 text-sm font-semibold text-foreground">Total SBD</td>
                          <td colSpan={3} className="px-3 py-2 text-sm font-bold text-primary text-right font-mono">
                            {bestRMs
                              .filter((r) => ["e1", "e4", "e7"].includes(r.exerciseId))
                              .reduce((sum, r) => sum + r.estimated1RM, 0)} kg
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">Sin datos de RMs aún</p>
                )}

                {/* Variant RMs */}
                {bestRMs.filter((r) => !["e1", "e4", "e7"].includes(r.exerciseId)).length > 0 && (
                  <div className="space-y-2 mt-2">
                    <p className="text-xs font-medium text-muted-foreground">Variantes</p>
                    {bestRMs
                      .filter((r) => !["e1", "e4", "e7"].includes(r.exerciseId))
                      .map((rm) => (
                        <div key={rm.exerciseId} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/30">
                          <span className="text-sm text-foreground">{rm.exerciseName}</span>
                          <span className="text-sm font-mono text-muted-foreground">{rm.estimated1RM} kg e1RM</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Questionnaire Metrics */}
              {trainingProgress && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Brain className="h-3.5 w-3.5" /> Último Check-in
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {trainingProgress.latestFatigue !== undefined && (
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-foreground">{trainingProgress.latestFatigue}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Fatiga /10</p>
                        <Progress value={trainingProgress.latestFatigue * 10} className="h-1.5 mt-2" />
                      </div>
                    )}
                    {trainingProgress.latestSleep !== undefined && (
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-foreground">{trainingProgress.latestSleep}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Sueño /10</p>
                        <Progress value={trainingProgress.latestSleep * 10} className="h-1.5 mt-2" />
                      </div>
                    )}
                    {trainingProgress.latestMotivation !== undefined && (
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-foreground">{trainingProgress.latestMotivation}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Motivación /10</p>
                        <Progress value={trainingProgress.latestMotivation * 10} className="h-1.5 mt-2" />
                      </div>
                    )}
                  </div>
                  {trainingProgress.hasInjury && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-destructive">Molestia reportada</p>
                        {trainingProgress.injuryDetail && (
                          <p className="text-xs text-muted-foreground mt-0.5">{trainingProgress.injuryDetail}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

// ── Main Dashboard ──────────────────────────────────────
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [progressClient, setProgressClient] = useState<Client | null>(null);

  const activeClients = getActiveClients();
  const newThisMonth = getNewClientsThisMonth();
  const activeNutrition = getActiveNutritionPlans();
  const activeTraining = getActiveTrainingPlans();
  const retention = getRetentionRate();

  const stats = [
    { title: "Clientes Activos", value: String(activeClients.length), change: `+${newThisMonth.length} este mes`, icon: Users, positive: true },
    { title: "Planes de Nutrición", value: String(activeNutrition.length), change: `${activeNutrition.length} activos`, icon: Utensils, positive: true },
    { title: "Entrenamientos", value: String(activeTraining.length), change: `${activeTraining.length} activos`, icon: Dumbbell, positive: true },
    { title: "Tasa de Retención", value: `${retention}%`, change: `${mockClients.filter(c => c.status !== "Inactivo").length}/${mockClients.length} clientes`, icon: TrendingUp, positive: retention >= 80 },
  ];

  const recentClients = mockClients.slice(0, 5);

  const quickActions = [
    { icon: Users, label: "Añadir cliente", desc: "Registrar nuevo cliente", onClick: () => navigate("/admin/clients") },
    { icon: Utensils, label: "Crear plan nutricional", desc: "Nuevo plan personalizado", onClick: () => navigate("/admin/nutrition") },
    { icon: Dumbbell, label: "Crear entrenamiento", desc: "Nueva rutina de ejercicios", onClick: () => navigate("/admin/training") },
    { icon: Activity, label: "Revisar progreso", desc: "Ver métricas de clientes", onClick: () => {} }, // handled separately
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Resumen general de tu actividad
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Clients Table */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-semibold text-foreground">Clientes Recientes</h2>
              <span className="text-xs text-primary cursor-pointer hover:underline" onClick={() => navigate("/admin/clients")}>Ver todos</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre</th>
                    <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Plan</th>
                    <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                    <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Inicio</th>
                  </tr>
                </thead>
                <tbody>
                  {recentClients.map((client) => (
                    <tr key={client.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/admin/clients/${client.id}`)}>
                      <td className="px-5 py-3.5 text-sm font-medium text-foreground">{client.name}</td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{client.plan}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            client.status === "Activo"
                              ? "bg-primary/15 text-primary"
                              : client.status === "Pendiente"
                              ? "bg-accent/15 text-accent"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {client.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{client.startDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h2 className="font-semibold text-foreground">Acciones Rápidas</h2>
            <div className="space-y-3">
              {quickActions.map((action) => (
                action.label === "Revisar progreso" ? (
                  /* Revisar progreso: shows client list */
                  <div key={action.label} className="space-y-0">
                    <button
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted border border-transparent hover:border-primary/20 transition-all text-left group"
                      onClick={() => {}}
                    >
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                        <action.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{action.label}</p>
                        <p className="text-xs text-muted-foreground">{action.desc}</p>
                      </div>
                    </button>
                    {/* Inline client list for progress */}
                    <div className="ml-3 border-l-2 border-primary/20 pl-3 space-y-1 py-2">
                      {activeClients.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setProgressClient(c)}
                          className="w-full flex items-center justify-between py-1.5 px-2.5 rounded-md hover:bg-muted/70 transition-colors text-left group/client"
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                              {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </div>
                            <span className="text-sm text-foreground">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {c.services.includes("nutrition") && <Utensils className="h-3 w-3 text-muted-foreground" />}
                            {c.services.includes("training") && <Dumbbell className="h-3 w-3 text-muted-foreground" />}
                            <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover/client:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted border border-transparent hover:border-primary/20 transition-all text-left group"
                  >
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                      <action.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{action.label}</p>
                      <p className="text-xs text-muted-foreground">{action.desc}</p>
                    </div>
                  </button>
                )
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Dialog */}
      <ClientProgressDialog
        client={progressClient}
        open={!!progressClient}
        onClose={() => setProgressClient(null)}
      />
    </AdminLayout>
  );
};

export default AdminDashboard;
