import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Trophy, Plus, Trash2, TrendingUp, TrendingDown, Target, Download, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { api } from "@/services/api";
import { ApiError } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { OppositionType, oppositionTypeLabels } from "@/types/api";
import type { PhysicalTestScaleEntry, ClientPhysicalMark } from "@/types/api";
import { OPPOSITION_TESTS, getOppositionTypeFromModality, getTestsForGender } from "@/data/oppositionScales";
import type { OppositionTestDef } from "@/data/oppositionScales";
import { exportPhysicalMarksPDF } from "@/utils/exportPhysicalMarksPDF";
import { mapDeleteMarkError } from "@/utils/mapDeleteMarkError";

interface Props {
  clientId: string;
  modality: string;
  clientName?: string;
  gender?: string; // "MALE" | "FEMALE"
  isAdmin?: boolean;
}

const scoreColor = (score: number): string => {
  if (score >= 8) return "text-green-400";
  if (score >= 5) return "text-yellow-400";
  if (score >= 1) return "text-orange-400";
  return "text-destructive";
};

const scoreBg = (score: number): string => {
  if (score >= 8) return "bg-green-500/10 border-green-500/20";
  if (score >= 5) return "bg-yellow-500/10 border-yellow-500/20";
  if (score >= 1) return "bg-orange-500/10 border-orange-500/20";
  return "bg-destructive/10 border-destructive/20";
};

const formatTimeValue = (seconds: number): string => {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}'${s.toString().padStart(2, "0")}''`;
  }
  return `${seconds.toFixed(1)}''`;
};

