import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Mail, Phone, Utensils, Dumbbell, CreditCard, CalendarDays,
  Scale, TrendingDown, TrendingUp, User, Pencil, Save, Eye, EyeOff, Shield, X,
  Target, Activity, AlertTriangle, Pill, Brain, Briefcase, Clock,
  UserX, UserCheck, CheckCircle2, Timer, CalendarClock,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPhotoComparison from "@/components/admin/AdminPhotoComparison";
import AdminVideoReview from "@/components/admin/AdminVideoReview";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useClientStore } from "@/data/useClientStore";
import { useClientDetailStore, type ClientDetail } from "@/data/useClientDetailStore";
import { api } from "@/services/api";

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

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
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

    setSaving(true);
    try {
      // Map services to packType (must match backend enum: NUTRITION, TRAINING, FULL)
      const hasNut = form.services.includes("nutrition");
      const hasTr = form.services.includes("training");
      let packType = "FULL";
      if (hasNut && !hasTr) packType = "NUTRITION";
      else if (hasTr && !hasNut) packType = "TRAINING";

      // Map status
      const statusMap: Record<string, string> = { "Activo": "ACTIVE", "Inactivo": "PAUSED", "Pendiente": "PENDING" };

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone || undefined,
        packType,
        status: statusMap[form.status] || "ACTIVE",
        monthlyFee: form.monthlyRate ? parseFloat(form.monthlyRate) : undefined,
        notes: form.notes || undefined,
        currentWeight: form.currentWeight ? parseFloat(form.currentWeight) : undefined,
        targetWeight: form.targetWeight ? parseFloat(form.targetWeight) : undefined,
        height: form.height ? parseFloat(form.height) : undefined,
      };

      await api.put(`/clients/${client.id}`, payload);

      // If password was set, reset it
      if (form.newPassword) {
        await api.put(`/clients/${client.id}/password`, { newPassword: form.newPassword });
      }

      // Update local stores so UI reflects changes immediately
      const { updateDetail } = useClientDetailStore.getState();
      updateDetail(client.id, {
        name: payload.name,
        email: payload.email,
        phone: form.phone,
        services: form.services,
        plan: packType,
        status: form.status,
        monthlyRate: payload.monthlyFee ?? client.monthlyRate,
        notes: form.notes,
        currentWeight: payload.currentWeight,
        targetWeight: payload.targetWeight,
        height: payload.height,
      });

      // Update client list store locally (don't use updateClient — it re-PATCHes the API)
      useClientStore.setState((state) => ({
        clients: state.clients.map((c) =>
          c.id === client.id
            ? { ...c, name: payload.name, email: payload.email, packType, status: statusMap[form.status] || "ACTIVE", monthlyFee: payload.monthlyFee, notes: form.notes, services: form.services }
            : c
        ),
      }));

      toast({ title: "Cliente actualizado", description: `Los datos de ${form.name} se han guardado correctamente.` });
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Error al guardar los datos", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!form.newPassword || form.newPassword.length < 8) {
      toast({ title: "Error", description: "La contraseña debe tener al menos 8 caracteres", variant: "destructive" });
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }
    try {
      await api.put(`/clients/${client.id}/password`, { newPassword: form.newPassword });
      toast({ title: "Contraseña actualizada", description: `Se ha cambiado la contraseña de ${client.name}.` });
      updateField("newPassword", "");
      updateField("confirmPassword", "");
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Error al cambiar contraseña", variant: "destructive" });
    }
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
  const [confirmToggle, setConfirmToggle] = useState(false);
  const { toast } = useToast();
  const clientStore = useClientStore();
  const { details, fetchDetail, loading } = useClientDetailStore();
  const client = id ? details[id] : null;

  // Fetch from API if not in store
  useEffect(() => {
    if (id && !details[id]) {
      fetchDetail(id);
    }
  }, [id]);

  if (loading && !client) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    );
  }

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
              <AvatarImage src={client.avatarUrl ?? undefined} alt={client.name} />
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
            <div className="flex gap-2 self-start">
              <Button
                variant="outline"
                className={`gap-2 ${client.status === "Inactivo" ? "border-primary/30 text-primary hover:bg-primary/10" : "border-destructive/30 text-destructive hover:bg-destructive/10"}`}
                onClick={() => setConfirmToggle(true)}
              >
                {client.status === "Inactivo" ? (
                  <><UserCheck className="h-4 w-4" /> Reactivar</>
                ) : (
                  <><UserX className="h-4 w-4" /> Desactivar</>
                )}
              </Button>
              <Button className="glow-primary-sm gap-2" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4" /> Editar cliente
              </Button>
            </div>
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
              <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Método de pago</span><span className="text-sm text-foreground">{client.paymentMethod || "—"}</span></div>
              <Separator className="bg-border" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Último pago</span>
                <span className="text-sm text-foreground flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                  {client.lastPaymentDate}
                </span>
              </div>
              <Separator className="bg-border" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Próximo pago</span>
                {(() => {
                  const isOverdue = client.lastPaidAt
                    ? new Date().getTime() - new Date(client.lastPaidAt).getTime() > 30 * 24 * 60 * 60 * 1000
                    : true;
                  const daysLeft = client.lastPaidAt
                    ? Math.max(0, Math.ceil((new Date(client.lastPaidAt).getTime() + 30 * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000)))
                    : 0;
                  return (
                    <span className={`text-sm font-medium flex items-center gap-1.5 ${isOverdue ? "text-destructive" : daysLeft <= 5 ? "text-accent" : "text-foreground"}`}>
                      {isOverdue ? (
                        <><AlertTriangle className="h-3.5 w-3.5" /> Vencido</>
                      ) : (
                        <><Timer className="h-3.5 w-3.5" /> {daysLeft} días ({client.nextPaymentDate})</>
                      )}
                    </span>
                  );
                })()}
              </div>
              <Separator className="bg-border" />
              <Button
                className="w-full gap-2 glow-primary-sm"
                onClick={async () => {
                  try {
                    await api.patch(`/clients/${client.id}/mark-paid`, {});
                    const now = new Date().toISOString();
                    const nextDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
                    useClientDetailStore.getState().updateDetail(client.id, {
                      lastPaidAt: now,
                      lastPaymentDate: now.split("T")[0],
                      nextPaymentDate: nextDate,
                    });
                    toast({ title: "Pago registrado", description: `El pago de ${client.name} ha sido confirmado. Se ha enviado un email de confirmación.` });
                  } catch (err: any) {
                    toast({ title: "Error", description: err?.message || "Error al registrar pago", variant: "destructive" });
                  }
                }}
              >
                <CheckCircle2 className="h-4 w-4" /> Marcar como pagado
              </Button>
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

        {/* ── Intake Context ── */}
        {(client.nutritionIntake || client.trainingIntake) && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Contexto Inicial del Cliente</h2>
            <div className={`grid grid-cols-1 ${client.nutritionIntake && client.trainingIntake ? "lg:grid-cols-2" : ""} gap-6`}>

              {/* Nutrition Intake */}
              {client.nutritionIntake && (
                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-foreground flex items-center gap-2">
                      <Utensils className="h-4 w-4 text-primary" /> Formulario Nutrición
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Goals */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Target className="h-3 w-3" /> Objetivos</p>
                      <div className="bg-muted/40 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Objetivo</span><span className="text-foreground font-medium">{client.nutritionIntake.goal}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Plazo</span><span className="text-foreground">{client.nutritionIntake.goalTimeframe}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Peso objetivo</span><span className="text-foreground">{client.nutritionIntake.targetWeight} kg</span></div>
                      </div>
                      {client.nutritionIntake.goalMotivation && (
                        <p className="text-sm text-muted-foreground italic bg-muted/30 rounded-lg p-2.5">"{client.nutritionIntake.goalMotivation}"</p>
                      )}
                    </div>
                    <Separator className="bg-border" />
                    {/* Lifestyle */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Activity className="h-3 w-3" /> Estilo de vida</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-muted/40 rounded-lg p-2.5 text-center">
                          <p className="text-lg font-bold text-foreground">{client.nutritionIntake.mealsPerDay}</p>
                          <p className="text-xs text-muted-foreground">comidas/día</p>
                        </div>
                        <div className="bg-muted/40 rounded-lg p-2.5 text-center">
                          <p className="text-lg font-bold text-foreground">{client.nutritionIntake.sleepHours}h</p>
                          <p className="text-xs text-muted-foreground">sueño medio</p>
                        </div>
                        <div className="bg-muted/40 rounded-lg p-2.5 text-center">
                          <p className="text-lg font-bold text-foreground">{client.nutritionIntake.stressLevel}/10</p>
                          <p className="text-xs text-muted-foreground">estrés</p>
                        </div>
                        <div className="bg-muted/40 rounded-lg p-2.5 text-center">
                          <p className="text-sm font-medium text-foreground truncate">{client.nutritionIntake.occupation || "—"}</p>
                          <p className="text-xs text-muted-foreground">ocupación</p>
                        </div>
                      </div>
                    </div>
                    <Separator className="bg-border" />
                    {/* Health */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Salud y restricciones</p>
                      <div className="space-y-1.5">
                        {[
                          { label: "Suplementos", value: client.nutritionIntake.supplements },
                          { label: "Alimentos excluidos", value: client.nutritionIntake.excludedFoods },
                          { label: "Alergias", value: client.nutritionIntake.allergies },
                          { label: "Patologías", value: client.nutritionIntake.pathologies },
                          { label: "Problemas digestivos", value: client.nutritionIntake.digestiveIssues },
                        ].filter((item) => item.value).map((item) => (
                          <div key={item.label} className="flex justify-between text-sm py-1">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="text-foreground text-right max-w-[60%]">{item.value}</span>
                          </div>
                        ))}
                        {![client.nutritionIntake.supplements, client.nutritionIntake.excludedFoods, client.nutritionIntake.allergies, client.nutritionIntake.pathologies, client.nutritionIntake.digestiveIssues].some(Boolean) && (
                          <p className="text-sm text-muted-foreground">Sin restricciones ni alergias reportadas</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Training Intake */}
              {client.trainingIntake && (
                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-foreground flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-accent" /> Formulario Entrenamiento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Experience */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Activity className="h-3 w-3" /> Experiencia</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-muted/40 rounded-lg p-2.5 text-center">
                          <p className="text-sm font-bold text-foreground">{client.trainingIntake.experience}</p>
                          <p className="text-xs text-muted-foreground">experiencia</p>
                        </div>
                        <div className="bg-muted/40 rounded-lg p-2.5 text-center">
                          <p className="text-lg font-bold text-foreground">{client.trainingIntake.sessionsPerWeek}</p>
                          <p className="text-xs text-muted-foreground">por semana</p>
                        </div>
                        <div className="bg-muted/40 rounded-lg p-2.5 text-center">
                          <p className="text-lg font-bold text-foreground">{client.trainingIntake.intensity}/10</p>
                          <p className="text-xs text-muted-foreground">intensidad</p>
                        </div>
                        <div className="bg-muted/40 rounded-lg p-2.5 text-center">
                          <p className="text-sm font-medium text-foreground truncate">{client.trainingIntake.otherSports || "Ninguno"}</p>
                          <p className="text-xs text-muted-foreground">otros deportes</p>
                        </div>
                      </div>
                    </div>
                    <Separator className="bg-border" />
                    {/* Training Goals */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Target className="h-3 w-3" /> Objetivos</p>
                      <div className="bg-muted/40 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Modalidad</span><span className="text-foreground font-medium">{client.trainingIntake.modality}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Objetivo</span><span className="text-foreground">{client.trainingIntake.goal}</span></div>
                        {client.trainingIntake.currentSBD && (
                          <div className="flex justify-between text-sm"><span className="text-muted-foreground">RMs iniciales (S/B/D)</span><span className="text-primary font-bold">{client.trainingIntake.currentSBD}</span></div>
                        )}
                      </div>
                    </div>
                    {client.trainingIntake.injuries && (
                      <>
                        <Separator className="bg-border" />
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Lesiones</p>
                          <p className="text-sm text-foreground bg-destructive/10 border border-destructive/20 rounded-lg p-2.5">{client.trainingIntake.injuries}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* ── Media Section ── */}
        {(hasNutrition || hasTraining) && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Media del Cliente</h2>
            {hasNutrition && <AdminPhotoComparison clientId={client.id} />}
            {hasTraining && <AdminVideoReview clientId={client.id} />}
          </div>
        )}
      </div>

      <EditClientSheet client={client} open={editing} onClose={() => setEditing(false)} />

      <AlertDialog open={confirmToggle} onOpenChange={setConfirmToggle}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5 text-accent" />
              {client.status === "Inactivo" ? "Reactivar cliente" : "Desactivar cliente"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {client.status === "Inactivo"
                ? `¿Estás seguro de que quieres reactivar a ${client.name}?`
                : `¿Estás seguro de que quieres desactivar a ${client.name}? El cliente pasará a estado inactivo.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const newStatus = client.status === "Inactivo" ? "Activo" : "Inactivo";
                // Update detail store
                useClientDetailStore.getState().updateDetail(client.id, { status: newStatus as ClientDetail["status"] });
                // Update list store
                clientStore.updateClientStatus(client.id, newStatus === "Activo" ? "ACTIVE" : "PAUSED");
                toast({
                  title: newStatus === "Activo" ? "Cliente reactivado" : "Cliente desactivado",
                  description: `${client.name} ahora está ${newStatus.toLowerCase()}.`,
                });
                setConfirmToggle(false);
              }}
              className={client.status === "Inactivo" ? "bg-primary hover:bg-primary/90" : "bg-destructive hover:bg-destructive/90"}
            >
              {client.status === "Inactivo" ? "Reactivar" : "Desactivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminClientDetail;
