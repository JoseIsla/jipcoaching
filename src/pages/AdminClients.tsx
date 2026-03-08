import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Utensils, Dumbbell, MoreHorizontal, UserX, UserCheck, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AdminLayout from "@/components/admin/AdminLayout";
import AddClientSheet, { type NewClientData } from "@/components/admin/AddClientSheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useClientStore } from "@/data/useClientStore";
import { useClientDetailStore } from "@/data/useClientDetailStore";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/useTranslation";
import { getStatusLabel, packTypeLabels } from "@/types/api";

type FilterType = "all" | "nutrition" | "training" | "both";

const AdminClients = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [toggleClient, setToggleClient] = useState<{ id: string; name: string; isActive: boolean } | null>(null);
  const [deleteClient, setDeleteClient] = useState<{ id: string; name: string; step: 1 | 2 } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { clients, fetchClients, addClient, updateClientStatus, deleteClient: removeClient } = useClientStore();

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleClientAdded = async (data: NewClientData) => {
    // The AddClientSheet now handles calling the API directly
    // Just close and refresh
  };

  const filtered = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());

    if (filter === "all") return matchesSearch;
    if (filter === "both") return matchesSearch && c.services.length === 2;
    return matchesSearch && c.services.includes(filter) && c.services.length === 1;
  });

  const statusClass = (status?: string) => {
    const s = String(status ?? "").toUpperCase();
    if (s === "ACTIVE") return "bg-primary/15 text-primary border-primary/20";
    if (s === "PAUSED") return "bg-muted text-muted-foreground border-border";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("clients.title")}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t("clients.registered", { n: clients.length })}
            </p>
          </div>
          <Button className="glow-primary-sm gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("clients.addClient")}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("clients.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <div className="flex gap-2">
            {([
              { value: "all", label: t("common.all") },
              { value: "nutrition", label: t("clients.onlyNutrition") },
              { value: "training", label: t("clients.onlyTraining") },
              { value: "both", label: t("common.both") },
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
                <TableHead className="text-muted-foreground">{t("clients.tableHeaders.name")}</TableHead>
                <TableHead className="text-muted-foreground">{t("clients.tableHeaders.email")}</TableHead>
                <TableHead className="text-muted-foreground">{t("clients.tableHeaders.services")}</TableHead>
                <TableHead className="text-muted-foreground">{t("clients.tableHeaders.status")}</TableHead>
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
                          {t("common.nutrition")}
                        </Badge>
                      )}
                      {client.services.includes("training") && (
                        <Badge variant="outline" className="gap-1 border-accent/30 text-accent bg-accent/10 text-xs">
                          <Dumbbell className="h-3 w-3" />
                          {t("common.training")}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusClass(client.status)}`}>
                      {getStatusLabel(client.status)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/admin/clients/${client.id}`); }}>
                            {t("common.viewProfile")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              const isActive = String(client.status ?? "").toUpperCase() !== "PAUSED";
                              setToggleClient({ id: client.id, name: client.name, isActive });
                            }}
                            className={String(client.status ?? "").toUpperCase() !== "PAUSED" ? "text-destructive focus:text-destructive" : "text-primary focus:text-primary"}
                          >
                            {String(client.status ?? "").toUpperCase() !== "PAUSED" ? (
                              <><UserX className="h-4 w-4 mr-2" /> Desactivar</>
                            ) : (
                              <><UserCheck className="h-4 w-4 mr-2" /> Reactivar</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteClient({ id: client.id, name: client.name, step: 1 });
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Eliminar permanentemente
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                    {t("clients.noClients")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <AddClientSheet open={addOpen} onClose={() => setAddOpen(false)} onClientAdded={handleClientAdded} />

        <AlertDialog open={!!toggleClient} onOpenChange={(open) => !open && setToggleClient(null)}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">
                {toggleClient?.isActive ? "Desactivar cliente" : "Reactivar cliente"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                {toggleClient?.isActive
                  ? `¿Estás seguro de que quieres desactivar a ${toggleClient?.name}? El cliente pasará a estado inactivo.`
                  : `¿Estás seguro de que quieres reactivar a ${toggleClient?.name}?`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (!toggleClient) return;
                  const newApiStatus = toggleClient.isActive ? "PAUSED" : "ACTIVE";
                  const newDetailStatus = toggleClient.isActive ? "Inactivo" : "Activo";
                  updateClientStatus(toggleClient.id, newApiStatus);
                  useClientDetailStore.getState().updateDetail(toggleClient.id, { status: newDetailStatus as any });
                  toast({
                    title: toggleClient.isActive ? "Cliente desactivado" : "Cliente reactivado",
                    description: `${toggleClient.name} ahora está ${newDetailStatus.toLowerCase()}.`,
                  });
                  setToggleClient(null);
                }}
                className={toggleClient?.isActive ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"}
              >
                {toggleClient?.isActive ? "Desactivar" : "Reactivar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete – Double Confirmation */}
        <AlertDialog open={deleteClient?.step === 1} onOpenChange={(open) => { if (!open && deleteClient?.step === 1) setDeleteClient(null); }}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                Eliminar cliente
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                ¿Estás seguro de que quieres eliminar permanentemente a <strong className="text-foreground">{deleteClient?.name}</strong>? Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  if (deleteClient) setDeleteClient({ ...deleteClient, step: 2 });
                }}
                className="bg-destructive hover:bg-destructive/90"
              >
                Sí, continuar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={deleteClient?.step === 2} onOpenChange={(open) => !open && setDeleteClient(null)}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Confirmar eliminación definitiva
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Vas a eliminar a <strong className="text-foreground">{deleteClient?.name}</strong> de forma permanente. Se perderán todos sus datos, planes y registros asociados. <strong className="text-destructive">Esta acción es irreversible.</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (!deleteClient) return;
                  removeClient(deleteClient.id);
                  useClientDetailStore.getState().deleteDetail(deleteClient.id);
                  toast({
                    title: "Cliente eliminado",
                    description: `${deleteClient.name} ha sido eliminado permanentemente.`,
                    variant: "destructive",
                  });
                  setDeleteClient(null);
                }}
                className="bg-destructive hover:bg-destructive/90"
              >
                Eliminar permanentemente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminClients;
