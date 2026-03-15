import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import ClientLayout from "@/components/client/ClientLayout";
import { useClient } from "@/contexts/ClientContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Utensils, Apple, Leaf, Target, Flame, Droplets, Download } from "lucide-react";
import AnimatedChevron from "@/components/ui/animated-chevron";
import AnimatedCollapsibleContent from "@/components/ui/animated-collapsible-content";
import { useNutritionPlanStore, macroCategoryLabels, type Meal, type MealOption } from "@/data/useNutritionPlanStore";
import { useExerciseLibraryStore } from "@/data/useExerciseLibraryStore";
import { exportNutritionPlanPDF } from "@/utils/exportClientPlanPDF";
import { type ReactNode } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import PullToRefresh from "@/components/client/PullToRefresh";

const ControlledCollapsible = ({ trigger, children }: { trigger: ReactNode; children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-2"><AnimatedChevron open={open} />{trigger}</div>
        </CollapsibleTrigger>
        <AnimatedCollapsibleContent open={open}>{children}</AnimatedCollapsibleContent>
      </div>
    </Collapsible>
  );
};

const OptionCard = ({ option, optionIdx, t }: { option: MealOption; optionIdx: number; t: (k: string, v?: Record<string, string | number>) => string }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <Badge className="text-[10px] bg-primary/15 text-primary border-0">{t("clientNutrition.option", { n: optionIdx + 1 })}</Badge>
      {option.notes && <span className="text-xs text-muted-foreground italic">{option.notes}</span>}
    </div>
    {option.rows.map((row) => (
      <div key={row.id} className="bg-background/50 border border-border/40 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          {row.macroCategory && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{macroCategoryLabels[row.macroCategory]}</span>}
          <span className="text-sm font-medium text-foreground">{row.mainIngredient}</span>
        </div>
        {row.alternatives.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">{row.alternatives.map((alt, i) => <span key={i} className="text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">↻ {alt}</span>)}</div>
        )}
      </div>
    ))}
  </div>
);

const MealCard = ({ meal, t }: { meal: Meal; t: (k: string, v?: Record<string, string | number>) => string }) => {
  const [open, setOpen] = useState(true);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-2">
            <AnimatedChevron open={open} />
            <span className="font-semibold text-foreground">{meal.name}</span>
            <Badge variant="outline" className="text-[10px]">{meal.options.length} opción{meal.options.length > 1 ? "es" : ""}</Badge>
          </div>
        </CollapsibleTrigger>
        <AnimatedCollapsibleContent open={open}>
          <div className="p-4 pt-0 space-y-4">
            {meal.description && <p className="text-xs text-muted-foreground italic">{meal.description}</p>}
            {meal.options.map((opt, i) => <OptionCard key={opt.id} option={opt} optionIdx={i} t={t} />)}
          </div>
        </AnimatedCollapsibleContent>
      </div>
    </Collapsible>
  );
};

