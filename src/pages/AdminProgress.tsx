import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Activity, Utensils, Dumbbell, Trophy, Brain, AlertTriangle, Search, Plus, Pencil, Trash2, ChevronRight, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ApiClient } from "@/types/api";
import { packTypeLabels } from "@/types/api";
import { useClientStore } from "@/data/useClientStore";
import { useQuestionnaireStore } from "@/data/useQuestionnaireStore";
import { useTranslation } from "@/i18n/useTranslation";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { parseDecimal } from "@/utils/parseDecimal";
import AdminPhotoComparison from "@/components/admin/AdminPhotoComparison";
const SBD_NAMES = ["Sentadilla", "Press Banca", "Peso Muerto"];

const ClientProgressCard = ({ client, onClick, t }: { client: ApiClient; onClick: () => void; t: (k: string) => string }) => {
  const hasNutrition = client.services.includes("nutrition");
  const hasTraining = client.services.includes("training");
  const wh = useQuestionnaireStore((s) => hasNutrition ? (s.weightHistory[client.id] || []) : []);
  const rmRecords = useQuestionnaireStore((s) => hasTraining ? (s.rmRecords[client.id] || []) : []);
  const bestRMs = useMemo(() => {
    const best: Record<string, typeof rmRecords[0]> = {};
    rmRecords.forEach((r) => { const k = r.exerciseName || r.exerciseId; if (!best[k] || r.estimated1RM > best[k].estimated1RM) best[k] = r; });
    return Object.values(best);
  }, [rmRecords]);
  const sbdTotal = bestRMs.filter((r) => SBD_NAMES.includes(r.exerciseName)).reduce((s, r) => s + r.estimated1RM, 0);
  const latestWeight = wh.length > 0 ? wh[wh.length - 1].weight : null;
  const packLabel = client.packType ? (packTypeLabels[String(client.packType)] ?? String(client.packType)) : "";

  const initials = client.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <button onClick={onClick} className="w-full bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/30 transition-all text-left group">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={client.avatarUrl || undefined} />
          <AvatarFallback className="bg-primary/15 text-primary text-sm font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-medium text-foreground truncate">{client.name}</p>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-muted-foreground">{packLabel}</span>
            {latestWeight && <span className="text-xs font-mono text-foreground">{latestWeight} kg</span>}
            {sbdTotal > 0 && <span className="text-xs font-mono text-foreground">SBD {sbdTotal}</span>}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          {hasNutrition && <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-[10px] px-1.5 py-0.5">Nutri</Badge>}
          {hasTraining && <Badge variant="outline" className="border-accent/30 text-accent bg-accent/10 text-[10px] px-1.5 py-0.5">{t("common.training")}</Badge>}
        </div>
      </div>
    </button>
  );
};

interface RMDialogProps {
  clientId: string;
  open: boolean;
  onClose: () => void;
  editRecord?: { id?: string; exerciseName: string; weight: number; reps: number; date: string } | null;
}

