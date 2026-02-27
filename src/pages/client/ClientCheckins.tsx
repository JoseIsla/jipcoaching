import React, { useState } from "react";
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
import { ClipboardList, Check, Clock, AlertCircle, Dumbbell, History } from "lucide-react";
import AnimatedChevron from "@/components/ui/animated-chevron";
import AnimatedCollapsibleContent from "@/components/ui/animated-collapsible-content";
import { useToast } from "@/hooks/use-toast";
import { type QuestionnaireEntry, type TrainingLogDay } from "@/data/useQuestionnaireStore";
import { nutritionTemplates, trainingTemplate, type QuestionDefinition } from "@/data/questionnaireDefs";
import { useQuestionnaireStore } from "@/data/useQuestionnaireStore";
import { useTranslation } from "@/i18n/useTranslation";

/** Publication hour for nutrition check-ins (8:00 AM) */
const NUTRITION_PUBLISH_HOUR = 8;

const getEntryWindowStatus = (entry: QuestionnaireEntry): "within" | "future" | "expired" => {
  const now = new Date();
  if (entry.category === "nutrition") {
    // 48h window from publication hour (8:00 AM on the check-in day)
    const publishDate = new Date(entry.date + "T00:00:00");
    publishDate.setHours(NUTRITION_PUBLISH_HOUR, 0, 0, 0);
    const windowEnd = new Date(publishDate.getTime() + 48 * 60 * 60 * 1000);
    if (now < publishDate) return "future";
    if (now <= windowEnd) return "within";
    return "expired";
  }
  // Training: keep original logic (2 calendar days)
  const entryDate = new Date(entry.date);
  const windowEnd = new Date(entryDate);
  windowEnd.setDate(windowEnd.getDate() + 2);
  if (now < entryDate) return "future";
  if (now <= windowEnd) return "within";
  return "expired";
};