const ClientNutrition = () => {
  const { t } = useTranslation();
  const { client } = useClient();
  const plans = useNutritionPlanStore((s) => s.plans);
  const details = useNutritionPlanStore((s) => s.details);
  const supplements = useNutritionPlanStore((s) => s.supplements);
  const fetchPlans = useNutritionPlanStore((s) => s.fetchPlans);
  const fetchSupplements = useNutritionPlanStore((s) => s.fetchSupplements);
  const fetchFoods = useExerciseLibraryStore((s) => s.fetchFoods);
  const fruits = useExerciseLibraryStore((s) => s.fruits);
  const vegetables = useExerciseLibraryStore((s) => s.vegetables);

  const refreshData = useCallback(async () => {
    await fetchPlans(client.id);
    await fetchSupplements();
    await fetchFoods();
  }, [client.id, fetchPlans, fetchSupplements, fetchFoods]);

  useEffect(() => { refreshData(); }, [client.id]);

  const activePlanSummary = plans.find((p) => p.clientId === client.id && p.active);
  const planDetail = activePlanSummary ? details[activePlanSummary.id] : null;

  if (!activePlanSummary) {
    return (
      <ClientLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Utensils className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold text-foreground">{t("clientNutrition.noActivePlan")}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t("clientNutrition.noActivePlanDesc")}</p>
        </div>
      </ClientLayout>
    );
  }

  const stagger = { animate: { transition: { staggerChildren: 0.07 } } };
  const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
  };

  return (
    <ClientLayout>
      <motion.div className="space-y-6 max-w-lg mx-auto" variants={stagger} initial="initial" animate="animate">
        <motion.div variants={fadeUp} className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Utensils className="h-5 w-5 text-primary" />{activePlanSummary.planName}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t("clientNutrition.activePlan")}</p>
          </div>
          {planDetail && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs shrink-0"
              onClick={() => exportNutritionPlanPDF(planDetail, activePlanSummary.planName, client.name, supplements)}
            >
              <Download className="h-3.5 w-3.5" />
              PDF
            </Button>
          )}
        </motion.div>

        {planDetail && (
          <motion.div variants={fadeUp} className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("clientNutrition.dailyGoal")}</h3>
            {planDetail.objective && <p className="text-sm text-foreground mb-3">{planDetail.objective}</p>}
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center"><Flame className="h-4 w-4 text-orange-400 mx-auto mb-1" /><p className="text-lg font-bold text-foreground">{planDetail.calories || "—"}</p><p className="text-[10px] text-muted-foreground">Kcal</p></div>
              <div className="text-center"><Target className="h-4 w-4 text-red-400 mx-auto mb-1" /><p className="text-lg font-bold text-foreground">{planDetail.protein || "—"}g</p><p className="text-[10px] text-muted-foreground">{t("clientNutrition.protein")}</p></div>
              <div className="text-center"><Droplets className="h-4 w-4 text-amber-400 mx-auto mb-1" /><p className="text-lg font-bold text-foreground">{planDetail.carbs || "—"}g</p><p className="text-[10px] text-muted-foreground">CH</p></div>
              <div className="text-center"><span className="text-base">🥑</span><p className="text-lg font-bold text-foreground">{planDetail.fats || "—"}g</p><p className="text-[10px] text-muted-foreground">{t("clientNutrition.fats")}</p></div>
            </div>
          </motion.div>
        )}

        {planDetail && (
          <motion.div variants={fadeUp} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("clientNutrition.meals")}</h2>
            {planDetail.meals.map((meal) => <MealCard key={meal.id} meal={meal} t={t} />)}
          </motion.div>
        )}

        {(supplements.length > 0 || (planDetail?.planSupplements?.length ?? 0) > 0) && <motion.div variants={fadeUp}><ControlledCollapsible trigger={<div className="flex items-center gap-2"><span className="font-semibold text-foreground">{t("clientNutrition.supplementation")}</span><Badge variant="outline" className="text-[10px]">{supplements.length + (planDetail?.planSupplements?.length ?? 0)}</Badge></div>}>
          <div className="px-4 pb-4 space-y-2">
            {supplements.map((s, i) => <div key={`g-${i}`} className="bg-background/50 border border-border/40 rounded-lg p-3 flex items-center justify-between"><div><p className="text-sm font-medium text-foreground">{s.name}</p><p className="text-xs text-muted-foreground">{s.dose}</p></div><Badge variant="outline" className="text-[10px]">{s.timing}</Badge></div>)}
            {(planDetail?.planSupplements ?? []).map((s, i) => <div key={`e-${i}`} className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between"><div><p className="text-sm font-medium text-foreground">{s.name}</p><p className="text-xs text-muted-foreground">{s.dose}</p></div><Badge variant="outline" className="text-[10px] border-primary/30">{s.timing}</Badge></div>)}
          </div>
        </ControlledCollapsible></motion.div>}

        {planDetail && planDetail.recommendations.length > 0 && (
          <motion.div variants={fadeUp} className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">{t("clientNutrition.recommendations")}</h3>
            <ul className="space-y-1.5">{planDetail.recommendations.map((r, i) => <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-primary mt-0.5">•</span> {r}</li>)}</ul>
          </motion.div>
        )}

        <motion.div variants={fadeUp} className="grid grid-cols-1 gap-3">
          <ControlledCollapsible trigger={<div className="flex items-center gap-2"><Apple className="h-4 w-4 text-primary" /><span className="font-semibold text-foreground text-sm">{t("clientNutrition.fruits")}</span><Badge variant="outline" className="text-[10px]">{fruits.length}</Badge></div>}>
            <div className="px-4 pb-4 flex flex-wrap gap-1.5">{fruits.map((f, i) => <span key={i} className="text-xs bg-muted/50 text-muted-foreground px-2 py-1 rounded-full">{f}</span>)}</div>
          </ControlledCollapsible>
          <ControlledCollapsible trigger={<div className="flex items-center gap-2"><Leaf className="h-4 w-4 text-accent" /><span className="font-semibold text-foreground text-sm">{t("clientNutrition.vegetables")}</span><Badge variant="outline" className="text-[10px]">{vegetables.length}</Badge></div>}>
            <div className="px-4 pb-4 flex flex-wrap gap-1.5">{vegetables.map((v, i) => <span key={i} className="text-xs bg-muted/50 text-muted-foreground px-2 py-1 rounded-full">{v}</span>)}</div>
          </ControlledCollapsible>
        </motion.div>
      </motion.div>
    </ClientLayout>
  );
};

export default ClientNutrition;
