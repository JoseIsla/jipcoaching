import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Utensils, MoreHorizontal, CheckCircle2, XCircle, Calendar, User, Power, Pencil, ChevronDown, ChevronUp, Eye } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useNutritionPlanStore, type NutritionPlanListEntry } from "@/data/useNutritionPlanStore";
import { api } from "@/services/api";
import CreateNutritionPlanSheet from "@/components/admin/CreateNutritionPlanSheet";
import { toast } from "sonner";
import { useTranslation } from "@/i18n/useTranslation";

const AdminNutrition = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const plans = useNutritionPlanStore((s) => s.plans);
  const fetchPlans = useNutritionPlanStore((s) => s.fetchPlans);
  const togglePlanActive = useNutritionPlanStore((s) => s.togglePlanActive);

  const matchesSearch = (p: NutritionPlanListEntry) =>
    (p.clientName ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.planName ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.type ?? "").toLowerCase().includes(search.toLowerCase());

  const activePlans = plans.filter((p) => p.active && matchesSearch(p));
  const inactivePlans = plans.filter((p) => !p.active && matchesSearch(p));
  const uniqueClients = new Set(plans.filter((p) => p.active).map((p) => p.clientId)).size;

  const handleToggle = async (planId: string, activate: boolean) => {
    try {
      await api.patch(`/nutrition/plans/${planId}/toggle`, { isActive: activate });
      togglePlanActive(planId, activate);
      toast.success(activate ? t("nutritionPage.activated") : t("nutritionPage.deactivated"));
    } catch (err: any) {
      toast.error(err?.message || "Error al cambiar estado del plan");
    }
  };

  const handleCreate = async (data: { planName: string; clientId: string; clientName: string; objective: string; duplicateFromPlanId?: string }) => {
    try {
      const body: any = {
        clientId: data.clientId,
        title: data.planName,
        objective: data.objective,
      };
      if (data.duplicateFromPlanId && data.duplicateFromPlanId !== "none") {
        body.duplicateFromPlanId = data.duplicateFromPlanId;
      }
      const result = await api.post<any>("/nutrition/plans", body);

      if (result?.id) {
        await useNutritionPlanStore.getState().fetchPlans();
        navigate(`/admin/nutrition/${result.id}/edit`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Error al crear el plan");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Utensils className="h-6 w-6 text-primary" />
              {t("nutritionPage.title")}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">{t("nutritionPage.subtitle")}</p>
          </div>
          <CreateNutritionPlanSheet onCreated={handleCreate} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center"><CheckCircle2 className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold text-foreground">{plans.filter((p) => p.active).length}</p><p className="text-xs text-muted-foreground">{t("nutritionPage.activePlans")}</p></div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center"><XCircle className="h-5 w-5 text-muted-foreground" /></div>
            <div><p className="text-2xl font-bold text-foreground">{plans.filter((p) => !p.active).length}</p><p className="text-xs text-muted-foreground">{t("nutritionPage.previousPlans")}</p></div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-accent/15 flex items-center justify-center"><User className="h-5 w-5 text-accent" /></div>
            <div><p className="text-2xl font-bold text-foreground">{uniqueClients}</p><p className="text-xs text-muted-foreground">{t("nutritionPage.clientsWithNutrition")}</p></div>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("nutritionPage.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            {t("nutritionPage.activePlans")}
            <span className="text-xs font-normal text-muted-foreground ml-1">({activePlans.length})</span>
          </h2>
          {activePlans.length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground text-sm">{t("nutritionPage.noActivePlans")}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activePlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} navigate={navigate} onToggle={handleToggle} t={t} />
              ))}
            </div>
          )}
        </div>

        <InactivePlansSection plans={inactivePlans} navigate={navigate} onToggle={handleToggle} t={t} />
      </div>
    </AdminLayout>
  );
};

const InactivePlansSection = ({ plans, navigate, onToggle, t }: {
  plans: NutritionPlanListEntry[];
  navigate: ReturnType<typeof import("react-router-dom").useNavigate>;
  onToggle: (id: string, activate: boolean) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="space-y-3">
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 text-lg font-semibold text-foreground hover:text-primary transition-colors w-full text-left">
        <XCircle className="h-5 w-5 text-muted-foreground" />
        {t("nutritionPage.previousPlans")}
        <span className="text-xs font-normal text-muted-foreground ml-1">({plans.length})</span>
        <span className="ml-auto">{expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}</span>
      </button>
      {expanded && (
        plans.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground text-sm">{t("nutritionPage.noPreviousPlans")}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {plans.map((plan) => (<PlanCard key={plan.id} plan={plan} navigate={navigate} onToggle={onToggle} t={t} />))}
          </div>
        )
      )}
    </div>
  );
};

const PlanCard = ({ plan, navigate, onToggle, t }: {
  plan: NutritionPlanListEntry;
  navigate: ReturnType<typeof import("react-router-dom").useNavigate>;
  onToggle: (id: string, activate: boolean) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) => (
  <div className="bg-card border border-border rounded-xl p-4 space-y-3 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => navigate(`/admin/nutrition/${plan.id}`)}>
    <div className="flex items-start justify-between">
      <div className="space-y-1 flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate">{plan.planName}</p>
        <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/clients/${plan.clientId}`); }} className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
          <User className="h-3 w-3" />{plan.clientName}
        </button>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-card border-border">
          <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); navigate(`/admin/nutrition/${plan.id}`); }}><Eye className="h-4 w-4" />{t("nutritionPage.viewPlan")}</DropdownMenuItem>
          <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); navigate(`/admin/nutrition/${plan.id}/edit`); }}><Pencil className="h-4 w-4" />{t("nutritionPage.editPlan")}</DropdownMenuItem>
          {plan.active ? (
            <DropdownMenuItem className="text-destructive gap-2" onClick={(e) => { e.stopPropagation(); onToggle(plan.id, false); }}><XCircle className="h-4 w-4" />{t("nutritionPage.deactivate")}</DropdownMenuItem>
          ) : (
            <DropdownMenuItem className="text-primary gap-2" onClick={(e) => { e.stopPropagation(); onToggle(plan.id, true); }}><Power className="h-4 w-4" />{t("nutritionPage.reactivate")}</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <div className="flex items-center gap-2 flex-wrap">
      <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-xs">{plan.type}</Badge>
      {plan.calories > 0 && <Badge variant="outline" className="border-border text-muted-foreground text-xs font-mono">{plan.calories} kcal</Badge>}
    </div>
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{plan.startDate}</span>
      {plan.endDate && <span>→ {plan.endDate}</span>}
    </div>
  </div>
);

export default AdminNutrition;
