import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { ClipboardList, Check, Clock, AlertCircle, Dumbbell, History, Video, Upload, Trash2, Film, Loader2, MessageSquare } from "lucide-react";
import AnimatedChevron from "@/components/ui/animated-chevron";
import AnimatedCollapsibleContent from "@/components/ui/animated-collapsible-content";
import { useToast } from "@/hooks/use-toast";
import { type QuestionnaireEntry, type TrainingLogDay, type CheckinVideo, NUTRITION_PUBLISH_HOUR, getEntryWindowStatus } from "@/data/useQuestionnaireStore";
import { DecimalInput } from "@/components/ui/decimal-input";
import { nutritionTemplates as localNutritionTemplates, trainingTemplate as localTrainingTemplate, type QuestionDefinition } from "@/data/questionnaireDefs";
import { useTemplateStore } from "@/data/useTemplateStore";
import { useQuestionnaireStore } from "@/data/useQuestionnaireStore";
import { useTranslation } from "@/i18n/useTranslation";
import { MAX_VIDEO_SIZE_MB } from "@/types/media";
import { compressVideo } from "@/utils/compressMedia";
import ClientMediaComments from "@/components/client/ClientMediaComments";
import { useMediaStore } from "@/data/useMediaStore";
import { useClientPreferencesStore } from "@/data/useClientPreferencesStore";
import { mediaApi } from "@/services/mediaApi";
import { parseDecimal } from "@/utils/parseDecimal";

/** Build default responses for all questions so untouched fields are still submitted. */
const buildDefaultResponses = (
  questions: QuestionDefinition[],
  existing: Record<string, string | number | boolean> = {}
): Record<string, string | number | boolean> => {
  const defaults: Record<string, string | number | boolean> = {};
  for (const q of questions) {
    if (existing[q.id] !== undefined) {
      defaults[q.id] = existing[q.id];
    } else {
      switch (q.type) {
        case "scale": defaults[q.id] = 5; break;
        case "number": defaults[q.id] = 0; break;
        case "yesno": defaults[q.id] = false; break;
        case "select": defaults[q.id] = q.options?.[0] ?? ""; break;
        default: defaults[q.id] = ""; break;
      }
    }
  }
  return defaults;
};

/** Returns the deadline Date for an entry's fill window. */
const getEntryDeadline = (entry: QuestionnaireEntry): Date => {
  if (entry.category === "nutrition") {
    const publishDate = new Date(entry.date + "T00:00:00");
    publishDate.setHours(NUTRITION_PUBLISH_HOUR, 0, 0, 0);
    return new Date(publishDate.getTime() + 48 * 60 * 60 * 1000);
  }
  // Training: deadline is Sunday 23:59:59
  const entryDate = new Date(entry.date + "T00:00:00");
  const windowEnd = new Date(entryDate);
  windowEnd.setDate(windowEnd.getDate() + 1); // Sunday
  windowEnd.setHours(23, 59, 59, 999);
  return windowEnd;
};

