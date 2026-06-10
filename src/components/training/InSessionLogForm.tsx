import { useEffect, useState } from "react";
import { Save, ChevronDown, ChevronUp } from "lucide-react";
import { useTrainingPlanStore, type SessionLog } from "@/data/useTrainingPlanStore";
import { toast } from "@/hooks/use-toast";
import { parseDecimal } from "@/utils/parseDecimal";

interface Props {
  planId: string;
  prescriptionId: string;
  exerciseName: string;
  section: string;
}

/** Inline form that lets the athlete register today's load directly on the plan exercise. */
const InSessionLogForm = ({ planId, prescriptionId, exerciseName, section }: Props) => {
  const log = useTrainingPlanStore((s) => s.sessionLogsByPlan[planId]?.[prescriptionId]);
  const upsert = useTrainingPlanStore((s) => s.upsertSessionLog);

  const isOpposition = section === "running" || section === "running_technique" || section === "official_test";

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"single" | "per_set">((log?.weightMode as any) || "single");
  const [weight, setWeight] = useState<string>(log?.actualWeight != null ? String(log.actualWeight) : "");
  const [perSet, setPerSet] = useState<string>(log?.perSetWeights || "");
  const [reps, setReps] = useState<string>(log?.actualReps || "");
  const [rpe, setRpe] = useState<string>(log?.actualRPE != null ? String(log.actualRPE) : "");
  const [mark, setMark] = useState<string>(log?.actualMarkValue != null ? String(log.actualMarkValue) : "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMode((log?.weightMode as any) || "single");
    setWeight(log?.actualWeight != null ? String(log.actualWeight) : "");
    setPerSet(log?.perSetWeights || "");
    setReps(log?.actualReps || "");
    setRpe(log?.actualRPE != null ? String(log.actualRPE) : "");
    setMark(log?.actualMarkValue != null ? String(log.actualMarkValue) : "");
  }, [log?.id]);

  const save = async () => {
    setSaving(true);
    const payload: Partial<SessionLog> = {
      weightMode: mode,
      actualWeight: mode === "single" ? (weight ? parseDecimal(weight, 0) : null) : null,
      perSetWeights: mode === "per_set" ? (perSet || null) : null,
      actualReps: reps || null,
      actualRPE: rpe ? parseDecimal(rpe, 0) : null,
      actualMarkValue: mark ? parseDecimal(mark, 0) : null,
    };
    const res = await upsert(planId, prescriptionId, payload);
    setSaving(false);
    if (res) {
      toast({ title: "Carga registrada", description: exerciseName, duration: 1800 });
    } else {
      toast({ title: "Error al guardar", variant: "destructive" });
    }
  };

  const summary = (() => {
    if (isOpposition && log?.actualMarkValue != null) return `${log.actualMarkValue}${log.actualMarkUnit || ""}`;
    if (log?.weightMode === "per_set" && log?.perSetWeights) return `${log.perSetWeights}kg`;
    if (log?.actualWeight != null) return `${log.actualWeight}kg${log.actualReps ? ` ×${log.actualReps}` : ""}`;
    return null;
  })();

  return (
    <div className="mt-1.5 border border-border/40 rounded-md bg-background/30">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] text-muted-foreground hover:bg-muted/20"
      >
        <span className="flex items-center gap-1.5">
          <span className="font-semibold uppercase tracking-wider">Registrar carga</span>
          {summary && (
            <span className="text-foreground/90 normal-case font-medium">· {summary}</span>
          )}
        </span>
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {open && (
        <div className="px-2 pb-2 pt-1 space-y-1.5">
          {!isOpposition && (
            <>
              <div className="inline-flex rounded-md overflow-hidden text-[10px]">
                <button
                  type="button"
                  onClick={() => setMode("single")}
                  className={`px-2 py-0.5 border ${mode === "single" ? "bg-primary/20 border-primary/40 text-primary" : "bg-background border-border text-muted-foreground"}`}
                >Mismo</button>
                <button
                  type="button"
                  onClick={() => setMode("per_set")}
                  className={`px-2 py-0.5 border -ml-px ${mode === "per_set" ? "bg-primary/20 border-primary/40 text-primary" : "bg-background border-border text-muted-foreground"}`}
                >Por serie</button>
              </div>
              {mode === "single" ? (
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="kg (vacío si no aplica)"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-background border border-border rounded px-2 py-1 text-xs"
                />
              ) : (
                <input
                  type="text"
                  placeholder="Ej: 80, 75, 72"
                  value={perSet}
                  onChange={(e) => setPerSet(e.target.value)}
                  className="w-full bg-background border border-border rounded px-2 py-1 text-xs"
                />
              )}
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="reps"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="w-1/2 bg-background border border-border rounded px-2 py-1 text-xs"
                />
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="RPE"
                  value={rpe}
                  onChange={(e) => setRpe(e.target.value)}
                  className="w-1/2 bg-background border border-border rounded px-2 py-1 text-xs"
                />
              </div>
            </>
          )}
          {isOpposition && (
            <input
              type="text"
              inputMode="decimal"
              placeholder="Marca / valor"
              value={mark}
              onChange={(e) => setMark(e.target.value)}
              className="w-full bg-background border border-border rounded px-2 py-1 text-xs"
            />
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-1 bg-primary/20 hover:bg-primary/30 text-primary text-[11px] font-semibold rounded px-2 py-1 border border-primary/40 disabled:opacity-50"
          >
            <Save className="h-3 w-3" />
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      )}
    </div>
  );
};

export default InSessionLogForm;