const RMDialog = ({ clientId, open, onClose, editRecord }: RMDialogProps) => {
  const { toast } = useToast();
  const fetchRMRecords = useQuestionnaireStore((s) => s.fetchRMRecords);
  const [exerciseName, setExerciseName] = useState("Sentadilla");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("1");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const isEdit = !!editRecord;

  useEffect(() => {
    if (editRecord) {
      setExerciseName(editRecord.exerciseName);
      setWeight(String(editRecord.weight));
      setReps(String(editRecord.reps));
      setDate(editRecord.date);
    } else {
      setExerciseName("Sentadilla");
      setWeight("");
      setReps("1");
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [editRecord, open]);

  const handleSave = async () => {
    if (!weight || parseDecimal(weight) <= 0) { toast({ title: "Error", description: "Introduce un peso válido", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const w = parseDecimal(weight);
      const r = parseDecimal(reps, 1);
      const e1rm = r === 1 ? w : Math.round(w * (1 + r / 30));
      if (isEdit && editRecord?.id) {
        await api.put(`/checkins/rm/record/${editRecord.id}`, { exerciseName, weight: w, reps: r, estimated1RM: e1rm, date });
        toast({ title: "RM actualizado", description: `${exerciseName}: ${w}kg x${r}` });
      } else {
        await api.post(`/checkins/rm/${clientId}`, { exerciseName, weight: w, reps: r, estimated1RM: e1rm, date });
        toast({ title: "RM añadido", description: `${exerciseName}: ${w}kg x${r}` });
      }
      await fetchRMRecords(clientId);
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "No se pudo guardar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border sm:max-w-sm">
        <DialogHeader><DialogTitle className="text-foreground flex items-center gap-2"><Dumbbell className="h-5 w-5 text-primary" /> {isEdit ? "Editar RM" : "Añadir RM"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-foreground text-xs">Ejercicio</Label>
            <Select value={exerciseName} onValueChange={setExerciseName}>
              <SelectTrigger className="bg-muted/50 border-border mt-1"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="Sentadilla">Sentadilla</SelectItem>
                <SelectItem value="Press Banca">Press Banca</SelectItem>
                <SelectItem value="Peso Muerto">Peso Muerto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-foreground text-xs">Peso (kg) *</Label>
              <Input type="text" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} className="bg-muted/50 border-border mt-1" placeholder="0" />
            </div>
            <div>
              <Label className="text-foreground text-xs">Reps</Label>
              <Input type="text" inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} className="bg-muted/50 border-border mt-1" placeholder="1" />
            </div>
          </div>
          <div>
            <Label className="text-foreground text-xs">Fecha</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-muted/50 border-border mt-1" />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full glow-primary-sm">
            {saving ? "Guardando..." : isEdit ? "Actualizar RM" : "Guardar RM"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ClientDetail = ({ client, onBack, t }: { client: ApiClient; onBack: () => void; t: (k: string) => string }) => {
  const hasNutrition = client.services.includes("nutrition");
  const hasTraining = client.services.includes("training");
  const weightHistory = useQuestionnaireStore((s) => hasNutrition ? (s.weightHistory[client.id] || []) : []);
  const rmRecords = useQuestionnaireStore((s) => hasTraining ? (s.rmRecords[client.id] || []) : []);
  const entries = useQuestionnaireStore((s) => s.entries);
  const fetchWeightHistory = useQuestionnaireStore((s) => s.fetchWeightHistory);
  const fetchRMRecords = useQuestionnaireStore((s) => s.fetchRMRecords);
  const fetchEntries = useQuestionnaireStore((s) => s.fetchEntries);
  const [showAddRM, setShowAddRM] = useState(false);
  const [editRM, setEditRM] = useState<{ id?: string; exerciseName: string; weight: number; reps: number; date: string } | null>(null);
  const { toast } = useToast();

  const handleDeleteRM = async (rm: { id?: string; exerciseName: string }) => {
    if (!rm.id) return;
    try {
      await api.delete(`/checkins/rm/record/${rm.id}`);
      await fetchRMRecords(client.id);
      toast({ title: "RM eliminado", description: rm.exerciseName });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "No se pudo eliminar", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchEntries(client.id);
    if (hasNutrition) fetchWeightHistory(client.id);
    if (hasTraining) fetchRMRecords(client.id);
  }, [client.id]);

  const bestRMs = useMemo(() => {
    const best: Record<string, typeof rmRecords[0]> = {};
    rmRecords.forEach((r) => { const k = r.exerciseName || r.exerciseId; if (!best[k] || r.estimated1RM > best[k].estimated1RM) best[k] = r; });
    return Object.values(best);
  }, [rmRecords]);
  const trainingProgress = useMemo(() => {
    if (!hasTraining) return null;
    const trainEntries = entries.filter(
      (e) => e.clientId === client.id && e.category === "training" && (e.status === "respondido" || e.status === "revisado")
    );
    const latest = trainEntries[trainEntries.length - 1];
    if (!latest?.responses) return null;
    const r = latest.responses;
    const qs = latest.templateQuestions || [];
    const findVal = (keywords: string[], fallbackId: string) => {
      const q = qs.find((q) => keywords.some((k) => q.label.toLowerCase().includes(k)));
      return r[q?.id || fallbackId];
    };
    return {
      latestFatigue: findVal(["fatiga", "fatigue"], "tq1") as number | undefined,
      latestSleep: findVal(["sueño", "sleep", "descanso"], "tq4") as number | undefined,
      latestMotivation: findVal(["motivación", "motivation", "ánimo"], "tq5") as number | undefined,
      hasInjury: findVal(["molestia", "dolor", "injury", "pain"], "tq2") as boolean | undefined,
      injuryDetail: findVal(["describe", "detalle", "detail"], "tq3") as string | undefined,
    };
  }, [entries, client.id, hasTraining]);
  const weightDelta = weightHistory.length >= 2 ? (weightHistory[weightHistory.length - 1].weight - weightHistory[0].weight).toFixed(1) : null;
  const defaultTab = hasNutrition ? "nutrition" : "training";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={client.avatarUrl || undefined} />
            <AvatarFallback className="bg-primary/15 text-primary text-lg font-bold">{client.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold text-foreground">{client.name}</h2>
            <div className="flex gap-1.5 mt-0.5">
              {hasNutrition && <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-xs">{t("common.nutrition")}</Badge>}
              {hasTraining && <Badge variant="outline" className="border-accent/30 text-accent bg-accent/10 text-xs">{t("common.training")}</Badge>}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="bg-muted border border-border">
          {hasNutrition && <TabsTrigger value="nutrition" className="data-[state=active]:bg-card data-[state=active]:text-primary"><Utensils className="h-4 w-4 mr-1.5" /> {t("common.nutrition")}</TabsTrigger>}
          {hasTraining && <TabsTrigger value="training" className="data-[state=active]:bg-card data-[state=active]:text-primary"><Dumbbell className="h-4 w-4 mr-1.5" /> {t("common.training")}</TabsTrigger>}
        </TabsList>

        {hasNutrition && (
          <TabsContent value="nutrition" className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 space-y-5">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("progress.fastingWeight")}</h3>
              {weightHistory.length > 0 ? (
                <>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-4xl font-bold text-foreground">{weightHistory[weightHistory.length - 1].weight} <span className="text-lg text-muted-foreground font-normal">kg</span></p>
                      <p className="text-xs text-muted-foreground mt-1">{t("progress.lastRecord")} — {weightHistory[weightHistory.length - 1].date}</p>
                    </div>
                    {weightDelta && (
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${Number(weightDelta) < 0 ? "text-primary" : Number(weightDelta) > 0 ? "text-accent" : "text-muted-foreground"}`}>{Number(weightDelta) > 0 ? "+" : ""}{weightDelta} kg</p>
                        <p className="text-xs text-muted-foreground">{t("progress.totalVariation")}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {weightHistory.map((entry, idx) => {
                      const min = Math.min(...weightHistory.map((w) => w.weight));
                      const max = Math.max(...weightHistory.map((w) => w.weight));
                      const range = max - min || 1;
                      const pct = ((entry.weight - min) / range) * 55 + 45;
                      return (
                        <div key={idx} className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground w-24 shrink-0 font-mono">{entry.date}</span>
                          <div className="flex-1 h-6 bg-muted/40 rounded-full overflow-hidden">
                            <div className="h-full bg-primary/25 rounded-full flex items-center justify-end pr-3 transition-all" style={{ width: `${pct}%` }}><span className="text-xs font-mono font-semibold text-primary">{entry.weight}</span></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">{t("progress.noWeightData")}</p>
              )}
            </div>

            {/* Progress Photos Section */}
            <AdminPhotoComparison clientId={client.id} />
          </TabsContent>
        )}

        {hasTraining && (
          <TabsContent value="training" className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Trophy className="h-4 w-4" /> {t("progress.bestRMs")}</h3>
                <Button variant="outline" size="sm" onClick={() => setShowAddRM(true)} className="gap-1 text-xs border-border"><Plus className="h-3.5 w-3.5" /> Añadir RM</Button>
              </div>
              {bestRMs.length > 0 ? (
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full">
                    <thead><tr className="bg-muted/50 text-left">
                      <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">{t("progress.exercise")}</th>
                      <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-right">{t("progress.weight")}</th>
                      <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-right">{t("progress.reps")}</th>
                       <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-right">e1RM</th>
                       <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-right">{t("progress.date")}</th>
                       <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-right w-20"></th>
                    </tr></thead>
                    <tbody>
                       {bestRMs.filter((r) => SBD_NAMES.includes(r.exerciseName)).map((rm) => (
                         <tr key={rm.id || rm.exerciseId} className="border-t border-border/50">
                           <td className="px-4 py-3 text-sm font-medium text-foreground">{rm.exerciseName}</td>
                           <td className="px-4 py-3 text-sm text-muted-foreground text-right font-mono">{rm.weight} kg</td>
                           <td className="px-4 py-3 text-sm text-muted-foreground text-right font-mono">{rm.reps}</td>
                           <td className="px-4 py-3 text-sm text-primary text-right font-mono font-bold">{rm.estimated1RM} kg</td>
                           <td className="px-4 py-3 text-xs text-muted-foreground text-right">{rm.date}</td>
                           <td className="px-4 py-2 text-right">
                             <div className="flex items-center justify-end gap-1">
                               <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setEditRM({ id: rm.id, exerciseName: rm.exerciseName, weight: rm.weight, reps: rm.reps, date: rm.date })}><Pencil className="h-3.5 w-3.5" /></Button>
                               <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteRM(rm)}><Trash2 className="h-3.5 w-3.5" /></Button>
                             </div>
                           </td>
                         </tr>
                       ))}
                    </tbody>
                    <tfoot><tr className="border-t border-border bg-muted/30">
                      <td className="px-4 py-2.5 text-sm font-semibold text-foreground">{t("progress.totalSBD")}</td>
                      <td colSpan={5} className="px-4 py-2.5 text-sm font-bold text-primary text-right font-mono">{bestRMs.filter((r) => SBD_NAMES.includes(r.exerciseName)).reduce((s, r) => s + r.estimated1RM, 0)} kg</td>
                    </tr></tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">{t("progress.noRMData")}</p>
              )}
            </div>
            {trainingProgress && (
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Brain className="h-4 w-4" /> {t("progress.weeklyCheckin")}</h3>
                <div className="grid grid-cols-3 gap-4">
                  {trainingProgress.latestFatigue !== undefined && <div className="bg-muted/40 rounded-xl p-4 text-center space-y-2"><p className="text-3xl font-bold text-foreground">{trainingProgress.latestFatigue}</p><p className="text-xs text-muted-foreground">{t("progress.fatigue")} /10</p><Progress value={trainingProgress.latestFatigue * 10} className="h-1.5" /></div>}
                  {trainingProgress.latestSleep !== undefined && <div className="bg-muted/40 rounded-xl p-4 text-center space-y-2"><p className="text-3xl font-bold text-foreground">{trainingProgress.latestSleep}</p><p className="text-xs text-muted-foreground">{t("progress.sleep")} /10</p><Progress value={trainingProgress.latestSleep * 10} className="h-1.5" /></div>}
                  {trainingProgress.latestMotivation !== undefined && <div className="bg-muted/40 rounded-xl p-4 text-center space-y-2"><p className="text-3xl font-bold text-foreground">{trainingProgress.latestMotivation}</p><p className="text-xs text-muted-foreground">{t("progress.motivationLabel")} /10</p><Progress value={trainingProgress.latestMotivation * 10} className="h-1.5" /></div>}
                </div>
                {trainingProgress.hasInjury && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div><p className="text-sm font-medium text-destructive">{t("progress.injuryReported")}</p>{trainingProgress.injuryDetail && <p className="text-sm text-muted-foreground mt-0.5">{trainingProgress.injuryDetail}</p>}</div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {hasTraining && <RMDialog clientId={client.id} open={showAddRM || !!editRM} onClose={() => { setShowAddRM(false); setEditRM(null); }} editRecord={editRM} />}
    </div>
  );
};

const AdminProgress = () => {
  const { t } = useTranslation();
  const [selectedClient, setSelectedClient] = useState<ApiClient | null>(null);
  const [search, setSearch] = useState("");
  const activeClients = useClientStore((s) => s.getActiveClients)();
  const filtered = activeClients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name, "es"));
  const fetchEntries = useQuestionnaireStore((s) => s.fetchEntries);

  const fetchWeightHistory = useQuestionnaireStore((s) => s.fetchWeightHistory);
  const fetchRMRecords = useQuestionnaireStore((s) => s.fetchRMRecords);

  // Fetch all check-ins and per-client weight/RM data
  useEffect(() => {
    fetchEntries();
    activeClients.forEach((c) => {
      fetchWeightHistory(c.id);
      fetchRMRecords(c.id);
    });
  }, [activeClients.length]);

  return (
    <AdminLayout>
      {selectedClient ? (
        <ClientDetail client={selectedClient} onBack={() => setSelectedClient(null)} t={t} />
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Activity className="h-6 w-6 text-primary" />{t("progress.title")}</h1>
            <p className="text-muted-foreground text-sm mt-1">{t("progress.subtitle")}</p>
          </div>
          <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder={t("progress.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-border" /></div>
          <div className="flex flex-col gap-2">
            {filtered.map((client) => <ClientProgressCard key={client.id} client={client} onClick={() => setSelectedClient(client)} t={t} />)}
            {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">{t("progress.noClients")}</p>}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminProgress;
