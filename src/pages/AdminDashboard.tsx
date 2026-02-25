import { useNavigate } from "react-router-dom";
import { Users, Utensils, Dumbbell, TrendingUp, Activity, CalendarDays } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";

const stats = [
  { title: "Clientes Activos", value: "24", change: "+3 este mes", icon: Users, positive: true },
  { title: "Planes de Nutrición", value: "18", change: "+5 esta semana", icon: Utensils, positive: true },
  { title: "Entrenamientos", value: "42", change: "+12 esta semana", icon: Dumbbell, positive: true },
  { title: "Tasa de Retención", value: "94%", change: "+2.1%", icon: TrendingUp, positive: true },
];

const recentClients = [
  { id: "1", name: "Carlos Martínez", plan: "Volumen", status: "Activo", lastSession: "Hoy" },
  { id: "2", name: "Ana López", plan: "Definición", status: "Activo", lastSession: "Ayer" },
  { id: "3", name: "Diego Fernández", plan: "Mantenimiento", status: "Pendiente", lastSession: "Hace 3 días" },
  { id: "4", name: "Laura García", plan: "Volumen", status: "Activo", lastSession: "Hoy" },
  { id: "5", name: "Miguel Torres", plan: "Definición", status: "Inactivo", lastSession: "Hace 1 semana" },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  return (
    <AdminLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Resumen general de tu actividad
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Clients Table */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-semibold text-foreground">Clientes Recientes</h2>
              <span className="text-xs text-primary cursor-pointer hover:underline">Ver todos</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre</th>
                    <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Plan</th>
                    <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                    <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Última sesión</th>
                  </tr>
                </thead>
                <tbody>
                  {recentClients.map((client) => (
                    <tr key={client.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/admin/clients/${client.id}`)}>
                      <td className="px-5 py-3.5 text-sm font-medium text-foreground">{client.name}</td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{client.plan}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            client.status === "Activo"
                              ? "bg-primary/15 text-primary"
                              : client.status === "Pendiente"
                              ? "bg-accent/15 text-accent"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {client.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{client.lastSession}</td>
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
              {[
                { icon: Users, label: "Añadir cliente", desc: "Registrar nuevo cliente" },
                { icon: Utensils, label: "Crear plan nutricional", desc: "Nuevo plan personalizado" },
                { icon: Dumbbell, label: "Crear entrenamiento", desc: "Nueva rutina de ejercicios" },
                { icon: CalendarDays, label: "Agendar sesión", desc: "Programar próxima consulta" },
                { icon: Activity, label: "Revisar progreso", desc: "Ver métricas de clientes" },
              ].map((action) => (
                <button
                  key={action.label}
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
