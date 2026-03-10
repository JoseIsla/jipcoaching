import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ClipboardList, Utensils, Dumbbell, CheckCircle2, Clock, XCircle, ChevronLeft, ChevronRight, Eye, Settings2, Plus, Trash2, GripVertical, Download, Pencil, User, AlertTriangle } from "lucide-react";
import { type QuestionnaireEntry, getEntryWindowStatus } from "@/data/useQuestionnaireStore";

/** Compute the effective display status: if API says "pendiente" but the window expired, treat as "expirado". */
const getEffectiveStatus = (e: QuestionnaireEntry): QuestionnaireEntry["status"] => {
  if (e.status === "pendiente" && getEntryWindowStatus(e) === "expired") return "expirado";
  return e.status;
};
import { type QuestionDefinition, type QuestionType } from "@/data/questionnaireDefs";
import { useQuestionnaireStore } from "@/data/useQuestionnaireStore";
import { useTemplateStore } from "@/data/useTemplateStore";
import { useTranslation } from "@/i18n/useTranslation";
import { exportTrainingLogPDF } from "@/utils/exportTrainingPDF";
import MediaCommentThread from "@/components/admin/MediaCommentThread";

// ─── Drag helpers ───
function useDragReorder(items: { id: string }[], onReorder: (ids: string[]) => void) {
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  const onDragStart = (idx: number) => { dragItem.current = idx; };
  const onDragEnter = (idx: number) => { dragOver.current = idx; };
  const onDragEnd = () => {
    if (dragItem.current === null || dragOver.current === null || dragItem.current === dragOver.current) {
      dragItem.current = null;
      dragOver.current = null;
      return;
    }
    const ids = items.map((i) => i.id);
    const [removed] = ids.splice(dragItem.current, 1);
    ids.splice(dragOver.current, 0, removed);
    onReorder(ids);
    dragItem.current = null;
    dragOver.current = null;
  };

  return { onDragStart, onDragEnter, onDragEnd };
}

