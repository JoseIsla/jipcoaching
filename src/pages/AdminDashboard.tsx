import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  Utensils,
  Dumbbell,
  TrendingUp,
  Activity,
  ChevronRight,
  UserPlus,
  ClipboardList,
  BarChart3,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  mockClients,
  mockQuestionnaireEntries,
  getActiveClients,
  getNewClientsThisMonth,
  getActiveNutritionPlans,
  getActiveTrainingPlans,
  getRetentionRate,
} from "@/data/mockData";

const item = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" as const },
});

const AdminDashboard = () => {
  const navigate = useNavigate();

  const activeClients = getActiveClients();
  const newThisMonth = getNewClientsThisMonth();
  const activeNutrition = getActiveNutritionPlans();
  const activeTraining = getActiveTrainingPlans();
  const retention = getRetentionRate();

  const pendingCheckins = mockQuestionnaireEntries.filter(
    (e) => e.status === "pendiente"
  ).length;

  const recentClients = mockClients.slice(0, 5);

  const stats = [
    {
      title: "Clientes Activos",
      value: activeClients.length,
      sub: `+${newThisMonth.length} este mes`,
      icon: Users,
      color: "primary" as const,
      positive: true,
    },
    {
      title: "Planes Nutrición",
      value: activeNutrition.length,
      sub: "activos",
      icon: Utensils,
      color: "primary" as const,
      positive: true,
    },
    {
      title: "Entrenamientos",
      value: activeTraining.length,
      sub: "activos",
      icon: Dumbbell,
      color: "accent" as const,
      positive: true,
    },
    {
      title: "Retención",
      value: `${retention}%`,
      sub: `${mockClients.filter((c) => c.status !== "Inactivo").length}/${mockClients.length}`,
      icon: TrendingUp,
      color: retention >= 80 ? ("primary" as const) : ("destructive" as const),
      positive: retention >= 80,
    },
  ];

  const quickActions = [
    { icon: UserPlus, label: "Añadir cliente", path: "/admin/clients" },
    { icon: Utensils, label: "Plan nutricional", path: "/admin/nutrition" },
    { icon: Dumbbell, label: "Plan de entreno", path: "/admin/training" },
    { icon: Activity, label: "Ver progreso", path: "/admin/progress" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Greeting */}
        <motion.div {...item(0)}>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Resumen general de tu actividad
          </p>
        </motion.div>

        {/* Stat cards */}
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

        {/* Middle row: Quick Actions + Pending Checkins */}
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
                    {mockClients.filter((c) => c.status !== "Inactivo").length} de{" "}
                    {mockClients.length} clientes
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

        {/* Recent Clients */}
        <motion.div
          {...item(0.42)}
          className="bg-card border border-border rounded-xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">
              Clientes Recientes
            </h2>
            <button
              onClick={() => navigate("/admin/clients")}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Ver todos
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-border/50">
            {recentClients.map((client, i) => {
              const initials = client.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase();
              return (
                <motion.button
                  key={client.id}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => navigate(`/admin/clients/${client.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left group"
                >
                  <Avatar className="h-8 w-8 border border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {client.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{client.plan}</p>
                  </div>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      client.status === "Activo"
                        ? "bg-primary/15 text-primary"
                        : client.status === "Pendiente"
                        ? "bg-accent/15 text-accent"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {client.status}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
