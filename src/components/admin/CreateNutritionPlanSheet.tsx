import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, AlertTriangle, Copy } from "lucide-react";
import { useClientStore } from "@/data/useClientStore";
import { useClientDetailStore } from "@/data/useClientDetailStore";
import { useNutritionPlanStore } from "@/data/useNutritionPlanStore";
import { toast } from "sonner";

interface Props {
  onCreated: (plan: { planName: string; clientId: string; clientName: string; objective: string; duplicateFromPlanId?: string }) => void;
}

const CreateNutritionPlanSheet = ({ onCreated }: Props) => {
  const [open, setOpen] = useState(false);
  const [planName, setPlanName] = useState("");
  const [clientId, setClientId] = useState("");
  const [objective, setObjective] = useState("");
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [duplicateFromPlanId, setDuplicateFromPlanId] = useState<string>("");

  const allClients = useClientStore((s) => s.clients);
  const details = useClientDetailStore((s) => s.details);
  const plans = useNutritionPlanStore((s) => s.plans);
  const getActivePlanForClient = useNutritionPlanStore((s) => s.getActivePlanForClient);

  const nutritionClients = allClients.filter((c) =>
    c.services.includes("nutrition")
  );

  const existingActivePlan = clientId ? getActivePlanForClient(clientId) : undefined;

  // All plans available for duplication, grouped by client
  const allPlansForDuplication = plans.filter((p) => p.id); // all plans
  const sameClientPlans = clientId ? allPlansForDuplication.filter((p) => p.clientId === clientId) : [];
  const otherClientPlans = clientId ? allPlansForDuplication.filter((p) => p.clientId !== clientId) : [];

  const handleCreate = () => {
    if (!planName.trim() || !clientId || !objective.trim()) {
      toast.error("Completa todos los campos");
      return;
    }
    if (existingActivePlan && !confirmDeactivate) {
      return;
    }
    const client = allClients.find((c) => c.id === clientId);
    if (!client) return;

    onCreated({
      planName: planName.trim(),
      clientId,
      clientName: client.name,
      objective: objective.trim(),
      duplicateFromPlanId: duplicateFromPlanId || undefined,
    });
    setPlanName("");
    setClientId("");
    setObjective("");
    setConfirmDeactivate(false);
    setDuplicateFromPlanId("");
    setOpen(false);
    toast.success("Plan creado correctamente");
  };

  const handleClientChange = (id: string) => {
    setClientId(id);
    setConfirmDeactivate(false);
    setDuplicateFromPlanId("");
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setConfirmDeactivate(false); setClientId(""); setPlanName(""); setObjective(""); setDuplicateFromPlanId(""); } }}>
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

          {/* Duplicate from any plan */}
          {clientId && allPlansForDuplication.length > 0 && (
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm flex items-center gap-1.5">
                <Copy className="h-3.5 w-3.5" /> Duplicar plan existente (opcional)
              </Label>
              <Select value={duplicateFromPlanId} onValueChange={setDuplicateFromPlanId}>
                <SelectTrigger className="bg-muted/30 border-border">
                  <SelectValue placeholder="Crear desde cero" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border max-h-[300px]">
                  <SelectItem value="none">Crear desde cero</SelectItem>
                  {sameClientPlans.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Planes del mismo cliente</div>
                      {sameClientPlans.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.planName} {p.active ? "● Activo" : ""} — {p.calories} kcal
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {otherClientPlans.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Planes de otros clientes</div>
                      {otherClientPlans.map((p) => {
                        const ownerName = allClients.find((c) => c.id === p.clientId)?.name ?? "Cliente";
                        return (
                          <SelectItem key={p.id} value={p.id}>
                            [{ownerName}] {p.planName} {p.active ? "● Activo" : ""} — {p.calories} kcal
                          </SelectItem>
                        );
                      })}
                    </>
                  )}
                </SelectContent>
              </Select>
              {duplicateFromPlanId && duplicateFromPlanId !== "none" && (
                <p className="text-xs text-primary">
                  ✓ Se copiarán comidas, macros, suplementos y recomendaciones del plan seleccionado.
                </p>
              )}
            </div>
          )}

          {existingActivePlan && !confirmDeactivate && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-destructive">Este cliente ya tiene un plan activo</p>
                  <p className="text-xs text-muted-foreground">
                    Plan actual: <span className="font-medium text-foreground">{existingActivePlan.planName}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Solo puede haber un plan activo por cliente. Al crear uno nuevo, el anterior se desactivará automáticamente.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => setConfirmDeactivate(true)}
              >
                Desactivar plan anterior y continuar
              </Button>
            </div>
          )}

          {existingActivePlan && confirmDeactivate && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
              <p className="text-xs text-primary">
                ✓ El plan "{existingActivePlan.planName}" se desactivará al crear el nuevo plan.
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
            {duplicateFromPlanId && duplicateFromPlanId !== "none" ? "Duplicar y crear plan" : "Crear plan"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CreateNutritionPlanSheet;
