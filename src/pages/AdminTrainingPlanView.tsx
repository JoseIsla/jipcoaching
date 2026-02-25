import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Dumbbell, Calendar, User, Info } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getTrainingPlanDetail,
  TRAINING_METHOD_LABELS,
  type TrainingPlanFull,
  type TrainingWeek,
  type TrainingExerciseEntry,
} from "@/data/trainingPlanStore";

const ExerciseRow = ({ ex, section }: { ex: TrainingExerciseEntry; section: "basic" | "accessory" }) => (
  <div className="bg-background/40 border border-border/40 rounded-lg p-3 space-y-1">
    <div className="flex items-center justify-between">
      <span className="font-medium text-sm text-foreground">{ex.exerciseName || "Sin ejercicio"}</span>
      {ex.exerciseType && <Badge variant="outline" className="text-xs">{ex.exerciseType}</Badge>}
    </div>
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {section === "basic" && ex.method && (
        <span><strong>Método:</strong> {TRAINING_METHOD_LABELS[ex.method] || ex.method}</span>
      )}
      {ex.topSetReps != null && <span><strong>Top Set:</strong> {ex.topSetReps} reps @{ex.topSetRPE}</span>}
      {ex.fatiguePercent != null && <span><strong>% Fatiga:</strong> {ex.fatiguePercent}%</span>}
      {ex.estimatedSeries && <span><strong>Series est.:</strong> {ex.estimatedSeries}</span>}
      {ex.backoffSets != null && <span><strong>Back-off:</strong> {ex.backoffSets} sets @{ex.backoffPercent}%</span>}
      {ex.sets && <span><strong>Series:</strong> {ex.sets}</span>}
      {ex.reps && <span><strong>Reps:</strong> {ex.reps}</span>}
      {ex.intensityType && ex.intensityValue != null && (
        <span><strong>{ex.intensityType}:</strong> {ex.intensityValue}</span>
      )}
      {ex.plannedLoad && <span><strong>Carga:</strong> {ex.plannedLoad}</span>}
      {ex.backoffRule && <span><strong>Regla:</strong> {ex.backoffRule}</span>}
      {ex.customMethodName && <span><strong>Método:</strong> {ex.customMethodName}</span>}
    </div>
    {ex.technicalNotes && (
      <p className="text-xs text-primary/80 italic mt-1">📝 {ex.technicalNotes}</p>
    )}
    {ex.customMethodDescription && (
      <p className="text-xs text-muted-foreground italic">{ex.customMethodDescription}</p>
    )}
  </div>
);

const WeekView = ({ week }: { week: TrainingWeek }) => (
  <div className="space-y-4">
    {week.generalNotes && (
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex gap-2 items-start">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-foreground">{week.generalNotes}</p>
      </div>
    )}
    {week.days.map((day) => {
      const basics = day.exercises.filter((e) => e.section === "basic");
      const accessories = day.exercises.filter((e) => e.section === "accessory");
      return (
        <div key={day.id} className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <h3 className="font-semibold text-foreground">Día {day.dayNumber} — {day.name}</h3>
            {day.warmup && <p className="text-xs text-muted-foreground mt-1">🔥 {day.warmup}</p>}
          </div>
          <div className="p-4 space-y-4">
            {basics.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary flex items-center gap-1.5">
                  <Dumbbell className="h-3.5 w-3.5" /> Básicos / Variantes
                </h4>
                {basics.map((ex) => <ExerciseRow key={ex.id} ex={ex} section="basic" />)}
              </div>
            )}
            {accessories.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">🎯 Accesorios</h4>
                {accessories.map((ex) => <ExerciseRow key={ex.id} ex={ex} section="accessory" />)}
              </div>
            )}
            {day.exercises.length === 0 && (
              <p className="text-sm text-muted-foreground italic text-center py-4">Sin ejercicios programados</p>
            )}
          </div>
        </div>
      );
    })}
  </div>
);

const AdminTrainingPlanView = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<TrainingPlanFull | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(0);

  useEffect(() => {
    if (!planId) return;
    const detail = getTrainingPlanDetail(planId);
    if (!detail) { navigate("/admin/training"); return; }
    setPlan(detail);
    const activeIdx = detail.weeks.findIndex((w) => w.status === "active");
    setSelectedWeek(activeIdx >= 0 ? activeIdx : detail.weeks.length - 1);
  }, [planId, navigate]);

  if (!plan) return null;

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/training")} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">{plan.planName}</h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5" /> {plan.clientName}
                <span>·</span>
                <span>{plan.modality}</span>
                <span>·</span>
                <Badge variant="outline" className="text-xs">{plan.block}</Badge>
                <span>·</span>
                <Calendar className="h-3.5 w-3.5" /> {plan.startDate}
              </div>
            </div>
          </div>
          <Button onClick={() => navigate(`/admin/training/${plan.id}/edit`)} className="gap-2">
            <Pencil className="h-4 w-4" /> Editar
          </Button>
        </div>

        {/* Plan info */}
        {plan.blockVariants && (
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground"><strong>Variantes del bloque:</strong> {plan.blockVariants}</p>
          </div>
        )}

        {/* Week tabs grouped by block */}
        {plan.weeks.length > 0 && (() => {
          const blockGroups: Record<string, { weeks: typeof plan.weeks; indices: number[] }> = {};
          plan.weeks.forEach((w, i) => {
            const b = w.block || plan.block;
            if (!blockGroups[b]) blockGroups[b] = { weeks: [], indices: [] };
            blockGroups[b].weeks.push(w);
            blockGroups[b].indices.push(i);
          });
          return (
            <div className="space-y-3">
              {Object.entries(blockGroups).map(([block, group]) => (
                <div key={block} className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{block}</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {group.weeks.map((w, gi) => (
                      <Button key={w.id} variant={group.indices[gi] === selectedWeek ? "default" : "outline"} size="sm" className="text-xs shrink-0" onClick={() => setSelectedWeek(group.indices[gi])}>
                        Sem {w.weekNumber}
                        {w.status === "active" && " ●"}
                        {w.status === "completed" && " ✓"}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Week content */}
        <WeekView week={plan.weeks[selectedWeek]} />
      </div>
    </AdminLayout>
  );
};

export default AdminTrainingPlanView;
