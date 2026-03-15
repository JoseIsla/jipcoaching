import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Utensils, Dumbbell, Activity, ClipboardList, BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQuestionnaireStore } from "@/data/useQuestionnaireStore";
import { useClientStore } from "@/data/useClientStore";
import { useTranslation } from "@/i18n/useTranslation";

const AnimatedBadge = ({ count }: { count: number }) => {
  const prevCount = useRef(count);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (count !== prevCount.current) {
      setKey((k) => k + 1);
      prevCount.current = count;
    }
  }, [count]);

  return (
    <AnimatePresence mode="wait">
      {count > 0 && (
        <motion.span
          key={key}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className="h-5 min-w-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center"
        >
          {count}
        </motion.span>
      )}
    </AnimatePresence>
  );
};

const item = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" as const },
});

const QuickActions = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { clients, getActiveClients, getRetentionRate } = useClientStore();
  const activeClients = getActiveClients();
  const retention = getRetentionRate();

  const getSubmittedCount = useQuestionnaireStore((s) => s.getSubmittedCount);
  const pendingCheckins = getSubmittedCount();

  const quickActions = [
    { icon: UserPlus, label: t("dashboard.addClient"), path: "/admin/clients" },
    { icon: Utensils, label: t("dashboard.nutritionPlan"), path: "/admin/nutrition" },
    { icon: Dumbbell, label: t("dashboard.trainingPlan"), path: "/admin/training" },
    { icon: Activity, label: t("dashboard.viewProgress"), path: "/admin/progress" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <motion.div
        {...item(0.3)}
        className="lg:col-span-1 bg-card border border-border rounded-xl p-4"
      >
        <h2 className="text-sm font-semibold text-foreground mb-3">
          {t("dashboard.quickActions")}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => (
            <motion.button
              key={action.label}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-muted/50 hover:bg-muted border border-transparent hover:border-primary/20 transition-colors group"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <action.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-[11px] font-medium text-foreground text-center leading-tight">
                {action.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div
        {...item(0.36)}
        className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/admin/checkins")}
          className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/40 transition-colors group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
              <ClipboardList className="h-4 w-4 text-foreground" />
            </div>
            <AnimatedBadge count={pendingCheckins} />
          </div>
          <p className="text-sm font-semibold text-foreground">
            {t("dashboard.pendingCheckins")}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pendingCheckins > 0
              ? t("dashboard.toReview", { n: pendingCheckins })
              : t("dashboard.allCaughtUp")}
          </p>
        </motion.button>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-sm font-semibold text-foreground">{t("dashboard.retentionLabel")}</p>
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {t("dashboard.ofClients", {
                  active: activeClients.length,
                  total: clients.length,
                })}
              </span>
              <span className="text-xs font-medium text-primary">
                {retention}%
              </span>
            </div>
            <Progress value={retention} className="h-1.5" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default QuickActions;
