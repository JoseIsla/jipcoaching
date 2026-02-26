import { useState, useEffect } from "react";
import ClientLayout from "@/components/client/ClientLayout";
import { useClient } from "@/contexts/ClientContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Dumbbell, Lock, Calendar } from "lucide-react";
import AnimatedChevron from "@/components/ui/animated-chevron";
import AnimatedCollapsibleContent from "@/components/ui/animated-collapsible-content";
import {
  useTrainingPlanStore,
  TRAINING_METHOD_LABELS,
  type TrainingPlanFull,
  type TrainingWeek,
  type TrainingDay,
} from "@/data/useTrainingPlanStore";

const DayView = ({ day }: { day: TrainingDay }) => {
  const [open, setOpen] = useState(false);
  const basics = day.exercises.filter((e) => e.section === "basic");
  const accessories = day.exercises.filter((e) => e.section === "accessory");

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <CollapsibleTrigger className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-2">
            <AnimatedChevron open={open} />
            <span className="font-semibold text-sm text-foreground">Día {day.dayNumber}</span>
            <span className="text-xs text-muted-foreground">— {day.name}</span>
          </div>
          <Badge variant="outline" className="text-[10px]">{day.exercises.length} ej.</Badge>
        </CollapsibleTrigger>
        <AnimatedCollapsibleContent open={open}>
          <div className="p-3 pt-0 space-y-3">
            {day.warmup && (
              <div className="bg-muted/30 rounded-lg p-2">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-0.5">Calentamiento</p>
                <p className="text-xs text-foreground">{day.warmup}</p>
              </div>
            )}

            {basics.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-primary flex items-center gap-1">
                  <Dumbbell className="h-3 w-3" /> Básicos / Variantes
                </p>
                {basics.map((ex) => (
                  <div key={ex.id} className="bg-background/50 border border-border/40 rounded-lg p-3 space-y-1">
                    <p className="text-sm font-medium text-foreground">{ex.exerciseName || "—"}</p>
                    {ex.method && (
                      <Badge variant="outline" className="text-[10px]">
                        {TRAINING_METHOD_LABELS[ex.method] || ex.method}
                      </Badge>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {ex.topSetReps && <span>Top: {ex.topSetReps} reps</span>}
                      {ex.topSetRPE && <span>@{ex.topSetRPE}</span>}
                      {ex.sets && <span>{ex.sets} series</span>}
                      {ex.reps && <span>× {ex.reps}</span>}
                      {ex.plannedLoad && <span>Carga: {ex.plannedLoad}</span>}
                    </div>
                    {ex.technicalNotes && (
                      <p className="text-[11px] text-muted-foreground italic mt-1">💡 {ex.technicalNotes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {accessories.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  🎯 Accesorios
                </p>
                {accessories.map((ex) => (
                  <div key={ex.id} className="bg-background/50 border border-border/40 rounded-lg p-3 space-y-1">
                    <p className="text-sm font-medium text-foreground">{ex.exerciseName || "—"}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {ex.sets && <span>{ex.sets} series</span>}
                      {ex.reps && <span>× {ex.reps}</span>}
                      {ex.intensityType && ex.intensityValue != null && (
                        <span>{ex.intensityType} {ex.intensityValue}</span>
                      )}
                    </div>
                    {ex.technicalNotes && (
                      <p className="text-[11px] text-muted-foreground italic">💡 {ex.technicalNotes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {day.exercises.length === 0 && (
              <p className="text-xs text-muted-foreground italic text-center py-4">Sin ejercicios programados</p>
            )}
          </div>
        </AnimatedCollapsibleContent>
      </div>
    </Collapsible>
  );
};

const ClientTraining = () => {
  const { client } = useClient();
  const plans = useTrainingPlanStore((s) => s.plans);
  const getDetail = useTrainingPlanStore((s) => s.getDetail);
  const details = useTrainingPlanStore((s) => s.details);
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0);

  const activePlan = plans.find((p) => p.clientId === client.id && p.active);
  const plan = activePlan ? (details[activePlan.id] || getDetail(activePlan.id)) : null;

  useEffect(() => {
    if (plan) {
      const activeIdx = plan.weeks.findIndex((w) => w.status === "active");
      setSelectedWeekIdx(activeIdx >= 0 ? activeIdx : plan.weeks.length - 1);
    }
  }, [plan?.id]);

  if (!activePlan || !plan) {
    return (
      <ClientLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold text-foreground">Sin plan activo</h2>
          <p className="text-sm text-muted-foreground mt-1">Tu coach aún no te ha asignado un plan de entrenamiento.</p>
        </div>
      </ClientLayout>
    );
  }

  const currentWeek = plan.weeks[selectedWeekIdx];

  // Group weeks by block
  const blockGroups: Record<string, { weeks: TrainingWeek[]; indices: number[] }> = {};
  plan.weeks.forEach((w, i) => {
    const b = w.block || plan.block;
    if (!blockGroups[b]) blockGroups[b] = { weeks: [], indices: [] };
    blockGroups[b].weeks.push(w);
    blockGroups[b].indices.push(i);
  });

  return (
    <ClientLayout>
      <div className="space-y-5 max-w-lg mx-auto animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-accent" />
            {plan.planName}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {plan.modality} · {plan.block}
          </p>
        </div>

        {/* Week selector */}
        <div className="space-y-2">
          {Object.entries(blockGroups).map(([block, group]) => (
            <div key={block} className="space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{block}</p>
              <div className="flex gap-1.5 flex-wrap">
                {group.weeks.map((w, gi) => {
                  const realIdx = group.indices[gi];
                  const isActive = w.status === "active";
                  const isCompleted = w.status === "completed";
                  const isSelected = realIdx === selectedWeekIdx;
                  return (
                    <Button
                      key={w.id}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={`text-xs gap-1 h-8 ${isCompleted && !isSelected ? "opacity-50" : ""}`}
                      onClick={() => setSelectedWeekIdx(realIdx)}
                    >
                      {isCompleted && <Lock className="h-3 w-3" />}
                      S{w.weekNumber}
                      {isActive && " ●"}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Week info */}
        {currentWeek && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">
                Semana {currentWeek.weekNumber}
              </span>
              <Badge variant={currentWeek.status === "active" ? "default" : "outline"} className="text-[10px]">
                {currentWeek.status === "active" ? "Actual" : currentWeek.status === "completed" ? "Completada" : "Borrador"}
              </Badge>
            </div>

            {currentWeek.generalNotes && (
              <div className="bg-muted/30 border border-border/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">{currentWeek.generalNotes}</p>
              </div>
            )}

            {/* Days */}
            <div className="space-y-2">
              {currentWeek.days.map((day) => (
                <DayView key={day.id} day={day} />
              ))}
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  );
};

export default ClientTraining;
