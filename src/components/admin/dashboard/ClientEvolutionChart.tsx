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

const ClientEvolutionChart = () => {
  const { t } = useTranslation();
  const { clients } = useClientStore();

  // Without joinedMonth from backend, show a simple total clients count
  const clientEvolution = [
    { month: t("common.total"), total: clients.length, new: 0 },
  ];

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
      </div>
      <div className="flex items-center justify-center h-56">
        <div className="text-center space-y-2">
          <p className="text-5xl font-bold text-foreground">{clients.length}</p>
          <p className="text-sm text-muted-foreground">{t("dashboard.activeClients")}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default ClientEvolutionChart;
