import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { mockClients } from "@/data/mockData";
import { clientDetailStore } from "@/data/clientStore";
import { toast } from "sonner";

interface Props {
  onCreated: (plan: { planName: string; clientId: string; clientName: string; objective: string }) => void;
}

const CreateNutritionPlanSheet = ({ onCreated }: Props) => {
  const [open, setOpen] = useState(false);
  const [planName, setPlanName] = useState("");
  const [clientId, setClientId] = useState("");
  const [objective, setObjective] = useState("");

  // Only show clients that have nutrition service
  const nutritionClients = mockClients.filter((c) => {
    const detail = clientDetailStore[c.id];
    return detail ? detail.services.includes("nutrition") : c.services.includes("nutrition");
  });

  const handleCreate = () => {
    if (!planName.trim() || !clientId || !objective.trim()) {
      toast.error("Completa todos los campos");
      return;
    }
    const client = mockClients.find((c) => c.id === clientId);
    if (!client) return;
    onCreated({ planName: planName.trim(), clientId, clientName: client.name, objective: objective.trim() });
    setPlanName("");
    setClientId("");
    setObjective("");
    setOpen(false);
    toast.success("Plan creado correctamente");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
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
            <Select value={clientId} onValueChange={setClientId}>
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
          <div className="space-y-2">
            <Label className="text-muted-foreground text-sm">Objetivo principal</Label>
            <Textarea
              placeholder="Ej: Reducir porcentaje de grasa sin perder masa muscular..."
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="bg-muted/30 border-border min-h-[100px]"
            />
          </div>
          <Button className="w-full glow-primary-sm" onClick={handleCreate}>
            Crear plan
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CreateNutritionPlanSheet;
