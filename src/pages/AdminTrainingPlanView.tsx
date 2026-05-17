import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Dumbbell, Calendar, User, Info, Footprints, Activity, Trophy } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useTrainingPlanStore,
  TRAINING_METHOD_LABELS,
  type TrainingPlanFull,
  type TrainingWeek,
  type TrainingExerciseEntry,
} from "@/data/useTrainingPlanStore";

const ExerciseRow = ({ ex, section }: { ex: TrainingExerciseEntry; section: "basic" | "accessory" }) => (
  <div className="bg-background/40 border border-border/40 rounded-lg p-3 space-y-1">
    <div className="flex items-center justify-between">
      <span className="font-medium text-sm text-foreground">{ex.exerciseName || "Sin ejercicio"}</span>
      {ex.exerciseType && <Badge variant="outline" className="text-xs">{ex.exerciseType}</Badge>}
    </div>
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {section === "basic" && ex.method && (
        <span><strong>Método:</strong> {ex.method === "custom" && ex.customMethodName ? ex.customMethodName : (TRAINING_METHOD_LABELS[ex.method] || ex.method)}</span>
      )}
      {ex.topSetReps != null && <span><strong>Top Set:</strong> {ex.topSetReps} reps{ex.topSetRPE != null ? ` @RPE ${ex.topSetRPE}` : ""}</span>}
      {ex.fatiguePercent != null && <span><strong>% Fatiga:</strong> {ex.fatiguePercent}%</span>}
      {ex.estimatedSeries && <span><strong>Series est.:</strong> {ex.estimatedSeries}</span>}
      {ex.backoffSets != null && <span><strong>Back-off:</strong> {ex.backoffSets} sets{ex.backoffReps ? ` × ${ex.backoffReps} reps` : ""}{ex.backoffPercent != null ? ` @RPE ${ex.backoffPercent}` : ""}</span>}
      {ex.sets && <span><strong>Series:</strong> {ex.sets}</span>}
      {ex.reps && <span><strong>Reps:</strong> {ex.reps}</span>}
      {/* RPE for methods without topSetReps (straight_sets, ramp, wave, custom) */}
      {!ex.topSetReps && ex.topSetRPE != null && <span><strong>RPE:</strong> {ex.topSetRPE}</span>}
      {ex.intensityType && ex.intensityValue != null && (
        <span><strong>{ex.intensityType}:</strong> {ex.intensityValue}</span>
      )}
      {ex.plannedLoad && <span><strong>Carga:</strong> {ex.plannedLoad}</span>}
      {ex.backoffRule && <span><strong>Regla:</strong> {ex.backoffRule}</span>}
    </div>
    {ex.technicalNotes && (
      <p className="text-xs text-primary/80 italic mt-1">📝 {ex.technicalNotes}</p>
    )}
    {ex.customMethodDescription && (
      <p className="text-xs text-muted-foreground italic">{ex.customMethodDescription}</p>
    )}
  </div>
);

const OppositionRow = ({
  ex,
  kind,
}: {
  ex: TrainingExerciseEntry;
  kind: "running" | "running_technique" | "official_test";
}) => (
  <div className="bg-background/40 border border-border/40 rounded-lg p-3 space-y-1">
    <p className="text-sm font-medium text-foreground">{ex.exerciseName || "—"}</p>
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {kind === "running" && (
        <>
          {ex.plannedDistanceM != null && <span><strong>Distancia:</strong> {ex.plannedDistanceM} m</span>}
          {ex.plannedDurationSec != null && <span><strong>Tiempo:</strong> {ex.plannedDurationSec}s</span>}
          {ex.plannedPace && <span><strong>Ritmo:</strong> {ex.plannedPace}</span>}
          {ex.plannedHeartRate != null && <span><strong>FC:</strong> {ex.plannedHeartRate} bpm</span>}
        </>
      )}
      {kind === "running_technique" && (
        <>
          {ex.sets && <span><strong>Series:</strong> {ex.sets}</span>}
          {ex.reps && <span><strong>Reps:</strong> {ex.reps}</span>}
          {ex.plannedLoad && <span><strong>Descanso:</strong> {ex.plannedLoad}</span>}
        </>
      )}
      {kind === "official_test" && (
        <>
          {ex.plannedMarkValue != null && (
            <span><strong>Objetivo:</strong> {ex.plannedMarkValue} {ex.plannedMarkUnit || ""}</span>
          )}
        </>
      )}
    </div>
    {ex.technicalNotes && (
      <p className="text-xs text-primary/80 italic mt-1">📝 {ex.technicalNotes}</p>
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
      const ordered = [...day.exercises].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      return (
        <div key={day.id} className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <h3 className="font-semibold text-foreground">Día {day.dayNumber} — {day.name}</h3>
            {day.warmup && <p className="text-xs text-muted-foreground mt-1">🔥 {day.warmup}</p>}
          </div>
          <div className="p-4 space-y-3">
            {ordered.map((ex, i) => {
              const meta =
                ex.section === "basic"
                  ? { label: "Básico / Variante", cls: "text-primary", Icon: Dumbbell }
                  : ex.section === "accessory"
                  ? { label: "Accesorio", cls: "text-muted-foreground", Icon: Dumbbell }
                  : ex.section === "running"
                  ? { label: "Carrera", cls: "text-sky-400", Icon: Footprints }
                  : ex.section === "running_technique"
                  ? { label: "Técnica de carrera", cls: "text-violet-400", Icon: Activity }
                  : { label: "Prueba oficial", cls: "text-amber-400", Icon: Trophy };
              const Icon = meta.Icon;
              const isOpp =
                ex.section === "running" ||
                ex.section === "running_technique" ||
                ex.section === "official_test";
              return (
                <div key={ex.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground/60 font-mono">#{i + 1}</span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${meta.cls}`}>
                      <Icon className="h-3 w-3" /> {meta.label}
                    </span>
                  </div>
                  {isOpp ? (
                    <OppositionRow ex={ex} kind={ex.section as "running" | "running_technique" | "official_test"} />
                  ) : (
                    <ExerciseRow ex={ex} section={ex.section as "basic" | "accessory"} />
                  )}
                </div>
              );
            })}
            {ordered.length === 0 && (
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
  const getDetail = useTrainingPlanStore((s) => s.getDetail);
  const fetchPlanDetail = useTrainingPlanStore((s) => s.fetchPlanDetail);
  const [loading, setLoading] = useState(false);
  const plan = planId ? getDetail(planId) : null;

  // Fetch full plan detail from API on mount
  useEffect(() => {
    if (!planId) return;
    const detail = useTrainingPlanStore.getState().details[planId];
    // If detail has no real data (empty weeks or no exercises), fetch from API
    const hasRealData = detail?.weeks?.some((w) => w.days?.some((d) => d.exercises?.length > 0));
    if (!hasRealData) {
      setLoading(true);
      fetchPlanDetail(planId).finally(() => setLoading(false));
    }
  }, [planId, fetchPlanDetail]);

  const [selectedWeek, setSelectedWeek] = useState(() => {
    if (!plan) return 0;
    const activeIdx = plan.weeks.findIndex((w) => w.status === "active");
    return activeIdx >= 0 ? activeIdx : plan.weeks.length - 1;
  });

  if (!plan || loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <p className="text-muted-foreground">{loading ? "Cargando plan…" : "Plan no encontrado"}</p>
          {!loading && <Button variant="outline" onClick={() => navigate("/admin/training")}>Volver</Button>}
        </div>
      </AdminLayout>
    );
  }

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
