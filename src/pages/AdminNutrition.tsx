import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Utensils, Eye, MoreHorizontal, CheckCircle2, XCircle, Calendar, User, Power, Pencil } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { mockNutritionPlans, type NutritionPlan } from "@/data/mockData";
import { nutritionPlanDetailStore, addNutritionPlanDetail, genId, type NutritionPlanDetail } from "@/data/nutritionPlanStore";
import CreateNutritionPlanSheet from "@/components/admin/CreateNutritionPlanSheet";
import { toast } from "sonner";

const AdminNutrition = () => {
  const [search, setSearch] = useState("");
  const [plans, setPlans] = useState(mockNutritionPlans);
  const navigate = useNavigate();

  const matchesSearch = (p: NutritionPlan) =>
    p.clientName.toLowerCase().includes(search.toLowerCase()) ||
    p.planName.toLowerCase().includes(search.toLowerCase()) ||
    p.type.toLowerCase().includes(search.toLowerCase());

  const activePlans = plans.filter((p) => p.active && matchesSearch(p));
  const inactivePlans = plans.filter((p) => !p.active && matchesSearch(p));
  const uniqueClients = new Set(plans.filter((p) => p.active).map((p) => p.clientId)).size;

  const togglePlanActive = (planId: string, activate: boolean) => {
    setPlans((prev) => {
      const plan = prev.find((p) => p.id === planId);
      if (!plan) return prev;

      return prev.map((p) => {
        if (p.id === planId) return { ...p, active: activate, endDate: activate ? null : new Date().toISOString().split("T")[0] };
        // If activating, deactivate other plans for same client
        if (activate && p.clientId === plan.clientId && p.active) {
          return { ...p, active: false, endDate: new Date().toISOString().split("T")[0] };
        }
        return p;
      });
    });

    // Sync detail store
    if (nutritionPlanDetailStore[planId]) {
      nutritionPlanDetailStore[planId].active = activate;
    }

    toast.success(activate ? "Plan activado" : "Plan desactivado");
  };

  const handleCreate = (data: { planName: string; clientId: string; clientName: string; objective: string }) => {
    const id = genId();
    const today = new Date().toISOString().split("T")[0];

    // Deactivate existing active plans for this client
    setPlans((prev) => {
      const updated = prev.map((p) =>
        p.clientId === data.clientId && p.active
          ? { ...p, active: false, endDate: today }
          : p
      );

      const newListPlan: NutritionPlan = {
        id,
        clientId: data.clientId,
        clientName: data.clientName,
        planName: data.planName,
        type: "Sin definir",
        calories: 0,
        active: true,
        startDate: today,
        endDate: null,
      };
      return [newListPlan, ...updated];
    });

    const detail: NutritionPlanDetail = {
      id,
      clientId: data.clientId,
      clientName: data.clientName,
      planName: data.planName,
      objective: data.objective,
      active: true,
      startDate: today,
      endDate: null,
      meals: [],
      supplements: [],
      recommendations: [],
    };
    addNutritionPlanDetail(detail);
    navigate(`/admin/nutrition/${id}`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Utensils className="h-6 w-6 text-primary" />
              Nutrición
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Planes nutricionales de tus clientes
            </p>
          </div>
          <CreateNutritionPlanSheet onCreated={handleCreate} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{plans.filter((p) => p.active).length}</p>
              <p className="text-xs text-muted-foreground">Planes activos</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <XCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{plans.filter((p) => !p.active).length}</p>
              <p className="text-xs text-muted-foreground">Planes anteriores</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-accent/15 flex items-center justify-center">
              <User className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{uniqueClients}</p>
              <p className="text-xs text-muted-foreground">Clientes con nutrición</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, plan o tipo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>

        {/* Active Plans */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Planes Activos
            <span className="text-xs font-normal text-muted-foreground ml-1">({activePlans.length})</span>
          </h2>
          {activePlans.length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
              No hay planes activos
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activePlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} navigate={navigate} onToggle={togglePlanActive} />
              ))}
            </div>
          )}
        </div>

        {/* Inactive Plans */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <XCircle className="h-5 w-5 text-muted-foreground" />
            Planes Anteriores
            <span className="text-xs font-normal text-muted-foreground ml-1">({inactivePlans.length})</span>
          </h2>
          {inactivePlans.length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
              No hay planes anteriores
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {inactivePlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} navigate={navigate} onToggle={togglePlanActive} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

const PlanCard = ({
  plan,
  navigate,
  onToggle,
}: {
  plan: NutritionPlan;
  navigate: ReturnType<typeof import("react-router-dom").useNavigate>;
  onToggle: (id: string, activate: boolean) => void;
}) => (
  <div className="bg-card border border-border rounded-xl p-4 space-y-3 hover:border-primary/30 transition-colors">
    <div className="flex items-start justify-between">
      <div className="space-y-1 flex-1 min-w-0">
        <button
          onClick={() => navigate(`/admin/nutrition/${plan.id}`)}
          className="font-semibold text-foreground hover:text-primary transition-colors text-left truncate block w-full"
        >
          {plan.planName}
        </button>
        <button
          onClick={() => navigate(`/admin/clients/${plan.clientId}`)}
          className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          <User className="h-3 w-3" />
          {plan.clientName}
        </button>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-card border-border">
          <DropdownMenuItem className="gap-2" onClick={() => navigate(`/admin/nutrition/${plan.id}`)}>
            <Pencil className="h-4 w-4" />Editar plan
          </DropdownMenuItem>
          {plan.active ? (
            <DropdownMenuItem className="text-destructive gap-2" onClick={() => onToggle(plan.id, false)}>
              <XCircle className="h-4 w-4" />Desactivar
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem className="text-primary gap-2" onClick={() => onToggle(plan.id, true)}>
              <Power className="h-4 w-4" />Reactivar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <div className="flex items-center gap-2 flex-wrap">
      <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-xs">
        {plan.type}
      </Badge>
      {plan.calories > 0 && (
        <Badge variant="outline" className="border-border text-muted-foreground text-xs font-mono">
          {plan.calories} kcal
        </Badge>
      )}
    </div>
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        {plan.startDate}
      </span>
      {plan.endDate && (
        <span>→ {plan.endDate}</span>
      )}
    </div>
  </div>
);

export default AdminNutrition;
