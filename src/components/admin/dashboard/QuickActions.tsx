import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus, Utensils, Dumbbell, Activity, ClipboardList, BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { mockQuestionnaireEntries } from "@/data/mockData";
import { useClientStore } from "@/data/useClientStore";

const item = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" as const },
});

const quickActions = [
  { icon: UserPlus, label: "Añadir cliente", path: "/admin/clients" },
  { icon: Utensils, label: "Plan nutricional", path: "/admin/nutrition" },
  { icon: Dumbbell, label: "Plan de entreno", path: "/admin/training" },
  { icon: Activity, label: "Ver progreso", path: "/admin/progress" },
];

const QuickActions = () => {
  const navigate = useNavigate();
  const { clients, getRetentionRate } = useClientStore();
  const retention = getRetentionRate();

  const pendingCheckins = mockQuestionnaireEntries.filter(
    (e) => e.status === "pendiente"
  ).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Quick Actions */}
      <motion.div
        {...item(0.3)}
        className="lg:col-span-1 bg-card border border-border rounded-xl p-4"
      >
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Acciones Rápidas
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

      {/* Overview cards */}
      <motion.div
        {...item(0.36)}
        className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        {/* Checkins pendientes */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/admin/questionnaires")}
          className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/40 transition-colors group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
              <ClipboardList className="h-4 w-4 text-foreground" />
            </div>
            {pendingCheckins > 0 && (
              <span className="h-5 min-w-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {pendingCheckins}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-foreground">
            Check-ins pendientes
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pendingCheckins > 0
              ? `${pendingCheckins} por revisar`
              : "Todo al día ✓"}
          </p>
        </motion.button>

        {/* Retention progress */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-sm font-semibold text-foreground">Retención</p>
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {clients.filter((c) => c.status !== "Inactivo").length} de{" "}
                {clients.length} clientes
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