/** Formats remaining ms as "Xh Ym" or "Xm" */
const formatTimeRemaining = (ms: number): string => {
  if (ms <= 0) return "";
  const totalMin = Math.floor(ms / 60000);
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

/** Hook that returns a live countdown string, updating every minute. */
const useCountdown = (entry: QuestionnaireEntry, isActive: boolean): string => {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    if (!isActive) { setRemaining(""); return; }
    const update = () => {
      const ms = getEntryDeadline(entry).getTime() - Date.now();
      setRemaining(ms > 0 ? formatTimeRemaining(ms) : "");
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [entry, isActive]);
  return remaining;
};

const NumericInput = ({ value, onChange, label, required }: { value: string | number | boolean | undefined; onChange: (v: string | number | boolean) => void; label: string; required?: boolean }) => {
  const [raw, setRaw] = React.useState(value != null && value !== "" ? String(value) : "");
  // Sync from parent when value changes externally
  React.useEffect(() => {
    const parsed = parseDecimal(raw, -Infinity);
    if (value != null && value !== "" && typeof value === "number" && parsed !== value) {
      setRaw(String(value));
    } else if ((value === undefined || value === "" || value === null) && raw !== "") {
      setRaw("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <div className="space-y-1">
      <Label className="text-sm text-foreground">{label}{required && " *"}</Label>
      <Input
        type="text"
        inputMode="decimal"
        className="bg-background border-border h-10"
        value={raw}
        onChange={(e) => {
          const v = e.target.value;
          // Allow digits, one comma or period, and leading minus
          if (v === "" || /^-?\d*[.,]?\d*$/.test(v)) {
            setRaw(v);
          }
        }}
        onBlur={() => {
          if (raw === "" || raw === "-") {
            onChange(0);
            setRaw("");
          } else {
            const n = parseDecimal(raw, 0);
            onChange(n);
            setRaw(String(n));
          }
        }}
      />
    </div>
  );
};

const QuestionField = ({ q, value, onChange }: { q: QuestionDefinition; value: string | number | boolean | undefined; onChange: (v: string | number | boolean) => void }) => {
  switch (q.type) {
    case "number": return (<NumericInput value={value} onChange={onChange} label={q.label} required={q.required} />);
    case "scale": return (<div className="space-y-2"><Label className="text-sm text-foreground">{q.label}{q.required && " *"}</Label><div className="flex items-center gap-3"><Slider value={[typeof value === "number" ? value : 5]} onValueChange={([v]) => onChange(v)} min={1} max={10} step={1} className="flex-1" /><span className="text-sm font-bold text-primary w-6 text-right">{typeof value === "number" ? value : "—"}</span></div></div>);
    case "yesno": return (<div className="flex items-center justify-between"><Label className="text-sm text-foreground">{q.label}{q.required && " *"}</Label><Switch checked={value === true} onCheckedChange={(v) => onChange(v)} /></div>);
    case "select": return (<div className="space-y-1"><Label className="text-sm text-foreground">{q.label}{q.required && " *"}</Label><Select value={value as string || ""} onValueChange={onChange}><SelectTrigger className="bg-background border-border h-10"><SelectValue placeholder="..." /></SelectTrigger><SelectContent>{q.options?.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select></div>);
    default: return (<div className="space-y-1"><Label className="text-sm text-foreground">{q.label}{q.required && " *"}</Label><Textarea className="bg-background border-border min-h-[60px]" value={value as string ?? ""} onChange={(e) => onChange(e.target.value)} /></div>);
  }
};

const NutritionCheckinCard = ({ entry }: { entry: QuestionnaireEntry }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(entry.status === "respondido");
  const { toast } = useToast();
  const submitEntry = useQuestionnaireStore((s) => s.submitEntry);
  const windowStatus = getEntryWindowStatus(entry);
  const storeTemplates = useTemplateStore((s) => s.nutritionTemplates);
  const template = storeTemplates.find((tp) => tp.id === entry.templateId)
    || localNutritionTemplates.find((tp) => tp.id === entry.templateId);
  const questions: QuestionDefinition[] = template?.questions
    || (entry.templateQuestions || []).map((q) => ({ id: q.id, label: q.label, type: q.type as any, required: q.required, options: q.options }))
    || [];
  const [responses, setResponses] = useState<Record<string, string | number | boolean>>(() =>
    buildDefaultResponses(questions, entry.responses || {})
  );
  const canFill = !submitted && windowStatus === "within";
  const countdown = useCountdown(entry, canFill);

  const handleSubmit = () => {
    submitEntry(entry.id, responses);
    setSubmitted(true);
    toast({ title: t("clientCheckins.checkinSent"), description: t("clientCheckins.checkinSentDesc") });
  };

  const statusIcon = submitted ? <Check className="h-3.5 w-3.5 text-green-500" /> : windowStatus === "within" ? <Clock className="h-3.5 w-3.5 text-yellow-500" /> : windowStatus === "future" ? <Clock className="h-3.5 w-3.5 text-blue-400" /> : <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />;
  const statusLabel = submitted ? t("clientCheckins.responded") : windowStatus === "within" ? t("clientCheckins.pendingLabel") : windowStatus === "future" ? t("clientCheckins.upcoming") : t("clientCheckins.expired");

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <CollapsibleTrigger className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-2"><AnimatedChevron open={open} /><div><p className="text-sm font-semibold text-foreground">{entry.templateName}</p><p className="text-[10px] text-muted-foreground">{entry.dayLabel} · {entry.weekLabel}</p></div></div>
          <div className="flex items-center gap-1.5">
            {countdown && <span className="text-[9px] font-mono text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">⏳ {countdown}</span>}
            {statusIcon}<span className="text-[10px] text-muted-foreground">{statusLabel}</span>
          </div>
        </CollapsibleTrigger>
        <AnimatedCollapsibleContent open={open}>
          <div className="p-4 pt-0 space-y-4">
            {canFill ? (
              <>{questions.map((q) => <QuestionField key={q.id} q={q} value={responses[q.id]} onChange={(v) => setResponses({ ...responses, [q.id]: v })} />)}<Button onClick={handleSubmit} className="w-full glow-primary-sm">{t("clientCheckins.submitCheckin")}</Button></>
            ) : submitted ? (
              <div className="space-y-2">{questions.map((q) => <div key={q.id} className="flex justify-between items-start py-1 border-b border-border/30 last:border-0"><span className="text-xs text-muted-foreground">{q.label}</span><span className="text-xs font-medium text-foreground ml-3">{responses[q.id] !== undefined ? (responses[q.id] === true || responses[q.id] === "true") ? "Sí" : (responses[q.id] === false || responses[q.id] === "false") ? "No" : String(responses[q.id]) : "—"}</span></div>)}</div>
            ) : windowStatus === "future" ? (
              <p className="text-sm text-muted-foreground text-center py-4" dangerouslySetInnerHTML={{ __html: t("clientCheckins.availableOn", { day: entry.dayLabel }) }} />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">{t("clientCheckins.noLongerAvailable")}</p>
            )}
          </div>
        </AnimatedCollapsibleContent>
      </div>
    </Collapsible>
  );
};

const TrainingLogCard = ({ entry }: { entry: QuestionnaireEntry }) => {
  const { t } = useTranslation();
  const { client } = useClient();
  const [open, setOpen] = useState(false);
  const [trainingLog, setTrainingLog] = useState<TrainingLogDay[]>(entry.trainingLog || []);
  const storeTrainingTemplate = useTemplateStore((s) => s.trainingTemplate);
  const apiQuestions: QuestionDefinition[] = (entry.templateQuestions || []).map((q) => ({
    id: q.id, label: q.label, type: q.type as any, required: q.required, options: q.options,
  }));
  // Prefer API questions from the entry (real DB IDs) over store/local mock IDs
  const questions = apiQuestions.length > 0
    ? apiQuestions
    : storeTrainingTemplate?.questions?.length > 0
    ? storeTrainingTemplate.questions
    : localTrainingTemplate.questions;
  const [responses, setResponses] = useState<Record<string, string | number | boolean>>(() =>
    buildDefaultResponses(questions, entry.responses || {})
  );
  const [submitted, setSubmitted] = useState(entry.status === "respondido");
  const [activeDay, setActiveDay] = useState(0);
  const { toast } = useToast();
  const submitEntry = useQuestionnaireStore((s) => s.submitEntry);
  const addVideoToEntry = useQuestionnaireStore((s) => s.addVideoToEntry);
  const removeVideoFromEntry = useQuestionnaireStore((s) => s.removeVideoFromEntry);

  // Video upload state
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [videoExerciseName, setVideoExerciseName] = useState("");
  const [videoNotes, setVideoNotes] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [compressingVideo, setCompressingVideo] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const videoFileRef = useRef<HTMLInputElement>(null);

  const videos = entry.techniqueVideos || [];

  // Unseen comments logic
  const getComments = useMediaStore((s) => s.getComments);
  const seenCommentIds = useClientPreferencesStore((s) => s.seenCommentIds);
  const markCommentsSeen = useClientPreferencesStore((s) => s.markCommentsSeen);

  const videoComments = videos.flatMap((v) => getComments("video", v.id));
  const unseenCount = videoComments.filter((c) => !seenCommentIds.includes(c.id)).length;

  // Mark comments as seen when expanded
  useEffect(() => {
    if (open && videoComments.length > 0) {
      const unseenIds = videoComments.filter((c) => !seenCommentIds.includes(c.id)).map((c) => c.id);
      if (unseenIds.length > 0) {
        markCommentsSeen(unseenIds);
      }
    }
  }, [open]);

  const handleVideoFileSelect = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast({ title: "Formato no válido", description: "Solo se permiten videos", variant: "destructive" });
      return;
    }
    let processedFile = file;
    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      setCompressingVideo(true);
      try {
        processedFile = await compressVideo(file, { maxSizeMB: MAX_VIDEO_SIZE_MB });
        const savedMB = ((file.size - processedFile.size) / (1024 * 1024)).toFixed(1);
        toast({ title: "Video comprimido ✅", description: `Se redujo ${savedMB}MB automáticamente` });
      } catch (err) {
        const msg = err instanceof Error ? err.message : `El video excede ${MAX_VIDEO_SIZE_MB}MB`;
        toast({ title: "No se pudo comprimir", description: msg, variant: "destructive" });
        setCompressingVideo(false);
        return;
      }
      setCompressingVideo(false);
    }
    setVideoFile(processedFile);
  };

  const handleAddVideo = async () => {
    if (!videoFile || !videoExerciseName.trim()) {
      toast({ title: "Campos requeridos", description: "Indica el ejercicio y selecciona un video", variant: "destructive" });
      return;
    }
    // Prevent upload attempts with local-only IDs that don't exist in the DB
    if (entry.id.startsWith("qe-t-auto-")) {
      toast({ title: "No se puede subir", description: "El check-in aún no está sincronizado con el servidor. Cierra y vuelve a abrir la app.", variant: "destructive" });
      return;
    }
    setUploadingVideo(true);
    try {
      const uploaded = await mediaApi.uploadCheckinVideo(
        entry.id,
        videoFile,
        videoExerciseName.trim(),
        videoNotes.trim() || undefined,
      );
      const newVideo: CheckinVideo = {
        id: uploaded.id,
        exerciseName: uploaded.exerciseName,
        url: uploaded.url,
        notes: uploaded.notes,
        uploadedAt: uploaded.uploadedAt,
      };
      addVideoToEntry(entry.id, newVideo);
      toast({ title: "Video subido ✅" });
      setVideoFile(null);
      setVideoExerciseName("");
      setVideoNotes("");
      setShowVideoUpload(false);
    } catch (err: any) {
      toast({ title: "Error al subir video", description: err?.message || "Inténtalo de nuevo", variant: "destructive" });
    } finally {
      setUploadingVideo(false);
    }
  };

  const updateExercise = (dayIdx: number, exIdx: number, field: string, value: string | number) => {
    const updated = trainingLog.map((day, di) =>
      di === dayIdx
        ? {
            ...day,
            exercises: day.exercises.map((ex, ei) =>
              ei === exIdx ? { ...ex, [field]: value } : ex
            ),
          }
        : day
    );
    setTrainingLog(updated);
  };

  const handleSubmit = () => {
    submitEntry(entry.id, responses, trainingLog);
    setSubmitted(true);
    toast({ title: t("clientCheckins.checkinSent"), description: t("clientCheckins.checkinSentDesc") });
  };

  const isPending = !submitted;
  const countdown = useCountdown(entry, isPending);
  const statusIcon = submitted ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Clock className="h-3.5 w-3.5 text-yellow-500" />;
  const statusLabel = submitted ? t("clientCheckins.responded") : t("clientCheckins.pendingLabel");

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <CollapsibleTrigger className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-2">
            <AnimatedChevron open={open} />
            <div>
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Dumbbell className="h-3.5 w-3.5 text-primary" />
                {entry.templateName}
              </p>
              <p className="text-[10px] text-muted-foreground">{entry.weekLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <AnimatePresence>
              {unseenCount > 0 && (
                <motion.span
                  key="unseen-badge"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.25 } }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="flex items-center gap-0.5 text-[9px] font-semibold text-accent bg-accent/15 px-1.5 py-0.5 rounded-full animate-pulse"
                >
                  <MessageSquare className="h-2.5 w-2.5" />
                  {unseenCount}
                </motion.span>
              )}
            </AnimatePresence>
            {countdown && <span className="text-[9px] font-mono text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">⏳ {countdown}</span>}
            {statusIcon}<span className="text-[10px] text-muted-foreground">{statusLabel}</span>
          </div>
        </CollapsibleTrigger>
        <AnimatedCollapsibleContent open={open}>
          <div className="p-4 pt-2 space-y-4">
            {!submitted ? (
              <>
                {/* Day tabs */}
                {trainingLog.length > 0 && (
                  <Tabs value={String(activeDay)} onValueChange={(v) => setActiveDay(Number(v))}>
                    <TabsList className="bg-muted border border-border w-full flex-wrap h-auto gap-1 p-1">
                      {trainingLog.map((day, i) => (
                        <TabsTrigger key={i} value={String(i)} className="text-[10px] flex-1 min-w-0 px-2 py-1.5">
                          Día {day.dayNumber}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {trainingLog.map((day, dayIdx) => (
                      <TabsContent key={dayIdx} value={String(dayIdx)} className="mt-3">
                        <div className="rounded-lg border border-border overflow-hidden">
                          <table className="w-full text-[10px]">
                            <thead>
                              <tr className="bg-muted/50">
                                <th className="px-2 py-1.5 text-left text-muted-foreground font-medium">Ejercicio</th>
                                <th className="px-2 py-1.5 text-center text-muted-foreground font-medium">{t("clientCheckins.planned")}</th>
                                <th className="px-2 py-1.5 text-center text-primary font-medium">{t("clientCheckins.actual")}</th>
                                <th className="px-2 py-1.5 text-center text-muted-foreground font-medium">RPE</th>
                              </tr>
                            </thead>
                            <tbody>
                              {day.exercises.map((ex, exIdx) => (
                                <tr key={exIdx} className="border-t border-border/50 align-top">
                                  <td className="px-2 py-2 font-medium text-foreground max-w-[90px]">
                                    <span className="block leading-tight">{ex.exerciseName}</span>
                                  </td>
                                  <td className="px-2 py-2 text-center text-muted-foreground">
                                    <span className="block">{ex.plannedSets}×{ex.plannedReps}</span>
                                    {ex.plannedLoad && ex.plannedLoad !== "—" && (
                                      <span className="block text-[9px] text-muted-foreground/70 mt-0.5">{ex.plannedLoad}</span>
                                    )}
                                  </td>
                                  <td className="px-1.5 py-1.5">
                                    <div className="flex flex-col gap-1">
                                      <DecimalInput
                                        value={ex.actualWeight ?? undefined}
                                        onChange={(v) => updateExercise(dayIdx, exIdx, "actualWeight", v ?? 0)}
                                        placeholder="kg"
                                        className="h-7 text-[11px] text-center bg-background border-border px-1"
                                      />
                                      <div className="flex gap-0.5">
                                        <Input
                                          type="text"
                                          className="h-6 text-[10px] text-center bg-background border-border px-1"
                                          placeholder={ex.plannedSets}
                                          value={ex.actualSets ?? ""}
                                          onChange={(e) => updateExercise(dayIdx, exIdx, "actualSets", e.target.value)}
                                        />
                                        <span className="text-muted-foreground self-center text-[9px]">×</span>
                                        <Input
                                          type="text"
                                          className="h-6 text-[10px] text-center bg-background border-border px-1"
                                          placeholder={ex.plannedReps}
                                          value={ex.actualReps ?? ""}
                                          onChange={(e) => updateExercise(dayIdx, exIdx, "actualReps", e.target.value)}
                                        />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-1.5 py-1.5">
                                    <div className="flex flex-col items-center gap-1">
                                      {ex.plannedRPE && (
                                        <span className="text-[9px] text-muted-foreground leading-none">
                                          <span className="block text-center opacity-60">Pautado</span>
                                          <span className="block text-center font-medium">{ex.plannedRPE}</span>
                                        </span>
                                      )}
                                      <div className="w-full">
                                        <span className="block text-center text-[9px] text-primary/70 leading-none mb-0.5">Real</span>
                                        <DecimalInput
                                          value={ex.actualRPE ?? undefined}
                                          onChange={(v) => updateExercise(dayIdx, exIdx, "actualRPE", v ?? 0)}
                                          placeholder="—"
                                          className="h-7 text-[11px] text-center bg-background border-border px-1"
                                        />
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {day.exercises.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">{t("clientTraining.noExercises")}</p>
                        )}
                      </TabsContent>
                    ))}
                  </Tabs>
                )}

                {/* General training questions */}
                <div className="border-t border-border pt-3 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("clientCheckins.generalQuestions")}</p>
                  {questions.map((q) => (
                    <QuestionField
                      key={q.id}
                      q={q}
                      value={responses[q.id]}
                      onChange={(v) => setResponses({ ...responses, [q.id]: v })}
                    />
                  ))}
                </div>

                {/* ── Optional Technique Videos ── */}
                <div className="border-t border-border pt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Video className="h-3 w-3 text-primary" />
                      Videos de técnica (opcional)
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[10px] gap-1 h-7 border-primary/30 text-primary hover:bg-primary/10"
                      onClick={() => setShowVideoUpload(!showVideoUpload)}
                    >
                      <Upload className="h-3 w-3" />
                      Añadir video
                    </Button>
                  </div>

                  {showVideoUpload && (
                    <div className="space-y-2 bg-muted/30 rounded-lg p-3">
                      <Input
                        value={videoExerciseName}
                        onChange={(e) => setVideoExerciseName(e.target.value)}
                        placeholder="Nombre del ejercicio (ej: Sentadilla)"
                        className="bg-background border-border text-sm h-8"
                      />
                      <Input
                        value={videoNotes}
                        onChange={(e) => setVideoNotes(e.target.value)}
                        placeholder="Notas (opcional)"
                        className="bg-background border-border text-sm h-8"
                      />
                      <input
                        ref={videoFileRef}
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => handleVideoFileSelect(e.target.files?.[0] ?? null)}
                      />
                      <button
                        onClick={() => videoFileRef.current?.click()}
                        disabled={compressingVideo}
                        className={`w-full py-4 rounded-lg border-2 border-dashed flex flex-col items-center gap-1.5 transition-colors ${
                          compressingVideo
                            ? "border-primary/50 bg-primary/5 animate-pulse"
                            : videoFile
                            ? "border-primary/50 bg-primary/5"
                            : "border-border hover:border-primary/30 hover:bg-muted/50"
                        }`}
                      >
                        {compressingVideo ? (
                          <>
                            <Loader2 className="h-5 w-5 text-primary animate-spin" />
                            <span className="text-[10px] text-primary font-medium">Comprimiendo…</span>
                          </>
                        ) : (
                          <>
                            <Film className="h-5 w-5 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">
                              {videoFile ? videoFile.name : "Seleccionar video (se comprime automáticamente)"}
                            </span>
                          </>
                        )}
                      </button>
                      <Button
                        size="sm"
                        className="w-full h-8 text-xs"
                        onClick={handleAddVideo}
                        disabled={compressingVideo || uploadingVideo || !videoFile || !videoExerciseName.trim()}
                      >
                        {uploadingVideo ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Subiendo...</> : "Añadir video"}
                      </Button>
                    </div>
                  )}

                  {/* Attached videos list */}
                  {videos.length > 0 && (
                    <div className="space-y-2">
                      {videos.map((v) => (
                        <div key={v.id} className="bg-muted/30 rounded-lg overflow-hidden">
                          <video src={v.url} controls preload="metadata" className="w-full max-h-36 bg-black rounded-t-lg" />
                          <div className="p-2 flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate">{v.exerciseName}</p>
                              {v.notes && <p className="text-[10px] text-muted-foreground truncate">{v.notes}</p>}
                            </div>
                            <button
                              onClick={async () => {
                                try { await mediaApi.deleteCheckinVideo(entry.id, v.id); } catch {}
                                removeVideoFromEntry(entry.id, v.id);
                              }}
                              className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button onClick={handleSubmit} className="w-full glow-primary-sm">{t("clientCheckins.submitCheckin")}</Button>
              </>
            ) : (
              /* Submitted view */
              <div className="space-y-4">
                {trainingLog.map((day, dayIdx) => (
                  <div key={dayIdx} className="space-y-2">
                    <p className="text-xs font-medium text-foreground">{t("clientCheckins.dayLabel", { n: String(day.dayNumber), name: day.dayName })}</p>
                    <div className="rounded-lg border border-border overflow-hidden">
                      <table className="w-full text-[10px]">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="px-2 py-1.5 text-left text-muted-foreground font-medium">Ejercicio</th>
                            <th className="px-2 py-1.5 text-center text-muted-foreground font-medium">{t("clientCheckins.planned")}</th>
                            <th className="px-2 py-1.5 text-center text-primary font-medium">{t("clientCheckins.actual")}</th>
                            <th className="px-2 py-1.5 text-center text-muted-foreground font-medium">RPE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {day.exercises.map((ex, i) => {
                            const rpeDiff = (ex.actualRPE != null && ex.plannedRPE != null)
                              ? ex.actualRPE - ex.plannedRPE
                              : null;
                            const rpeDiffColor = rpeDiff != null
                              ? rpeDiff > 0 ? "text-destructive" : rpeDiff < 0 ? "text-primary" : "text-foreground"
                              : "";
                            return (
                              <tr key={i} className="border-t border-border/50 align-top">
                                <td className="px-2 py-1.5 font-medium text-foreground">{ex.exerciseName}</td>
                                <td className="px-2 py-1.5 text-center text-muted-foreground">
                                  <span className="block">{ex.plannedSets}×{ex.plannedReps}</span>
                                  {ex.plannedLoad && ex.plannedLoad !== "—" && (
                                    <span className="block text-[9px] text-muted-foreground/70 mt-0.5">{ex.plannedLoad}</span>
                                  )}
                                </td>
                                <td className="px-2 py-1.5 text-center text-foreground font-mono">
                                  {ex.actualWeight ? `${ex.actualWeight}kg` : "—"}
                                  {ex.actualSets ? ` (${ex.actualSets}×${ex.actualReps || "?"})` : ""}
                                </td>
                                <td className="px-2 py-1.5 text-center">
                                  <div className="flex flex-col items-center leading-tight">
                                    {ex.plannedRPE && (
                                      <span className="text-muted-foreground">
                                        <span className="block text-[8px] opacity-60">Pautado</span>
                                        {ex.plannedRPE}
                                      </span>
                                    )}
                                    {ex.actualRPE && (
                                      <span className={`font-bold ${rpeDiffColor}`}>
                                        <span className="block text-[8px] opacity-60 font-normal">Real</span>
                                        {ex.actualRPE}
                                      </span>
                                    )}
                                    {rpeDiff != null && rpeDiff !== 0 && (
                                      <span className={`text-[8px] font-semibold ${rpeDiffColor}`}>
                                        {rpeDiff > 0 ? "+" : ""}{rpeDiff}
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
                {/* Show general responses */}
                <div className="space-y-2 border-t border-border pt-3">
                  {questions.map((q) => (
                    <div key={q.id} className="flex justify-between items-start py-1 border-b border-border/30 last:border-0">
                      <span className="text-xs text-muted-foreground">{q.label}</span>
                      <span className="text-xs font-medium text-foreground ml-3">
                        {responses[q.id] !== undefined ? typeof responses[q.id] === "boolean" ? responses[q.id] ? "Sí" : "No" : String(responses[q.id]) : "—"}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Submitted videos */}
                {videos.length > 0 && (
                  <div className="border-t border-border pt-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Video className="h-3 w-3 text-primary" />
                      Videos de técnica ({videos.length})
                    </p>
                    {videos.map((v) => (
                      <div key={v.id} className="bg-muted/30 rounded-lg overflow-hidden">
                        <video src={v.url} controls preload="metadata" className="w-full max-h-36 bg-black rounded-t-lg" />
                        <div className="p-2 space-y-1.5">
                          <p className="text-xs font-semibold text-foreground">{v.exerciseName}</p>
                          {v.notes && <p className="text-[10px] text-muted-foreground">{v.notes}</p>}
                          <ClientMediaComments targetType="video" targetId={v.id} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </AnimatedCollapsibleContent>
      </div>
    </Collapsible>
  );
};

/** Get Monday 00:00 and Sunday 23:59:59 of the ISO week containing `ref`. */
const getCurrentWeekRange = (ref: Date = new Date()): [Date, Date] => {
  const d = new Date(ref);
  const day = d.getDay(); // 0=Sun … 6=Sat
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMon);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return [monday, sunday];
};

const isInCurrentWeek = (dateStr: string): boolean => {
  const [monday, sunday] = getCurrentWeekRange();
  const d = new Date(dateStr + "T12:00:00"); // noon to avoid TZ edge cases
  return d >= monday && d <= sunday;
};

const HistorySection = ({ weeks, renderCard, formatShortDate, t }: { weeks: { start: Date; end: Date; entries: QuestionnaireEntry[] }[]; renderCard: (entry: QuestionnaireEntry) => React.ReactNode; formatShortDate: (d: Date) => string; t: (key: string, params?: Record<string, string>) => string }) => {
  const [open, setOpen] = useState(false);
  if (weeks.length === 0) return null;
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full flex items-center gap-2 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <History className="h-4 w-4" />
        <span className="flex-1 text-left">{t("clientCheckins.history")}</span>
        <AnimatedChevron open={open} />
      </CollapsibleTrigger>
      <AnimatedCollapsibleContent open={open}>
        <div className="space-y-4 pb-2">
          {weeks.map((week) => (
            <div key={week.start.toISOString()} className="space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground">{t("clientCheckins.weekOf", { start: formatShortDate(week.start), end: formatShortDate(week.end) })}</p>
              {week.entries.map((entry) => renderCard(entry))}
            </div>
          ))}
        </div>
      </AnimatedCollapsibleContent>
    </Collapsible>
  );
};
const TrainingUpcomingCard = ({ date }: { date: string }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <CollapsibleTrigger className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-2">
            <AnimatedChevron open={open} />
            <div>
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Dumbbell className="h-3.5 w-3.5 text-primary" />
                {t("clientCheckins.trainingCheckinLabel") || "Check-in Entrenamiento"}
              </p>
              <p className="text-[10px] text-muted-foreground">{t("clientCheckins.upcoming")}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-[10px] text-muted-foreground">{t("clientCheckins.upcoming")}</span>
          </div>
        </CollapsibleTrigger>
        <AnimatedCollapsibleContent open={open}>
          <div className="p-4 pt-0">
            <p className="text-sm text-muted-foreground text-center py-4" dangerouslySetInnerHTML={{ __html: t("clientCheckins.trainingAvailableOn", { date }) }} />
          </div>
        </AnimatedCollapsibleContent>
      </div>
    </Collapsible>
  );
};

const ClientCheckins = () => {
  const { t } = useTranslation();
  const { client } = useClient();
  const hasNutrition = client.services.includes("nutrition");
  const hasTraining = client.services.includes("training");

  const allEntries = useQuestionnaireStore((s) => s.entries);
  const getOrCreateTrainingEntry = useQuestionnaireStore((s) => s.getOrCreateTrainingEntry);
  const fetchEntries = useQuestionnaireStore((s) => s.fetchEntries);
  const generateMyCheckins = useQuestionnaireStore((s) => s.generateMyCheckins);

  // Generate + fetch check-ins from API on mount
  useEffect(() => {
    generateMyCheckins().then(() => fetchEntries(client.id));
  }, [client.id]);

  const myEntries = allEntries.filter((e) => e.clientId === client.id);

  // Only auto-generate training entry locally if no API-generated one exists for this week
  useEffect(() => {
    if (hasTraining) {
      const hasApiTrainingEntry = myEntries.some(
        (e) => e.category === "training" && isInCurrentWeek(e.date) && !e.id.startsWith("qe-t-auto-")
      );
      if (!hasApiTrainingEntry) {
        getOrCreateTrainingEntry(client.id, client.name);
      }
    }
  }, [client.id, hasTraining, allEntries.length]);

  // Only show current week entries — hide older ones entirely
  const nutritionEntries = myEntries.filter((e) => e.category === "nutrition" && isInCurrentWeek(e.date)).sort((a, b) => a.date.localeCompare(b.date));
  const trainingEntries = myEntries.filter(
    (e) => e.category === "training" && e.trainingLog && e.trainingLog.length > 0 && isInCurrentWeek(e.date)
  );


  const defaultTab = hasNutrition ? "nutrition" : "training";

  const stagger = { animate: { transition: { staggerChildren: 0.07 } } };
  const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
  };

  return (
    <ClientLayout>
      <motion.div className="space-y-5 max-w-lg mx-auto" variants={stagger} initial="initial" animate="animate">
        <motion.div variants={fadeUp}>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><ClipboardList className="h-5 w-5 text-yellow-500" />{t("clientCheckins.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("clientCheckins.subtitle")}</p>
        </motion.div>
        <motion.div variants={fadeUp}>
          <Tabs defaultValue={defaultTab} className="space-y-4">
            <TabsList className="bg-card border border-border w-full">
              {hasNutrition && <TabsTrigger value="nutrition" className="flex-1 text-xs">🍎 {t("common.nutrition")}</TabsTrigger>}
              {hasTraining && <TabsTrigger value="training" className="flex-1 text-xs">🏋️ {t("common.training")}</TabsTrigger>}
            </TabsList>
            {hasNutrition && (
              <TabsContent value="nutrition" className="space-y-3">
                <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: t("clientCheckins.nutritionSchedule") }} />
                {nutritionEntries.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">{t("clientCheckins.noNutrition")}</p>}
                {nutritionEntries.map((entry) => <NutritionCheckinCard key={entry.id} entry={entry} />)}
                
              </TabsContent>
            )}
            {hasTraining && (
              <TabsContent value="training" className="space-y-3">
                <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: t("clientCheckins.trainingSchedule") }} />
                {trainingEntries.length === 0 && (() => {
                  const day = new Date().getDay();
                  const isTrainingWindow = day === 6 || day === 0;
                  if (!isTrainingWindow) {
                    const now = new Date();
                    const daysUntilSat = (6 - day + 7) % 7 || 7;
                    const nextSat = new Date(now);
                    nextSat.setDate(now.getDate() + daysUntilSat);
                    const formatted = nextSat.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
                    return <TrainingUpcomingCard date={formatted} />;
                  }
                  return (
                    <div className="text-center py-8">
                      <Dumbbell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">{t("clientCheckins.noActivePlan")}</p>
                    </div>
                  );
                })()}
                {trainingEntries.map((entry) => <TrainingLogCard key={entry.id} entry={entry} />)}
                
              </TabsContent>
            )}
          </Tabs>
        </motion.div>
      </motion.div>
    </ClientLayout>
  );
};

export default ClientCheckins;
