import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import ClientLayout from "@/components/client/ClientLayout";
import { useClient } from "@/contexts/ClientContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Dumbbell, Lock, Calendar, Download } from "lucide-react";
import AnimatedChevron from "@/components/ui/animated-chevron";
import AnimatedCollapsibleContent from "@/components/ui/animated-collapsible-content";
import { useTrainingPlanStore, TRAINING_METHOD_LABELS, type TrainingPlanFull, type TrainingWeek, type TrainingDay } from "@/data/useTrainingPlanStore";
import { exportTrainingWeekPDF } from "@/utils/exportClientPlanPDF";
import { useTranslation } from "@/i18n/useTranslation";

const DayView = ({ day, t }: { day: TrainingDay; t: (k: string, v?: Record<string, string | number>) => string }) => {
  const [open, setOpen] = useState(false);
  const basics = day.exercises.filter((e) => e.section === "basic");
  const accessories = day.exercises.filter((e) => e.section === "accessory");

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <CollapsibleTrigger className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-2">
            <AnimatedChevron open={open} />
            <span className="font-semibold text-sm text-foreground">{t("clientTraining.day", { n: day.dayNumber })}</span>
            <span className="text-xs text-muted-foreground">— {day.name}</span>
          </div>
          <Badge variant="outline" className="text-[10px]">{day.exercises.length} {t("clientTraining.exercises")}</Badge>
        </CollapsibleTrigger>
        <AnimatedCollapsibleContent open={open}>
          <div className="p-3 pt-0 space-y-3">
            {day.warmup && (
              <div className="bg-muted/30 rounded-lg p-2">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-0.5">{t("clientTraining.warmup")}</p>
                <p className="text-xs text-foreground">{day.warmup}</p>
              </div>
            )}
            {basics.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-primary flex items-center gap-1"><Dumbbell className="h-3 w-3" /> {t("clientTraining.basicsVariants")}</p>
                {basics.map((ex) => (
                  <div key={ex.id} className="bg-background/50 border border-border/40 rounded-lg p-3 space-y-1">
                    <p className="text-sm font-medium text-foreground">{ex.exerciseName || "—"}</p>
                    {ex.method && (
                      <Badge variant="outline" className="text-[10px]">
                        {ex.method === "custom" && ex.customMethodName
                          ? ex.customMethodName
                          : TRAINING_METHOD_LABELS[ex.method] || ex.method}
                      </Badge>
                    )}
                    {ex.method === "custom" && ex.customMethodDescription && (
                      <p className="text-[11px] text-muted-foreground italic">📋 {ex.customMethodDescription}</p>
                    )}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {ex.topSetReps && <span><span className="font-medium text-foreground">Top Set:</span> {ex.topSetReps} reps{ex.topSetRPE ? ` @RPE ${ex.topSetRPE}` : ""}</span>}
                      {ex.backoffSets && <span><span className="font-medium text-foreground">Back-off:</span> {ex.backoffSets} sets{ex.backoffReps ? ` × ${ex.backoffReps} reps` : ""}{ex.backoffPercent ? ` @RPE ${ex.backoffPercent}` : ""}</span>}
                      {ex.estimatedSeries && <span><span className="font-medium text-foreground">Series est.:</span> {ex.estimatedSeries}</span>}
                      {ex.sets && <span>{ex.sets} {t("clientTraining.series")}</span>}
                      {ex.reps && <span>× {ex.reps}</span>}
                      {/* RPE for straight_sets/ramp/wave where topSetReps is not used */}
                      {!ex.topSetReps && ex.topSetRPE != null && <span><span className="font-medium text-foreground">RPE:</span> {ex.topSetRPE}</span>}
                      {ex.plannedLoad && <span><span className="font-medium text-foreground">Carga:</span> {ex.plannedLoad}</span>}
                      {ex.backoffRule && <span><span className="font-medium text-foreground">Regla:</span> {ex.backoffRule}</span>}
                    </div>
                    {ex.technicalNotes && <p className="text-[11px] text-muted-foreground italic mt-1">💡 {ex.technicalNotes}</p>}
                  </div>
                ))}
              </div>
            )}
            {accessories.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">{t("clientTraining.accessories")}</p>
                {accessories.map((ex) => (
                  <div key={ex.id} className="bg-background/50 border border-border/40 rounded-lg p-3 space-y-1">
                    <p className="text-sm font-medium text-foreground">{ex.exerciseName || "—"}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {ex.sets && <span>{ex.sets} {t("clientTraining.series")}</span>}
                      {ex.reps && <span>× {ex.reps}</span>}
                      {ex.intensityType && ex.intensityValue != null && <span><span className="font-medium text-foreground">{ex.intensityType}:</span> {ex.intensityValue}</span>}
                      {ex.plannedLoad && <span><span className="font-medium text-foreground">Carga:</span> {ex.plannedLoad}</span>}
                    </div>
                    {ex.technicalNotes && <p className="text-[11px] text-muted-foreground italic">💡 {ex.technicalNotes}</p>}
                  </div>
                ))}
              </div>
            )}
            {day.exercises.length === 0 && <p className="text-xs text-muted-foreground italic text-center py-4">{t("clientTraining.noExercises")}</p>}
          </div>
        </AnimatedCollapsibleContent>
      </div>
    </Collapsible>
  );
};

