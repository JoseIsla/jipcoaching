import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format, parse } from "date-fns";
import { es as esLocale } from "date-fns/locale";
import { TrendingUp, Loader2 } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { api } from "@/services/api";
import { useTranslation } from "@/i18n/useTranslation";
import { isLocalMode } from "@/config/devMode";

const item = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" as const },
});

interface EvolutionPoint {
  month: string;
  newClients: number;
  total: number;
}

const demoEvolution: EvolutionPoint[] = [
  { month: "2025-11", newClients: 1, total: 1 },
  { month: "2025-12", newClients: 1, total: 2 },
  { month: "2026-01", newClients: 2, total: 4 },
  { month: "2026-02", newClients: 1, total: 5 },
  { month: "2026-03", newClients: 2, total: 7 },
];

const ClientEvolutionChart = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<{ month: string; total: number; new: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLocalMode()) {
      const formatted = demoEvolution.map((p) => {
        const date = parse(p.month, "yyyy-MM", new Date());
        return {
          month: format(date, "MMM yy", { locale: esLocale }),
          total: p.total,
          new: p.newClients,
        };
      });
      setData(formatted);
      setLoading(false);
      return;
    }

    api
      .get<EvolutionPoint[]>("/clients/stats/evolution")
      .then((raw) => {
        const formatted = (raw ?? []).map((p) => {
          const date = parse(p.month, "yyyy-MM", new Date());
          return {
            month: format(date, "MMM yy", { locale: esLocale }),
            total: p.total,
            new: p.newClients,
          };
        });
        setData(formatted);
      })
      .catch((err) => console.warn("Failed to fetch evolution:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div
      {...item(0.42)}
      className="bg-card border border-border rounded-xl p-4"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">
            {t("dashboard.clientEvolution")}
          </h2>
        </div>
        {data.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {data.length} {data.length === 1 ? "mes" : "meses"}
          </p>
        )}
      </div>
      <div className="h-56">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            No hay datos de evolución aún
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number, name: string) => [
                  value,
                  name === "total" ? "Total clientes" : "Nuevos",
                ]}
              />
              <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorTotal)" name="total" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
};

export default ClientEvolutionChart;
