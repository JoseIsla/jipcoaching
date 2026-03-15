import { useEffect, useCallback } from "react";
import ClientLayout from "@/components/client/ClientLayout";
import { useClient } from "@/contexts/ClientContext";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Utensils, Dumbbell, ClipboardList, TrendingUp, TrendingDown, Scale, Target, ChevronRight, Flame, Calendar, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNutritionPlanStore } from "@/data/useNutritionPlanStore";
import { useTrainingPlanStore } from "@/data/useTrainingPlanStore";
import { useQuestionnaireStore, isActionablePending } from "@/data/useQuestionnaireStore";
import { useTranslation } from "@/i18n/useTranslation";
import ClientTestimonialCard from "@/components/client/ClientTestimonialCard";
import PullToRefresh from "@/components/client/PullToRefresh";

const ClientHome = () => {
  const { t } = useTranslation();
  const { client } = useClient();
  const navigate = useNavigate();
  const hasNutrition = client.services.includes("nutrition");
  const hasTraining = client.services.includes("training");
  const nutritionPlans = useNutritionPlanStore((s) => s.plans);
  const trainingPlans = useTrainingPlanStore((s) => s.plans);
  const entries = useQuestionnaireStore((s) => s.entries);
  const getWeightHistory = useQuestionnaireStore((s) => s.getWeightHistory);
  const getBestRMs = useQuestionnaireStore((s) => s.getBestRMs);
  const fetchEntries = useQuestionnaireStore((s) => s.fetchEntries);
  const fetchWeightHistory = useQuestionnaireStore((s) => s.fetchWeightHistory);
  const fetchRMRecords = useQuestionnaireStore((s) => s.fetchRMRecords);
  const generateMyCheckins = useQuestionnaireStore((s) => s.generateMyCheckins);

  const refreshData = useCallback(async () => {
    await generateMyCheckins();
    await fetchEntries(client.id);
    if (hasNutrition) await fetchWeightHistory(client.id);
    if (hasTraining) await fetchRMRecords(client.id);
  }, [client.id, hasNutrition, hasTraining, generateMyCheckins, fetchEntries, fetchWeightHistory, fetchRMRecords]);

  useEffect(() => { refreshData(); }, [client.id]);
  const activePlan = hasNutrition ? nutritionPlans.find((p) => p.clientId === client.id && p.active) : null;
  const activeTraining = hasTraining ? trainingPlans.find((p) => p.clientId === client.id && p.active) : null;
  const pendingCheckins = entries.filter((e) => e.clientId === client.id && isActionablePending(e)).length;
  const weightHistory = getWeightHistory(client.id);
  const latestWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1] : null;
  const prevWeight = weightHistory.length > 1 ? weightHistory[weightHistory.length - 2] : null;
  const weightDiff = latestWeight && prevWeight ? +(latestWeight.weight - prevWeight.weight).toFixed(1) : null;
  const firstWeight = weightHistory.length > 0 ? weightHistory[0] : null;
  const totalDiff = latestWeight && firstWeight ? +(latestWeight.weight - firstWeight.weight).toFixed(1) : null;
  const bestRMs = hasTraining ? getBestRMs(client.id) : [];
  const mainLifts = bestRMs.filter((r) => ["Sentadilla", "Press Banca", "Peso Muerto"].includes(r.exerciseName));
  const totalRM = mainLifts.reduce((sum, r) => sum + r.estimated1RM, 0);
  const trainingWeekProgress = activeTraining ? Math.round(((activeTraining.currentWeek ?? 0) / activeTraining.weeksDuration) * 100) : 0;
  const nextCheckin = entries.find((e) => e.clientId === client.id && e.status === "pendiente");

  return (
    <ClientLayout>
      <div className="space-y-5 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
          <h1 className="text-2xl font-bold text-foreground">{t("clientHome.greeting", { name: client.name.split(" ")[0] })}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("clientHome.todaySummary")}</p>
        </motion.div>

        {hasNutrition && latestWeight && (
          <motion.button initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }} whileTap={{ scale: 0.98 }} onClick={() => navigate("/client/progress")} className="w-full bg-card border border-border rounded-xl p-4 text-left hover:border-primary/40 transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center"><Scale className="h-4 w-4 text-primary" /></div><span className="text-sm font-semibold text-foreground">{t("clientHome.bodyWeight")}</span></div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="text-3xl font-bold text-foreground tracking-tight">{latestWeight.weight}<span className="text-base font-normal text-muted-foreground ml-1">kg</span></p>
            <div className="flex gap-3 mt-1.5">
              {weightDiff !== null && (<div className="flex items-center gap-1">{weightDiff < 0 ? <TrendingDown className="h-3.5 w-3.5 text-primary" /> : weightDiff > 0 ? <TrendingUp className="h-3.5 w-3.5 text-primary" /> : null}<span className={`text-xs font-medium ${weightDiff !== 0 ? "text-primary" : "text-muted-foreground"}`}>{weightDiff > 0 ? "+" : ""}{weightDiff} sem</span></div>)}
              {totalDiff !== null && <span className="text-xs text-muted-foreground">{totalDiff > 0 ? "+" : ""}{totalDiff} total</span>}
            </div>
          </motion.button>
        )}

        <div className="grid grid-cols-2 gap-3">
          {hasNutrition && (
            <motion.button initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.16 }} whileTap={{ scale: 0.97 }} onClick={() => navigate("/client/nutrition")} className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/40 transition-colors group">
              <div className="flex items-center justify-between mb-2"><div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center"><Utensils className="h-4 w-4 text-primary" /></div><ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" /></div>
              <p className="text-sm font-semibold text-foreground">{t("clientHome.nutritionLabel")}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{activePlan ? activePlan.planName : t("clientHome.noActivePlan")}</p>
              {activePlan && <div className="flex items-center gap-1.5 mt-2"><Flame className="h-3 w-3 text-primary" /><span className="text-xs font-medium text-primary">{activePlan.calories} kcal</span></div>}
            </motion.button>
          )}
          {hasTraining && (
            <motion.button initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.22 }} whileTap={{ scale: 0.97 }} onClick={() => navigate("/client/training")} className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/40 transition-colors group">
              <div className="flex items-center justify-between mb-2"><div className="h-9 w-9 rounded-lg bg-accent/15 flex items-center justify-center"><Dumbbell className="h-4 w-4 text-accent" /></div><ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-accent transition-colors" /></div>
              <p className="text-sm font-semibold text-foreground">{t("clientHome.trainingLabel")}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{activeTraining ? activeTraining.planName : t("clientHome.noActivePlan")}</p>
              {activeTraining && activeTraining.currentWeek && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between"><span className="text-[10px] text-muted-foreground">Sem {activeTraining.currentWeek}/{activeTraining.weeksDuration}</span><span className="text-[10px] text-muted-foreground">{trainingWeekProgress}%</span></div>
                  <Progress value={trainingWeekProgress} className="h-1.5" />
                </div>
              )}
            </motion.button>
          )}
        </div>

        {hasTraining && mainLifts.length > 0 && (
          <motion.button initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.28 }} whileTap={{ scale: 0.98 }} onClick={() => navigate("/client/progress")} className="w-full bg-card border border-border rounded-xl p-4 text-left hover:border-primary/40 transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg bg-accent/15 flex items-center justify-center"><Trophy className="h-4 w-4 text-accent" /></div><span className="text-sm font-semibold text-foreground">{t("clientHome.bestMarks")}</span></div>
              {totalRM > 0 && <Badge variant="outline" className="text-[10px] border-accent/30 text-accent">Total: {totalRM} kg</Badge>}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {mainLifts.map((lift) => (
                <div key={lift.exerciseId} className="bg-muted rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{lift.exerciseName === "Sentadilla" ? "SQ" : lift.exerciseName === "Press Banca" ? "BP" : "DL"}</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">{lift.estimated1RM}<span className="text-[10px] font-normal text-muted-foreground ml-0.5">kg</span></p>
                </div>
              ))}
            </div>
          </motion.button>
        )}

        <div className="grid grid-cols-2 gap-3">
          <motion.button initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.34 }} whileTap={{ scale: 0.97 }} onClick={() => navigate("/client/checkins")} className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/40 transition-colors group">
            <div className="flex items-center justify-between mb-2">
              <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center"><ClipboardList className="h-4 w-4 text-foreground" /></div>
              {pendingCheckins > 0 && <span className="h-5 min-w-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">{pendingCheckins}</span>}
            </div>
            <p className="text-sm font-semibold text-foreground">{t("clientHome.checkins")}</p>
            {nextCheckin ? (
              <div className="flex items-center gap-1 mt-1"><Calendar className="h-3 w-3 text-muted-foreground" /><span className="text-xs text-muted-foreground truncate">{nextCheckin.dayLabel} · {nextCheckin.templateName}</span></div>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">{t("clientHome.allCaughtUp")}</p>
            )}
          </motion.button>

          <motion.button initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }} whileTap={{ scale: 0.97 }} onClick={() => navigate("/client/progress")} className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/40 transition-colors group">
            <div className="flex items-center justify-between mb-2">
              <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center"><Target className="h-4 w-4 text-foreground" /></div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="text-sm font-semibold text-foreground">{t("clientHome.progressLabel")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{weightHistory.length > 0 ? t("clientHome.records", { n: weightHistory.length }) : t("clientHome.viewMetrics")}</p>
          </motion.button>
        </div>

        {/* Testimonial */}
        <ClientTestimonialCard />
      </div>
    </ClientLayout>
  );
};

export default ClientHome;