const ClientTraining = () => {
  const { t } = useTranslation();
  const { client } = useClient();
  const plans = useTrainingPlanStore((s) => s.plans);
  const getDetail = useTrainingPlanStore((s) => s.getDetail);
  const details = useTrainingPlanStore((s) => s.details);
  const fetchPlans = useTrainingPlanStore((s) => s.fetchPlans);
  const fetchPlanDetail = useTrainingPlanStore((s) => s.fetchPlanDetail);
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0);

  // Fetch plans from API on mount
  useEffect(() => { fetchPlans(client.id); }, [client.id]);

  const activePlan = plans.find((p) => p.clientId === client.id && p.active);

  // Fetch plan detail when active plan is known
  useEffect(() => {
    if (activePlan && !details[activePlan.id]) {
      fetchPlanDetail(activePlan.id);
    }
  }, [activePlan?.id]);

  const plan = activePlan ? (details[activePlan.id] || null) : null;

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
          <h2 className="text-lg font-semibold text-foreground">{t("clientTraining.noActivePlan")}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t("clientTraining.noActivePlanDesc")}</p>
        </div>
      </ClientLayout>
    );
  }

  const currentWeek = plan.weeks[selectedWeekIdx];
  const blockGroups: Record<string, { weeks: TrainingWeek[]; indices: number[] }> = {};
  plan.weeks.forEach((w, i) => { const b = w.block || plan.block; if (!blockGroups[b]) blockGroups[b] = { weeks: [], indices: [] }; blockGroups[b].weeks.push(w); blockGroups[b].indices.push(i); });

  const stagger = { animate: { transition: { staggerChildren: 0.07 } } };
  const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
  };

  return (
    <ClientLayout>
      <motion.div className="space-y-5 max-w-lg mx-auto" variants={stagger} initial="initial" animate="animate">
        <motion.div variants={fadeUp} className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Dumbbell className="h-5 w-5 text-accent" />{plan.planName}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{plan.modality} · {plan.block}</p>
          </div>
          {currentWeek && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs shrink-0"
              onClick={() => exportTrainingWeekPDF(plan, currentWeek, client.name)}
            >
              <Download className="h-3.5 w-3.5" />
              PDF
            </Button>
          )}
        </motion.div>
        <motion.div variants={fadeUp} className="space-y-2">
          {Object.entries(blockGroups).map(([block, group]) => (
            <div key={block} className="space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{block}</p>
              <div className="flex gap-1.5 flex-wrap">
                {group.weeks.map((w, gi) => {
                  const realIdx = group.indices[gi];
                  return (
                    <Button key={w.id} variant={realIdx === selectedWeekIdx ? "default" : "outline"} size="sm" className={`text-xs gap-1 h-8 ${w.status === "completed" && realIdx !== selectedWeekIdx ? "opacity-50" : ""}`} onClick={() => setSelectedWeekIdx(realIdx)}>
                      {w.status === "completed" && <Lock className="h-3 w-3" />}S{w.weekNumber}{w.status === "active" && " ●"}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </motion.div>
        {currentWeek && (
          <motion.div variants={fadeUp} className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">{t("clientTraining.week", { n: currentWeek.weekNumber })}</span>
              <Badge variant={currentWeek.status === "active" ? "default" : "outline"} className="text-[10px]">
                {currentWeek.status === "active" ? t("clientTraining.current") : currentWeek.status === "completed" ? t("clientTraining.completed") : t("clientTraining.draft")}
              </Badge>
            </div>
            {currentWeek.generalNotes && <div className="bg-muted/30 border border-border/40 rounded-lg p-3"><p className="text-xs text-muted-foreground">{currentWeek.generalNotes}</p></div>}
            <div className="space-y-2">{[...currentWeek.days].sort((a, b) => a.dayNumber - b.dayNumber).map((day) => <DayView key={day.id} day={day} t={t} />)}</div>
          </motion.div>
        )}
      </motion.div>
    </ClientLayout>
  );
};

export default ClientTraining;
