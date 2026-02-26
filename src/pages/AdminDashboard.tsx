import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Users,
  Utensils,
  Dumbbell,
  TrendingUp,
  Activity,
  UserPlus,
  ClipboardList,
  BarChart3,
  CalendarIcon,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  mockQuestionnaireEntries,
} from "@/data/mockData";
import { useClientStore } from "@/data/useClientStore";
import { nutritionPlanList } from "@/data/nutritionPlanStore";
import { trainingPlanList } from "@/data/trainingPlanStore";

const item = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" as const },
});

const AdminDashboard = () => {
  const navigate = useNavigate();

  const { clients, getActiveClients, getNewClientsThisMonth, getRetentionRate } = useClientStore();
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const activeClients = getActiveClients();
  const newThisMonth = getNewClientsThisMonth();
  const activeNutrition = nutritionPlanList.filter((p) => p.active);
  const activeTraining = trainingPlanList.filter((p) => p.active);
  const retention = getRetentionRate();

  const pendingCheckins = mockQuestionnaireEntries.filter(
    (e) => e.status === "pendiente"
  ).length;

  // Client evolution by month – computed from store
  const clientEvolution = (() => {
    const monthNames: Record<string, string> = {
      "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
      "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
      "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic",
    };

    const monthsSet = new Set(clients.map((c) => c.joinedMonth));
    const sortedMonths = Array.from(monthsSet).sort();

    // Apply date range filter
    const fromStr = dateFrom ? format(dateFrom, "yyyy-MM") : null;
    const toStr = dateTo ? format(dateTo, "yyyy-MM") : null;

    let cumulative = 0;
    const all = sortedMonths.map((m) => {
      const newInMonth = clients.filter((c) => c.joinedMonth === m).length;
      cumulative += newInMonth;
      const label = monthNames[m.split("-")[1]] || m;
      return { month: label, total: cumulative, new: newInMonth, key: m };
    });

    return all.filter((d) => {
      if (fromStr && d.key < fromStr) return false;
      if (toStr && d.key > toStr) return false;
      return true;
    });
  })();

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
      sub: `${clients.filter((c) => c.status !== "Inactivo").length}/${clients.length}`,
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

        {/* Client Evolution Chart */}
        <motion.div
          {...item(0.42)}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">
                Evolución de Clientes
              </h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Date From */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 text-xs gap-1.5 font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {dateFrom ? format(dateFrom, "MMM yyyy", { locale: es }) : "Desde"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {/* Date To */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 text-xs gap-1.5 font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {dateTo ? format(dateTo, "MMM yyyy", { locale: es }) : "Hasta"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {(dateFrom || dateTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground"
                  onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}
                >
                  Limpiar
                </Button>
              )}
              <div className="flex items-center gap-3 ml-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-[10px] text-muted-foreground">Total</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-accent" />
                  <span className="text-[10px] text-muted-foreground">Nuevos</span>
                </div>
              </div>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={clientEvolution} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradNew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
                        <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
                        {payload.map((p) => (
                          <p key={p.dataKey} className="text-[11px] text-muted-foreground">
                            <span
                              className="inline-block h-1.5 w-1.5 rounded-full mr-1.5"
                              style={{ backgroundColor: p.color }}
                            />
                            {p.dataKey === "total" ? "Total" : "Nuevos"}: {p.value}
                          </p>
                        ))}
                      </div>
                    );
                  }}
                  cursor={{ stroke: "hsl(var(--border))" }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#gradTotal)"
                  dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                />
                <Area
                  type="monotone"
                  dataKey="new"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  fill="url(#gradNew)"
                  dot={{ r: 3, fill: "hsl(var(--accent))", strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: "hsl(var(--accent))", strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
