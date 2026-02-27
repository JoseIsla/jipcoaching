import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { es as esLocale } from "date-fns/locale";
import { TrendingUp, CalendarIcon } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useClientStore } from "@/data/useClientStore";
import { useTranslation } from "@/i18n/useTranslation";

const item = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" as const },
});

const buildEvolutionData = (totalClients: number) => {
  const now = new Date();
  const data = [];
  // Build 6 months of mock evolution leading to current total
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = format(d, "MMM yy", { locale: esLocale });
    // Simulate gradual growth
    const factor = (6 - i) / 6;
    const total = Math.max(1, Math.round(totalClients * (0.4 + 0.6 * factor)));
    const prev = data.length > 0 ? data[data.length - 1].total : 0;
    const newClients = i === 5 ? 0 : Math.max(0, total - prev);
    data.push({ month, total, new: newClients });
  }
  // Fix "new" for first point
  if (data.length > 0) data[0].new = data[0].total;
  return data;
};

const ClientEvolutionChart = () => {
  const { t } = useTranslation();
  const { clients } = useClientStore();

  const clientEvolution = buildEvolutionData(clients.length);

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
        <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={clientEvolution} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
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
              itemStyle={{ color: "hsl(var(--primary))" }}
            />
            <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorTotal)" name="Clientes" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default ClientEvolutionChart;
