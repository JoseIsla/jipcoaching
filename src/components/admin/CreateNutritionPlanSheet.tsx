import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, AlertTriangle } from "lucide-react";
import { mockClients, mockNutritionPlans } from "@/data/mockData";
import { clientDetailStore } from "@/data/clientStore";
import { toast } from "sonner";

interface Props {
  onCreated: (plan: { planName: string; clientId: string; clientName: string; objective: string }) => void;
  activePlansByClient: Record<string, string>; // clientId -> planName
}

const CreateNutritionPlanSheet = ({ onCreated, activePlansByClient }: Props) => {
  const [open, setOpen] = useState(false);
  const [planName, setPlanName] = useState("");
  const [clientId, setClientId] = useState("");
  const [objective, setObjective] = useState("");
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const nutritionClients = mockClients.filter((c) => {
    const detail = clientDetailStore[c.id];
    return detail ? detail.services.includes("nutrition") : c.services.includes("nutrition");
  });

  const existingActivePlan = clientId ? activePlansByClient[clientId] : undefined;

  const handleCreate = () => {
    if (!planName.trim() || !clientId || !objective.trim()) {
      toast.error("Completa todos los campos");
      return;
    }
    if (existingActivePlan && !confirmDeactivate) {
      return; // Should not happen, button is hidden
    }
    const client = mockClients.find((c) => c.id === clientId);
    if (!client) return;
    onCreated({ planName: planName.trim(), clientId, clientName: client.name, objective: objective.trim() });
    setPlanName("");
    setClientId("");
    setObjective("");
    setConfirmDeactivate(false);
    setOpen(false);
    toast.success("Plan creado correctamente");
  };

  const handleClientChange = (id: string) => {
    setClientId(id);
    setConfirmDeactivate(false);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setConfirmDeactivate(false); setClientId(""); } }}>
      <SheetTrigger asChild>
        <Button className="glow-primary-sm gap-2">
          <Plus className="h-4 w-4" />
          Crear plan
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground">Nuevo Plan Nutricional</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 mt-6">
          <div className="space-y-2">
            <Label className="text-muted-foreground text-sm">Nombre del plan</Label>
            <Input
              placeholder="Ej: Definición Fase 1"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="bg-muted/30 border-border"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground text-sm">Asignar a cliente</Label>
            <Select value={clientId} onValueChange={handleClientChange}>
              <SelectTrigger className="bg-muted/30 border-border">
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {nutritionClients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Warning if client already has active plan */}
          {existingActivePlan && !confirmDeactivate && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-400">Este cliente ya tiene un plan activo</p>
                  <p className="text-xs text-muted-foreground">
                    Plan actual: <span className="font-medium text-foreground">{existingActivePlan}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Solo puede haber un plan activo por cliente. Al crear uno nuevo, el anterior se desactivará automáticamente.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                onClick={() => setConfirmDeactivate(true)}
              >
                Desactivar plan anterior y continuar
              </Button>
            </div>
          )}

          {existingActivePlan && confirmDeactivate && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
              <p className="text-xs text-primary">
                ✓ El plan "{existingActivePlan}" se desactivará al crear el nuevo plan.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-muted-foreground text-sm">Objetivo principal</Label>
            <Textarea
              placeholder="Ej: Reducir porcentaje de grasa sin perder masa muscular..."
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="bg-muted/30 border-border min-h-[100px]"
            />
          </div>
          <Button
            className="w-full glow-primary-sm"
            onClick={handleCreate}
            disabled={!planName.trim() || !clientId || !objective.trim() || (!!existingActivePlan && !confirmDeactivate)}
          >
            Crear plan
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CreateNutritionPlanSheet;
