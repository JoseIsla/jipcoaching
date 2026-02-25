import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Mail, Phone, Utensils, Dumbbell, CreditCard, CalendarDays,
  Scale, TrendingDown, TrendingUp, User, Pencil, Save, Eye, EyeOff, Shield, X,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

interface ClientDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  services: ("nutrition" | "training")[];
  plan: string;
  status: "Activo" | "Pendiente" | "Inactivo";
  startDate: string;
  monthlyRate: number;
  lastPaymentDate: string;
  nextPaymentDate: string;
  paymentMethod: string;
  notes: string;
  currentWeight?: number;
  targetWeight?: number;
  height?: number;
  weightHistory?: { date: string; weight: number }[];
}

const mockClientsDetail: Record<string, ClientDetail> = {
  "1": {
    id: "1", name: "Carlos Martínez", email: "carlos@email.com", phone: "+34 612 345 678",
    services: ["nutrition", "training"], plan: "Volumen", status: "Activo", startDate: "2025-01-15",
    monthlyRate: 120, lastPaymentDate: "2026-02-01", nextPaymentDate: "2026-03-01",
    paymentMethod: "Tarjeta ****4521", notes: "Objetivo: ganar 5kg de masa muscular en 6 meses.",
    currentWeight: 78.5, targetWeight: 83, height: 178,
    weightHistory: [
      { date: "2025-01-15", weight: 75.2 }, { date: "2025-02-15", weight: 76.1 },
      { date: "2025-03-15", weight: 76.8 }, { date: "2025-04-15", weight: 77.3 },
      { date: "2025-05-15", weight: 77.9 }, { date: "2026-01-15", weight: 78.1 },
      { date: "2026-02-15", weight: 78.5 },
    ],
  },
  "2": {
    id: "2", name: "Ana López", email: "ana@email.com", phone: "+34 623 456 789",
    services: ["nutrition"], plan: "Definición", status: "Activo", startDate: "2025-02-01",
    monthlyRate: 80, lastPaymentDate: "2026-02-05", nextPaymentDate: "2026-03-05",
    paymentMethod: "Bizum", notes: "Intolerancia a la lactosa. Dieta sin gluten.",
    currentWeight: 62.3, targetWeight: 58, height: 165,
    weightHistory: [
      { date: "2025-02-01", weight: 67.0 }, { date: "2025-03-01", weight: 66.1 },
      { date: "2025-04-01", weight: 65.2 }, { date: "2025-05-01", weight: 64.5 },
      { date: "2026-01-01", weight: 63.0 }, { date: "2026-02-01", weight: 62.3 },
    ],
  },
  "3": {
    id: "3", name: "Diego Fernández", email: "diego@email.com", phone: "+34 634 567 890",
    services: ["training"], plan: "Fuerza", status: "Pendiente", startDate: "2025-02-10",
    monthlyRate: 70, lastPaymentDate: "2026-01-10", nextPaymentDate: "2026-02-10",
    paymentMethod: "Transferencia bancaria", notes: "Lesión previa en rodilla derecha.",
  },
  "4": {
    id: "4", name: "Laura García", email: "laura@email.com", phone: "+34 645 678 901",
    services: ["nutrition", "training"], plan: "Volumen", status: "Activo", startDate: "2025-01-20",
    monthlyRate: 120, lastPaymentDate: "2026-02-01", nextPaymentDate: "2026-03-01",
    paymentMethod: "Tarjeta ****8832", notes: "Competidora de CrossFit.",
    currentWeight: 65.0, targetWeight: 68, height: 170,
    weightHistory: [
      { date: "2025-01-20", weight: 62.5 }, { date: "2025-03-20", weight: 63.4 },
      { date: "2025-05-20", weight: 64.1 }, { date: "2026-01-20", weight: 64.8 },
      { date: "2026-02-20", weight: 65.0 },
    ],
  },
  "5": {
    id: "5", name: "Miguel Torres", email: "miguel@email.com", phone: "+34 656 789 012",
    services: ["nutrition"], plan: "Pérdida de grasa", status: "Inactivo", startDate: "2024-11-05",
    monthlyRate: 80, lastPaymentDate: "2025-06-05", nextPaymentDate: "-",
    paymentMethod: "Bizum", notes: "Cliente inactivo desde julio 2025.",
    currentWeight: 92.0, targetWeight: 82, height: 182,
    weightHistory: [
      { date: "2024-11-05", weight: 98.3 }, { date: "2025-01-05", weight: 96.1 },
      { date: "2025-03-05", weight: 94.2 }, { date: "2025-05-05", weight: 92.0 },
    ],
  },
  "6": {
    id: "6", name: "Sofía Ruiz", email: "sofia@email.com", phone: "+34 667 890 123",
    services: ["nutrition", "training"], plan: "Recomposición", status: "Activo", startDate: "2025-02-18",
    monthlyRate: 120, lastPaymentDate: "2026-02-18", nextPaymentDate: "2026-03-18",
    paymentMethod: "Tarjeta ****1290", notes: "Preparación para media maratón en mayo.",
    currentWeight: 58.7, targetWeight: 57, height: 163,
    weightHistory: [
      { date: "2025-02-18", weight: 60.2 }, { date: "2025-06-18", weight: 59.5 },
      { date: "2026-01-18", weight: 59.0 }, { date: "2026-02-18", weight: 58.7 },
    ],
  },
  "7": {
    id: "7", name: "Pablo Navarro", email: "pablo@email.com", phone: "+34 678 901 234",
    services: ["training"], plan: "Hipertrofia", status: "Activo", startDate: "2025-01-28",
    monthlyRate: 70, lastPaymentDate: "2026-02-01", nextPaymentDate: "2026-03-01",
    paymentMethod: "Transferencia bancaria", notes: "Entrena 5 días por semana.",
  },
  "8": {
    id: "8", name: "María Jiménez", email: "maria@email.com", phone: "+34 689 012 345",
    services: ["nutrition", "training"], plan: "Mantenimiento", status: "Activo", startDate: "2024-12-10",
    monthlyRate: 120, lastPaymentDate: "2026-02-10", nextPaymentDate: "2026-03-10",
    paymentMethod: "Tarjeta ****7743", notes: "Embarazada, adaptar plan a partir del tercer trimestre.",
    currentWeight: 70.2, targetWeight: 68, height: 172,
    weightHistory: [
      { date: "2024-12-10", weight: 66.5 }, { date: "2025-03-10", weight: 67.2 },
      { date: "2025-06-10", weight: 68.0 }, { date: "2025-09-10", weight: 69.1 },
      { date: "2026-02-10", weight: 70.2 },
    ],
  },
};

