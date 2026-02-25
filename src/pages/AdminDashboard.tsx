import { useNavigate } from "react-router-dom";
import { Users, Utensils, Dumbbell, TrendingUp, Activity } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import {
  mockClients,
  getActiveClients,
  getNewClientsThisMonth,
  getActiveNutritionPlans,
  getActiveTrainingPlans,
  getRetentionRate,
} from "@/data/mockData";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const activeClients = getActiveClients();
  const newThisMonth = getNewClientsThisMonth();
  const activeNutrition = getActiveNutritionPlans();
  const activeTraining = getActiveTrainingPlans();
  const retention = getRetentionRate();

  const stats = [
    { title: "Clientes Activos", value: String(activeClients.length), change: `+${newThisMonth.length} este mes`, icon: Users, positive: true },
    { title: "Planes de Nutrición", value: String(activeNutrition.length), change: `${activeNutrition.length} activos`, icon: Utensils, positive: true },
    { title: "Entrenamientos", value: String(activeTraining.length), change: `${activeTraining.length} activos`, icon: Dumbbell, positive: true },
    { title: "Tasa de Retención", value: `${retention}%`, change: `${mockClients.filter(c => c.status !== "Inactivo").length}/${mockClients.length} clientes`, icon: TrendingUp, positive: retention >= 80 },
  ];

  const recentClients = mockClients.slice(0, 5);

  const quickActions = [
    { icon: Users, label: "Añadir cliente", desc: "Registrar nuevo cliente", path: "/admin/clients" },
    { icon: Utensils, label: "Crear plan nutricional", desc: "Nuevo plan personalizado", path: "/admin/nutrition" },
    { icon: Dumbbell, label: "Crear entrenamiento", desc: "Nueva rutina de ejercicios", path: "/admin/training" },
    { icon: Activity, label: "Revisar progreso", desc: "Ver métricas de clientes", path: "/admin/progress" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Resumen general de tu actividad</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Clients Table */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-semibold text-foreground">Clientes Recientes</h2>
              <span className="text-xs text-primary cursor-pointer hover:underline" onClick={() => navigate("/admin/clients")}>Ver todos</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre</th>
                    <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Plan</th>
                    <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                    <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Inicio</th>
                  </tr>
                </thead>
                <tbody>
                  {recentClients.map((client) => (
                    <tr key={client.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/admin/clients/${client.id}`)}>
                      <td className="px-5 py-3.5 text-sm font-medium text-foreground">{client.name}</td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{client.plan}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          client.status === "Activo" ? "bg-primary/15 text-primary"
                            : client.status === "Pendiente" ? "bg-accent/15 text-accent"
                            : "bg-muted text-muted-foreground"
                        }`}>{client.status}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{client.startDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h2 className="font-semibold text-foreground">Acciones Rápidas</h2>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted border border-transparent hover:border-primary/20 transition-all text-left group"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                    <action.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
