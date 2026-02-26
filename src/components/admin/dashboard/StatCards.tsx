import { motion } from "framer-motion";
import { Users, Utensils, Dumbbell, TrendingUp, type LucideIcon } from "lucide-react";
import { useClientStore } from "@/data/useClientStore";
import { nutritionPlanList } from "@/data/nutritionPlanStore";
import { trainingPlanList } from "@/data/trainingPlanStore";

const item = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" as const },
});

interface Stat {
  title: string;
  value: string | number;
  sub: string;
  icon: LucideIcon;
  color: "primary" | "accent" | "destructive";
  positive: boolean;
}

const StatCards = () => {
  const { clients, getActiveClients, getNewClientsThisMonth, getRetentionRate } = useClientStore();
  const activeClients = getActiveClients();
  const newThisMonth = getNewClientsThisMonth();
  const activeNutrition = nutritionPlanList.filter((p) => p.active);
  const activeTraining = trainingPlanList.filter((p) => p.active);
  const retention = getRetentionRate();

  const stats: Stat[] = [
    {
      title: "Clientes Activos",
      value: activeClients.length,
      sub: `+${newThisMonth.length} este mes`,
      icon: Users,
      color: "primary",
      positive: true,
    },
    {
      title: "Planes Nutrición",
      value: activeNutrition.length,
      sub: "activos",
      icon: Utensils,
      color: "primary",
      positive: true,
    },
    {
      title: "Entrenamientos",
      value: activeTraining.length,
      sub: "activos",
      icon: Dumbbell,
      color: "accent",
      positive: true,
    },
    {
      title: "Retención",
      value: `${retention}%`,
      sub: `${clients.filter((c) => c.status !== "Inactivo").length}/${clients.length}`,
      icon: TrendingUp,
      color: retention >= 80 ? "primary" : "destructive",
      positive: retention >= 80,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.title}
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
