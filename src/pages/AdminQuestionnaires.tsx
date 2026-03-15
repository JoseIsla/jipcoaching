import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Utensils, Dumbbell, Settings2, Plus, Trash2, GripVertical, Pencil } from "lucide-react";
import { type QuestionDefinition, type QuestionType } from "@/data/questionnaireDefs";
import { useTemplateStore } from "@/data/useTemplateStore";
import { useTranslation } from "@/i18n/useTranslation";
import { useRef } from "react";

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

// ─── Main component ───
const AdminQuestionnaires = () => {
  const { t } = useTranslation();

  const fetchTemplates = useTemplateStore((s) => s.fetchTemplates);
  useEffect(() => { fetchTemplates(); }, []);

  const nutritionTemplates = useTemplateStore((s) => s.nutritionTemplates);
  const trainingTemplate = useTemplateStore((s) => s.trainingTemplate);
  const {
    updateNutritionQuestion, deleteNutritionQuestion, addNutritionQuestion, reorderNutritionQuestions,
    updateTrainingQuestion, deleteTrainingQuestion, addTrainingQuestion, reorderTrainingQuestions,
    saveTemplate,
  } = useTemplateStore();

  const [editingQuestion, setEditingQuestion] = useState<QuestionDefinition | undefined>();
  const [editContext, setEditContext] = useState<{ type: "nutrition" | "training"; templateId?: string } | null>(null);
  const [addContext, setAddContext] = useState<{ type: "nutrition" | "training"; templateId?: string } | null>(null);
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

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("questionnaires.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestiona las plantillas de cuestionarios de nutrición y entrenamiento</p>
        </div>

        <div className="space-y-6">
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
        </div>

        {/* Edit Question Dialog */}
        <QuestionEditorDialog
          question={editingQuestion}
          open={!!editContext}
          onOpenChange={(o) => { if (!o) { setEditContext(null); setEditingQuestion(undefined); } }}
          onSave={handleSaveQuestion}
        />

        {/* Add Question Dialog */}
        <QuestionEditorDialog
          open={!!addContext}
          onOpenChange={(o) => { if (!o) setAddContext(null); }}
          onSave={handleSaveQuestion}
        />

        {/* Delete Confirmation */}
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
        
        {/* Mock table preview — matches current client check-in UI */}
        <div className="rounded-lg border border-border overflow-hidden opacity-70 bg-muted/20 pointer-events-none select-none">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-2 py-1.5 text-left text-muted-foreground font-medium">Ejercicio</th>
                <th className="px-2 py-1.5 text-center text-muted-foreground font-medium">Pautado</th>
                <th className="px-2 py-1.5 text-center text-primary font-medium">Real</th>
                <th className="px-2 py-1.5 text-center text-muted-foreground font-medium">RPE</th>
              </tr>
            </thead>
            <tbody>
              {/* Exercise 1 */}
              <tr className="border-t border-border/50 align-top">
                <td className="px-2 py-2 font-medium text-foreground">Sentadilla</td>
                <td className="px-2 py-2 text-center text-muted-foreground">
                  <span className="block">4×4</span>
                  <span className="block text-[9px] text-muted-foreground/70 mt-0.5">Autoregulada</span>
                </td>
                <td className="px-2 py-2 text-center text-foreground font-mono">
                  <span className="block">4×4</span>
                  <span className="block text-[9px] mt-0.5">115kg</span>
                </td>
                <td className="px-2 py-2 text-center">
                  <div className="flex flex-col items-center leading-tight">
                    <span className="text-muted-foreground">
                      <span className="block text-[8px] opacity-60">Pautado</span>
                      7
                    </span>
                    <span className="font-bold text-foreground">
                      <span className="block text-[8px] opacity-60 font-normal">Real</span>
                      7
                    </span>
                  </div>
                </td>
              </tr>
              <tr className="border-t border-border/20">
                <td colSpan={4} className="px-2 py-1">
                  <span className="text-[9px] text-muted-foreground italic">"Buenas sensaciones hoy"</span>
                </td>
              </tr>
              {/* Exercise 2 */}
              <tr className="border-t border-border/50 align-top">
                <td className="px-2 py-2 font-medium text-foreground">Sentadilla Pausa</td>
                <td className="px-2 py-2 text-center text-muted-foreground">
                  <span className="block">3×3</span>
                  <span className="block text-[9px] text-muted-foreground/70 mt-0.5">Autoregulada</span>
                </td>
                <td className="px-2 py-2 text-center text-foreground font-mono">
                  <span className="block">3×3</span>
                  <span className="block text-[9px] mt-0.5">95kg</span>
                </td>
                <td className="px-2 py-2 text-center">
                  <div className="flex flex-col items-center leading-tight">
                    <span className="text-muted-foreground">
                      <span className="block text-[8px] opacity-60">Pautado</span>
                      7
                    </span>
                    <span className="font-bold text-foreground">
                      <span className="block text-[8px] opacity-60 font-normal">Real</span>
                      7
                    </span>
                  </div>
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

export default AdminQuestionnaires;
