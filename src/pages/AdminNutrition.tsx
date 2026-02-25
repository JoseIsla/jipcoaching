import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Utensils, Eye, MoreHorizontal, CheckCircle2, XCircle, Calendar, User } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { mockNutritionPlans, type NutritionPlan } from "@/data/mockData";
import { nutritionPlanDetailStore, addNutritionPlanDetail, genId, type NutritionPlanDetail } from "@/data/nutritionPlanStore";
import CreateNutritionPlanSheet from "@/components/admin/CreateNutritionPlanSheet";

const PlanTable = ({ plans, navigate }: { plans: NutritionPlan[]; navigate: ReturnType<typeof useNavigate> }) => (
  <div className="bg-card border border-border rounded-xl overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow className="border-border hover:bg-transparent">
          <TableHead className="text-muted-foreground">Cliente</TableHead>
          <TableHead className="text-muted-foreground">Plan</TableHead>
          <TableHead className="text-muted-foreground">Tipo</TableHead>
          <TableHead className="text-muted-foreground">Kcal</TableHead>
          <TableHead className="text-muted-foreground">Inicio</TableHead>
          <TableHead className="text-muted-foreground">Fin</TableHead>
          <TableHead className="text-muted-foreground w-10"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {plans.map((plan) => (
          <TableRow key={plan.id} className="border-border/50 hover:bg-muted/30">
            <TableCell>
              <button onClick={() => navigate(`/admin/clients/${plan.clientId}`)} className="font-medium text-foreground hover:text-primary transition-colors text-left">
                {plan.clientName}
              </button>
            </TableCell>
            <TableCell>
              <button onClick={() => navigate(`/admin/nutrition/${plan.id}`)} className="font-medium text-foreground hover:text-primary transition-colors text-left">
                {plan.planName}
              </button>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-xs">
                {plan.type}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground font-mono text-sm">{plan.calories}</TableCell>
            <TableCell className="text-muted-foreground text-sm">{plan.startDate}</TableCell>
            <TableCell className="text-muted-foreground text-sm">{plan.endDate ?? "—"}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border">
                  <DropdownMenuItem className="gap-2" onClick={() => navigate(`/admin/nutrition/${plan.id}`)}>
                    <Eye className="h-4 w-4" />Ver / Editar plan
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2"><Calendar className="h-4 w-4" />Cambiar fechas</DropdownMenuItem>
                  {plan.active && (
                    <DropdownMenuItem className="text-destructive gap-2"><XCircle className="h-4 w-4" />Desactivar</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
        {plans.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
              No se encontraron planes de nutrición
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </div>
);

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

  const handleCreate = (data: { planName: string; clientId: string; clientName: string; objective: string }) => {
    const id = genId();
    const today = new Date().toISOString().split("T")[0];

    // Add to list
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
    setPlans((prev) => [newListPlan, ...prev]);

    // Create detail entry
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

    // Navigate to editor
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
          <PlanTable plans={activePlans} navigate={navigate} />
        </div>

        {/* Inactive Plans */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <XCircle className="h-5 w-5 text-muted-foreground" />
            Planes Anteriores
            <span className="text-xs font-normal text-muted-foreground ml-1">({inactivePlans.length})</span>
          </h2>
          <PlanTable plans={inactivePlans} navigate={navigate} />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminNutrition;
