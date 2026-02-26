import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TrendingUp, CalendarIcon } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useClientStore } from "@/data/useClientStore";

const item = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" as const },
});

const monthNames: Record<string, string> = {
  "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
  "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
  "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic",
};

const ClientEvolutionChart = () => {
  const { clients } = useClientStore();
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const clientEvolution = (() => {
    const monthsSet = new Set(clients.map((c) => c.joinedMonth));
    const sortedMonths = Array.from(monthsSet).sort();

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

  return (
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
  );
};

export default ClientEvolutionChart;
