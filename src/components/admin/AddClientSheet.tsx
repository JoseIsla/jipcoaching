import { useState } from "react";
import { User, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useClientStore } from "@/data/useClientStore";
import { PackType, ClientStatus, packTypeLabels, type CreateClientDto } from "@/types/api";

export interface NewClientData {
  name: string;
  email: string;
  notes: string;
}

interface AddClientSheetProps {
  open: boolean;
  onClose: () => void;
  onClientAdded: (data: NewClientData) => void;
}

const AddClientSheet = ({ open, onClose, onClientAdded }: AddClientSheetProps) => {
  const { toast } = useToast();
  const addClient = useClientStore((s) => s.addClient);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [packType, setPackType] = useState<PackType>(PackType.NUTRITION);
  const [status, setStatus] = useState<ClientStatus>(ClientStatus.ACTIVE);
  const [monthlyFee, setMonthlyFee] = useState("");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setName(""); setEmail(""); setPassword(""); setPackType(PackType.NUTRITION);
    setStatus(ClientStatus.ACTIVE); setMonthlyFee(""); setNotes("");
  };

  const handleSave = async () => {
    if (!name.trim()) { toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" }); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast({ title: "Error", description: "Email no válido", variant: "destructive" }); return; }
    if (!password || password.length < 6) { toast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" }); return; }

    const dto: CreateClientDto = {
      name: name.trim(),
      email: email.trim(),
      password,
      packType,
      status,
      monthlyFee: monthlyFee ? Number(monthlyFee) : 0,
      notes: notes.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      await addClient(dto);
      toast({ title: "Cliente añadido", description: `${name} se ha registrado correctamente.` });
      onClientAdded({ name, email, notes });
      resetForm();
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "No se pudo crear el cliente", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => { resetForm(); onClose(); };
  const inputCls = "bg-muted/50 border-border mt-1";

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Nuevo Cliente
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-6 pb-6">
          <div>
            <Label className="text-foreground text-xs">Nombre completo *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Nombre y apellidos" />
          </div>
          <div>
            <Label className="text-foreground text-xs">Email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="email@ejemplo.com" />
          </div>
          <div>
            <Label className="text-foreground text-xs">Contraseña *</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="Min. 6 caracteres" />
          </div>
          <div>
            <Label className="text-foreground text-xs">Pack contratado *</Label>
            <Select value={packType} onValueChange={(v) => setPackType(v as PackType)}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                {Object.values(PackType).map((pt) => (
                  <SelectItem key={pt} value={pt}>{packTypeLabels[pt]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-foreground text-xs">Estado</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ClientStatus)}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value={ClientStatus.ACTIVE}>Activo</SelectItem>
                <SelectItem value={ClientStatus.PAUSED}>Pausado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-foreground text-xs">Tarifa mensual (€)</Label>
            <Input type="number" value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} className={inputCls} placeholder="0" />
          </div>
          <div>
            <Label className="text-foreground text-xs">Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputCls} min-h-[80px] resize-none`} placeholder="Notas internas sobre el cliente..." />
          </div>
          <Button onClick={handleSave} disabled={isSubmitting} className="w-full glow-primary-sm gap-2">
            <Save className="h-4 w-4" /> {isSubmitting ? "Guardando..." : "Crear cliente"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AddClientSheet;