// ─── Add / Edit question dialog ───
function QuestionEditorDialog({
  question,
  open,
  onOpenChange,
  onSave,
}: {
  question?: QuestionDefinition;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (q: QuestionDefinition) => void;
}) {
  const { t } = useTranslation();
  const isNew = !question;
  const [label, setLabel] = useState(question?.label || "");
  const [type, setType] = useState<QuestionType>(question?.type || "text");
  const [required, setRequired] = useState(question?.required ?? true);

  useEffect(() => {
    setLabel(question?.label || "");
    setType(question?.type || "text");
    setRequired(question?.required ?? true);
  }, [question]);

  const handleSave = () => {
    if (!label.trim()) return;
    onSave({
      id: question?.id || `q-${Date.now()}`,
      label: label.trim(),
      type,
      required,
    });
    onOpenChange(false);
    if (isNew) { setLabel(""); setType("text"); setRequired(true); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isNew ? t("questionnaires.addQuestion") : t("questionnaires.editQuestionLabel")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label className="text-foreground">{t("questionnaires.questionLabel")}</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} className="bg-muted border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as QuestionType)}>
              <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Texto</SelectItem>
                <SelectItem value="number">Número</SelectItem>
                <SelectItem value="scale">Escala (1-10)</SelectItem>
                <SelectItem value="yesno">Sí/No</SelectItem>
                <SelectItem value="select">Selección</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="accent-primary" id="q-required" />
            <Label htmlFor="q-required" className="text-foreground text-sm">{t("questionnaires.required")}</Label>
          </div>
          <Button onClick={handleSave} className="w-full" disabled={!label.trim()}>
            {isNew ? t("questionnaires.addQuestion") : "Guardar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Question row ───
function QuestionRow({
  question,
  index,
  onEdit,
  onDelete,
  dragHandlers,
}: {
  question: QuestionDefinition;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  dragHandlers: { onDragStart: (i: number) => void; onDragEnter: (i: number) => void; onDragEnd: () => void };
}) {
  const { t } = useTranslation();
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border"
      draggable
      onDragStart={() => dragHandlers.onDragStart(index)}
      onDragEnter={() => dragHandlers.onDragEnter(index)}
      onDragEnd={dragHandlers.onDragEnd}
      onDragOver={(e) => e.preventDefault()}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{question.label}</p>
        <p className="text-xs text-muted-foreground capitalize">
          {question.type}{question.required ? ` · ${t("questionnaires.required")}` : ""}
        </p>
      </div>
      <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-primary" onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ─── Client checkin summary type ───
interface ClientCheckinSummary {
  clientId: string;
  clientName: string;
  entries: QuestionnaireEntry[];
  responded: number;
  pending: number;
  expired: number;
  total: number;
}

// ─── Main component ───
const AdminQuestionnaires = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState<QuestionnaireEntry | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "templates">("overview");
  const [filterStatus, setFilterStatus] = useState<"all" | "pendiente" | "respondido" | "expirado">("all");
  const allEntries = useQuestionnaireStore((s) => s.entries);
  const fetchEntries = useQuestionnaireStore((s) => s.fetchEntries);
  const generateWeeklyCheckins = useQuestionnaireStore((s) => s.generateWeeklyCheckins);
  const markAsReviewed = useQuestionnaireStore((s) => s.markAsReviewed);

  const handleViewEntry = useCallback((entry: QuestionnaireEntry) => {
    setSelectedEntry(entry);
    if (entry.status === "respondido") {
      markAsReviewed(entry.id);
    }
  }, [markAsReviewed]);

  // Fetch check-ins and templates from API on mount
  const fetchTemplates = useTemplateStore((s) => s.fetchTemplates);
  useEffect(() => {
    generateWeeklyCheckins().then(() => fetchEntries());
    fetchTemplates();
  }, []);

  // Template store
  const nutritionTemplates = useTemplateStore((s) => s.nutritionTemplates);
  const trainingTemplate = useTemplateStore((s) => s.trainingTemplate);
  const {
    updateNutritionQuestion, deleteNutritionQuestion, addNutritionQuestion, reorderNutritionQuestions,
    updateTrainingQuestion, deleteTrainingQuestion, addTrainingQuestion, reorderTrainingQuestions,
    saveTemplate,
  } = useTemplateStore();

  // Edit/add question state
  const [editingQuestion, setEditingQuestion] = useState<QuestionDefinition | undefined>();
  const [editContext, setEditContext] = useState<{ type: "nutrition" | "training"; templateId?: string } | null>(null);
  const [addContext, setAddContext] = useState<{ type: "nutrition" | "training"; templateId?: string } | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ type: "nutrition" | "training"; templateId?: string; questionId: string } | null>(null);

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "nutrition" && deleteTarget.templateId) {
      deleteNutritionQuestion(deleteTarget.templateId, deleteTarget.questionId);
      saveTemplate(deleteTarget.templateId);
    } else {
      deleteTrainingQuestion(deleteTarget.questionId);
      saveTemplate(trainingTemplate.id);
    }
    setDeleteTarget(null);
  };

  const handleSaveQuestion = (q: QuestionDefinition) => {
    if (editContext) {
      if (editContext.type === "nutrition" && editContext.templateId) {
        updateNutritionQuestion(editContext.templateId, q.id, q);
        saveTemplate(editContext.templateId);
      } else {
        updateTrainingQuestion(q.id, q);
        saveTemplate(trainingTemplate.id);
      }
      setEditContext(null);
      setEditingQuestion(undefined);
    } else if (addContext) {
      if (addContext.type === "nutrition" && addContext.templateId) {
        addNutritionQuestion(addContext.templateId, q);
        saveTemplate(addContext.templateId);
      } else {
        addTrainingQuestion(q);
        saveTemplate(trainingTemplate.id);
      }
      setAddContext(null);
    }
  };

  const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
    respondido: { label: t("questionnaires.statusResponded"), icon: CheckCircle2, className: "bg-primary/15 text-primary border-primary/30" },
    revisado: { label: t("questionnaires.statusReviewed") || "Revisado", icon: CheckCircle2, className: "bg-muted text-muted-foreground border-border" },
    pendiente: { label: t("questionnaires.statusPending"), icon: Clock, className: "bg-accent/15 text-accent border-accent/30" },
    expirado: { label: t("questionnaires.statusExpired"), icon: AlertTriangle, className: "bg-destructive/15 text-destructive border-destructive/30" },
    no_enviado: { label: t("questionnaires.statusNotSent"), icon: XCircle, className: "bg-muted text-muted-foreground border-border" },
  };

  // ── Compute week range based on offset ──
  const weekRange = useMemo(() => {
    const now = new Date();
    const shifted = new Date(now);
    shifted.setDate(now.getDate() + weekOffset * 7);
    const day = shifted.getDay(); // 0=Sun
    const diffToMon = day === 0 ? -6 : 1 - day;
    const monday = new Date(shifted);
    monday.setDate(shifted.getDate() + diffToMon);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { monday, sunday };
  }, [weekOffset]);

  const weekLabel = useMemo(() => {
    if (weekOffset === 0) return t("questionnaires.thisWeek");
    if (weekOffset === -1) return t("questionnaires.lastWeek");
    const d = weekRange.monday;
    return t("questionnaires.weekOf", { date: `${d.getDate()} ${d.toLocaleString("es-ES", { month: "short" })}` });
  }, [weekOffset, weekRange, t]);

  // Filter entries to the selected week
  const entries = useMemo(() => {
    return allEntries.filter((e) => {
      const entryDate = new Date(e.date + "T12:00:00"); // noon to avoid TZ issues
      return entryDate >= weekRange.monday && entryDate <= weekRange.sunday;
    });
  }, [allEntries, weekRange]);

  // ── Group entries by client ──
  const clientSummaries = useMemo(() => {
    const map: Record<string, ClientCheckinSummary> = {};
    entries.forEach((e) => {
      if (!map[e.clientId]) {
        map[e.clientId] = {
          clientId: e.clientId,
          clientName: e.clientName,
          entries: [],
          responded: 0,
          pending: 0,
          expired: 0,
          total: 0,
        };
      }
      map[e.clientId].entries.push(e);
      map[e.clientId].total++;
      const effectiveStatus = getEffectiveStatus(e);
      if (effectiveStatus === "respondido" || effectiveStatus === "revisado") map[e.clientId].responded++;
      else if (effectiveStatus === "expirado") map[e.clientId].expired++;
      else map[e.clientId].pending++;
    });
    return Object.values(map).sort((a, b) => {
      // Clients with pending/expired first
      const aPriority = a.pending + a.expired;
      const bPriority = b.pending + b.expired;
      if (aPriority !== bPriority) return bPriority - aPriority;
      return a.clientName.localeCompare(b.clientName);
    });
  }, [entries]);

  // Global stats
  const globalStats = useMemo(() => {
    const nutrition = entries.filter((e) => e.category === "nutrition");
    const training = entries.filter((e) => e.category === "training");
    return {
      totalEntries: entries.length,
      responded: entries.filter((e) => ["respondido", "revisado"].includes(getEffectiveStatus(e))).length,
      pending: entries.filter((e) => getEffectiveStatus(e) === "pendiente").length,
      expired: entries.filter((e) => getEffectiveStatus(e) === "expirado").length,
      nutritionTotal: nutrition.length,
      nutritionResponded: nutrition.filter((e) => ["respondido", "revisado"].includes(getEffectiveStatus(e))).length,
      trainingTotal: training.length,
      trainingResponded: training.filter((e) => ["respondido", "revisado"].includes(getEffectiveStatus(e))).length,
    };
  }, [entries]);

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("questionnaires.title")}</h1>
            <p className="text-muted-foreground text-sm mt-1">{t("questionnaires.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm font-medium text-foreground min-w-[120px] text-center">{weekLabel}</span>
            <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => Math.min(w + 1, 0))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatMini icon={ClipboardList} label="Total" value={globalStats.totalEntries} />
          <StatMini icon={CheckCircle2} label={t("questionnaires.statusResponded")} value={globalStats.responded} accent />
          <StatMini icon={Clock} label={t("questionnaires.statusPending")} value={globalStats.pending} warn={globalStats.pending > 0} />
          <StatMini icon={AlertTriangle} label={t("questionnaires.statusExpired")} value={globalStats.expired} danger={globalStats.expired > 0} />
          <StatMini icon={User} label="Clientes" value={clientSummaries.length} />
        </div>

        {/* Tab: Overview vs Templates */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "overview" | "templates")} className="space-y-4">
          <TabsList className="bg-muted border border-border">
            <TabsTrigger value="overview" className="data-[state=active]:bg-card data-[state=active]:text-primary">
              <ClipboardList className="h-4 w-4 mr-1.5" /> Seguimiento
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-card data-[state=active]:text-primary">
              <Settings2 className="h-4 w-4 mr-1.5" /> Plantillas
            </TabsTrigger>
          </TabsList>

          {/* ═══ OVERVIEW TAB — By Client ═══ */}
          <TabsContent value="overview" className="space-y-4">
            {/* Status filter */}
            <div className="flex items-center gap-2 flex-wrap">
              {(["all", "pendiente", "respondido", "expirado"] as const).map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                  className={filterStatus === status ? "" : "text-muted-foreground"}
                >
                  {status === "all" ? "Todos" : statusConfig[status]?.label}
                  {status !== "all" && (
                    <span className="ml-1.5 text-xs opacity-70">
                      {status === "respondido" ? globalStats.responded : status === "pendiente" ? globalStats.pending : globalStats.expired}
                    </span>
                  )}
                </Button>
              ))}
            </div>

            {clientSummaries.length === 0 ? (
              <EmptyState text="No hay check-ins esta semana" />
            ) : (
              clientSummaries.map((client) => {
                const filteredEntries = filterStatus === "all"
                  ? client.entries
                  : client.entries.filter((e) => getEffectiveStatus(e) === filterStatus);

                if (filteredEntries.length === 0) return null;

                return (
                  <ClientCheckinCard
                    key={client.clientId}
                    client={client}
                    filteredEntries={filteredEntries}
                    statusConfig={statusConfig}
                    onViewEntry={handleViewEntry}
                    onNavigateToClient={() => navigate(`/admin/clients/${client.clientId}`)}
                  />
                );
              })
            )}
          </TabsContent>

          {/* ═══ TEMPLATES TAB ═══ */}
          <TabsContent value="templates" className="space-y-6">
            {/* Nutrition Templates */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-primary" />
                  {t("questionnaires.nutritionTemplates")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={nutritionTemplates[0]?.id} className="space-y-4">
                  <TabsList className="bg-muted border border-border">
                    {nutritionTemplates.map((tp) => (
                      <TabsTrigger key={tp.id} value={tp.id} className="data-[state=active]:bg-card data-[state=active]:text-primary">{tp.dayLabel}</TabsTrigger>
                    ))}
                  </TabsList>
                  {nutritionTemplates.map((template) => (
                    <NutritionTemplateEditor
                      key={template.id}
                      template={template}
                      onEdit={(q) => { setEditingQuestion(q); setEditContext({ type: "nutrition", templateId: template.id }); }}
                      onDelete={(qId) => setDeleteTarget({ type: "nutrition", templateId: template.id, questionId: qId })}
                      onReorder={(ids) => { reorderNutritionQuestions(template.id, ids); saveTemplate(template.id); }}
                      onAdd={() => setAddContext({ type: "nutrition", templateId: template.id })}
                      t={t}
                    />
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Training Template */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-primary" />
                  {t("questionnaires.questionnaireQuestions")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TrainingTemplateEditor
                  questions={trainingTemplate.questions}
                  onEdit={(q) => { setEditingQuestion(q); setEditContext({ type: "training" }); }}
                  onDelete={(qId) => setDeleteTarget({ type: "training", questionId: qId })}
                  onReorder={(ids) => { reorderTrainingQuestions(ids); saveTemplate(trainingTemplate.id); }}
                  onAdd={() => setAddContext({ type: "training" })}
                  t={t}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ═══ ENTRY PREVIEW DIALOG ═══ */}
        <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
          <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                {selectedEntry?.category === "nutrition" ? <Utensils className="h-5 w-5 text-primary" /> : <Dumbbell className="h-5 w-5 text-primary" />}
                {selectedEntry?.clientName} — {selectedEntry?.templateName}
              </DialogTitle>
            </DialogHeader>
            {selectedEntry?.status === "respondido" && selectedEntry.category === "training" && (
              <div className="flex justify-end -mt-2">
                <Button variant="outline" size="sm" onClick={() => selectedEntry && exportTrainingLogPDF(selectedEntry)} className="gap-1.5">
                  <Download className="h-4 w-4" />
                  {t("questionnaires.exportPDF")}
                </Button>
              </div>
            )}
            {selectedEntry?.status === "respondido" ? (
              <div className="space-y-4 mt-2">
                {selectedEntry.trainingLog && selectedEntry.trainingLog.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("questionnaires.trainingLogReview")}</p>
                    {selectedEntry.trainingLog.map((day, dayIdx) => (
                      <div key={dayIdx} className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">{t("questionnaires.dayLabel", { n: String(day.dayNumber), name: day.dayName })}</p>
                        <div className="rounded-lg border border-border overflow-hidden">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-muted/50 text-left">
                                <th className="px-3 py-2 text-xs font-medium text-muted-foreground">{t("progress.exercise")}</th>
                                <th className="px-3 py-2 text-xs font-medium text-muted-foreground text-center">{t("questionnaires.planned")}</th>
                                <th className="px-3 py-2 text-xs font-medium text-primary text-center">{t("questionnaires.actual")}</th>
                                <th className="px-3 py-2 text-xs font-medium text-muted-foreground text-center">RPE / RPE real</th>
                              </tr>
                            </thead>
                            <tbody>
                              {day.exercises.map((ex, i) => {
                                const rpeDiff = ex.actualRPE && ex.plannedRPE ? ex.actualRPE - ex.plannedRPE : null;
                                return (
                                  <tr key={i} className="border-t border-border/50">
                                    <td className="px-3 py-2">
                                      <p className="text-sm font-medium text-foreground">{ex.exerciseName}</p>
                                      <p className="text-[10px] text-muted-foreground">{ex.section === "basic" ? "Básico" : "Variante"}</p>
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <p className="text-xs text-muted-foreground">{ex.plannedSets}×{ex.plannedReps}</p>
                                      <p className="text-[10px] text-muted-foreground">{ex.plannedLoad}</p>
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <p className="text-xs text-foreground font-medium">{ex.actualSets ? `${ex.actualSets}×${ex.actualReps || "?"}` : "—"}</p>
                                      <p className="text-[10px] font-mono font-bold text-foreground">{ex.actualWeight ? `${ex.actualWeight}kg` : "—"}</p>
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <div className="flex flex-col items-center">
                                        <span className="text-xs text-muted-foreground">{ex.plannedRPE ?? "—"}</span>
                                        <span className={`text-sm font-mono font-bold ${rpeDiff && rpeDiff > 1 ? "text-destructive" : rpeDiff && rpeDiff < -1 ? "text-primary" : "text-foreground"}`}>
                                          {ex.actualRPE ?? "—"}
                                        </span>
                                        {rpeDiff !== null && (
                                          <span className={`text-[10px] ${rpeDiff > 0 ? "text-destructive" : rpeDiff < 0 ? "text-primary" : "text-muted-foreground"}`}>
                                            {rpeDiff > 0 ? `+${rpeDiff}` : rpeDiff === 0 ? "=" : rpeDiff}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                    <Separator className="bg-border" />
                  </div>
                )}
                {(!selectedEntry.trainingLog || selectedEntry.trainingLog.length === 0) && selectedEntry.liftLogs && selectedEntry.liftLogs.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("questionnaires.weightRecord")}</p>
                    <div className="rounded-lg border border-border overflow-hidden">
                      <table className="w-full">
                        <thead><tr className="bg-muted/50 text-left">
                          <th className="px-3 py-2 text-xs font-medium text-muted-foreground">{t("progress.exercise")}</th>
                          <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Series</th>
                          <th className="px-3 py-2 text-xs font-medium text-muted-foreground text-right">{t("progress.weight")} (kg)</th>
                          <th className="px-3 py-2 text-xs font-medium text-muted-foreground text-right">RPE</th>
                        </tr></thead>
                        <tbody>
                          {selectedEntry.liftLogs.map((log, i) => (
                            <tr key={i} className="border-t border-border/50">
                              <td className="px-3 py-2 text-sm font-medium text-foreground">{log.exerciseName}</td>
                              <td className="px-3 py-2 text-sm text-muted-foreground">{log.sets}</td>
                              <td className="px-3 py-2 text-sm text-foreground text-right font-mono">{log.weight}</td>
                              <td className="px-3 py-2 text-sm text-primary text-right font-mono">{log.rpe ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {selectedEntry.responses && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("questionnaires.responses")}</p>
                    {(() => {
                      // Build ordered question list: prefer templateQuestions (already ordered by DB), fallback to store templates
                      const orderedQuestions: { id: string; label: string }[] =
                        selectedEntry.templateQuestions && selectedEntry.templateQuestions.length > 0
                          ? selectedEntry.templateQuestions
                          : selectedEntry.category === "nutrition"
                            ? (nutritionTemplates.find((tp) => tp.id === selectedEntry.templateId)?.questions || [])
                            : (trainingTemplate.questions || []);

                      // Show responses in question order; append any orphan keys at the end
                      const orderedKeys = orderedQuestions.map((q) => q.id);
                      const orphanKeys = Object.keys(selectedEntry.responses!).filter((k) => !orderedKeys.includes(k));
                      const allKeys = [...orderedKeys, ...orphanKeys];

                      return allKeys
                        .filter((key) => selectedEntry.responses![key] !== undefined)
                        .map((key) => {
                          const val = selectedEntry.responses![key];
                          const qDef = orderedQuestions.find((q) => q.id === key);
                          return (
                            <div key={key} className="flex justify-between items-start gap-4 py-2 border-b border-border/50">
                              <span className="text-sm text-muted-foreground">{qDef?.label || key}</span>
                              <span className="text-sm font-medium text-foreground text-right">{val === true || val === "true" ? "Sí" : val === false || val === "false" ? "No" : String(val)}</span>
                            </div>
                          );
                        });
                    })()}
                  </div>
                )}
                {/* Technique Videos */}
                {selectedEntry.techniqueVideos && selectedEntry.techniqueVideos.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Video className="h-4 w-4 text-primary" />
                      Videos de técnica ({selectedEntry.techniqueVideos.length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedEntry.techniqueVideos.map((v) => (
                        <div key={v.id} className="bg-muted/30 rounded-lg overflow-hidden border border-border">
                          <video src={v.url} controls preload="metadata" className="w-full max-h-48 bg-black rounded-t-lg" />
                          <div className="p-2.5 space-y-2">
                            <p className="text-sm font-semibold text-foreground">{v.exerciseName}</p>
                            {v.notes && <p className="text-xs text-muted-foreground mt-0.5">{v.notes}</p>}
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {new Date(v.uploadedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                            <MediaCommentThread targetType="video" targetId={v.id} clientId={selectedEntry.clientId} exerciseName={v.exerciseName} compact />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : selectedEntry?.status === "expirado" ? (
              <div className="py-8 text-center">
                <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-3" />
                <p className="text-sm text-destructive font-medium">{t("questionnaires.statusExpired")}</p>
                <p className="text-xs text-muted-foreground mt-1">El cliente no completó este check-in a tiempo</p>
              </div>
            ) : (
              <div className="py-8 text-center"><Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">{t("questionnaires.statusPending")}</p></div>
            )}
          </DialogContent>
        </Dialog>

        {/* ═══ EDIT QUESTION DIALOG ═══ */}
        <QuestionEditorDialog
          question={editingQuestion}
          open={!!editContext}
          onOpenChange={(o) => { if (!o) { setEditContext(null); setEditingQuestion(undefined); } }}
          onSave={handleSaveQuestion}
        />

        {/* ═══ ADD QUESTION DIALOG ═══ */}
        <QuestionEditorDialog
          open={!!addContext}
          onOpenChange={(o) => { if (!o) setAddContext(null); }}
          onSave={handleSaveQuestion}
        />

        {/* ═══ DELETE CONFIRMATION ═══ */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">{t("questionnaires.confirmDeleteQuestion")}</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

// ─── Client Checkin Card ───
function ClientCheckinCard({
  client,
  filteredEntries,
  statusConfig,
  onViewEntry,
  onNavigateToClient,
}: {
  client: ClientCheckinSummary;
  filteredEntries: QuestionnaireEntry[];
  statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string }>;
  onViewEntry: (e: QuestionnaireEntry) => void;
  onNavigateToClient: () => void;
}) {
  const nutritionEntries = filteredEntries.filter((e) => e.category === "nutrition");
  const trainingEntries = filteredEntries.filter((e) => e.category === "training");

  // Completion percentage
  const completionPct = client.total > 0 ? Math.round((client.responded / client.total) * 100) : 0;

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <button onClick={onNavigateToClient} className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                {client.clientName}
              </button>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{client.total} check-ins</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className={`text-xs font-medium ${completionPct === 100 ? "text-primary" : completionPct > 0 ? "text-accent" : "text-muted-foreground"}`}>
                  {completionPct}% completado
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {client.responded > 0 && (
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />{client.responded}
              </Badge>
            )}
            {client.pending > 0 && (
              <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/30">
                <Clock className="h-3 w-3 mr-1" />{client.pending}
              </Badge>
            )}
            {client.expired > 0 && (
              <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/30">
                <AlertTriangle className="h-3 w-3 mr-1" />{client.expired}
              </Badge>
            )}
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${completionPct === 100 ? "bg-primary" : "bg-primary/60"}`}
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {/* Nutrition entries */}
        {nutritionEntries.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Utensils className="h-3 w-3" /> Nutrición
            </p>
            {nutritionEntries.map((entry) => (
              <EntryRow key={entry.id} entry={entry} onView={() => onViewEntry(entry)} statusConfig={statusConfig} />
            ))}
          </div>
        )}
        {/* Training entries */}
        {trainingEntries.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Dumbbell className="h-3 w-3" /> Entrenamiento
            </p>
            {trainingEntries.map((entry) => (
              <EntryRow key={entry.id} entry={entry} onView={() => onViewEntry(entry)} statusConfig={statusConfig} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Nutrition template editor (per tab) ───
function NutritionTemplateEditor({
  template,
  onEdit,
  onDelete,
  onReorder,
  onAdd,
  t,
}: {
  template: { id: string; name: string; questions: QuestionDefinition[]; dayLabel: string };
  onEdit: (q: QuestionDefinition) => void;
  onDelete: (qId: string) => void;
  onReorder: (ids: string[]) => void;
  onAdd: () => void;
  t: (key: string) => string;
}) {
  const drag = useDragReorder(template.questions, onReorder);

  return (
    <TabsContent value={template.id} className="space-y-4 mt-4">
      <p className="text-sm text-muted-foreground">{template.name} — {template.questions.length} {t("questionnaires.questions")}</p>
      <div className="space-y-3">
        {template.questions.map((q, idx) => (
          <QuestionRow
            key={q.id}
            question={q}
            index={idx}
            onEdit={() => onEdit(q)}
            onDelete={() => onDelete(q.id)}
            dragHandlers={drag}
          />
        ))}
      </div>
      <Button variant="outline" size="sm" className="w-full border-dashed" onClick={onAdd}>
        <Plus className="h-4 w-4 mr-1" /> {t("questionnaires.addQuestion")}
      </Button>
    </TabsContent>
  );
}

// ─── Training template editor ───
function TrainingTemplateEditor({
  questions,
  onEdit,
  onDelete,
  onReorder,
  onAdd,
  t,
}: {
  questions: QuestionDefinition[];
  onEdit: (q: QuestionDefinition) => void;
  onDelete: (qId: string) => void;
  onReorder: (ids: string[]) => void;
  onAdd: () => void;
  t: (key: string) => string;
}) {
  const drag = useDragReorder(questions, onReorder);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Registro de Entrenamiento (Generado Automáticamente)</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Esta sección se genera dinámicamente en cada check-in basándose en el plan de entrenamiento activo del cliente.
        </p>
        
        {/* Mock table preview */}
        <div className="rounded-lg border border-border overflow-hidden opacity-70 bg-muted/20 pointer-events-none select-none">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 text-left">
                <th className="px-3 py-2 text-xs font-medium text-muted-foreground">Ejercicio</th>
                <th className="px-3 py-2 text-xs font-medium text-muted-foreground text-center">Pautado</th>
                <th className="px-3 py-2 text-xs font-medium text-primary text-center">Real</th>
                <th className="px-3 py-2 text-xs font-medium text-muted-foreground text-center">RPE / RPE real</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border/50">
                <td className="px-3 py-2">
                  <p className="text-sm font-medium text-foreground">Sentadilla</p>
                  <p className="text-[10px] text-muted-foreground">Básico</p>
                </td>
                <td className="px-3 py-2 text-center">
                  <p className="text-xs text-muted-foreground">3×8</p>
                  <p className="text-[10px] text-muted-foreground">100kg</p>
                </td>
                <td className="px-3 py-2 text-center">
                  <p className="text-xs text-foreground font-medium">—</p>
                  <p className="text-[10px] font-mono font-bold text-foreground">—</p>
                </td>
                <td className="px-3 py-2 text-center flex flex-col items-center">
                  <span className="text-xs text-muted-foreground">8</span>
                  <span className="text-sm font-mono font-bold text-foreground">—</span>
                </td>
              </tr>
              <tr className="border-t border-border/50">
                <td className="px-3 py-2">
                  <p className="text-sm font-medium text-foreground">Press Banca</p>
                  <p className="text-[10px] text-muted-foreground">Básico</p>
                </td>
                <td className="px-3 py-2 text-center">
                  <p className="text-xs text-muted-foreground">3×10</p>
                  <p className="text-[10px] text-muted-foreground">80kg</p>
                </td>
                <td className="px-3 py-2 text-center">
                  <p className="text-xs text-foreground font-medium">—</p>
                  <p className="text-[10px] font-mono font-bold text-foreground">—</p>
                </td>
                <td className="px-3 py-2 text-center flex flex-col items-center">
                  <span className="text-xs text-muted-foreground">7</span>
                  <span className="text-sm font-mono font-bold text-foreground">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <Separator className="bg-border" />

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Preguntas Adicionales</h3>
        <p className="text-sm text-muted-foreground">
          Estas preguntas se mostrarán debajo del registro de entrenamiento.
        </p>
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <QuestionRow
              key={q.id}
              question={q}
              index={idx}
              onEdit={() => onEdit(q)}
              onDelete={() => onDelete(q.id)}
              dragHandlers={drag}
            />
          ))}
        </div>
        <Button variant="outline" size="sm" className="w-full border-dashed" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-1" /> {t("questionnaires.addQuestion")}
        </Button>
      </div>
    </div>
  );
}

// ─── Small helpers ───
function StatMini({ icon: Icon, label, value, accent, warn, danger }: { icon: typeof ClipboardList; label: string; value: number; accent?: boolean; warn?: boolean; danger?: boolean }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${danger ? "bg-destructive/10" : warn ? "bg-accent/10" : accent ? "bg-primary/10" : "bg-muted"}`}>
          <Icon className={`h-4 w-4 ${danger ? "text-destructive" : warn ? "text-accent" : accent ? "text-primary" : "text-muted-foreground"}`} />
        </div>
        <div><p className="text-xl font-bold text-foreground">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
      </CardContent>
    </Card>
  );
}

function EntryRow({ entry, onView, statusConfig }: { entry: QuestionnaireEntry; onView: () => void; statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> }) {
  const config = statusConfig[getEffectiveStatus(entry)] || statusConfig.no_enviado;
  const StatusIcon = config.icon;
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer" onClick={onView}>
      <div className="flex items-center gap-3 min-w-0">
        <StatusIcon className={`h-4 w-4 shrink-0 ${entry.status === "respondido" ? "text-primary" : entry.status === "revisado" ? "text-muted-foreground" : entry.status === "pendiente" ? "text-accent" : entry.status === "expirado" ? "text-destructive" : "text-muted-foreground"}`} />
        <div className="min-w-0">
          <span className="text-sm font-medium text-foreground truncate block">{entry.templateName}</span>
          <p className="text-xs text-muted-foreground">{entry.dayLabel} · {entry.date}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={`text-xs ${config.className}`}>{config.label}</Badge>
        <Eye className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card className="bg-card border-border"><CardContent className="py-12 text-center"><ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">{text}</p></CardContent></Card>
  );
}

export default AdminQuestionnaires;
