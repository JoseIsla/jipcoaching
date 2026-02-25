import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  icon: LucideIcon;
  positive?: boolean;
}

const StatCard = ({ title, value, change, icon: Icon, positive }: StatCardProps) => {
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors group">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {change && (
            <p className={`text-xs font-medium ${positive ? "text-primary" : "text-destructive"}`}>
              {change}
            </p>
          )}
        </div>
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
