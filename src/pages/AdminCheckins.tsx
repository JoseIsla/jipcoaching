import { useState, useMemo, useCallback, useEffect } from "react";
import { Video, RotateCcw } from "lucide-react";
import { api } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ClipboardList, Utensils, Dumbbell, CheckCircle2, Clock, XCircle, ChevronLeft, ChevronRight, Eye, Download, User, AlertTriangle } from "lucide-react";
import { type QuestionnaireEntry, getEntryWindowStatus } from "@/data/useQuestionnaireStore";
import { useQuestionnaireStore } from "@/data/useQuestionnaireStore";
import { useTemplateStore } from "@/data/useTemplateStore";
import { useTranslation } from "@/i18n/useTranslation";
import { exportTrainingLogPDF } from "@/utils/exportTrainingPDF";
import MediaCommentThread from "@/components/admin/MediaCommentThread";

/** Compute the effective display status */
const getEffectiveStatus = (e: QuestionnaireEntry): QuestionnaireEntry["status"] => {
  if (e.status === "pendiente" && getEntryWindowStatus(e) === "expired") return "expirado";
  return e.status;
};

interface ClientCheckinSummary {
  clientId: string;
  clientName: string;
  entries: QuestionnaireEntry[];
  responded: number;
  pending: number;
  expired: number;
  total: number;
}

