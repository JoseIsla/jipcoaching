import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Utensils, Dumbbell, MoreHorizontal } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import AddClientSheet from "@/components/admin/AddClientSheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mockClients, type Client, type ServiceType } from "@/data/mockData";

type FilterType = "all" | "nutrition" | "training" | "both";

const AdminClients = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>(mockClients);
  const navigate = useNavigate();

  const handleClientAdded = (newClient: { name: string; email: string; phone: string; services: ServiceType[]; status: "Activo" | "Pendiente" }) => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const client: Client = {
      id: String(Date.now()),
      name: newClient.name,
      email: newClient.email,
      phone: newClient.phone,
      services: newClient.services,
      plan: "Sin asignar",
      status: newClient.status,
      startDate: now.toISOString().split("T")[0],
      joinedMonth: month,
    };
    setClients((prev) => [client, ...prev]);
  };

  const filtered = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());

    if (filter === "all") return matchesSearch;
    if (filter === "both") return matchesSearch && c.services.length === 2;
    return matchesSearch && c.services.includes(filter) && c.services.length === 1;
  });

  const statusClass = (status: Client["status"]) => {
    switch (status) {
      case "Activo":
        return "bg-primary/15 text-primary border-primary/20";
      case "Pendiente":
        return "bg-accent/15 text-accent border-accent/20";
      case "Inactivo":
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {clients.length} clientes registrados
            </p>
          </div>
          <Button className="glow-primary-sm gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Añadir cliente
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <div className="flex gap-2">
            {([
              { value: "all", label: "Todos" },
              { value: "nutrition", label: "Solo Nutrición" },
              { value: "training", label: "Solo Entrenamiento" },
              { value: "both", label: "Ambos" },
            ] as const).map((f) => (
              <Button
                key={f.value}
                variant={filter === f.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f.value)}
                className={filter === f.value ? "" : "border-border text-muted-foreground hover:text-foreground"}
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
                <TableHead className="text-muted-foreground">Nombre</TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground">Servicios</TableHead>
                <TableHead className="text-muted-foreground">Plan</TableHead>
                <TableHead className="text-muted-foreground">Estado</TableHead>
                <TableHead className="text-muted-foreground">Inicio</TableHead>
                <TableHead className="text-muted-foreground w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((client) => (
                <TableRow key={client.id} className="border-border/50 hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/admin/clients/${client.id}`)}>
                  <TableCell className="font-medium text-foreground">{client.name}</TableCell>
                  <TableCell className="text-muted-foreground">{client.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      {client.services.includes("nutrition") && (
                        <Badge variant="outline" className="gap-1 border-primary/30 text-primary bg-primary/10 text-xs">
                          <Utensils className="h-3 w-3" />
                          Nutrición
                        </Badge>
                      )}
                      {client.services.includes("training") && (
                        <Badge variant="outline" className="gap-1 border-accent/30 text-accent bg-accent/10 text-xs">
                          <Dumbbell className="h-3 w-3" />
                          Entrenamiento
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{client.plan}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusClass(client.status)}`}>
                      {client.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{client.startDate}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border">
                        <DropdownMenuItem onClick={() => navigate(`/admin/clients/${client.id}`)}>Ver perfil</DropdownMenuItem>
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                    No se encontraron clientes
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <AddClientSheet open={addOpen} onClose={() => setAddOpen(false)} onClientAdded={handleClientAdded} />
      </div>
    </AdminLayout>
  );
};

export default AdminClients;
