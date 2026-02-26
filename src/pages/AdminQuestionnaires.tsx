import { useState, useMemo, useCallback, useRef } from "react";
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
import { ClipboardList, Utensils, Dumbbell, CheckCircle2, Clock, XCircle, ChevronLeft, ChevronRight, Eye, Settings2, Plus, Trash2, GripVertical, Download, Pencil } from "lucide-react";
import { type QuestionnaireEntry, type QuestionDefinition, type QuestionType } from "@/data/mockData";
import { useQuestionnaireStore } from "@/data/useQuestionnaireStore";
import { useTemplateStore } from "@/data/useTemplateStore";
import { useTranslation } from "@/i18n/useTranslation";
import { exportTrainingLogPDF } from "@/utils/exportTrainingPDF";

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

// ─── Main component ───
const AdminQuestionnaires = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState<QuestionnaireEntry | null>(null);
  const allEntries = useQuestionnaireStore((s) => s.entries);

  // Template store
  const nutritionTemplates = useTemplateStore((s) => s.nutritionTemplates);
  const trainingTemplate = useTemplateStore((s) => s.trainingTemplate);
  const {
    updateNutritionQuestion, deleteNutritionQuestion, addNutritionQuestion, reorderNutritionQuestions,
    updateTrainingQuestion, deleteTrainingQuestion, addTrainingQuestion, reorderTrainingQuestions,
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
    } else {
      deleteTrainingQuestion(deleteTarget.questionId);
    }
    setDeleteTarget(null);
  };

  const handleSaveQuestion = (q: QuestionDefinition) => {
    if (editContext) {
      if (editContext.type === "nutrition" && editContext.templateId) {
        updateNutritionQuestion(editContext.templateId, q.id, q);
      } else {
        updateTrainingQuestion(q.id, q);
      }
      setEditContext(null);
      setEditingQuestion(undefined);
    } else if (addContext) {
      if (addContext.type === "nutrition" && addContext.templateId) {
        addNutritionQuestion(addContext.templateId, q);
      } else {
        addTrainingQuestion(q);
      }
      setAddContext(null);
    }
  };

  const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
    respondido: { label: t("questionnaires.statusResponded"), icon: CheckCircle2, className: "bg-primary/15 text-primary border-primary/30" },
    pendiente: { label: t("questionnaires.statusPending"), icon: Clock, className: "bg-accent/15 text-accent border-accent/30" },
    no_enviado: { label: t("questionnaires.statusNotSent"), icon: XCircle, className: "bg-muted text-muted-foreground border-border" },
  };

  const weekLabel = useMemo(() => {
    if (weekOffset === 0) return t("questionnaires.thisWeek");
    if (weekOffset === -1) return t("questionnaires.lastWeek");
    const d = new Date(); d.setDate(d.getDate() + weekOffset * 7);
    return t("questionnaires.weekOf", { date: `${d.getDate()} ${d.toLocaleString("es-ES", { month: "short" })}` });
  }, [weekOffset, t]);

  const entries = weekOffset === 0 ? allEntries : [];
  const nutritionEntries = entries.filter((e) => e.category === "nutrition");
  const trainingEntries = entries.filter((e) => e.category === "training");
  const nutritionStats = { total: nutritionEntries.length, responded: nutritionEntries.filter((e) => e.status === "respondido").length };
  const trainingStats = { total: trainingEntries.length, responded: trainingEntries.filter((e) => e.status === "respondido").length };

  const nutritionByDay = useMemo(() => {
    const map: Record<string, QuestionnaireEntry[]> = {};
    nutritionEntries.forEach((e) => { if (!map[e.dayLabel]) map[e.dayLabel] = []; map[e.dayLabel].push(e); });
    return map;
  }, [nutritionEntries]);

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatMini icon={Utensils} label={t("questionnaires.nutritionSent")} value={nutritionStats.total} />
          <StatMini icon={CheckCircle2} label={t("questionnaires.nutritionResponded")} value={nutritionStats.responded} accent />
          <StatMini icon={Dumbbell} label={t("questionnaires.trainingSent")} value={trainingStats.total} />
          <StatMini icon={CheckCircle2} label={t("questionnaires.trainingResponded")} value={trainingStats.responded} accent />
        </div>

        <Tabs defaultValue="nutrition" className="space-y-4">
          <TabsList className="bg-muted border border-border">
            <TabsTrigger value="nutrition" className="data-[state=active]:bg-card data-[state=active]:text-primary"><Utensils className="h-4 w-4 mr-1.5" /> {t("common.nutrition")}</TabsTrigger>
            <TabsTrigger value="training" className="data-[state=active]:bg-card data-[state=active]:text-primary"><Dumbbell className="h-4 w-4 mr-1.5" /> {t("common.training")}</TabsTrigger>
          </TabsList>

          {/* ═══ NUTRITION TAB ═══ */}
          <TabsContent value="nutrition" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{t("questionnaires.nutritionCheckins")}</h2>
              <Dialog>
                <DialogTrigger asChild><Button variant="outline" size="sm"><Settings2 className="h-4 w-4 mr-1" /> {t("questionnaires.editTemplates")}</Button></DialogTrigger>
                <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader><DialogTitle className="text-foreground">{t("questionnaires.nutritionTemplates")}</DialogTitle></DialogHeader>
                  <Tabs defaultValue={nutritionTemplates[0]?.id} className="mt-4">
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
                        onReorder={(ids) => reorderNutritionQuestions(template.id, ids)}
                        onAdd={() => setAddContext({ type: "nutrition", templateId: template.id })}
                        t={t}
                      />
                    ))}
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>
            {Object.keys(nutritionByDay).length === 0 ? (
              <EmptyState text={t("questionnaires.noNutritionCheckins")} />
            ) : (
              Object.entries(nutritionByDay).map(([day, dayEntries]) => (
                <Card key={day} className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2"><Utensils className="h-4 w-4 text-primary" /> {day}</CardTitle>
                      <Badge variant="outline" className="text-xs border-border text-muted-foreground">{dayEntries.filter((e) => e.status === "respondido").length}/{dayEntries.length} {t("questionnaires.responded")}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent><div className="space-y-2">{dayEntries.map((entry) => <EntryRow key={entry.id} entry={entry} onView={() => setSelectedEntry(entry)} statusConfig={statusConfig} />)}</div></CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* ═══ TRAINING TAB ═══ */}
          <TabsContent value="training" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{t("questionnaires.weeklyTraining")}</h2>
              <Dialog>
                <DialogTrigger asChild><Button variant="outline" size="sm"><Settings2 className="h-4 w-4 mr-1" /> {t("questionnaires.editTemplate")}</Button></DialogTrigger>
                <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader><DialogTitle className="text-foreground">{t("questionnaires.questionnaireQuestions")}</DialogTitle></DialogHeader>
                  <TrainingTemplateEditor
                    questions={trainingTemplate.questions}
                    onEdit={(q) => { setEditingQuestion(q); setEditContext({ type: "training" }); }}
                    onDelete={(qId) => setDeleteTarget({ type: "training", questionId: qId })}
                    onReorder={(ids) => reorderTrainingQuestions(ids)}
                    onAdd={() => setAddContext({ type: "training" })}
                    t={t}
                  />
                </DialogContent>
              </Dialog>
            </div>
            {trainingEntries.length === 0 ? (
              <EmptyState text={t("questionnaires.noTrainingRecords")} />
            ) : (
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2"><Dumbbell className="h-4 w-4 text-primary" /> {t("questionnaires.weeklyRecord")}</CardTitle>
                    <Badge variant="outline" className="text-xs border-border text-muted-foreground">{trainingEntries.filter((e) => e.status === "respondido").length}/{trainingEntries.length} {t("questionnaires.responded")}</Badge>
                  </div>
                </CardHeader>
                <CardContent><div className="space-y-2">{trainingEntries.map((entry) => <EntryRow key={entry.id} entry={entry} onView={() => setSelectedEntry(entry)} statusConfig={statusConfig} />)}</div></CardContent>
              </Card>
            )}
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
                                <th className="px-3 py-2 text-xs font-medium text-muted-foreground text-center">{t("questionnaires.rpe")}</th>
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
                                      <p className="text-sm font-mono font-medium text-foreground">{ex.actualWeight ? `${ex.actualWeight}kg` : "—"}</p>
                                      <p className="text-[10px] text-muted-foreground">{ex.actualSets ? `${ex.actualSets}×${ex.actualReps || "?"}` : "—"}</p>
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
                    {Object.entries(selectedEntry.responses).map(([key, val]) => {
                      const template = selectedEntry.category === "nutrition" ? nutritionTemplates.find((tp) => tp.id === selectedEntry.templateId) : null;
                      const questionDef = template ? template.questions.find((q) => q.id === key) : trainingTemplate.questions.find((q) => q.id === key);
                      return (
                        <div key={key} className="flex justify-between items-start gap-4 py-2 border-b border-border/50">
                          <span className="text-sm text-muted-foreground">{questionDef?.label || key}</span>
                          <span className="text-sm font-medium text-foreground text-right">{typeof val === "boolean" ? (val ? "Sí" : "No") : String(val)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
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

// ─── Training template editor (questions only, no exercises) ───
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
    <div className="mt-4 space-y-4">
      <p className="text-sm text-muted-foreground">
        Los ejercicios del registro se generan automáticamente desde el plan de entrenamiento activo.
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
  );
}

// ─── Small helpers ───
function StatMini({ icon: Icon, label, value, accent }: { icon: typeof ClipboardList; label: string; value: number; accent?: boolean }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${accent ? "bg-primary/10" : "bg-muted"}`}><Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`} /></div>
        <div><p className="text-xl font-bold text-foreground">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
      </CardContent>
    </Card>
  );
}

function EntryRow({ entry, onView, statusConfig }: { entry: QuestionnaireEntry; onView: () => void; statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> }) {
  const config = statusConfig[entry.status];
  const StatusIcon = config.icon;
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer" onClick={onView}>
      <div className="flex items-center gap-3 min-w-0">
        <StatusIcon className={`h-4 w-4 shrink-0 ${entry.status === "respondido" ? "text-primary" : entry.status === "pendiente" ? "text-accent" : "text-muted-foreground"}`} />
        <div className="min-w-0"><span className="text-sm font-medium text-foreground truncate block">{entry.clientName}</span><p className="text-xs text-muted-foreground">{entry.date}</p></div>
      </div>
      <div className="flex items-center gap-2"><Badge variant="outline" className={`text-xs ${config.className}`}>{config.label}</Badge><Eye className="h-4 w-4 text-muted-foreground" /></div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card className="bg-card border-border"><CardContent className="py-12 text-center"><ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">{text}</p></CardContent></Card>
  );
}

export default AdminQuestionnaires;