const AdminCheckins = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState<QuestionnaireEntry | null>(null);
  const [categoryTab, setCategoryTab] = useState<"all" | "nutrition" | "training">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "pendiente" | "respondido" | "expirado">("all");
  const allEntries = useQuestionnaireStore((s) => s.entries);
  const fetchEntries = useQuestionnaireStore((s) => s.fetchEntries);
  const generateWeeklyCheckins = useQuestionnaireStore((s) => s.generateWeeklyCheckins);
  const markAsReviewed = useQuestionnaireStore((s) => s.markAsReviewed);

  const nutritionTemplates = useTemplateStore((s) => s.nutritionTemplates);
  const trainingTemplate = useTemplateStore((s) => s.trainingTemplate);
  const fetchTemplates = useTemplateStore((s) => s.fetchTemplates);

  const [resetting, setResetting] = useState(false);

  const handleResetTrainingWeek = async () => {
    if (!confirm("¿Seguro que quieres resetear los check-ins de entrenamiento de esta semana? Se eliminarán y regenerarán.")) return;
    setResetting(true);
    try {
      const res = await api.post("/checkins/reset-training-week");
      toast({ title: "Check-ins reseteados", description: `${res.deleted ?? 0} eliminados, ${res.created ?? 0} regenerados` });
      await fetchEntries();
    } catch {
      // api.ts already shows error toast
    } finally {
      setResetting(false);
    }
  };
  const handleViewEntry = useCallback((entry: QuestionnaireEntry) => {
    setSelectedEntry(entry);
    if (entry.status === "respondido") {
      markAsReviewed(entry.id);
    }
  }, [markAsReviewed]);

  useEffect(() => {
    generateWeeklyCheckins().then(() => fetchEntries());
    fetchTemplates();
  }, []);

  const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
    respondido: { label: t("questionnaires.statusResponded"), icon: CheckCircle2, className: "bg-primary/15 text-primary border-primary/30" },
    revisado: { label: t("questionnaires.statusReviewed") || "Revisado", icon: CheckCircle2, className: "bg-muted text-muted-foreground border-border" },
    pendiente: { label: t("questionnaires.statusPending"), icon: Clock, className: "bg-accent/15 text-accent border-accent/30" },
    expirado: { label: t("questionnaires.statusExpired"), icon: AlertTriangle, className: "bg-destructive/15 text-destructive border-destructive/30" },
    no_enviado: { label: t("questionnaires.statusNotSent"), icon: XCircle, className: "bg-muted text-muted-foreground border-border" },
  };

  // Week range
  const weekRange = useMemo(() => {
    const now = new Date();
    const shifted = new Date(now);
    shifted.setDate(now.getDate() + weekOffset * 7);
    const day = shifted.getDay();
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

  // Filter entries by week + category
  const entries = useMemo(() => {
    return allEntries.filter((e) => {
      const entryDate = new Date(e.date + "T12:00:00");
      const inWeek = entryDate >= weekRange.monday && entryDate <= weekRange.sunday;
      if (!inWeek) return false;
      if (categoryTab !== "all" && e.category !== categoryTab) return false;
      return true;
    });
  }, [allEntries, weekRange, categoryTab]);

  // Group by client
  const clientSummaries = useMemo(() => {
    const map: Record<string, ClientCheckinSummary> = {};
    entries.forEach((e) => {
      if (!map[e.clientId]) {
        map[e.clientId] = { clientId: e.clientId, clientName: e.clientName, entries: [], responded: 0, pending: 0, expired: 0, total: 0 };
      }
      map[e.clientId].entries.push(e);
      map[e.clientId].total++;
      const effectiveStatus = getEffectiveStatus(e);
      if (effectiveStatus === "respondido" || effectiveStatus === "revisado") map[e.clientId].responded++;
      else if (effectiveStatus === "expirado") map[e.clientId].expired++;
      else map[e.clientId].pending++;
    });
    return Object.values(map).sort((a, b) => {
      const aPriority = a.pending + a.expired;
      const bPriority = b.pending + b.expired;
      if (aPriority !== bPriority) return bPriority - aPriority;
      return a.clientName.localeCompare(b.clientName);
    });
  }, [entries]);

  // Global stats
  const globalStats = useMemo(() => {
    return {
      totalEntries: entries.length,
      responded: entries.filter((e) => ["respondido", "revisado"].includes(getEffectiveStatus(e))).length,
      pending: entries.filter((e) => getEffectiveStatus(e) === "pendiente").length,
      expired: entries.filter((e) => getEffectiveStatus(e) === "expirado").length,
    };
  }, [entries]);

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Check-ins</h1>
            <p className="text-muted-foreground text-sm mt-1">Revisión de check-ins de nutrición y entrenamiento</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleResetTrainingWeek} disabled={resetting} className="text-destructive border-destructive/30 hover:bg-destructive/10">
              <RotateCcw className={`h-4 w-4 mr-1.5 ${resetting ? "animate-spin" : ""}`} />
              {resetting ? "Reseteando…" : "Reset training"}
            </Button>
            <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm font-medium text-foreground min-w-[120px] text-center">{weekLabel}</span>
            <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => Math.min(w + 1, 0))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatMini icon={ClipboardList} label="Total" value={globalStats.totalEntries} />
          <StatMini icon={CheckCircle2} label={t("questionnaires.statusResponded")} value={globalStats.responded} accent />
          <StatMini icon={Clock} label={t("questionnaires.statusPending")} value={globalStats.pending} warn={globalStats.pending > 0} />
          <StatMini icon={AlertTriangle} label={t("questionnaires.statusExpired")} value={globalStats.expired} danger={globalStats.expired > 0} />
        </div>

        {/* Category tabs: All / Nutrition / Training */}
        <Tabs value={categoryTab} onValueChange={(v) => setCategoryTab(v as "all" | "nutrition" | "training")} className="space-y-4">
          <TabsList className="bg-muted border border-border">
            <TabsTrigger value="all" className="data-[state=active]:bg-card data-[state=active]:text-primary">
              <ClipboardList className="h-4 w-4 mr-1.5" /> Todos
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="data-[state=active]:bg-card data-[state=active]:text-primary">
              <Utensils className="h-4 w-4 mr-1.5" /> Nutrición
            </TabsTrigger>
            <TabsTrigger value="training" className="data-[state=active]:bg-card data-[state=active]:text-primary">
              <Dumbbell className="h-4 w-4 mr-1.5" /> Entrenamiento
            </TabsTrigger>
          </TabsList>

          {/* Same content for all tabs, filtering is done via entries */}
          {(["all", "nutrition", "training"] as const).map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
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
          ))}
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
            {(selectedEntry?.status === "respondido" || selectedEntry?.status === "revisado") && selectedEntry.category === "training" && (
              <div className="flex justify-end -mt-2">
                <Button variant="outline" size="sm" onClick={() => selectedEntry && exportTrainingLogPDF(selectedEntry)} className="gap-1.5">
                  <Download className="h-4 w-4" />
                  {t("questionnaires.exportPDF")}
                </Button>
              </div>
            )}
            {(selectedEntry?.status === "respondido" || selectedEntry?.status === "revisado") ? (
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
                      const orderedQuestions: { id: string; label: string }[] =
                        selectedEntry.templateQuestions && selectedEntry.templateQuestions.length > 0
                          ? selectedEntry.templateQuestions
                          : selectedEntry.category === "nutrition"
                            ? (nutritionTemplates.find((tp) => tp.id === selectedEntry.templateId)?.questions || [])
                            : (trainingTemplate.questions || []);

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
        <div className="mt-3 h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${completionPct === 100 ? "bg-primary" : "bg-primary/60"}`} style={{ width: `${completionPct}%` }} />
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
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

export default AdminCheckins;
