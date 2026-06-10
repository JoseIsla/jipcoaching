import { History } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { PreviousLoad } from "@/data/useTrainingPlanStore";

interface PreviousLoadBadgeProps {
  load?: PreviousLoad | null;
  className?: string;
}

const formatDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  } catch {
    return "";
  }
};

const buildText = (load: PreviousLoad): string => {
  if (load.weightMode === "per_set" && load.perSetWeights) {
    return `Anterior: ${load.perSetWeights}kg`;
  }
  if (load.actualWeight != null) {
    const reps = load.actualReps ? `×${load.actualReps}` : "";
    return `Anterior: ${load.actualWeight}kg${reps}`;
  }
  if (load.actualMarkValue != null) {
    return `Anterior: ${load.actualMarkValue}${load.actualMarkUnit || ""}`;
  }
  if (load.actualDistanceM != null) {
    const km = load.actualDistanceM >= 1000 ? `${(load.actualDistanceM / 1000).toFixed(2)}km` : `${load.actualDistanceM}m`;
    return `Anterior: ${km}`;
  }
  // Athlete logged the exercise but left the weight blank
  return "Anterior: —";
};

/** Small inline badge that surfaces the athlete's last logged value for an exercise. */
const PreviousLoadBadge = ({ load, className }: PreviousLoadBadgeProps) => {
  const hasLoad = !!load;
  const text = hasLoad ? buildText(load!) : "Anterior: sin registro";

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center gap-1 rounded-full text-[10px] px-1.5 py-0.5 border leading-none ${hasLoad ? "bg-muted/40 text-muted-foreground border-border/40" : "bg-transparent text-muted-foreground/60 border-border/30 italic"} ${className || ""}`}
          >
            <History className="h-2.5 w-2.5" />
            <span>{text}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-[11px]">
          {hasLoad ? `Registrado el ${formatDate(load!.createdAt)}` : "Aún no hay carga registrada para este ejercicio"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PreviousLoadBadge;

/** Lookup helper: case-insensitive name match. */
export const lookupPreviousLoad = (
  map: Record<string, PreviousLoad> | undefined,
  name: string | undefined,
): PreviousLoad | null => {
  if (!map || !name) return null;
  return map[name.trim().toLowerCase()] || null;
};