const PhysicalTestTracker = ({ clientId, modality, clientName = "Cliente", gender = "MALE", isAdmin }: Props) => {
  const { toast } = useToast();
  const [scales, setScales] = useState<PhysicalTestScaleEntry[]>([]);
  const [marks, setMarks] = useState<ClientPhysicalMark[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState("");
  const [newValue, setNewValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingMark, setEditingMark] = useState<ClientPhysicalMark | null>(null);
  const [editValue, setEditValue] = useState("");
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const [deletingMarkId, setDeletingMarkId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const opType = getOppositionTypeFromModality(modality);
  const genderKey = (gender?.toUpperCase() === "FEMALE" ? "FEMALE" : "MALE") as "MALE" | "FEMALE";
  const tests = opType ? getTestsForGender(opType, genderKey) : [];

  const fetchData = useCallback(async () => {
    if (!opType) return;
    try {
      const [scalesRes, marksRes] = await Promise.all([
        api.get<PhysicalTestScaleEntry[]>(`/training/physical-scales?oppositionType=${opType}&gender=${gender}`),
        api.get<ClientPhysicalMark[]>(`/training/physical-marks?clientId=${clientId}`),
      ]);
      setScales(scalesRes || []);
      setMarks(marksRes || []);
    } catch (err) {
      console.error("Error fetching physical test data:", err);
    }
  }, [clientId, opType, gender]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getScore = (testName: string, value: number): number => {
    const matching = scales.filter(s => s.testName === testName);
    for (const s of matching) {
      if (value >= s.minValue && value <= s.maxValue) return s.score;
    }
    return 0;
  };

  const getLatestMark = (testName: string): ClientPhysicalMark | null => {
    return marks.find(m => m.testName === testName) || null;
  };

  const getMarkHistory = (testName: string): ClientPhysicalMark[] => {
    return marks.filter(m => m.testName === testName).slice(0, 5);
  };

  const handleAddMark = async () => {
    if (!selectedTest || !newValue) return;
    const testDef = tests.find(t => t.testName === selectedTest);
    if (!testDef) return;

    setSubmitting(true);
    try {
      await api.post("/training/physical-marks", {
        clientId,
        testName: selectedTest,
        value: parseFloat(newValue),
        unit: testDef.unit,
      });
      toast({ title: "Marca registrada", description: `${selectedTest}: ${newValue} ${testDef.unitLabel}` });
      setAddOpen(false);
      setSelectedTest("");
      setNewValue("");
      await fetchData();
    } catch (err) {
      toast({ title: "Error", description: "No se pudo registrar la marca", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (mark: ClientPhysicalMark) => {
    setEditingMark(mark);
    setEditValue(String(mark.value));
  };

  const handleConfirmEdit = async () => {
    if (!editingMark || !editValue) return;
    setSubmitting(true);
    try {
      await api.put(`/training/physical-marks/${editingMark.id}`, { value: parseFloat(editValue) });
      toast({ title: "Marca actualizada", description: `${editingMark.testName}: ${editValue}` });
      setEditingMark(null);
      setEditValue("");
      setConfirmEditOpen(false);
      await fetchData();
    } catch {
      toast({ title: "Error", description: "No se pudo actualizar la marca", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMark = async (markId: string) => {
    setDeleting(true);
    setDeleteError(null);
    // Optimistic: remove mark from UI immediately
    const previousMarks = marks;
    setMarks(prev => prev.filter(m => m.id !== markId));
    try {
      await api.delete(`/training/physical-marks/${markId}`, { silent: true });
      toast({ title: "Marca eliminada" });
      setDeletingMarkId(null);
      // Sync with server in background (no flicker since mark is already gone)
      fetchData();
    } catch (err) {
      setMarks(previousMarks);
      const mapped = mapDeleteMarkError(err);
      if (!mapped.closeDialog) {
        // Show inline error in dialog (stays open)
        setDeleteError(`${mapped.title}: ${mapped.description}`);
      } else {
        // Toast for errors that close the dialog
        toast({ title: mapped.title, description: mapped.description, variant: "destructive" });
        setDeletingMarkId(null);
      }
      if (mapped.refetch) {
        fetchData();
      }
    } finally {
      setDeleting(false);
    }
  };

  if (!opType || tests.length === 0) return null;

  const totalScore = tests.reduce((acc, t) => {
    const mark = getLatestMark(t.testName);
    return acc + (mark ? getScore(t.testName, mark.value) : 0);
  }, 0);
  const maxScore = tests.length * 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.1 } }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-bold text-foreground">Mis Marcas</h2>
          <Badge variant="outline" className="text-[10px]">
            {oppositionTypeLabels[opType]}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {marks.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() =>
                exportPhysicalMarksPDF({
                  clientName,
                  oppositionLabel: oppositionTypeLabels[opType!],
                  gender,
                  tests,
                  scales,
                  marks,
                  lastCheckinDate: marks.length > 0 ? marks[0].recordedAt : null,
                })
              }
            >
              <Download className="h-3.5 w-3.5" /> PDF
            </Button>
          )}
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" /> Registrar
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Registrar nueva marca</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Prueba</Label>
                  <Select value={selectedTest} onValueChange={setSelectedTest}>
                    <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Seleccionar prueba" /></SelectTrigger>
                    <SelectContent>
                      {tests.map(t => (
                        <SelectItem key={t.testName} value={t.testName}>{t.testName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedTest && (
                  <div className="space-y-2">
                    <Label>Valor ({tests.find(t => t.testName === selectedTest)?.unitLabel})</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder={tests.find(t => t.testName === selectedTest)?.unit === "seconds" ? "Ej: 10.5" : "Ej: 12"}
                      className="bg-background border-border"
                    />
                  </div>
                )}
                <Button onClick={handleAddMark} className="w-full" disabled={!selectedTest || !newValue || submitting}>
                  {submitting ? "Guardando..." : "Guardar marca"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Total score summary */}
      <Card className={`p-4 border ${scoreBg(totalScore / tests.length)}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Puntuación total</p>
            <p className={`text-2xl font-bold ${scoreColor(totalScore / tests.length)}`}>
              {totalScore} / {maxScore}
            </p>
          </div>
          <Target className={`h-8 w-8 ${scoreColor(totalScore / tests.length)} opacity-60`} />
        </div>
      </Card>

      {/* Test cards */}
      <div className="space-y-2">
        {tests.map((testDef) => {
          const latest = getLatestMark(testDef.testName);
          const history = getMarkHistory(testDef.testName);
          const score = latest ? getScore(testDef.testName, latest.value) : null;
          const prev = history.length > 1 ? history[1] : null;
          const improved = latest && prev
            ? testDef.lowerIsBetter ? latest.value < prev.value : latest.value > prev.value
            : null;

          return (
            <Card key={testDef.testName} className="p-3 border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{testDef.testName}</p>
                  {latest ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg font-bold text-foreground">
                        {testDef.unit === "seconds" ? formatTimeValue(latest.value) : `${latest.value} ${testDef.unitLabel}`}
                      </span>
                      {improved !== null && (
                        improved
                          ? <TrendingUp className="h-4 w-4 text-green-400" />
                          : <TrendingDown className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1 italic">Sin registros</p>
                  )}
                  {history.length > 1 && (
                    <div className="flex gap-1.5 mt-1">
                      {history.slice(1).map((h, i) => (
                        <span key={i} className="text-[10px] text-muted-foreground">
                          {testDef.unit === "seconds" ? formatTimeValue(h.value) : h.value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {latest && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => openEdit(latest)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {isAdmin && latest && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeletingMarkId(latest.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {score !== null && (
                    <div className={`flex flex-col items-center rounded-lg px-3 py-2 border ${scoreBg(score)}`}>
                      <span className={`text-xl font-bold ${scoreColor(score)}`}>{score}</span>
                      <span className="text-[9px] text-muted-foreground uppercase">pts</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Edit mark dialog */}
      <Dialog open={!!editingMark && !confirmEditOpen} onOpenChange={(open) => { if (!open) setEditingMark(null); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Editar marca</DialogTitle>
          </DialogHeader>
          {editingMark && (
            <div className="space-y-4 pt-2">
              <div>
                <p className="text-sm font-medium text-foreground">{editingMark.testName}</p>
                <p className="text-xs text-muted-foreground">
                  Valor actual: {editingMark.value} {editingMark.unit === "seconds" ? "seg" : editingMark.unit}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Nuevo valor ({tests.find(t => t.testName === editingMark.testName)?.unitLabel || editingMark.unit})</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="bg-background border-border"
                  autoFocus
                />
              </div>
              <Button
                className="w-full"
                disabled={!editValue || editValue === String(editingMark.value)}
                onClick={() => setConfirmEditOpen(true)}
              >
                Actualizar marca
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation alert */}
      <AlertDialog open={confirmEditOpen} onOpenChange={setConfirmEditOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar edición?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a cambiar la marca de <strong>{editingMark?.testName}</strong> de{" "}
              <strong>{editingMark?.value}</strong> a <strong>{editValue}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmEdit} disabled={submitting}>
              {submitting ? "Guardando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingMarkId} onOpenChange={(open) => { if (!open && !deleting) { setDeletingMarkId(null); setDeleteError(null); } }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar marca?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la marca permanentemente y no se puede deshacer.
            </AlertDialogDescription>
            {deleteError && (
              <p className="mt-2 text-sm text-destructive font-medium">{deleteError}</p>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); deletingMarkId && handleDeleteMark(deletingMarkId); }} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default PhysicalTestTracker;