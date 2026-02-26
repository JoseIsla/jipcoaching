import { motion } from "framer-motion";
import { Users, Utensils, Dumbbell, TrendingUp, type LucideIcon } from "lucide-react";
import { useClientStore } from "@/data/useClientStore";
import { useNutritionPlanStore } from "@/data/useNutritionPlanStore";
import { useTrainingPlanStore } from "@/data/useTrainingPlanStore";
import { useTranslation } from "@/i18n/useTranslation";

const item = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" as const },
});

const StatCards = () => {
  const { t } = useTranslation();
  const { clients, getActiveClients, getRetentionRate } = useClientStore();
  const activeClients = getActiveClients();
  const nutritionPlans = useNutritionPlanStore((s) => s.plans);
  const trainingPlans = useTrainingPlanStore((s) => s.plans);
  const activeNutrition = nutritionPlans.filter((p) => p.active);
  const activeTraining = trainingPlans.filter((p) => p.active);
  const retention = getRetentionRate();

  const stats = [
    {
      title: t("dashboard.activeClients"),
      value: activeClients.length,
      sub: `${clients.length} ${t("common.total").toLowerCase()}`,
      icon: Users,
      color: "primary" as const,
      positive: true,
    },
    {
      title: t("dashboard.nutritionPlans"),
      value: activeNutrition.length,
      sub: t("dashboard.activePlural"),
      icon: Utensils,
      color: "primary" as const,
      positive: true,
    },
    {
      title: t("dashboard.trainings"),
      value: activeTraining.length,
      sub: t("dashboard.activePlural"),
      icon: Dumbbell,
      color: "accent" as const,
      positive: true,
    },
    {
      title: t("dashboard.retention"),
      value: `${retention}%`,
      sub: `${activeClients.length}/${clients.length}`,
      icon: TrendingUp,
      color: (retention >= 80 ? "primary" : "destructive") as "primary" | "destructive",
      positive: retention >= 80,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          {...item(0.06 * (i + 1))}
          whileTap={{ scale: 0.97 }}
          className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors group cursor-default"
        >
          <div className="flex items-center justify-between mb-2">
            <div
              className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                stat.color === "accent"
                  ? "bg-accent/15"
                  : stat.color === "destructive"
                  ? "bg-destructive/15"
                  : "bg-primary/15"
              }`}
            >
              <stat.icon
                className={`h-4 w-4 ${
                  stat.color === "accent"
                    ? "text-accent"
                    : stat.color === "destructive"
                    ? "text-destructive"
                    : "text-primary"
                }`}
              />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground tracking-tight">
            {stat.value}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{stat.title}</p>
          <p
            className={`text-xs font-medium mt-1 ${
              stat.positive ? "text-primary" : "text-destructive"
            }`}
          >
            {stat.sub}
          </p>
        </motion.div>
      ))}
    </div>
  );
};

export default StatCards;
