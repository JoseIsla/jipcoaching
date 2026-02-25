import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Utensils, Eye, MoreHorizontal, CheckCircle2, XCircle, Calendar, User } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NutritionPlan {
  id: string;
  clientId: string;
  clientName: string;
  planName: string;
  type: string;
  calories: number;
  active: boolean;
  startDate: string;
  endDate: string | null;
}

const mockPlans: NutritionPlan[] = [
  { id: "p1", clientId: "1", clientName: "Carlos Martínez", planName: "Volumen Fase 1", type: "Volumen", calories: 3200, active: true, startDate: "2025-02-01", endDate: null },
  { id: "p2", clientId: "1", clientName: "Carlos Martínez", planName: "Definición Verano", type: "Definición", calories: 2400, active: false, startDate: "2024-09-01", endDate: "2025-01-31" },
  { id: "p3", clientId: "2", clientName: "Ana López", planName: "Definición Q1", type: "Definición", calories: 1800, active: true, startDate: "2025-02-01", endDate: null },
  { id: "p4", clientId: "2", clientName: "Ana López", planName: "Mantenimiento Inicial", type: "Mantenimiento", calories: 2000, active: false, startDate: "2024-06-15", endDate: "2025-01-31" },
  { id: "p5", clientId: "4", clientName: "Laura García", planName: "Volumen Controlado", type: "Volumen", calories: 2600, active: true, startDate: "2025-01-20", endDate: null },
  { id: "p6", clientId: "5", clientName: "Miguel Torres", planName: "Pérdida de grasa", type: "Pérdida de grasa", calories: 1700, active: false, startDate: "2024-11-05", endDate: "2025-01-15" },
  { id: "p7", clientId: "6", clientName: "Sofía Ruiz", planName: "Recomposición Activa", type: "Recomposición", calories: 2200, active: true, startDate: "2025-02-18", endDate: null },
  { id: "p8", clientId: "8", clientName: "María Jiménez", planName: "Mantenimiento Plus", type: "Mantenimiento", calories: 2100, active: true, startDate: "2024-12-10", endDate: null },
  { id: "p9", clientId: "8", clientName: "María Jiménez", planName: "Volumen Off-Season", type: "Volumen", calories: 2800, active: false, startDate: "2024-06-01", endDate: "2024-12-09" },
];

type StatusFilter = "all" | "active" | "inactive";

const AdminNutrition = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const navigate = useNavigate();

  const filtered = mockPlans.filter((p) => {
    const matchesSearch =
      p.clientName.toLowerCase().includes(search.toLowerCase()) ||
      p.planName.toLowerCase().includes(search.toLowerCase()) ||
      p.type.toLowerCase().includes(search.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "active") return matchesSearch && p.active;
    return matchesSearch && !p.active;
  });

  const activePlans = mockPlans.filter((p) => p.active).length;
  const inactivePlans = mockPlans.filter((p) => !p.active).length;
  const uniqueClients = new Set(mockPlans.filter((p) => p.active).map((p) => p.clientId)).size;

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
          <Button className="glow-primary-sm gap-2">
            <Plus className="h-4 w-4" />
            Crear plan
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{activePlans}</p>
              <p className="text-xs text-muted-foreground">Planes activos</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <XCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{inactivePlans}</p>
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, plan o tipo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <div className="flex gap-2">
            {([
              { value: "all", label: "Todos" },
              { value: "active", label: "Activos" },
              { value: "inactive", label: "Anteriores" },
            ] as const).map((f) => (
              <Button
                key={f.value}
                variant={statusFilter === f.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(f.value)}
                className={statusFilter === f.value ? "" : "border-border text-muted-foreground hover:text-foreground"}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Cliente</TableHead>
                <TableHead className="text-muted-foreground">Plan</TableHead>
                <TableHead className="text-muted-foreground">Tipo</TableHead>
                <TableHead className="text-muted-foreground">Kcal</TableHead>
                <TableHead className="text-muted-foreground">Estado</TableHead>
                <TableHead className="text-muted-foreground">Inicio</TableHead>
                <TableHead className="text-muted-foreground">Fin</TableHead>
                <TableHead className="text-muted-foreground w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((plan) => (
                <TableRow key={plan.id} className="border-border/50 hover:bg-muted/30">
                  <TableCell>
                    <button
                      onClick={() => navigate(`/admin/clients/${plan.clientId}`)}
                      className="font-medium text-foreground hover:text-primary transition-colors text-left"
                    >
                      {plan.clientName}
                    </button>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{plan.planName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-xs">
                      {plan.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">{plan.calories}</TableCell>
                  <TableCell>
                    {plan.active ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border bg-primary/15 text-primary border-primary/20">
                        <CheckCircle2 className="h-3 w-3" />
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border bg-muted text-muted-foreground border-border">
                        <XCircle className="h-3 w-3" />
                        Finalizado
                      </span>
                    )}
                  </TableCell>
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
                        <DropdownMenuItem className="gap-2">
                          <Eye className="h-4 w-4" />
                          Ver plan
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Calendar className="h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        {plan.active && (
                          <DropdownMenuItem className="text-destructive gap-2">
                            <XCircle className="h-4 w-4" />
                            Desactivar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                    No se encontraron planes de nutrición
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminNutrition;