const QuestionField = ({ q, value, onChange }: { q: QuestionDefinition; value: string | number | boolean | undefined; onChange: (v: string | number | boolean) => void }) => {
  switch (q.type) {
    case "number": return (<div className="space-y-1"><Label className="text-sm text-foreground">{q.label}{q.required && " *"}</Label><Input type="number" step="0.1" className="bg-background border-border h-10" value={value as number ?? ""} onChange={(e) => onChange(Number(e.target.value))} /></div>);
    case "scale": return (<div className="space-y-2"><Label className="text-sm text-foreground">{q.label}{q.required && " *"}</Label><div className="flex items-center gap-3"><Slider value={[typeof value === "number" ? value : 5]} onValueChange={([v]) => onChange(v)} min={1} max={10} step={1} className="flex-1" /><span className="text-sm font-bold text-primary w-6 text-right">{typeof value === "number" ? value : "—"}</span></div></div>);
    case "yesno": return (<div className="flex items-center justify-between"><Label className="text-sm text-foreground">{q.label}{q.required && " *"}</Label><Switch checked={value === true} onCheckedChange={(v) => onChange(v)} /></div>);
    case "select": return (<div className="space-y-1"><Label className="text-sm text-foreground">{q.label}{q.required && " *"}</Label><Select value={value as string || ""} onValueChange={onChange}><SelectTrigger className="bg-background border-border h-10"><SelectValue placeholder="..." /></SelectTrigger><SelectContent>{q.options?.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select></div>);
    default: return (<div className="space-y-1"><Label className="text-sm text-foreground">{q.label}{q.required && " *"}</Label><Textarea className="bg-background border-border min-h-[60px]" value={value as string ?? ""} onChange={(e) => onChange(e.target.value)} /></div>);
  }
};

const NutritionCheckinCard = ({ entry }: { entry: QuestionnaireEntry }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [responses, setResponses] = useState<Record<string, string | number | boolean>>(entry.responses || {});
  const [submitted, setSubmitted] = useState(entry.status === "respondido");
  const { toast } = useToast();
  const submitEntry = useQuestionnaireStore((s) => s.submitEntry);
  const windowStatus = getEntryWindowStatus(entry);
  const canFill = !submitted && windowStatus === "within";
  const template = nutritionTemplates.find((tp) => tp.id === entry.templateId);
  const questions = template?.questions || [];

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
          <div className="flex items-center gap-1.5">{statusIcon}<span className="text-[10px] text-muted-foreground">{statusLabel}</span></div>
        </CollapsibleTrigger>
        <AnimatedCollapsibleContent open={open}>
          <div className="p-4 pt-0 space-y-4">
            {canFill ? (
              <>{questions.map((q) => <QuestionField key={q.id} q={q} value={responses[q.id]} onChange={(v) => setResponses({ ...responses, [q.id]: v })} />)}<Button onClick={handleSubmit} className="w-full glow-primary-sm">{t("clientCheckins.submitCheckin")}</Button></>
            ) : submitted ? (
              <div className="space-y-2">{questions.map((q) => <div key={q.id} className="flex justify-between items-start py-1 border-b border-border/30 last:border-0"><span className="text-xs text-muted-foreground">{q.label}</span><span className="text-xs font-medium text-foreground ml-3">{responses[q.id] !== undefined ? typeof responses[q.id] === "boolean" ? responses[q.id] ? "Sí" : "No" : String(responses[q.id]) : "—"}</span></div>)}</div>
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
  const [open, setOpen] = useState(false);
  const [trainingLog, setTrainingLog] = useState<TrainingLogDay[]>(entry.trainingLog || []);
  const [responses, setResponses] = useState<Record<string, string | number | boolean>>(entry.responses || {});
  const [submitted, setSubmitted] = useState(entry.status === "respondido");
  const [activeDay, setActiveDay] = useState(0);
  const { toast } = useToast();
  const submitEntry = useQuestionnaireStore((s) => s.submitEntry);
  const questions = trainingTemplate.questions;

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
          <div className="flex items-center gap-1.5">{statusIcon}<span className="text-[10px] text-muted-foreground">{statusLabel}</span></div>
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
                          {day.dayName}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {trainingLog.map((day, dayIdx) => (
                      <TabsContent key={dayIdx} value={String(dayIdx)} className="mt-3 space-y-3">
                        {day.exercises.map((ex, exIdx) => (
                          <div key={exIdx} className="rounded-lg border border-border p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-foreground">{ex.exerciseName}</p>
                              <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                                {ex.section === "basic" ? "🏋️" : "🎯"} {ex.plannedSets}×{ex.plannedReps}
                              </Badge>
                            </div>
                            {/* Planned info */}
                            <div className="flex gap-2 text-[10px] text-muted-foreground bg-muted/50 rounded p-1.5">
                              <span>{t("clientCheckins.planned")}: {ex.plannedSets}×{ex.plannedReps}</span>
                              {ex.plannedLoad !== "—" && <span>· {ex.plannedLoad}</span>}
                              {ex.plannedRPE && <span>· RPE {ex.plannedRPE}</span>}
                            </div>
                            {/* Actual inputs */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">{t("clientCheckins.actualWeight")}</Label>
                                <Input
                                  type="number"
                                  step="0.5"
                                  className="h-8 text-xs bg-background border-border"
                                  value={ex.actualWeight ?? ""}
                                  onChange={(e) => updateExercise(dayIdx, exIdx, "actualWeight", Number(e.target.value))}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">{t("clientCheckins.actualRPE")}</Label>
                                <Input
                                  type="number"
                                  step="0.5"
                                  min={1}
                                  max={10}
                                  className="h-8 text-xs bg-background border-border"
                                  value={ex.actualRPE ?? ""}
                                  onChange={(e) => updateExercise(dayIdx, exIdx, "actualRPE", Number(e.target.value))}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">{t("clientCheckins.actualSets")}</Label>
                                <Input
                                  type="text"
                                  className="h-8 text-xs bg-background border-border"
                                  placeholder={ex.plannedSets}
                                  value={ex.actualSets ?? ""}
                                  onChange={(e) => updateExercise(dayIdx, exIdx, "actualSets", e.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">{t("clientCheckins.actualReps")}</Label>
                                <Input
                                  type="text"
                                  className="h-8 text-xs bg-background border-border"
                                  placeholder={ex.plannedReps}
                                  value={ex.actualReps ?? ""}
                                  onChange={(e) => updateExercise(dayIdx, exIdx, "actualReps", e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
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
                          </tr>
                        </thead>
                        <tbody>
                          {day.exercises.map((ex, i) => (
                            <tr key={i} className="border-t border-border/50">
                              <td className="px-2 py-1.5 font-medium text-foreground">{ex.exerciseName}</td>
                              <td className="px-2 py-1.5 text-center text-muted-foreground">
                                {ex.plannedSets}×{ex.plannedReps} {ex.plannedRPE ? `@${ex.plannedRPE}` : ""}
                              </td>
                              <td className="px-2 py-1.5 text-center text-foreground font-mono">
                                {ex.actualWeight ? `${ex.actualWeight}kg` : "—"} {ex.actualRPE ? `@${ex.actualRPE}` : ""}
                                {ex.actualSets ? ` (${ex.actualSets}×${ex.actualReps || "?"})` : ""}
                              </td>
                            </tr>
                          ))}
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

const ClientCheckins = () => {
  const { t } = useTranslation();
  const { client } = useClient();
  const hasNutrition = client.services.includes("nutrition");
  const hasTraining = client.services.includes("training");

  const allEntries = useQuestionnaireStore((s) => s.entries);
  const getOrCreateTrainingEntry = useQuestionnaireStore((s) => s.getOrCreateTrainingEntry);

  // Auto-generate training entry from active plan if needed
  const trainingEntry = hasTraining ? getOrCreateTrainingEntry(client.id, client.name) : null;

  const myEntries = allEntries.filter((e) => e.clientId === client.id);

  // Only show current week entries
  const nutritionEntries = myEntries.filter((e) => e.category === "nutrition" && isInCurrentWeek(e.date));
  const trainingEntries = myEntries.filter(
    (e) => e.category === "training" && e.trainingLog && e.trainingLog.length > 0 && isInCurrentWeek(e.date)
  );

  // Past week entries grouped by week
  const pastNutrition = myEntries.filter((e) => e.category === "nutrition" && !isInCurrentWeek(e.date));
  const pastTraining = myEntries.filter((e) => e.category === "training" && e.trainingLog && e.trainingLog.length > 0 && !isInCurrentWeek(e.date));

  const groupByWeek = (entries: QuestionnaireEntry[]) => {
    const groups: Record<string, { start: Date; end: Date; entries: QuestionnaireEntry[] }> = {};
    entries.forEach((e) => {
      const d = new Date(e.date + "T12:00:00");
      const [mon, sun] = getCurrentWeekRange(d);
      const key = mon.toISOString();
      if (!groups[key]) groups[key] = { start: mon, end: sun, entries: [] };
      groups[key].entries.push(e);
    });
    return Object.values(groups).sort((a, b) => b.start.getTime() - a.start.getTime());
  };

  const pastNutritionWeeks = groupByWeek(pastNutrition);
  const pastTrainingWeeks = groupByWeek(pastTraining);

  const formatShortDate = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;

  const defaultTab = hasNutrition ? "nutrition" : "training";

  return (
    <ClientLayout>
      <div className="space-y-5 max-w-lg mx-auto animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><ClipboardList className="h-5 w-5 text-yellow-500" />{t("clientCheckins.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("clientCheckins.subtitle")}</p>
        </div>
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
              <HistorySection weeks={pastNutritionWeeks} renderCard={(entry) => <NutritionCheckinCard key={entry.id} entry={entry} />} formatShortDate={formatShortDate} t={t} />
            </TabsContent>
          )}
          {hasTraining && (
            <TabsContent value="training" className="space-y-3">
              <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: t("clientCheckins.trainingSchedule") }} />
              {trainingEntries.length === 0 && (
                <div className="text-center py-8">
                  <Dumbbell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{t("clientCheckins.noActivePlan")}</p>
                </div>
              )}
              {trainingEntries.map((entry) => <TrainingLogCard key={entry.id} entry={entry} />)}
              <HistorySection weeks={pastTrainingWeeks} renderCard={(entry) => <TrainingLogCard key={entry.id} entry={entry} />} formatShortDate={formatShortDate} t={t} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </ClientLayout>
  );
};

export default ClientCheckins;
