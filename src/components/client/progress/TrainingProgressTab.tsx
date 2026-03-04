import { Dumbbell, Activity } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";

interface BestRM {
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  estimated1RM: number;
  date: string;
}

interface TrainingProgressData {
  latestFatigue?: number;
  latestSleep?: number;
  latestMotivation?: number;
  hasInjury?: boolean;
  injuryDetail?: string;
}

interface TrainingProgressTabProps {
  bestRMs: BestRM[];
  trainingProgress: TrainingProgressData;
}

const TrainingProgressTab = ({ bestRMs, trainingProgress }: TrainingProgressTabProps) => {
  const { t } = useTranslation();

  const squat = bestRMs.find((r) => r.exerciseName === "Sentadilla");
  const bench = bestRMs.find((r) => r.exerciseName === "Press Banca");
  const deadlift = bestRMs.find((r) => r.exerciseName === "Peso Muerto");
  const sbdTotal = (squat?.estimated1RM || 0) + (bench?.estimated1RM || 0) + (deadlift?.estimated1RM || 0);

  return (
    <div className="space-y-4">
      {sbdTotal > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <Dumbbell className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-3xl font-black text-foreground">{sbdTotal} kg</p>
          <p className="text-xs text-muted-foreground">{t("clientProgress.sbdTotal")}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t("clientProgress.personalRecords")}
          </h3>
          {bestRMs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">{t("clientProgress.noRecords")}</p>
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

        {trainingProgress.latestFatigue != null && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-3 h-fit">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Activity className="h-3.5 w-3.5" /> {t("clientProgress.lastReport")}
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-foreground">{trainingProgress.latestFatigue ?? "—"}/10</p>
                <p className="text-[10px] text-muted-foreground">{t("clientProgress.fatigueLabel")}</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{trainingProgress.latestSleep ?? "—"}/10</p>
                <p className="text-[10px] text-muted-foreground">{t("clientProgress.sleepLabel")}</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{trainingProgress.latestMotivation ?? "—"}/10</p>
                <p className="text-[10px] text-muted-foreground">{t("clientProgress.motivationLabel")}</p>
              </div>
            </div>
            {trainingProgress.hasInjury && (
              <div className="bg-destructive/10 rounded-lg p-2">
                <p className="text-xs text-destructive">
                  {t("clientProgress.injuryReported", { detail: trainingProgress.injuryDetail || t("clientProgress.noDetail") })}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingProgressTab;
