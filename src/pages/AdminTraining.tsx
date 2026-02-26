import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Dumbbell, MoreHorizontal, CheckCircle2, XCircle, Calendar, Eye, User, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTrainingPlanStore } from "@/data/useTrainingPlanStore";
import type { TrainingBlock } from "@/data/useTrainingPlanStore";
import CreateTrainingPlanSheet from "@/components/admin/CreateTrainingPlanSheet";
import { useTranslation } from "@/i18n/useTranslation";

const blockColor: Record<string, string> = {
  Hipertrofia: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  Intensificación: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  Peaking: "bg-red-500/15 text-red-400 border-red-500/20",
  Tapering: "bg-purple-500/15 text-purple-400 border-purple-500/20",
};

interface PlanEntry {
  id: string; clientId: string; clientName: string; planName: string; modality: string;
  block: TrainingBlock; weeksDuration: number; currentWeek: number | null;
  active: boolean; startDate: string; endDate: string | null;
}

const PlanTable = ({ plans, navigate, onDeactivate, t }: {
  plans: PlanEntry[]; navigate: ReturnType<typeof useNavigate>;
  onDeactivate?: (id: string) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) => {
  const getCurrentBlock = useTrainingPlanStore((s) => s.getCurrentBlock);
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground">{t("trainingPage.tableHeaders.client")}</TableHead>
            <TableHead className="text-muted-foreground">{t("trainingPage.tableHeaders.plan")}</TableHead>
            <TableHead className="text-muted-foreground">{t("trainingPage.tableHeaders.modality")}</TableHead>
            <TableHead className="text-muted-foreground">{t("trainingPage.tableHeaders.block")}</TableHead>
            <TableHead className="text-muted-foreground">{t("trainingPage.tableHeaders.weeks")}</TableHead>
            <TableHead className="text-muted-foreground">{t("trainingPage.tableHeaders.start")}</TableHead>
            <TableHead className="text-muted-foreground">{t("trainingPage.tableHeaders.end")}</TableHead>
            <TableHead className="text-muted-foreground w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.id} className="border-border/50 hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/admin/training/${plan.id}`)}>
              <TableCell className="font-medium text-foreground">{plan.clientName}</TableCell>
              <TableCell className="font-medium text-foreground">{plan.planName}</TableCell>
              <TableCell><Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-xs">{plan.modality}</Badge></TableCell>
              <TableCell>{(() => { const cb = getCurrentBlock(plan.id) || plan.block; return <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full border ${blockColor[cb] || ""}`}>{cb}</span>; })()}</TableCell>
              <TableCell className="text-muted-foreground font-mono text-sm">{plan.active && plan.currentWeek ? `${plan.currentWeek}/${plan.weeksDuration}` : plan.weeksDuration}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{plan.startDate}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{plan.endDate ?? "—"}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border-border">
                    <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); navigate(`/admin/training/${plan.id}`); }}><Eye className="h-4 w-4" />{t("trainingPage.viewPlan")}</DropdownMenuItem>
                    <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); navigate(`/admin/training/${plan.id}/edit`); }}><Pencil className="h-4 w-4" />{t("trainingPage.editPlan")}</DropdownMenuItem>
                    {plan.active && onDeactivate && (
                      <DropdownMenuItem className="text-destructive gap-2" onClick={(e) => { e.stopPropagation(); onDeactivate(plan.id); }}><XCircle className="h-4 w-4" />{t("trainingPage.deactivate")}</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {plans.length === 0 && (
            <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">{t("trainingPage.noPlans")}</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

const AdminTraining = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const plans = useTrainingPlanStore((s) => s.plans);
  const togglePlanActive = useTrainingPlanStore((s) => s.togglePlanActive);

  const matchesSearch = (p: PlanEntry) =>
    p.clientName.toLowerCase().includes(search.toLowerCase()) ||
    p.planName.toLowerCase().includes(search.toLowerCase()) ||
    p.modality.toLowerCase().includes(search.toLowerCase()) ||
    p.block.toLowerCase().includes(search.toLowerCase());

  const activePlans = plans.filter((p) => p.active && matchesSearch(p));
  const inactivePlans = plans.filter((p) => !p.active && matchesSearch(p));
  const uniqueClients = new Set(plans.filter((p) => p.active).map((p) => p.clientId)).size;

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Dumbbell className="h-6 w-6 text-primary" />{t("trainingPage.title")}</h1>
            <p className="text-muted-foreground text-sm mt-1">{t("trainingPage.subtitle")}</p>
          </div>
          <CreateTrainingPlanSheet />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center"><CheckCircle2 className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold text-foreground">{plans.filter((p) => p.active).length}</p><p className="text-xs text-muted-foreground">{t("trainingPage.activePlans")}</p></div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center"><XCircle className="h-5 w-5 text-muted-foreground" /></div>
            <div><p className="text-2xl font-bold text-foreground">{plans.filter((p) => !p.active).length}</p><p className="text-xs text-muted-foreground">{t("trainingPage.previousPlans")}</p></div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-accent/15 flex items-center justify-center"><User className="h-5 w-5 text-accent" /></div>
            <div><p className="text-2xl font-bold text-foreground">{uniqueClients}</p><p className="text-xs text-muted-foreground">{t("trainingPage.clientsWithTraining")}</p></div>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("trainingPage.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />{t("trainingPage.activePlans")}
            <span className="text-xs font-normal text-muted-foreground ml-1">({activePlans.length})</span>
          </h2>
          <PlanTable plans={activePlans} navigate={navigate} onDeactivate={(id) => togglePlanActive(id, false)} t={t} />
        </div>

        <InactivePlansSection plans={inactivePlans} navigate={navigate} t={t} />
      </div>
    </AdminLayout>
  );
};

const InactivePlansSection = ({ plans, navigate, t }: { plans: PlanEntry[]; navigate: ReturnType<typeof useNavigate>; t: (key: string) => string }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="space-y-3">
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 text-lg font-semibold text-foreground hover:text-primary transition-colors w-full text-left">
        <XCircle className="h-5 w-5 text-muted-foreground" />{t("trainingPage.previousPlans")}
        <span className="text-xs font-normal text-muted-foreground ml-1">({plans.length})</span>
        <span className="ml-auto">{expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}</span>
      </button>
      {expanded && (
        plans.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground text-sm">{t("trainingPage.noPreviousPlans")}</div>
        ) : (<PlanTable plans={plans} navigate={navigate} t={t} />)
      )}
    </div>
  );
};

export default AdminTraining;