const statusClass = (status: ClientDetail["status"]) => {
  switch (status) {
    case "Activo": return "bg-primary/15 text-primary border-primary/20";
    case "Pendiente": return "bg-accent/15 text-accent border-accent/20";
    case "Inactivo": return "bg-muted text-muted-foreground border-border";
  }
};

// ── Edit Sheet ──────────────────────────────────────────
interface EditForm {
  name: string;
  email: string;
  phone: string;
  plan: string;
  status: ClientDetail["status"];
  services: ("nutrition" | "training")[];
  monthlyRate: string;
  paymentMethod: string;
  notes: string;
  currentWeight: string;
  targetWeight: string;
  height: string;
  newPassword: string;
  confirmPassword: string;
}

const EditClientSheet = ({
  client,
  open,
  onClose,
}: {
  client: ClientDetail;
  open: boolean;
  onClose: () => void;
}) => {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const hasNutrition = client.services.includes("nutrition");

  const [form, setForm] = useState<EditForm>({
    name: client.name,
    email: client.email,
    phone: client.phone,
    plan: client.plan,
    status: client.status,
    services: [...client.services],
    monthlyRate: String(client.monthlyRate),
    paymentMethod: client.paymentMethod,
    notes: client.notes,
    currentWeight: client.currentWeight ? String(client.currentWeight) : "",
    targetWeight: client.targetWeight ? String(client.targetWeight) : "",
    height: client.height ? String(client.height) : "",
    newPassword: "",
    confirmPassword: "",
  });

  const updateField = <K extends keyof EditForm>(key: K, value: EditForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleService = (service: "nutrition" | "training") => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" });
      return;
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast({ title: "Error", description: "Email no válido", variant: "destructive" });
      return;
    }
    if (form.services.length === 0) {
      toast({ title: "Error", description: "Selecciona al menos un servicio", variant: "destructive" });
      return;
    }
    if (form.newPassword && form.newPassword.length < 8) {
      toast({ title: "Error", description: "La contraseña debe tener al menos 8 caracteres", variant: "destructive" });
      return;
    }
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }

    // Simulate API call
    toast({ title: "Cliente actualizado", description: `Los datos de ${form.name} se han guardado correctamente.` });
    onClose();
  };

  const handleResetPassword = () => {
    if (!form.newPassword || form.newPassword.length < 8) {
      toast({ title: "Error", description: "La contraseña debe tener al menos 8 caracteres", variant: "destructive" });
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }
    toast({ title: "Contraseña actualizada", description: `Se ha cambiado la contraseña de ${client.name}.` });
    updateField("newPassword", "");
    updateField("confirmPassword", "");
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="bg-card border-border w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Editar Cliente
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6 pb-6">
          {/* Personal Info */}
          <section className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Información Personal</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-foreground text-xs">Nombre completo</Label>
                <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} className="bg-muted/50 border-border mt-1" />
              </div>
              <div>
                <Label className="text-foreground text-xs">Email</Label>
                <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="bg-muted/50 border-border mt-1" />
              </div>
              <div>
                <Label className="text-foreground text-xs">Teléfono</Label>
                <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="bg-muted/50 border-border mt-1" />
              </div>
            </div>
          </section>

          <Separator className="bg-border" />

          {/* Services & Plan */}
          <section className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Servicio y Plan</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-foreground text-xs mb-2 block">Servicios</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={form.services.includes("nutrition")}
                      onCheckedChange={() => toggleService("nutrition")}
                    />
                    <span className="text-sm text-foreground">Nutrición</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={form.services.includes("training")}
                      onCheckedChange={() => toggleService("training")}
                    />
                    <span className="text-sm text-foreground">Entrenamiento</span>
                  </label>
                </div>
              </div>
              <div>
                <Label className="text-foreground text-xs">Plan</Label>
                <Select value={form.plan} onValueChange={(v) => updateField("plan", v)}>
                  <SelectTrigger className="bg-muted/50 border-border mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {["Volumen", "Definición", "Recomposición", "Mantenimiento", "Fuerza", "Hipertrofia", "Pérdida de grasa"].map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-foreground text-xs">Estado</Label>
                <Select value={form.status} onValueChange={(v) => updateField("status", v as ClientDetail["status"])}>
                  <SelectTrigger className="bg-muted/50 border-border mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <Separator className="bg-border" />

          {/* Measurements - only if nutrition */}
          {form.services.includes("nutrition") && (
            <>
              <section className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="h-3.5 w-3.5" /> Medidas
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-foreground text-xs">Peso actual (kg)</Label>
                    <Input type="number" step="0.1" value={form.currentWeight} onChange={(e) => updateField("currentWeight", e.target.value)} className="bg-muted/50 border-border mt-1" />
                  </div>
                  <div>
                    <Label className="text-foreground text-xs">Peso objetivo (kg)</Label>
                    <Input type="number" step="0.1" value={form.targetWeight} onChange={(e) => updateField("targetWeight", e.target.value)} className="bg-muted/50 border-border mt-1" />
                  </div>
                  <div>
                    <Label className="text-foreground text-xs">Altura (cm)</Label>
                    <Input type="number" value={form.height} onChange={(e) => updateField("height", e.target.value)} className="bg-muted/50 border-border mt-1" />
                  </div>
                </div>
              </section>
              <Separator className="bg-border" />
            </>
          )}

          {/* Billing */}
          <section className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" /> Facturación
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-foreground text-xs">Tarifa mensual (€)</Label>
                <Input type="number" value={form.monthlyRate} onChange={(e) => updateField("monthlyRate", e.target.value)} className="bg-muted/50 border-border mt-1" />
              </div>
              <div>
                <Label className="text-foreground text-xs">Método de pago</Label>
                <Select value={form.paymentMethod} onValueChange={(v) => updateField("paymentMethod", v)}>
                  <SelectTrigger className="bg-muted/50 border-border mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {["Bizum", "Transferencia bancaria", "Tarjeta", "Efectivo", "PayPal"].map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <Separator className="bg-border" />

          {/* Notes */}
          <section className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Notas</h3>
            <Textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              className="bg-muted/50 border-border min-h-[80px] resize-none"
              placeholder="Notas internas sobre el cliente..."
            />
          </section>

          <Separator className="bg-border" />

          {/* Security - Password Reset */}
          <section className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> Seguridad
            </h3>
            <p className="text-xs text-muted-foreground">
              Restablecer la contraseña del cliente si la ha perdido.
            </p>
            <div className="space-y-3">
              <div className="relative">
                <Label className="text-foreground text-xs">Nueva contraseña</Label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={form.newPassword}
                    onChange={(e) => updateField("newPassword", e.target.value)}
                    className="bg-muted/50 border-border pr-10"
                    placeholder="Min. 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-foreground text-xs">Confirmar contraseña</Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  className="bg-muted/50 border-border mt-1"
                  placeholder="Repetir contraseña"
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleResetPassword} disabled={!form.newPassword} className="gap-2">
                <Shield className="h-4 w-4" /> Restablecer contraseña
              </Button>
            </div>
          </section>

          <Separator className="bg-border" />

          {/* Save */}
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} className="flex-1 glow-primary-sm gap-2">
              <Save className="h-4 w-4" /> Guardar cambios
            </Button>
            <Button variant="outline" onClick={onClose} className="gap-2">
              <X className="h-4 w-4" /> Cancelar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ── Main Page ───────────────────────────────────────────
const AdminClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const client = id ? mockClientsDetail[id] : null;

  if (!client) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <User className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground">Cliente no encontrado</h2>
          <Button variant="outline" onClick={() => navigate("/admin/clients")}>Volver a clientes</Button>
        </div>
      </AdminLayout>
    );
  }

  const hasNutrition = client.services.includes("nutrition");
  const hasTraining = client.services.includes("training");
  const initials = client.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
  const weightChange = client.weightHistory && client.weightHistory.length >= 2
    ? client.weightHistory[client.weightHistory.length - 1].weight - client.weightHistory[0].weight
    : null;

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/clients")} className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver a clientes
        </Button>

        {/* Profile Header */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <Avatar className="h-16 w-16 border-2 border-primary/30">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border w-fit ${statusClass(client.status)}`}>{client.status}</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{client.email}</span>
                <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{client.phone}</span>
              </div>
              <div className="flex gap-2 pt-1">
                {hasNutrition && <Badge variant="outline" className="gap-1 border-primary/30 text-primary bg-primary/10 text-xs"><Utensils className="h-3 w-3" /> Nutrición</Badge>}
                {hasTraining && <Badge variant="outline" className="gap-1 border-accent/30 text-accent bg-accent/10 text-xs"><Dumbbell className="h-3 w-3" /> Entrenamiento</Badge>}
              </div>
            </div>
            <Button className="glow-primary-sm gap-2 self-start" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" /> Editar cliente
            </Button>
          </div>
        </div>

        {/* Info Grid */}
        <div className={`grid grid-cols-1 ${hasNutrition ? "lg:grid-cols-3" : "lg:grid-cols-2"} gap-6`}>
          <Card className="bg-card border-border">
            <CardHeader className="pb-3"><CardTitle className="text-base text-foreground">Plan y Servicio</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Plan actual</span><span className="text-sm font-medium text-foreground">{client.plan}</span></div>
              <Separator className="bg-border" />
              <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Servicios</span><span className="text-sm font-medium text-foreground">{hasNutrition && hasTraining ? "Nutrición + Entrenamiento" : hasNutrition ? "Solo Nutrición" : "Solo Entrenamiento"}</span></div>
              <Separator className="bg-border" />
              <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Fecha de inicio</span><span className="text-sm text-foreground">{client.startDate}</span></div>
              <Separator className="bg-border" />
              <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Notas</span></div>
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">{client.notes}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3"><CardTitle className="text-base text-foreground flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> Facturación</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Tarifa mensual</span><span className="text-lg font-bold text-primary">{client.monthlyRate}€/mes</span></div>
              <Separator className="bg-border" />
              <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Método de pago</span><span className="text-sm text-foreground">{client.paymentMethod}</span></div>
              <Separator className="bg-border" />
              <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Último pago</span><span className="text-sm text-foreground flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />{client.lastPaymentDate}</span></div>
              <Separator className="bg-border" />
              <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Próximo pago</span><span className="text-sm text-foreground">{client.nextPaymentDate}</span></div>
            </CardContent>
          </Card>

          {hasNutrition && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3"><CardTitle className="text-base text-foreground flex items-center gap-2"><Scale className="h-4 w-4 text-primary" /> Control de Peso</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Peso actual</span><span className="text-lg font-bold text-foreground">{client.currentWeight} kg</span></div>
                <Separator className="bg-border" />
                <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Peso objetivo</span><span className="text-sm text-foreground">{client.targetWeight} kg</span></div>
                <Separator className="bg-border" />
                <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Altura</span><span className="text-sm text-foreground">{client.height} cm</span></div>
                <Separator className="bg-border" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Cambio total</span>
                  {weightChange !== null && (
                    <span className={`text-sm font-medium flex items-center gap-1 ${weightChange >= 0 ? "text-primary" : "text-accent"}`}>
                      {weightChange >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      {weightChange >= 0 ? "+" : ""}{weightChange.toFixed(1)} kg
                    </span>
                  )}
                </div>
                <Separator className="bg-border" />
                <div>
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Historial reciente</p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {client.weightHistory?.slice().reverse().slice(0, 5).map((entry) => (
                      <div key={entry.date} className="flex justify-between text-xs px-2 py-1.5 rounded bg-muted/40">
                        <span className="text-muted-foreground">{entry.date}</span>
                        <span className="text-foreground font-medium">{entry.weight} kg</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <EditClientSheet client={client} open={editing} onClose={() => setEditing(false)} />
    </AdminLayout>
  );
};

export default AdminClientDetail;
