import { useState } from "react";
import { User, Save, ChevronRight, ChevronLeft, Apple, Dumbbell, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useClientStore } from "@/data/useClientStore";
import { useClientDetailStore } from "@/data/useClientDetailStore";
import { PackType, ClientStatus, packTypeLabels, getServicesFromPack, type CreateClientDto, type NutritionIntakeDto, type TrainingIntakeDto } from "@/types/api";
import { useTranslation } from "@/i18n/useTranslation";
import { parseDecimal, parseOptionalDecimal } from "@/utils/parseDecimal";

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

const NUTRITION_GOALS = [
  "Pérdida de grasa",
  "Ganancia muscular",
  "Recomposición corporal",
  "Mantenimiento",
  "Rendimiento deportivo",
  "Salud general",
];

const AddClientSheet = ({ open, onClose, onClientAdded }: AddClientSheetProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const addClient = useClientStore((s) => s.addClient);
  const addDetail = useClientDetailStore((s) => s.addDetail);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step tracking
  const [step, setStep] = useState(0);

  // Step 0: Basic info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [packType, setPackType] = useState<PackType>(PackType.NUTRITION);
  const [status, setStatus] = useState<ClientStatus>(ClientStatus.ACTIVE);
  const [monthlyFee, setMonthlyFee] = useState("");

  // Nutrition intake
  const [nutIntake, setNutIntake] = useState<NutritionIntakeDto>({});

  // Training intake
  const [trainIntake, setTrainIntake] = useState<TrainingIntakeDto>({});

  // Notes
  const [notes, setNotes] = useState("");

  const hasNutrition = packType === PackType.NUTRITION || packType === PackType.FULL;
  const hasTraining = packType === PackType.TRAINING || packType === PackType.FULL;

  // Build steps dynamically based on pack type
  const getSteps = () => {
    const steps = ["basic"];
    if (hasNutrition) steps.push("nutrition");
    if (hasTraining) steps.push("training");
    steps.push("notes");
    return steps;
  };

  const steps = getSteps();
  const currentStepKey = steps[step];
  const isLastStep = step === steps.length - 1;

  const resetForm = () => {
    setStep(0);
    setName(""); setEmail(""); setPassword(""); setPackType(PackType.NUTRITION);
    setStatus(ClientStatus.ACTIVE); setMonthlyFee(""); setNotes("");
    setNutIntake({}); setTrainIntake({});
  };

  const validateBasic = () => {
    if (!name.trim()) { toast({ title: "Error", description: t("addClient.errorName"), variant: "destructive" }); return false; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast({ title: "Error", description: t("addClient.errorEmail"), variant: "destructive" }); return false; }
    if (!password || password.length < 6) { toast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" }); return false; }
    return true;
  };

  const handleNext = () => {
    if (currentStepKey === "basic" && !validateBasic()) return;
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSave = async () => {
    const dto: CreateClientDto = {
      name: name.trim(),
      email: email.trim(),
      password,
      packType,
      status,
      monthlyFee: monthlyFee ? parseDecimal(monthlyFee) : 0,
      notes: notes.trim() || undefined,
      ...(hasNutrition && Object.keys(nutIntake).length > 0 && { nutritionIntake: nutIntake }),
      ...(hasTraining && Object.keys(trainIntake).length > 0 && { trainingIntake: trainIntake }),
    };

    setIsSubmitting(true);
    try {
      const created = await addClient(dto);
      addDetail({
        id: created.id,
        name: dto.name,
        email: dto.email,
        phone: "",
        services: getServicesFromPack(dto.packType),
        plan: "",
        status: dto.status === ClientStatus.ACTIVE ? "Activo" : "Pendiente",
        startDate: new Date().toISOString().slice(0, 10),
        monthlyRate: dto.monthlyFee,
        lastPaymentDate: "",
        nextPaymentDate: "",
        paymentMethod: "",
        notes: dto.notes || "",
      });
      toast({ title: t("addClient.clientAdded"), description: `${name} se ha registrado correctamente.` });
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

  // Step indicators
  const stepIcons: Record<string, React.ReactNode> = {
    basic: <User className="h-3.5 w-3.5" />,
    nutrition: <Apple className="h-3.5 w-3.5" />,
    training: <Dumbbell className="h-3.5 w-3.5" />,
    notes: <FileText className="h-3.5 w-3.5" />,
  };
  const stepLabels: Record<string, string> = {
    basic: "Datos",
    nutrition: t("addClient.nutritionIntake"),
    training: t("addClient.trainingIntake"),
    notes: t("addClient.notesFinalize"),
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Nuevo Cliente
          </SheetTitle>
        </SheetHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-1.5 mt-4 mb-6 px-1">
          {steps.map((s, i) => (
            <button
              key={s}
              onClick={() => { if (i < step) setStep(i); }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                    ? "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {stepIcons[s]}
              <span className="hidden sm:inline">{stepLabels[s]}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
          ))}
        </div>

        <div className="space-y-5 pb-6">
          {/* Step: Basic Info */}
          {currentStepKey === "basic" && (
            <div className="space-y-4 animate-fade-in">
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
                <Select value={packType} onValueChange={(v) => { setPackType(v as PackType); setStep(0); }}>
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
                <Input type="text" inputMode="decimal" value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} className={inputCls} placeholder="0" />
              </div>
            </div>
          )}

          {/* Step: Nutrition Intake */}
          {currentStepKey === "nutrition" && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Apple className="h-4 w-4 text-primary" />
                {t("addClient.nutritionGoals")}
              </div>

              <div>
                <Label className="text-foreground text-xs">{t("addClient.mainGoal")}</Label>
                <Select value={nutIntake.goal || ""} onValueChange={(v) => setNutIntake({ ...nutIntake, goal: v })}>
                  <SelectTrigger className={inputCls}><SelectValue placeholder={t("addClient.selectGoal")} /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {NUTRITION_GOALS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-foreground text-xs">{t("addClient.goalTimeframe")}</Label>
                  <Input value={nutIntake.goalTimeframe || ""} onChange={(e) => setNutIntake({ ...nutIntake, goalTimeframe: e.target.value })} className={inputCls} placeholder="Ej: 3 meses" />
                </div>
                <div>
                  <Label className="text-foreground text-xs">{t("addClient.targetWeight")}</Label>
                  <Input type="text" inputMode="decimal" value={nutIntake.targetWeight ?? ""} onChange={(e) => setNutIntake({ ...nutIntake, targetWeight: parseOptionalDecimal(e.target.value) })} className={inputCls} placeholder="kg" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-foreground text-xs">Altura</Label>
                  <Input type="text" inputMode="decimal" value={nutIntake.height ?? ""} onChange={(e) => setNutIntake({ ...nutIntake, height: parseOptionalDecimal(e.target.value) })} className={inputCls} placeholder="cm" />
                </div>
                <div>
                  <Label className="text-foreground text-xs">Peso actual</Label>
                  <Input type="text" inputMode="decimal" value={nutIntake.currentWeight ?? ""} onChange={(e) => setNutIntake({ ...nutIntake, currentWeight: parseOptionalDecimal(e.target.value) })} className={inputCls} placeholder="kg" />
                </div>
                <div>
                  <Label className="text-foreground text-xs">Edad</Label>
                  <Input type="text" inputMode="numeric" value={nutIntake.age ?? ""} onChange={(e) => setNutIntake({ ...nutIntake, age: parseOptionalDecimal(e.target.value) })} className={inputCls} placeholder="años" />
                </div>
              </div>

              <div>
                <Label className="text-foreground text-xs">{t("addClient.motivation")}</Label>
                <Textarea value={nutIntake.goalMotivation || ""} onChange={(e) => setNutIntake({ ...nutIntake, goalMotivation: e.target.value })} className={`${inputCls} min-h-[60px] resize-none`} placeholder={t("addClient.motivationPlaceholder")} />
              </div>

              <div className="flex items-center gap-2 text-sm font-semibold text-foreground pt-2">
                <User className="h-4 w-4 text-primary" />
                {t("addClient.lifestyle")}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-foreground text-xs">{t("addClient.occupation")}</Label>
                  <Input value={nutIntake.occupation || ""} onChange={(e) => setNutIntake({ ...nutIntake, occupation: e.target.value })} className={inputCls} placeholder="Ej: Oficina" />
                </div>
                <div>
                  <Label className="text-foreground text-xs">{t("addClient.mealsPerDay")}</Label>
                  <Input type="number" value={nutIntake.mealsPerDay ?? ""} onChange={(e) => setNutIntake({ ...nutIntake, mealsPerDay: e.target.value ? Number(e.target.value) : undefined })} className={inputCls} placeholder="4" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-foreground text-xs">{t("addClient.sleepHours")}</Label>
                  <Input type="text" inputMode="decimal" value={nutIntake.sleepHours ?? ""} onChange={(e) => setNutIntake({ ...nutIntake, sleepHours: parseOptionalDecimal(e.target.value) })} className={inputCls} placeholder="7" />
                </div>
                <div>
                  <Label className="text-foreground text-xs">{t("addClient.stressLevel")}</Label>
                  <div className="mt-2">
                    <Slider min={1} max={10} step={1} value={[nutIntake.stressLevel || 5]} onValueChange={([v]) => setNutIntake({ ...nutIntake, stressLevel: v })} />
                    <p className="text-xs text-muted-foreground text-center mt-1">{nutIntake.stressLevel || 5}/10</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm font-semibold text-foreground pt-2">
                {t("addClient.healthRestrictions")}
              </div>

              <div>
                <Label className="text-foreground text-xs">{t("addClient.supplements")}</Label>
                <Input value={nutIntake.supplements || ""} onChange={(e) => setNutIntake({ ...nutIntake, supplements: e.target.value })} className={inputCls} placeholder="Creatina, omega-3..." />
              </div>
              <div>
                <Label className="text-foreground text-xs">{t("addClient.excludedFoods")}</Label>
                <Input value={nutIntake.excludedFoods || ""} onChange={(e) => setNutIntake({ ...nutIntake, excludedFoods: e.target.value })} className={inputCls} placeholder="Lácteos, gluten..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-foreground text-xs">{t("addClient.allergies")}</Label>
                  <Input value={nutIntake.allergies || ""} onChange={(e) => setNutIntake({ ...nutIntake, allergies: e.target.value })} className={inputCls} placeholder="Ninguna" />
                </div>
                <div>
                  <Label className="text-foreground text-xs">{t("addClient.pathologies")}</Label>
                  <Input value={nutIntake.pathologies || ""} onChange={(e) => setNutIntake({ ...nutIntake, pathologies: e.target.value })} className={inputCls} placeholder="Ninguna" />
                </div>
              </div>
              <div>
                <Label className="text-foreground text-xs">{t("addClient.digestiveIssues")}</Label>
                <Input value={nutIntake.digestiveIssues || ""} onChange={(e) => setNutIntake({ ...nutIntake, digestiveIssues: e.target.value })} className={inputCls} placeholder="Ninguno" />
              </div>
            </div>
          )}

          {/* Step: Training Intake */}
          {currentStepKey === "training" && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Dumbbell className="h-4 w-4 text-primary" />
                {t("addClient.trainingBackground")}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-foreground text-xs">{t("addClient.experience")}</Label>
                  <Input value={trainIntake.experience || ""} onChange={(e) => setTrainIntake({ ...trainIntake, experience: e.target.value })} className={inputCls} placeholder="Ej: 3 años" />
                </div>
                <div>
                  <Label className="text-foreground text-xs">{t("addClient.sessionsPerWeek")}</Label>
                  <Input value={trainIntake.sessionsPerWeek || ""} onChange={(e) => setTrainIntake({ ...trainIntake, sessionsPerWeek: e.target.value })} className={inputCls} placeholder="4" />
                </div>
              </div>

              <div>
                <Label className="text-foreground text-xs">{t("addClient.intensity")}</Label>
                <div className="mt-2">
                  <Slider min={1} max={10} step={1} value={[trainIntake.intensity || 5]} onValueChange={([v]) => setTrainIntake({ ...trainIntake, intensity: v })} />
                  <p className="text-xs text-muted-foreground text-center mt-1">{trainIntake.intensity || 5}/10</p>
                </div>
              </div>

              <div>
                <Label className="text-foreground text-xs">{t("addClient.modality")}</Label>
                <Select value={trainIntake.modality || ""} onValueChange={(v) => setTrainIntake({ ...trainIntake, modality: v })}>
                  <SelectTrigger className={inputCls}><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="Powerlifting">Powerlifting</SelectItem>
                    <SelectItem value="Hipertrofia">Hipertrofia</SelectItem>
                    <SelectItem value="Fuerza general">Fuerza general</SelectItem>
                    <SelectItem value="Funcional">Funcional</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-foreground text-xs">{t("addClient.trainingGoal")}</Label>
                <Input value={trainIntake.goal || ""} onChange={(e) => setTrainIntake({ ...trainIntake, goal: e.target.value })} className={inputCls} placeholder="Ej: Subir total SBD" />
              </div>

              <div>
                <Label className="text-foreground text-xs">{t("addClient.currentSBD")}</Label>
                <Input value={trainIntake.currentSBD || ""} onChange={(e) => setTrainIntake({ ...trainIntake, currentSBD: e.target.value })} className={inputCls} placeholder="Ej: 180/120/200" />
              </div>

              <div>
                <Label className="text-foreground text-xs">{t("addClient.otherSports")}</Label>
                <Input value={trainIntake.otherSports || ""} onChange={(e) => setTrainIntake({ ...trainIntake, otherSports: e.target.value })} className={inputCls} placeholder="Ninguno" />
              </div>

              <div>
                <Label className="text-foreground text-xs">{t("addClient.injuries")}</Label>
                <Textarea value={trainIntake.injuries || ""} onChange={(e) => setTrainIntake({ ...trainIntake, injuries: e.target.value })} className={`${inputCls} min-h-[60px] resize-none`} placeholder="Describe lesiones o limitaciones..." />
              </div>
            </div>
          )}

          {/* Step: Notes & Finalize */}
          {currentStepKey === "notes" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <FileText className="h-4 w-4 text-primary" />
                {t("addClient.notesFinalize")}
              </div>

              {/* Summary */}
              <div className="bg-muted/40 rounded-lg p-4 space-y-2 text-sm">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{t("addClient.reviewSummary")}</p>
                <div className="flex justify-between"><span className="text-muted-foreground">Nombre</span><span className="text-foreground font-medium">{name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="text-foreground font-medium">{email}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Pack</span><span className="text-foreground font-medium">{packTypeLabels[packType]}</span></div>
                {monthlyFee && <div className="flex justify-between"><span className="text-muted-foreground">Tarifa</span><span className="text-foreground font-medium">{monthlyFee}€/mes</span></div>}
                {hasNutrition && nutIntake.goal && <div className="flex justify-between"><span className="text-muted-foreground">Objetivo nutrición</span><span className="text-foreground font-medium">{nutIntake.goal}</span></div>}
                {hasTraining && trainIntake.modality && <div className="flex justify-between"><span className="text-muted-foreground">Modalidad</span><span className="text-foreground font-medium">{trainIntake.modality}</span></div>}
              </div>

              <div>
                <Label className="text-foreground text-xs">{t("addClient.internalNotes")}</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputCls} min-h-[100px] resize-none`} placeholder={t("addClient.notesPlaceholder")} />
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-2 pt-2">
            {step > 0 && (
              <Button variant="outline" onClick={handleBack} className="flex-1 border-border gap-1">
                <ChevronLeft className="h-4 w-4" /> Atrás
              </Button>
            )}
            {isLastStep ? (
              <Button onClick={handleSave} disabled={isSubmitting} className="flex-1 glow-primary-sm gap-2">
                <Save className="h-4 w-4" /> {isSubmitting ? "Guardando..." : t("addClient.saveClient")}
              </Button>
            ) : (
              <Button onClick={handleNext} className="flex-1 glow-primary-sm gap-1">
                Siguiente <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AddClientSheet;
