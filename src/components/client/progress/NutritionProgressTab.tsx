import { useMemo } from "react";
import { TrendingDown, TrendingUp, Weight } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell, ReferenceLine,
} from "recharts";
import { useTranslation } from "@/i18n/useTranslation";
import ProgressPhotosSection from "@/components/client/ProgressPhotosSection";
import { computeWeightDeltas } from "@/utils/progressHelpers";

interface NutritionProgressTabProps {
  clientId: string;
  weightData: { date: string; weight: number }[];
}

const NutritionProgressTab = ({ clientId, weightData }: NutritionProgressTabProps) => {
  const { t } = useTranslation();

  const latestWeight = weightData.length > 0 ? weightData[weightData.length - 1].weight : null;
  const weightDelta = weightData.length >= 2
    ? (weightData[weightData.length - 1].weight - weightData[0].weight).toFixed(1)
    : null;
  const weeklyWeight = weightData.length >= 2
    ? (weightData[weightData.length - 1].weight - weightData[weightData.length - 2].weight).toFixed(1)
    : null;
  const weightDeltas = useMemo(() => computeWeightDeltas(weightData), [weightData]);

  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <Weight className="h-4 w-4 text-primary mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">{latestWeight ?? "—"}</p>
          <p className="text-[9px] text-muted-foreground">{t("clientProgress.currentWeight")}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          {weeklyWeight && Number(weeklyWeight) < 0
            ? <TrendingDown className="h-4 w-4 text-primary mx-auto mb-1" />
            : <TrendingUp className="h-4 w-4 text-primary mx-auto mb-1" />}
          <p className="text-xl font-bold text-foreground">{weeklyWeight ? `${Number(weeklyWeight) > 0 ? "+" : ""}${weeklyWeight}` : "—"}</p>
          <p className="text-[9px] text-muted-foreground">Δ semanal</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          {weightDelta && Number(weightDelta) < 0
            ? <TrendingDown className="h-4 w-4 text-primary mx-auto mb-1" />
            : <TrendingUp className="h-4 w-4 text-primary mx-auto mb-1" />}
          <p className="text-xl font-bold text-foreground">{weightDelta ? `${Number(weightDelta) > 0 ? "+" : ""}${weightDelta}` : "—"}</p>
          <p className="text-[9px] text-muted-foreground">{t("clientProgress.totalDelta")}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {weightData.length > 1 && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
              {t("clientProgress.weightEvolution")}
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 16%)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "hsl(0 0% 60%)" }}
                  tickFormatter={(d) => { const dt = new Date(d); return `${dt.getDate()}/${dt.getMonth() + 1}`; }}
                />
                <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 10, fill: "hsl(0 0% 60%)" }} />
                <Tooltip
                  contentStyle={{ background: "hsl(0 0% 7%)", border: "1px solid hsl(110 100% 54% / 0.3)", borderRadius: 8, fontSize: 12, color: "hsl(0 0% 100%)" }}
                  itemStyle={{ color: "hsl(110 100% 54%)" }}
                  labelFormatter={(d) => new Date(d).toLocaleDateString("es-ES")}
                />
                <Line type="monotone" dataKey="weight" stroke="hsl(110 100% 54%)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {weightDeltas.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
              Variación semanal de peso
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weightDeltas}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 16%)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(0 0% 60%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(0 0% 60%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}kg`} />
                <ReferenceLine y={0} stroke="hsl(0 0% 30%)" />
                <Tooltip
                  contentStyle={{ background: "hsl(0 0% 7%)", border: "1px solid hsl(110 100% 54% / 0.3)", borderRadius: 8, fontSize: 12, color: "hsl(0 0% 100%)" }}
                  itemStyle={{ color: "hsl(110 100% 54%)" }}
                  formatter={(value: number) => [`${value > 0 ? "+" : ""}${value} kg`, "Variación"]}
                  labelFormatter={(label) => `Semana ${label}`}
                />
                <Bar dataKey="delta" radius={[4, 4, 0, 0]}>
                  {weightDeltas.map((entry, i) => (
                    <Cell key={i} fill={entry.delta > 0 ? "hsl(110 100% 54%)" : entry.delta < 0 ? "hsl(0 70% 55%)" : "hsl(0 0% 40%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {weightData.length <= 1 && (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-sm text-muted-foreground">{t("clientProgress.notEnoughData")}</p>
        </div>
      )}

      <ProgressPhotosSection clientId={clientId} />
    </div>
  );
};

export default NutritionProgressTab;
