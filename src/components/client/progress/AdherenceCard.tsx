import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Cell, ReferenceLine,
} from "recharts";
import { useQuestionnaireStore } from "@/data/useQuestionnaireStore";
import { computeAdherence } from "@/utils/progressHelpers";

interface AdherenceCardProps {
  clientId: string;
}

const AdherenceCard = ({ clientId }: AdherenceCardProps) => {
  const allEntries = useQuestionnaireStore((s) => s.entries);
  const adherenceData = useMemo(() => computeAdherence(allEntries, clientId), [allEntries, clientId]);
  const avgAdherence = adherenceData.length > 0
    ? Math.round(adherenceData.reduce((s, d) => s + d.rate, 0) / adherenceData.length)
    : 0;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
          Adherencia a check-ins
        </h3>
        <Badge variant="outline" className="text-primary border-primary/30 text-[10px]">
          {avgAdherence}% media
        </Badge>
      </div>
      {adherenceData.length > 0 ? (
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={adherenceData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
            <ReferenceLine y={100} stroke="hsl(var(--primary))" strokeDasharray="3 3" strokeOpacity={0.3} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12, color: "hsl(var(--card-foreground))" }}
              itemStyle={{ color: "hsl(var(--primary))" }}
              formatter={(value: number, _name: string, props: any) => [`${value}% (${props.payload.answered}/${props.payload.total})`, props.payload.weekFull]}
              labelFormatter={() => ""}
            />
            <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
              {adherenceData.map((entry, i) => (
                <Cell key={i} fill={entry.rate === 100 ? "hsl(110 100% 54%)" : entry.rate >= 50 ? "hsl(45 100% 55%)" : "hsl(0 70% 55%)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">Sin datos de adherencia aún.</p>
      )}
    </div>
  );
};

export default AdherenceCard;
