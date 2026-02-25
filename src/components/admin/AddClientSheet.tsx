import { useState } from "react";
import {
  User, Mail, Phone, Utensils, Dumbbell, Save, X, ChevronRight, ChevronLeft,
  Scale, Activity, Brain, Pill, AlertTriangle, Briefcase, Target, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { type ServiceType } from "@/data/mockData";

interface NewClientForm {
  // Step 1 — Personal
  name: string;
  email: string;
  phone: string;
  age: string;
  sex: string;
  height: string;
  currentWeight: string;
  services: ServiceType[];
  monthlyRate: string;
  paymentMethod: string;

  // Step 2 — Nutrition intake (if nutrition selected)
  nutritionGoal: string;
  goalTimeframe: string;
  goalMotivation: string;
  targetWeight: string;
  mealsPerDay: string;
  sleepHours: string;
  stressLevel: string;
  occupation: string;
  supplements: string;
  excludedFoods: string;
  allergies: string;
  pathologies: string;
  digestiveIssues: string;

  // Step 3 — Training intake (if training selected)
  trainingExperience: string;
  sessionsPerWeek: string;
  trainingIntensity: string;
  otherSports: string;
  trainingModality: string;
  currentSBD: string;
  injuries: string;
  trainingGoal: string;

  // Step 4 — Notes
  notes: string;
}

const defaultForm: NewClientForm = {
  name: "", email: "", phone: "", age: "", sex: "", height: "", currentWeight: "",
  services: [], monthlyRate: "", paymentMethod: "",
  nutritionGoal: "", goalTimeframe: "", goalMotivation: "", targetWeight: "",
  mealsPerDay: "", sleepHours: "", stressLevel: "", occupation: "",
  supplements: "", excludedFoods: "", allergies: "", pathologies: "", digestiveIssues: "",
  trainingExperience: "", sessionsPerWeek: "", trainingIntensity: "", otherSports: "",
  trainingModality: "", currentSBD: "", injuries: "", trainingGoal: "",
  notes: "",
};

interface AddClientSheetProps {
  open: boolean;
  onClose: () => void;
  onClientAdded: (client: {
    name: string;
    email: string;
    phone: string;
    services: ServiceType[];
    status: "Activo" | "Pendiente";
  }) => void;
}

const AddClientSheet = ({ open, onClose, onClientAdded }: AddClientSheetProps) => {
  const { toast } = useToast();
  const [form, setForm] = useState<NewClientForm>({ ...defaultForm });
  const [step, setStep] = useState(0);

  const hasNutrition = form.services.includes("nutrition");
  const hasTraining = form.services.includes("training");

  // Steps: 0=Personal, 1=Nutrition(if), 2=Training(if), 3=Notes
  const steps = [
    { label: "Datos personales", icon: User },
    ...(hasNutrition ? [{ label: "Formulario Nutrición", icon: Utensils }] : []),
    ...(hasTraining ? [{ label: "Formulario Entrenamiento", icon: Dumbbell }] : []),
    { label: "Notas y finalizar", icon: Save },
  ];

  const currentStepType = (): "personal" | "nutrition" | "training" | "notes" => {
    if (step === 0) return "personal";
    let idx = 1;
    if (hasNutrition) {
      if (step === idx) return "nutrition";
      idx++;
    }
    if (hasTraining) {
      if (step === idx) return "training";
      idx++;
    }
    return "notes";
  };

  const updateField = <K extends keyof NewClientForm>(key: K, value: NewClientForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleService = (service: ServiceType) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const validateStep = (): boolean => {
    const type = currentStepType();
    if (type === "personal") {
      if (!form.name.trim()) { toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" }); return false; }
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast({ title: "Error", description: "Email no válido", variant: "destructive" }); return false; }
      if (form.services.length === 0) { toast({ title: "Error", description: "Selecciona al menos un servicio", variant: "destructive" }); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSave = () => {
    if (!validateStep()) return;

    onClientAdded({
      name: form.name,
      email: form.email,
      phone: form.phone,
      services: form.services,
      status: "Activo",
    });

    toast({ title: "Cliente añadido", description: `${form.name} se ha registrado correctamente.` });
    setForm({ ...defaultForm });
    setStep(0);
    onClose();
  };

  const handleClose = () => {
    setForm({ ...defaultForm });
    setStep(0);
    onClose();
  };

  const inputCls = "bg-muted/50 border-border mt-1";

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent className="bg-card border-border w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Nuevo Cliente
          </SheetTitle>
        </SheetHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mt-4 mb-6 overflow-x-auto">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={i} className="flex items-center gap-1 min-w-0">
                <button
                  onClick={() => i < step && setStep(i)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive ? "bg-primary text-primary-foreground" : isDone ? "bg-primary/15 text-primary cursor-pointer" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < steps.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
              </div>
            );
          })}
        </div>

        <div className="space-y-6 pb-6">
          {/* ── Step: Personal ── */}
          {currentStepType() === "personal" && (
            <div className="space-y-5 animate-fade-in">
              <section className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Información Personal
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-foreground text-xs">Nombre completo *</Label>
                    <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} className={inputCls} placeholder="Nombre y apellidos" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-foreground text-xs">Email *</Label>
                      <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className={inputCls} placeholder="email@ejemplo.com" />
                    </div>
                    <div>
                      <Label className="text-foreground text-xs">Teléfono</Label>
                      <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className={inputCls} placeholder="+34 600 000 000" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-foreground text-xs">Edad</Label>
                      <Input type="number" value={form.age} onChange={(e) => updateField("age", e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <Label className="text-foreground text-xs">Sexo</Label>
                      <Select value={form.sex} onValueChange={(v) => updateField("sex", v)}>
                        <SelectTrigger className={inputCls}><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="Masculino">Masculino</SelectItem>
                          <SelectItem value="Femenino">Femenino</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-foreground text-xs">Altura (cm)</Label>
                      <Input type="number" value={form.height} onChange={(e) => updateField("height", e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-foreground text-xs">Peso actual (kg)</Label>
                    <Input type="number" step="0.1" value={form.currentWeight} onChange={(e) => updateField("currentWeight", e.target.value)} className={inputCls} />
                  </div>
                </div>
              </section>

              <Separator className="bg-border" />

              <section className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Servicio y Facturación</h3>
                <div>
                  <Label className="text-foreground text-xs mb-2 block">Servicios *</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={hasNutrition} onCheckedChange={() => toggleService("nutrition")} />
                      <span className="text-sm text-foreground flex items-center gap-1"><Utensils className="h-3.5 w-3.5 text-primary" /> Nutrición</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={hasTraining} onCheckedChange={() => toggleService("training")} />
                      <span className="text-sm text-foreground flex items-center gap-1"><Dumbbell className="h-3.5 w-3.5 text-accent" /> Entrenamiento</span>
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-foreground text-xs">Tarifa mensual (€)</Label>
                    <Input type="number" value={form.monthlyRate} onChange={(e) => updateField("monthlyRate", e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div>
                  <Label className="text-foreground text-xs">Método de pago</Label>
                  <Select value={form.paymentMethod} onValueChange={(v) => updateField("paymentMethod", v)}>
                    <SelectTrigger className={inputCls}><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {["Bizum", "Transferencia bancaria", "Tarjeta", "Efectivo", "PayPal"].map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </section>
            </div>
          )}

          {/* ── Step: Nutrition Intake ── */}
          {currentStepType() === "nutrition" && (
            <div className="space-y-5 animate-fade-in">
              <section className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" /> Objetivos
                </h3>
                <div>
                  <Label className="text-foreground text-xs">¿Cuál es tu objetivo principal?</Label>
                  <Select value={form.nutritionGoal} onValueChange={(v) => updateField("nutritionGoal", v)}>
                    <SelectTrigger className={inputCls}><SelectValue placeholder="Seleccionar objetivo" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {["Ganar músculo", "Perder grasa", "Recomposición corporal", "Mantenimiento", "Rendimiento deportivo", "Salud general"].map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-foreground text-xs">¿En cuánto tiempo esperas lograrlo?</Label>
                  <Input value={form.goalTimeframe} onChange={(e) => updateField("goalTimeframe", e.target.value)} className={inputCls} placeholder="Ej: 6 meses, 1 año..." />
                </div>
                <div>
                  <Label className="text-foreground text-xs">¿Qué te motiva a conseguirlo?</Label>
                  <Textarea value={form.goalMotivation} onChange={(e) => updateField("goalMotivation", e.target.value)} className={`${inputCls} min-h-[60px] resize-none`} placeholder="Motivación personal..." />
                </div>
                <div>
                  <Label className="text-foreground text-xs">Peso objetivo (kg)</Label>
                  <Input type="number" step="0.1" value={form.targetWeight} onChange={(e) => updateField("targetWeight", e.target.value)} className={inputCls} />
                </div>
              </section>

              <Separator className="bg-border" />

              <section className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" /> Estilo de vida
                </h3>
                <div>
                  <Label className="text-foreground text-xs">Ocupación actual</Label>
                  <Input value={form.occupation} onChange={(e) => updateField("occupation", e.target.value)} className={inputCls} placeholder="Ej: Estudiante, Oficina, Construcción..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-foreground text-xs">Horas de sueño media</Label>
                    <Input type="number" step="0.5" value={form.sleepHours} onChange={(e) => updateField("sleepHours", e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <Label className="text-foreground text-xs">Nivel de estrés (1-10)</Label>
                    <Input type="number" min="1" max="10" value={form.stressLevel} onChange={(e) => updateField("stressLevel", e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div>
                  <Label className="text-foreground text-xs">¿Cuántas comidas haces al día?</Label>
                  <Input type="number" value={form.mealsPerDay} onChange={(e) => updateField("mealsPerDay", e.target.value)} className={inputCls} />
                </div>
              </section>

              <Separator className="bg-border" />

              <section className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Salud y restricciones
                </h3>
                <div>
                  <Label className="text-foreground text-xs">¿Tomas algún suplemento?</Label>
                  <Input value={form.supplements} onChange={(e) => updateField("supplements", e.target.value)} className={inputCls} placeholder="Ej: Proteína, creatina, multivitamínico..." />
                </div>
                <div>
                  <Label className="text-foreground text-xs">¿Hay alimentos que no quieras incluir?</Label>
                  <Input value={form.excludedFoods} onChange={(e) => updateField("excludedFoods", e.target.value)} className={inputCls} placeholder="Ej: Brócoli, hígado..." />
                </div>
                <div>
                  <Label className="text-foreground text-xs">¿Tienes alguna alergia alimentaria?</Label>
                  <Input value={form.allergies} onChange={(e) => updateField("allergies", e.target.value)} className={inputCls} placeholder="Ej: Lactosa, gluten, frutos secos..." />
                </div>
                <div>
                  <Label className="text-foreground text-xs">¿Tienes alguna patología o enfermedad?</Label>
                  <Input value={form.pathologies} onChange={(e) => updateField("pathologies", e.target.value)} className={inputCls} placeholder="Ej: Diabetes, hipotiroidismo..." />
                </div>
                <div>
                  <Label className="text-foreground text-xs">¿Problemas digestivos habituales?</Label>
                  <Input value={form.digestiveIssues} onChange={(e) => updateField("digestiveIssues", e.target.value)} className={inputCls} placeholder="Ej: Hinchazón, gases, reflujo..." />
                </div>
              </section>
            </div>
          )}

          {/* ── Step: Training Intake ── */}
          {currentStepType() === "training" && (
            <div className="space-y-5 animate-fade-in">
              <section className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Dumbbell className="h-3.5 w-3.5" /> Experiencia
                </h3>
                <div>
                  <Label className="text-foreground text-xs">Años de experiencia entrenando</Label>
                  <Select value={form.trainingExperience} onValueChange={(v) => updateField("trainingExperience", v)}>
                    <SelectTrigger className={inputCls}><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {["Menos de 1 año", "1-2 años", "2-4 años", "4-7 años", "Más de 7 años"].map((e) => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-foreground text-xs">Sesiones por semana</Label>
                    <Select value={form.sessionsPerWeek} onValueChange={(v) => updateField("sessionsPerWeek", v)}>
                      <SelectTrigger className={inputCls}><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {["2 días", "3 días", "4 días", "5 días", "6 días"].map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-foreground text-xs">Intensidad (1-10)</Label>
                    <Input type="number" min="1" max="10" value={form.trainingIntensity} onChange={(e) => updateField("trainingIntensity", e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div>
                  <Label className="text-foreground text-xs">¿Realizas otros deportes?</Label>
                  <Input value={form.otherSports} onChange={(e) => updateField("otherSports", e.target.value)} className={inputCls} placeholder="Ej: Fútbol, natación, running..." />
                </div>
              </section>

              <Separator className="bg-border" />

              <section className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" /> Objetivos de entrenamiento
                </h3>
                <div>
                  <Label className="text-foreground text-xs">Modalidad principal</Label>
                  <Select value={form.trainingModality} onValueChange={(v) => updateField("trainingModality", v)}>
                    <SelectTrigger className={inputCls}><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="Powerlifting">Powerlifting</SelectItem>
                      <SelectItem value="Powerbuilding">Powerbuilding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-foreground text-xs">Objetivo principal</Label>
                  <Select value={form.trainingGoal} onValueChange={(v) => updateField("trainingGoal", v)}>
                    <SelectTrigger className={inputCls}><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {["Ganar fuerza", "Hipertrofia", "Preparar competición", "Mejorar técnica", "Rehabilitación"].map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-foreground text-xs">RMs actuales estimados (S/B/D en kg)</Label>
                  <Input value={form.currentSBD} onChange={(e) => updateField("currentSBD", e.target.value)} className={inputCls} placeholder="Ej: 150/100/180" />
                </div>
              </section>

              <Separator className="bg-border" />

              <section className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Lesiones y consideraciones
                </h3>
                <div>
                  <Label className="text-foreground text-xs">¿Tienes alguna lesión actual o previa?</Label>
                  <Textarea value={form.injuries} onChange={(e) => updateField("injuries", e.target.value)} className={`${inputCls} min-h-[60px] resize-none`} placeholder="Describe lesiones, molestias o limitaciones..." />
                </div>
              </section>
            </div>
          )}

          {/* ── Step: Notes ── */}
          {currentStepType() === "notes" && (
            <div className="space-y-5 animate-fade-in">
              <section className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Resumen</h3>
                <div className="bg-muted/40 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cliente</span>
                    <span className="text-foreground font-medium">{form.name || "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Email</span>
                    <span className="text-foreground">{form.email || "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Servicios</span>
                    <span className="text-foreground">
                      {form.services.map((s) => s === "nutrition" ? "Nutrición" : "Entrenamiento").join(" + ") || "—"}
                    </span>
                  </div>
                  {form.monthlyRate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tarifa</span>
                      <span className="text-primary font-medium">{form.monthlyRate}€/mes</span>
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Notas internas</h3>
                <Textarea
                  value={form.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  className={`${inputCls} min-h-[80px] resize-none`}
                  placeholder="Observaciones, contexto adicional, cosas a tener en cuenta..."
                />
              </section>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-2">
            {step > 0 && (
              <Button variant="outline" onClick={handleBack} className="gap-2">
                <ChevronLeft className="h-4 w-4" /> Anterior
              </Button>
            )}
            <div className="flex-1" />
            {step < steps.length - 1 ? (
              <Button onClick={handleNext} className="gap-2 glow-primary-sm">
                Siguiente <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSave} className="gap-2 glow-primary-sm">
                <Save className="h-4 w-4" /> Registrar cliente
              </Button>
            )}
            <Button variant="outline" onClick={handleClose} size="icon">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AddClientSheet;
