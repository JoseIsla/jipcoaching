import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Dumbbell, ChevronDown, ChevronRight, Lock, Copy } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { TrainingBlock } from "@/data/useTrainingPlanStore";
import {
  useTrainingPlanStore,
  TRAINING_METHOD_LABELS,
  type TrainingPlanFull,
  type TrainingWeek,
  type TrainingDay,
  type TrainingExerciseEntry,
  type TrainingMethod,
  type IntensityMeasure,
} from "@/data/useTrainingPlanStore";
import { useExerciseLibraryStore } from "@/data/useExerciseLibraryStore";

// ==================== EXERCISE FORM ====================

const ExerciseForm = ({
  exercise,
  onChange,
  onRemove,
  section,
}: {
  exercise: TrainingExerciseEntry;
  onChange: (e: TrainingExerciseEntry) => void;
  onRemove: () => void;
  section: "basic" | "accessory";
}) => {
  const allExercises = useExerciseLibraryStore((s) => s.exercises);
  const libraryItems = allExercises
    .filter((e) =>
      section === "basic"
        ? e.category === "basico" || e.category === "variante"
        : e.category === "accesorio"
    )
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  const update = (patch: Partial<TrainingExerciseEntry>) => onChange({ ...exercise, ...patch });

  const isMethodBased = section === "basic" && exercise.method && ["load_drop", "top_set_backoffs"].includes(exercise.method);

  return (
    <div className="bg-background/50 border border-border/50 rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
          <Select
            value={exercise.exerciseId || ""}
            onValueChange={(v) => {
              const item = allExercises.find((e) => e.id === v);
              update({
                exerciseId: v,
                exerciseName: item?.name || "",
                exerciseType: item?.category === "basico" ? "Básico" : item?.category === "variante" ? "Variante" : item?.muscleGroup || "",
              });
            }}
          >
            <SelectTrigger className="bg-background border-border text-sm h-8">
              <SelectValue placeholder="Seleccionar ejercicio" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {libraryItems.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  <span className="flex items-center gap-2">
                    {e.name}
                    <span className="text-xs text-muted-foreground">({e.muscleGroup})</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive shrink-0" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* BASIC section: method-specific fields */}
      {section === "basic" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Método</Label>
            <Select value={exercise.method || ""} onValueChange={(v) => update({ method: v as TrainingMethod })}>
              <SelectTrigger className="bg-background border-border text-xs h-8"><SelectValue placeholder="Método" /></SelectTrigger>
              <SelectContent>
                {Object.entries(TRAINING_METHOD_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isMethodBased && (
            <>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Top Set Reps</Label>
                <Input type="number" className="h-8 text-xs bg-background border-border" value={exercise.topSetReps ?? ""} onChange={(e) => update({ topSetReps: Number(e.target.value) || undefined })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Top Set RPE</Label>
                <Input type="number" step={0.5} className="h-8 text-xs bg-background border-border" value={exercise.topSetRPE ?? ""} onChange={(e) => update({ topSetRPE: Number(e.target.value) || undefined })} />
              </div>
            </>
          )}

          {exercise.method === "load_drop" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">% Fatiga</Label>
                <Input type="number" step={0.5} className="h-8 text-xs bg-background border-border" value={exercise.fatiguePercent ?? ""} onChange={(e) => update({ fatiguePercent: Number(e.target.value) || undefined })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Series est.</Label>
                <Input className="h-8 text-xs bg-background border-border" placeholder="2-5" value={exercise.estimatedSeries ?? ""} onChange={(e) => update({ estimatedSeries: e.target.value })} />
              </div>
            </>
          )}

          {exercise.method === "top_set_backoffs" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Back-off sets</Label>
                <Input type="number" className="h-8 text-xs bg-background border-border" value={exercise.backoffSets ?? ""} onChange={(e) => update({ backoffSets: Number(e.target.value) || undefined })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">RPE Back-off</Label>
                <Input type="number" step={0.5} className="h-8 text-xs bg-background border-border" value={exercise.backoffPercent ?? ""} onChange={(e) => update({ backoffPercent: Number(e.target.value) || undefined })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Reps Back-off</Label>
                <Input className="h-8 text-xs bg-background border-border" placeholder="Ej: 2, 3-5" value={exercise.backoffReps ?? ""} onChange={(e) => update({ backoffReps: e.target.value })} />
              </div>
            </>
          )}

          {(exercise.method === "straight_sets" || exercise.method === "ramp" || exercise.method === "wave") && (
            <>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Series</Label>
                <Input className="h-8 text-xs bg-background border-border" placeholder="4" value={exercise.sets ?? ""} onChange={(e) => update({ sets: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Reps</Label>
                <Input className="h-8 text-xs bg-background border-border" placeholder="8-10" value={exercise.reps ?? ""} onChange={(e) => update({ reps: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">RPE</Label>
                <Input type="number" step={0.5} className="h-8 text-xs bg-background border-border" value={exercise.topSetRPE ?? ""} onChange={(e) => update({ topSetRPE: Number(e.target.value) || undefined })} />
              </div>
            </>
          )}

          {exercise.method === "custom" && (
            <>
              <div className="space-y-1 col-span-2">
                <Label className="text-xs text-muted-foreground">Nombre del método</Label>
                <Input className="h-8 text-xs bg-background border-border" value={exercise.customMethodName ?? ""} onChange={(e) => update({ customMethodName: e.target.value })} />
              </div>
              <div className="space-y-1 col-span-full">
                <Label className="text-xs text-muted-foreground">Descripción / instrucciones</Label>
                <Textarea className="text-xs bg-background border-border min-h-[50px]" value={exercise.customMethodDescription ?? ""} onChange={(e) => update({ customMethodDescription: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Series</Label>
                <Input className="h-8 text-xs bg-background border-border" placeholder="4" value={exercise.sets ?? ""} onChange={(e) => update({ sets: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Reps</Label>
                <Input className="h-8 text-xs bg-background border-border" placeholder="8-10" value={exercise.reps ?? ""} onChange={(e) => update({ reps: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">RPE</Label>
                <Input type="number" step={0.5} className="h-8 text-xs bg-background border-border" value={exercise.topSetRPE ?? ""} onChange={(e) => update({ topSetRPE: Number(e.target.value) || undefined })} />
              </div>
            </>
          )}
        </div>
      )}

      {/* ACCESSORY section */}
      {section === "accessory" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Series</Label>
            <Input className="h-8 text-xs bg-background border-border" placeholder="3-4" value={exercise.sets ?? ""} onChange={(e) => update({ sets: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Reps</Label>
            <Input className="h-8 text-xs bg-background border-border" placeholder="10-15" value={exercise.reps ?? ""} onChange={(e) => update({ reps: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Medición</Label>
            <Select value={exercise.intensityType ?? "RIR"} onValueChange={(v) => update({ intensityType: v as IntensityMeasure })}>
              <SelectTrigger className="bg-background border-border text-xs h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="RIR">RIR</SelectItem>
                <SelectItem value="RPE">RPE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{exercise.intensityType ?? "RIR"}</Label>
            <Input type="number" step={0.5} className="h-8 text-xs bg-background border-border" value={exercise.intensityValue ?? ""} onChange={(e) => update({ intensityValue: Number(e.target.value) || undefined })} />
          </div>
        </div>
      )}

      {/* Common fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {isMethodBased && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Regla back-off</Label>
            <Input className="h-8 text-xs bg-background border-border" placeholder="-7,5% y repetir hasta volver a @7" value={exercise.backoffRule ?? ""} onChange={(e) => update({ backoffRule: e.target.value })} />
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Carga planificada</Label>
          <Input className="h-8 text-xs bg-background border-border" placeholder="Autoreg." value={exercise.plannedLoad ?? ""} onChange={(e) => update({ plannedLoad: e.target.value })} />
        </div>
        <div className="space-y-1 col-span-full">
          <Label className="text-xs text-muted-foreground">Notas técnicas / cues</Label>
          <Input className="h-8 text-xs bg-background border-border" placeholder="Brace 360°, control lumbar..." value={exercise.technicalNotes ?? ""} onChange={(e) => update({ technicalNotes: e.target.value })} />
        </div>
      </div>
    </div>
  );
};

// ==================== DAY EDITOR ====================

const DayEditor = ({
  day,
  onChange,
  allDays,
}: {
  day: TrainingDay;
  onChange: (d: TrainingDay) => void;
  allDays: TrainingDay[];
}) => {
  const [open, setOpen] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);
  const basics = day.exercises.filter((e) => e.section === "basic");
  const accessories = day.exercises.filter((e) => e.section === "accessory");

  const updateExercise = (idx: number, updated: TrainingExerciseEntry) => {
    const newExercises = [...day.exercises];
    const realIdx = day.exercises.findIndex((e) => e.id === updated.id);
    if (realIdx >= 0) newExercises[realIdx] = updated;
    onChange({ ...day, exercises: newExercises });
  };

  const removeExercise = (id: string) => {
    onChange({ ...day, exercises: day.exercises.filter((e) => e.id !== id) });
  };

  const addExercise = (section: "basic" | "accessory") => {
    const newEx: TrainingExerciseEntry = {
      id: `te-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      order: day.exercises.length + 1,
      section,
      exerciseName: "",
      method: section === "basic" ? "load_drop" : undefined,
      intensityType: section === "accessory" ? "RIR" : undefined,
    };
    onChange({ ...day, exercises: [...day.exercises, newEx] });
  };

  const reorderExercises = (sectionExercises: TrainingExerciseEntry[], fromIdx: number, toIdx: number, section: "basic" | "accessory") => {
    const reordered = [...sectionExercises];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const otherSection = day.exercises.filter((e) => e.section !== section);
    const newExercises = section === "basic" ? [...reordered, ...otherSection] : [...otherSection, ...reordered];
    onChange({ ...day, exercises: newExercises });
  };

  const handleDragStart = (id: string) => setDragId(id);
  const handleDragEnd = () => setDragId(null);

  const handleDrop = (targetId: string, sectionExercises: TrainingExerciseEntry[], section: "basic" | "accessory") => {
    if (!dragId || dragId === targetId) return;
    const fromIdx = sectionExercises.findIndex((e) => e.id === dragId);
    const toIdx = sectionExercises.findIndex((e) => e.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    reorderExercises(sectionExercises, fromIdx, toIdx, section);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="bg-card border border-border rounded-xl overflow-hidden">
      <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3">
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <span className="font-semibold text-foreground">Día {day.dayNumber}</span>
          <span className="text-sm text-muted-foreground">— {day.name || "Sin nombre"}</span>
          <Badge variant="outline" className="text-xs">{basics.length} básicos · {accessories.length} accesorios</Badge>
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {allDays.filter((d) => d.id !== day.id && d.exercises.length > 0).length > 0 && (
            <Select
              value=""
              onValueChange={(sourceDayId) => {
                const sourceDay = allDays.find((d) => d.id === sourceDayId);
                if (!sourceDay) return;
                const clonedExercises = sourceDay.exercises.map((ex) => ({
                  ...ex,
                  id: `te-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                }));
                onChange({ ...day, exercises: [...day.exercises, ...clonedExercises] });
              }}
            >
              <SelectTrigger className="h-7 text-xs gap-1 w-auto border-border bg-background px-2">
                <Copy className="h-3 w-3" />
                <span>Copiar de...</span>
              </SelectTrigger>
              <SelectContent>
                {allDays
                  .filter((d) => d.id !== day.id && d.exercises.length > 0)
                  .map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      Día {d.dayNumber} — {d.name || "Sin nombre"} ({d.exercises.length} ej.)
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="p-4 pt-0 space-y-4">
          {/* Day name & warmup */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Nombre del día</Label>
              <Input className="h-8 text-sm bg-background border-border" value={day.name} onChange={(e) => onChange({ ...day, name: e.target.value })} placeholder="Ej: SSB + Banca" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Preparación / calentamiento</Label>
              <Input className="h-8 text-sm bg-background border-border" value={day.warmup || ""} onChange={(e) => onChange({ ...day, warmup: e.target.value })} placeholder="McGill Big 3 + movilidad..." />
            </div>
          </div>

          {/* BASICS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-primary flex items-center gap-1.5">
                <Dumbbell className="h-3.5 w-3.5" /> Básicos / Variantes
              </h4>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary" onClick={() => addExercise("basic")}>
                <Plus className="h-3 w-3" /> Añadir
              </Button>
            </div>
            {basics.length === 0 && <p className="text-xs text-muted-foreground italic">Sin ejercicios básicos</p>}
            {basics.map((ex, i) => (
              <div
                key={ex.id}
                draggable
                onDragStart={() => handleDragStart(ex.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(ex.id, basics, "basic")}
                className={`transition-opacity ${dragId === ex.id ? "opacity-40" : ""}`}
              >
                <ExerciseForm exercise={ex} section="basic" onChange={(u) => updateExercise(i, u)} onRemove={() => removeExercise(ex.id)} />
              </div>
            ))}
          </div>

          {/* ACCESSORIES */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                🎯 Accesorios
              </h4>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => addExercise("accessory")}>
                <Plus className="h-3 w-3" /> Añadir
              </Button>
            </div>
            {accessories.length === 0 && <p className="text-xs text-muted-foreground italic">Sin accesorios</p>}
            {accessories.map((ex, i) => (
              <div
                key={ex.id}
                draggable
                onDragStart={() => handleDragStart(ex.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(ex.id, accessories, "accessory")}
                className={`transition-opacity ${dragId === ex.id ? "opacity-40" : ""}`}
              >
                <ExerciseForm exercise={ex} section="accessory" onChange={(u) => updateExercise(i, u)} onRemove={() => removeExercise(ex.id)} />
              </div>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

// ==================== MAIN PAGE ====================

const AdminTrainingPlanDetail = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const getDetail = useTrainingPlanStore((s) => s.getDetail);
  const saveWeek = useTrainingPlanStore((s) => s.saveWeek);
  const addWeek = useTrainingPlanStore((s) => s.addWeek);
  
  const [plan, setPlan] = useState<TrainingPlanFull | null>(null);
  const [weekIdx, setWeekIdx] = useState(0);
  const [currentWeek, setCurrentWeek] = useState<TrainingWeek | null>(null);
  const [deleteTargetWeek, setDeleteTargetWeek] = useState<TrainingWeek | null>(null);

  const [saving, setSaving] = useState(false);
  const [deletingWeek, setDeletingWeek] = useState(false);

  useEffect(() => {
    if (!planId) return;
    const loadPlan = async () => {
      // Ensure exercise library is loaded before mapping plan exercises
      await useExerciseLibraryStore.getState().fetchExercises();
      const fetched = await useTrainingPlanStore.getState().fetchPlanDetail(planId);
      const detail = fetched || getDetail(planId);
      if (!detail) { navigate("/admin/training"); return; }
      setPlan(detail);
      const activeIdx = detail.weeks.findIndex((w) => w.status === "active");
      const idx = activeIdx >= 0 ? activeIdx : detail.weeks.length - 1;
      setWeekIdx(idx);
      setCurrentWeek(JSON.parse(JSON.stringify(detail.weeks[idx])));
    };
    loadPlan();
  }, [planId, navigate, getDetail]);

  if (!plan || !currentWeek) return null;

  const updateDay = (dayId: string, updated: TrainingDay) => {
    setCurrentWeek({
      ...currentWeek,
      days: currentWeek.days.map((d) => (d.id === dayId ? updated : d)),
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save each day's exercises via API
      for (const day of currentWeek.days) {
        const exercisesToSave = day.exercises.filter((e) => e.exerciseName?.trim());
        await api.put(`/training/days/${day.id}`, {
          title: day.name,
          warmup: day.warmup,
          exercises: exercisesToSave.map((e, i) => ({
            name: e.exerciseName,
            type: e.section === "basic" ? (e.exerciseType === "Variante" ? "VARIANT" : "BASIC") : "ACCESSORY",
            method: e.method?.toUpperCase() || "STRAIGHT_SETS",
            topSetReps: e.topSetReps,
            topSetRpe: e.topSetRPE,
            fatiguePct: e.fatiguePercent,
            setsMin: e.sets ? parseInt(String(e.sets).split("-")[0]) : undefined,
            setsMax: e.sets ? parseInt(String(e.sets).split("-").pop()!) : undefined,
            rirMin: e.intensityValue,
            notes: e.technicalNotes,
            order: e.order ?? i,
            backoffSets: e.backoffSets,
            backoffPercent: e.backoffPercent,
            backoffReps: e.backoffReps || undefined,
            technicalNotes: e.technicalNotes,
            reps: e.reps || undefined,
            plannedLoad: e.plannedLoad || undefined,
            estimatedSeries: e.estimatedSeries || undefined,
            backoffRule: e.backoffRule || undefined,
            customMethodName: e.customMethodName || undefined,
            customMethodDescription: e.customMethodDescription || undefined,
            intensityType: e.intensityType || undefined,
          })),
        });
      }
      // Save week metadata
      await api.put(`/training/weeks/${currentWeek.id}`, {
        block: currentWeek.block,
        status: currentWeek.status?.toUpperCase(),
        notes: currentWeek.generalNotes,
      });
      // Update local store
      saveWeek(plan.id, currentWeek);
      toast({ title: "Semana guardada", description: `Semana ${currentWeek.weekNumber} guardada correctamente.` });
      navigate("/admin/training");
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Error al guardar la semana", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAddWeek = async (block: TrainingBlock) => {
    try {
      const result = await api.post<any>(`/training/plans/${plan.id}/weeks`, { block });
      if (result) {
        const updatedDetail = await useTrainingPlanStore.getState().fetchPlanDetail(plan.id);
        if (updatedDetail) {
          setPlan({ ...updatedDetail });
          const newIdx = updatedDetail.weeks.length - 1;
          setWeekIdx(newIdx);
          setCurrentWeek(JSON.parse(JSON.stringify(updatedDetail.weeks[newIdx])));
        }
        toast({ title: "Semana añadida", description: `Semana (${block}) creada.` });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Error al crear semana", variant: "destructive" });
    }
  };

  const handleDuplicateWeek = async (sourceWeekIdx: number, block: TrainingBlock) => {
    try {
      const sourceWeek = plan.weeks[sourceWeekIdx];
      if (!sourceWeek) return;

      // 1. Create the new empty week
      const result = await api.post<any>(`/training/plans/${plan.id}/weeks`, { block });
      if (!result) return;

      // 2. Refetch to get the new week with its days
      let updatedDetail = await useTrainingPlanStore.getState().fetchPlanDetail(plan.id);
      if (!updatedDetail) return;

      const newWeek = updatedDetail.weeks[updatedDetail.weeks.length - 1];

      // 3. Copy exercises from source days to new days (matched by dayNumber)
      for (const newDay of newWeek.days) {
        const sourceDay = sourceWeek.days.find((d) => d.dayNumber === newDay.dayNumber);
        if (!sourceDay || sourceDay.exercises.length === 0) continue;

        const exercisesToCopy = sourceDay.exercises.filter((e) => e.exerciseName?.trim());
        await api.put(`/training/days/${newDay.id}`, {
          title: sourceDay.name,
          warmup: sourceDay.warmup,
          exercises: exercisesToCopy.map((e, i) => ({
            name: e.exerciseName,
            type: e.section === "basic" ? (e.exerciseType === "Variante" ? "VARIANT" : "BASIC") : "ACCESSORY",
            method: e.method?.toUpperCase() || "STRAIGHT_SETS",
            topSetReps: e.topSetReps,
            topSetRpe: e.topSetRPE,
            fatiguePct: e.fatiguePercent,
            setsMin: e.sets ? parseInt(String(e.sets).split("-")[0]) : undefined,
            setsMax: e.sets ? parseInt(String(e.sets).split("-").pop()!) : undefined,
            rirMin: e.intensityValue,
            notes: e.technicalNotes,
            order: e.order ?? i,
            backoffSets: e.backoffSets,
            backoffPercent: e.backoffPercent,
            backoffReps: e.backoffReps || undefined,
            technicalNotes: e.technicalNotes,
            reps: e.reps || undefined,
            plannedLoad: e.plannedLoad || undefined,
            estimatedSeries: e.estimatedSeries || undefined,
            backoffRule: e.backoffRule || undefined,
            customMethodName: e.customMethodName || undefined,
            customMethodDescription: e.customMethodDescription || undefined,
            intensityType: e.intensityType || undefined,
          })),
        });
      }

      // 4. Refetch again to get the populated week
      updatedDetail = await useTrainingPlanStore.getState().fetchPlanDetail(plan.id);
      if (updatedDetail) {
        setPlan({ ...updatedDetail });
        const newIdx = updatedDetail.weeks.length - 1;
        setWeekIdx(newIdx);
        setCurrentWeek(JSON.parse(JSON.stringify(updatedDetail.weeks[newIdx])));
      }

      toast({ title: "Semana duplicada", description: `Semana ${sourceWeek.weekNumber} duplicada como nueva semana (${block}).` });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Error al duplicar semana", variant: "destructive" });
    }
  };

  const handleDeleteWeek = async () => {
    if (!plan || !deleteTargetWeek || plan.weeks.length <= 1) return;

    setDeletingWeek(true);
    try {
      await api.delete(`/training/weeks/${deleteTargetWeek.id}`);
      const updatedDetail = await useTrainingPlanStore.getState().fetchPlanDetail(plan.id);
      if (!updatedDetail || updatedDetail.weeks.length === 0) {
        navigate("/admin/training");
        return;
      }

      setPlan({ ...updatedDetail });

      const nextIdx = Math.min(
        updatedDetail.weeks.length - 1,
        plan.weeks.findIndex((week) => week.id === deleteTargetWeek.id)
      );
      const safeIdx = nextIdx >= 0 ? nextIdx : 0;

      setWeekIdx(safeIdx);
      setCurrentWeek(JSON.parse(JSON.stringify(updatedDetail.weeks[safeIdx])));
      setDeleteTargetWeek(null);

      toast({
        title: "Semana eliminada",
        description: `La semana ${deleteTargetWeek.weekNumber} se eliminó correctamente.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Error al eliminar la semana",
        variant: "destructive",
      });
    } finally {
      setDeletingWeek(false);
    }
  };

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
              <p className="text-sm text-muted-foreground">{plan.clientName} · {plan.modality} · {plan.block}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{plan.blockVariants || "Sin variantes definidas"}</Badge>
            <Button
              variant="outline"
              className="gap-2"
              disabled={plan.weeks.length <= 1 || deletingWeek}
              onClick={() => setDeleteTargetWeek(currentWeek)}
            >
              <Trash2 className="h-4 w-4" /> Eliminar semana
            </Button>
            <Button onClick={handleSave} className="glow-primary-sm gap-2" disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? "Guardando..." : "Guardar semana"}
            </Button>
          </div>
        </div>

        {/* Week selector grouped by block */}
        <div className="space-y-3">
          {(() => {
            const blockGroups: Record<string, { weeks: TrainingWeek[]; indices: number[] }> = {};
            plan.weeks.forEach((w, i) => {
              const b = w.block || plan.block;
              if (!blockGroups[b]) blockGroups[b] = { weeks: [], indices: [] };
              blockGroups[b].weeks.push(w);
              blockGroups[b].indices.push(i);
            });
            return Object.entries(blockGroups).map(([block, group]) => (
              <div key={block} className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{block}</p>
                <div className="flex gap-2 flex-wrap">
                  {group.weeks.map((w, gi) => {
                    const realIdx = group.indices[gi];
                    const isCompleted = w.status === "completed";
                    return (
                      <div key={w.id} className="flex items-center gap-1.5">
                        <Button
                          variant={realIdx === weekIdx ? "default" : "outline"}
                          size="sm"
                          className={`text-xs shrink-0 gap-1 ${isCompleted && realIdx !== weekIdx ? "opacity-50" : ""}`}
                          onClick={() => {
                            if (isCompleted) return;
                            setWeekIdx(realIdx);
                            setCurrentWeek(JSON.parse(JSON.stringify(plan.weeks[realIdx])));
                          }}
                          disabled={isCompleted}
                        >
                          {isCompleted && <Lock className="h-3 w-3" />}
                          Sem {w.weekNumber}
                          {w.status === "active" && " ●"}
                          {w.status === "completed" && " ✓"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          disabled={plan.weeks.length <= 1 || deletingWeek}
                          onClick={() => setDeleteTargetWeek(w)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ));
          })()}

          {/* Add new week */}
          <AddWeekDialog onAdd={handleAddWeek} onDuplicate={handleDuplicateWeek} weeks={plan.weeks} />
        </div>

        {/* Week notes */}
        <div className="space-y-1">
          <Label className="text-sm text-muted-foreground">Notas generales de la semana</Label>
          <Textarea
            className="bg-card border-border min-h-[50px]"
            placeholder="Objetivo de la semana, reglas generales..."
            value={currentWeek.generalNotes || ""}
            onChange={(e) => setCurrentWeek({ ...currentWeek, generalNotes: e.target.value })}
          />
        </div>

        {/* Days */}
        <div className="space-y-4">
          {currentWeek.days.map((day) => (
            <DayEditor key={day.id} day={day} onChange={(d) => updateDay(day.id, d)} allDays={currentWeek.days} />
          ))}
        </div>

        {/* Bottom save */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="glow-primary-sm gap-2" disabled={saving}>
            <Save className="h-4 w-4" /> {saving ? "Guardando..." : "Guardar semana"}
          </Button>
        </div>

        <AlertDialog open={!!deleteTargetWeek} onOpenChange={(open) => { if (!open) setDeleteTargetWeek(null); }}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar semana?</AlertDialogTitle>
              <AlertDialogDescription>
                {plan.weeks.length <= 1
                  ? "El plan debe mantener al menos una semana."
                  : `Se eliminará la semana ${deleteTargetWeek?.weekNumber} y se reordenarán las semanas restantes.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletingWeek}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteWeek}
                disabled={plan.weeks.length <= 1 || deletingWeek}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletingWeek ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

// ==================== ADD WEEK DIALOG ====================

const BLOCKS: TrainingBlock[] = ["Hipertrofia", "Intensificación", "Peaking", "Tapering"];

const AddWeekDialog = ({ onAdd, onDuplicate, weeks }: { onAdd: (block: TrainingBlock) => void; onDuplicate: (sourceWeekIdx: number, block: TrainingBlock) => void; weeks: TrainingWeek[] }) => {
  const [open, setOpen] = useState(false);
  const [block, setBlock] = useState<TrainingBlock>("Hipertrofia");
  const [mode, setMode] = useState<"empty" | "duplicate">("empty");
  const [sourceWeekIdx, setSourceWeekIdx] = useState(0);

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) { setMode("empty"); setSourceWeekIdx(0); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Añadir semana
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva semana</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* Mode selection */}
          <div className="flex gap-2">
            <Button variant={mode === "empty" ? "default" : "outline"} size="sm" className="flex-1 text-xs" onClick={() => setMode("empty")}>
              <Plus className="h-3 w-3 mr-1" /> Vacía
            </Button>
            <Button variant={mode === "duplicate" ? "default" : "outline"} size="sm" className="flex-1 text-xs" onClick={() => setMode("duplicate")}>
              <Copy className="h-3 w-3 mr-1" /> Duplicar semana
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Bloque de entrenamiento</Label>
            <Select value={block} onValueChange={(v) => setBlock(v as TrainingBlock)}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLOCKS.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mode === "duplicate" && weeks.length > 0 && (
            <div className="space-y-2">
              <Label>Copiar ejercicios de</Label>
              <Select value={String(sourceWeekIdx)} onValueChange={(v) => setSourceWeekIdx(Number(v))}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weeks.map((w, i) => (
                    <SelectItem key={w.id} value={String(i)}>
                      Semana {w.weekNumber} — {w.block || "Sin bloque"} ({w.days.reduce((s, d) => s + d.exercises.length, 0)} ej.)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Se copiarán todos los días y ejercicios de la semana seleccionada.
              </p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            La semana anterior se marcará como completada automáticamente.
          </p>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => {
              if (mode === "duplicate") {
                onDuplicate(sourceWeekIdx, block);
              } else {
                onAdd(block);
              }
              setOpen(false);
            }}>
              {mode === "duplicate" ? "Duplicar y crear" : "Crear semana"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminTrainingPlanDetail;
