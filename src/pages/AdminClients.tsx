import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Utensils, Dumbbell, MoreHorizontal, AlertTriangle } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import AddClientSheet, { type NewClientData } from "@/components/admin/AddClientSheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClientStore } from "@/data/useClientStore";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/useTranslation";
import { getStatusLabel, packTypeLabels } from "@/types/api";

type FilterType = "all" | "nutrition" | "training" | "both";

const AdminClients = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [addOpen, setAddOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { clients, fetchClients, addClient } = useClientStore();

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
      </div>
    </AdminLayout>
  );
};

export default AdminClients;
