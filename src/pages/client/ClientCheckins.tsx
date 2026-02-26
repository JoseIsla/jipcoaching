import { useState } from "react";
import ClientLayout from "@/components/client/ClientLayout";
import { useClient } from "@/contexts/ClientContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ClipboardList, Check, Clock, AlertCircle } from "lucide-react";
import AnimatedChevron from "@/components/ui/animated-chevron";
import AnimatedCollapsibleContent from "@/components/ui/animated-collapsible-content";
import { useToast } from "@/hooks/use-toast";
import {
  mockQuestionnaireEntries,
  nutritionTemplates,
  trainingTemplate,
  type QuestionnaireEntry,
  type QuestionDefinition,
} from "@/data/mockData";

// Time window: the questionnaire day + 2 days after
const getEntryWindowStatus = (entry: QuestionnaireEntry): "within" | "future" | "expired" => {
  const entryDate = new Date(entry.date);
  const now = new Date();
  const windowEnd = new Date(entryDate);
  windowEnd.setDate(windowEnd.getDate() + 2);
  if (now < entryDate) return "future";
  if (now <= windowEnd) return "within";
  return "expired";
};

const QuestionField = ({
  q,
  value,
  onChange,
}: {
  q: QuestionDefinition;
  value: string | number | boolean | undefined;
  onChange: (v: string | number | boolean) => void;
}) => {
  switch (q.type) {
    case "number":
      return (
        <div className="space-y-1">
          <Label className="text-sm text-foreground">{q.label}{q.required && " *"}</Label>
          <Input
            type="number"
            step="0.1"
            className="bg-background border-border h-10"
            value={value as number ?? ""}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </div>
      );
    case "scale":
      return (
        <div className="space-y-2">
          <Label className="text-sm text-foreground">{q.label}{q.required && " *"}</Label>
          <div className="flex items-center gap-3">
            <Slider
              value={[typeof value === "number" ? value : 5]}
              onValueChange={([v]) => onChange(v)}
              min={1}
              max={10}
              step={1}
              className="flex-1"
            />
            <span className="text-sm font-bold text-primary w-6 text-right">{typeof value === "number" ? value : "—"}</span>
          </div>
        </div>
      );
    case "yesno":
      return (
        <div className="flex items-center justify-between">
          <Label className="text-sm text-foreground">{q.label}{q.required && " *"}</Label>
          <Switch
            checked={value === true}
            onCheckedChange={(v) => onChange(v)}
          />
        </div>
      );
    case "select":
      return (
        <div className="space-y-1">
          <Label className="text-sm text-foreground">{q.label}{q.required && " *"}</Label>
          <Select value={value as string || ""} onValueChange={onChange}>
            <SelectTrigger className="bg-background border-border h-10">
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {q.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    default:
      return (
        <div className="space-y-1">
          <Label className="text-sm text-foreground">{q.label}{q.required && " *"}</Label>
          <Textarea
            className="bg-background border-border min-h-[60px]"
            value={value as string ?? ""}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
  }
};

const CheckinCard = ({ entry }: { entry: QuestionnaireEntry }) => {
  const [open, setOpen] = useState(false);
  const [responses, setResponses] = useState<Record<string, string | number | boolean>>(entry.responses || {});
  const [submitted, setSubmitted] = useState(entry.status === "respondido");
  const { toast } = useToast();

  const windowStatus = getEntryWindowStatus(entry);
  const canFill = !submitted && windowStatus === "within";

  const template = entry.category === "nutrition"
    ? nutritionTemplates.find((t) => t.id === entry.templateId)
    : trainingTemplate;
  const questions = template
    ? "questions" in template ? template.questions : []
    : [];

  const handleSubmit = () => {
    // In-memory update
    const idx = mockQuestionnaireEntries.findIndex((e) => e.id === entry.id);
    if (idx >= 0) {
      mockQuestionnaireEntries[idx].status = "respondido";
      mockQuestionnaireEntries[idx].responses = responses;
    }
    setSubmitted(true);
    toast({ title: "Check-in enviado", description: "Tus respuestas se han guardado correctamente." });
  };

  const statusIcon = submitted
    ? <Check className="h-3.5 w-3.5 text-green-500" />
    : windowStatus === "within"
      ? <Clock className="h-3.5 w-3.5 text-yellow-500" />
      : windowStatus === "future"
        ? <Clock className="h-3.5 w-3.5 text-blue-400" />
        : <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />;

  const statusLabel = submitted
    ? "Respondido"
    : windowStatus === "within"
      ? "Pendiente"
      : windowStatus === "future"
        ? "Próximamente"
        : "Fuera de plazo";

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <CollapsibleTrigger className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-2">
            <AnimatedChevron open={open} />
            <div>
              <p className="text-sm font-semibold text-foreground">{entry.templateName}</p>
              <p className="text-[10px] text-muted-foreground">{entry.dayLabel} · {entry.weekLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {statusIcon}
            <span className="text-[10px] text-muted-foreground">{statusLabel}</span>
          </div>
        </CollapsibleTrigger>
        <AnimatedCollapsibleContent open={open}>
          <div className="p-4 pt-0 space-y-4">
            {canFill ? (
              <>
                {questions.map((q) => (
                  <QuestionField
                    key={q.id}
                    q={q}
                    value={responses[q.id]}
                    onChange={(v) => setResponses({ ...responses, [q.id]: v })}
                  />
                ))}
                <Button onClick={handleSubmit} className="w-full glow-primary-sm">
                  Enviar check-in
                </Button>
              </>
            ) : submitted ? (
              <div className="space-y-2">
                {questions.map((q) => (
                  <div key={q.id} className="flex justify-between items-start py-1 border-b border-border/30 last:border-0">
                    <span className="text-xs text-muted-foreground">{q.label}</span>
                    <span className="text-xs font-medium text-foreground ml-3">
                      {responses[q.id] !== undefined
                        ? typeof responses[q.id] === "boolean"
                          ? responses[q.id] ? "Sí" : "No"
                          : String(responses[q.id])
                        : "—"}
                    </span>
                  </div>
                ))}
              </div>
            ) : windowStatus === "future" ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Este check-in estará disponible el <strong>{entry.dayLabel}</strong>.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Este check-in ya no está disponible para rellenar.
              </p>
            )}
          </div>
        </AnimatedCollapsibleContent>
      </div>
    </Collapsible>
  );
};

const ClientCheckins = () => {
  const { client } = useClient();
  const hasNutrition = client.services.includes("nutrition");
  const hasTraining = client.services.includes("training");

  const myEntries = mockQuestionnaireEntries.filter((e) => e.clientId === client.id);
  const nutritionEntries = myEntries.filter((e) => e.category === "nutrition");
  const trainingEntries = myEntries.filter((e) => e.category === "training");

  const defaultTab = hasNutrition ? "nutrition" : "training";

  return (
    <ClientLayout>
      <div className="space-y-5 max-w-lg mx-auto animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-yellow-500" />
            Check-ins
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Cuestionarios semanales</p>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList className="bg-card border border-border w-full">
            {hasNutrition && <TabsTrigger value="nutrition" className="flex-1 text-xs">🍎 Nutrición</TabsTrigger>}
            {hasTraining && <TabsTrigger value="training" className="flex-1 text-xs">🏋️ Entrenamiento</TabsTrigger>}
          </TabsList>

          {hasNutrition && (
            <TabsContent value="nutrition" className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Check-ins cada <strong>martes</strong> y <strong>viernes</strong>. Tienes hasta 2 días después para rellenarlos.
              </p>
              {nutritionEntries.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No hay check-ins de nutrición aún.</p>
              )}
              {nutritionEntries.map((entry) => (
                <CheckinCard key={entry.id} entry={entry} />
              ))}
            </TabsContent>
          )}

          {hasTraining && (
            <TabsContent value="training" className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Registro semanal cada <strong>domingo</strong>. Tienes hasta 2 días después para rellenarlo.
              </p>
              {trainingEntries.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No hay check-ins de entrenamiento aún.</p>
              )}
              {trainingEntries.map((entry) => (
                <CheckinCard key={entry.id} entry={entry} />
              ))}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </ClientLayout>
  );
};

export default ClientCheckins;
