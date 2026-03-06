import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import type { TrainingBlock, TrainingModality } from "@/data/useTrainingPlanStore";
import { useTrainingPlanStore } from "@/data/useTrainingPlanStore";
import { api } from "@/services/api";

const BLOCKS: TrainingBlock[] = ["Hipertrofia", "Intensificación", "Peaking", "Tapering"];
const MODALITIES: TrainingModality[] = ["Powerlifting", "Powerbuilding"];

const CreateTrainingPlanSheet = ({ onCreated }: { onCreated?: () => void }) => {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [planName, setPlanName] = useState("");
  const [modality, setModality] = useState<TrainingModality>("Powerlifting");
  const [block, setBlock] = useState<TrainingBlock>("Hipertrofia");
  const [weeksDuration, setWeeksDuration] = useState(8);
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [blockVariants, setBlockVariants] = useState("");
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const clients = useTrainingPlanStore((s) => s.getClientsWithService)();
  const getActivePlanForClient = useTrainingPlanStore((s) => s.getActivePlanForClient);
  
  const selectedClient = clients.find((c) => c.id === clientId);
  const existingActive = clientId ? getActivePlanForClient(clientId) : null;

  const reset = () => {
    setClientId(""); setPlanName(""); setModality("Powerlifting");
    setBlock("Hipertrofia"); setWeeksDuration(8); setDaysPerWeek(4);
    setBlockVariants(""); setConfirmDeactivate(false);
  };

  const handleSubmit = async () => {
    if (!clientId || !planName.trim()) return;
    if (existingActive && !confirmDeactivate) {
      setConfirmDeactivate(true);
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.post<any>("/training/plans", {
        clientId,
        title: planName.trim(),
        modality,
        block,
        daysPerWeek,
        blockVariants: blockVariants.trim() || undefined,
      });

      if (result?.id) {
        toast({
          title: "Plan creado",
          description: `"${planName}" asignado a ${selectedClient?.name}`,
        });
        // Refresh plans from API
        await useTrainingPlanStore.getState().fetchPlans();
        reset();
        setOpen(false);
        onCreated?.();
        navigate(`/admin/training/${result.id}/edit`);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Error al crear el plan",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <SheetTrigger asChild>
        <Button className="glow-primary-sm gap-2">
          <Plus className="h-4 w-4" />
          Crear plan
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-card border-border overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground">Nuevo Plan de Entrenamiento</SheetTitle>
          <SheetDescription>Configura el plan y empieza a programar la primera semana.</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          {/* Client */}
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select value={clientId} onValueChange={(v) => { setClientId(v); setConfirmDeactivate(false); }}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Selecciona cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Warning existing plan */}
          {existingActive && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex gap-2 items-start">
              <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-400">Plan activo existente</p>
                <p className="text-muted-foreground mt-1">
                  "{existingActive.planName}" se desactivará automáticamente al crear el nuevo plan.
                </p>
              </div>
            </div>
          )}

          {/* Plan name */}
          <div className="space-y-2">
            <Label>Nombre del plan</Label>
            <Input value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="Ej: PL Comp Prep Q1" className="bg-background border-border" />
          </div>

          {/* Modality */}
          <div className="space-y-2">
            <Label>Modalidad</Label>
            <Select value={modality} onValueChange={(v) => setModality(v as TrainingModality)}>
              <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODALITIES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Block */}
          <div className="space-y-2">
            <Label>Bloque inicial</Label>
            <Select value={block} onValueChange={(v) => setBlock(v as TrainingBlock)}>
              <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {BLOCKS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Days per week + duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Días/semana</Label>
              <Select value={String(daysPerWeek)} onValueChange={(v) => setDaysPerWeek(Number(v))}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[3, 4, 5, 6].map((n) => <SelectItem key={n} value={String(n)}>{n} días</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duración (semanas)</Label>
              <Input type="number" min={1} max={52} value={weeksDuration} onChange={(e) => setWeeksDuration(Number(e.target.value))} className="bg-background border-border" />
            </div>
          </div>

          {/* Block variants */}
          <div className="space-y-2">
            <Label>Variantes del bloque (opcional)</Label>
            <Textarea
              value={blockVariants}
              onChange={(e) => setBlockVariants(e.target.value)}
              placeholder="Ej: SSB, Banca comp. pausa, DL desde bloques (3-5cm)"
              className="bg-background border-border min-h-[60px]"
            />
          </div>

          {/* Submit */}
          <Button onClick={handleSubmit} className="w-full glow-primary-sm" disabled={!clientId || !planName.trim() || submitting}>
            {submitting ? "Creando..." : confirmDeactivate ? "Confirmar: desactivar anterior y crear" : "Crear plan"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CreateTrainingPlanSheet;
