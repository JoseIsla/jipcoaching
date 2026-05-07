import { useState, useEffect, useCallback } from "react";
import { Trophy, Plus, Pencil, Trash2, Save, Search, X } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import { OppositionType, oppositionTypeLabels } from "@/types/api";
import type { PhysicalTestScaleEntry } from "@/types/api";

const OPPOSITION_TYPES = Object.values(OppositionType);
const GENDERS = ["MALE", "FEMALE"] as const;
const genderLabel = (g: string) => (g === "MALE" ? "Hombre" : "Mujer");

/** Short description per opposition type shown below the tabs */
const oppositionDescriptions: Record<OppositionType, string> = {
  [OppositionType.POLICIA_NACIONAL]:
    "Escala 0-10 puntos por prueba según BOE. Pruebas: circuito de agilidad, dominadas (H) / suspensión en barra (M), carrera 1000m.",
  [OppositionType.POLICIA_LOCAL]:
    "Mismos baremos de referencia que Policía Nacional. Consultar convocatoria municipal específica.",
  [OppositionType.BOMBEROS]:
    "Sistema apto / no apto. Pruebas: carreras (60m, 100m, 1000m, 2000m), natación 50m, salto vertical, press de banca, dominadas, circuito de agilidad.",
  [OppositionType.TROPA_MARINERIA]:
    "Sistema apto / no apto. Pruebas: salto vertical, flexiones de brazos, Course Navette.",
  [OppositionType.GUARDIA_CIVIL]:
    "Sistema apto / no apto (BOE convocatoria 2022-2025, grupo <35 años). Pruebas: circuito de agilidad, carrera 2000m, flexiones de brazos, natación 50m. Marcas mínimas diferenciadas por sexo y edad.",
};

interface FormState {
  oppositionType: OppositionType;
  testName: string;
  gender: string;
  minValue: string;
  maxValue: string;
  unit: string;
  score: string;
}

const emptyForm = (opType: OppositionType): FormState => ({
  oppositionType: opType,
  testName: "",
  gender: "MALE",
  minValue: "",
  maxValue: "",
  unit: "seconds",
  score: "",
});

const AdminBaremos = () => {
  const { toast } = useToast();
  const [scales, setScales] = useState<PhysicalTestScaleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<OppositionType>(OppositionType.POLICIA_NACIONAL);
  const [selectedGender, setSelectedGender] = useState<string>("MALE");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(selectedType));
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMinValue, setFilterMinValue] = useState("");
  const [filterMaxValue, setFilterMaxValue] = useState("");

  const fetchScales = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<PhysicalTestScaleEntry[]>(`/training/physical-scales?oppositionType=${selectedType}&gender=${selectedGender}`);
      setScales(data || []);
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar los baremos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedGender, toast]);

  useEffect(() => { fetchScales(); }, [fetchScales]);

  // Apply local filters
  const filtered = scales.filter((s) => {
    if (searchQuery && !s.testName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterMinValue && s.maxValue < parseFloat(filterMinValue)) return false;
    if (filterMaxValue && s.minValue > parseFloat(filterMaxValue)) return false;
    return true;
  });

  const grouped = filtered.reduce<Record<string, PhysicalTestScaleEntry[]>>((acc, s) => {
    if (!acc[s.testName]) acc[s.testName] = [];
    acc[s.testName].push(s);
    return acc;
  }, {});

  // Sort each group by score ascending
  Object.values(grouped).forEach((arr) => arr.sort((a, b) => a.score - b.score));

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm(selectedType));
    setForm((f) => ({ ...f, gender: selectedGender }));
    setDialogOpen(true);
  };

  const openEdit = (s: PhysicalTestScaleEntry) => {
    setEditingId(s.id);
    setForm({
      oppositionType: s.oppositionType as OppositionType,
      testName: s.testName,
      gender: s.gender,
      minValue: String(s.minValue),
      maxValue: String(s.maxValue),
      unit: s.unit,
      score: String(s.score),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.testName || !form.minValue || !form.maxValue || !form.score) {
      toast({ title: "Campos requeridos", description: "Rellena todos los campos", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const body = {
        oppositionType: form.oppositionType,
        testName: form.testName,
        gender: form.gender,
        minValue: parseFloat(form.minValue),
        maxValue: parseFloat(form.maxValue),
        unit: form.unit,
        score: parseInt(form.score),
      };
      if (editingId) {
        await api.put(`/training/physical-scales/${editingId}`, body);
        toast({ title: "Baremo actualizado" });
      } else {
        await api.post("/training/physical-scales", body);
        toast({ title: "Baremo creado" });
      }
      setDialogOpen(false);
      await fetchScales();
    } catch {
      toast({ title: "Error", description: "No se pudo guardar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este baremo?")) return;
    try {
      await api.delete(`/training/physical-scales/${id}`);
      toast({ title: "Baremo eliminado" });
      await fetchScales();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="h-6 w-6 text-accent" /> Baremos Oficiales
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Gestiona las tablas de puntuación por oposición</p>
          </div>
          <Button onClick={openCreate} className="gap-2 glow-primary-sm">
            <Plus className="h-4 w-4" /> Nuevo baremo
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-end">
          <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as OppositionType)}>
            <TabsList className="bg-muted border border-border">
              {OPPOSITION_TYPES.map((t) => (
                <TabsTrigger key={t} value={t} className="text-xs data-[state=active]:bg-card data-[state=active]:text-primary">
                  {oppositionTypeLabels[t]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="flex gap-2">
            {GENDERS.map((g) => (
              <Button
                key={g}
                variant={selectedGender === g ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedGender(g)}
              >
                {genderLabel(g)}
              </Button>
            ))}
          </div>
        </div>

        {/* Search & value range */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar prueba..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background border-border"
            />
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="0.01"
              placeholder="Valor mín"
              value={filterMinValue}
              onChange={(e) => setFilterMinValue(e.target.value)}
              className="w-28 bg-background border-border text-sm"
            />
            <span className="text-muted-foreground text-xs">–</span>
            <Input
              type="number"
              step="0.01"
              placeholder="Valor máx"
              value={filterMaxValue}
              onChange={(e) => setFilterMaxValue(e.target.value)}
              className="w-28 bg-background border-border text-sm"
            />
          </div>
          {(searchQuery || filterMinValue || filterMaxValue) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1 text-muted-foreground"
              onClick={() => { setSearchQuery(""); setFilterMinValue(""); setFilterMaxValue(""); }}
            >
              <X className="h-3.5 w-3.5" /> Limpiar
            </Button>
          )}
        </div>

        {/* Results count */}
        {!loading && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {filtered.length} baremo{filtered.length !== 1 ? "s" : ""} en {Object.keys(grouped).length} prueba{Object.keys(grouped).length !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-muted-foreground/70 italic">
              {oppositionDescriptions[selectedType]}
            </p>
          </div>
        )}

        {/* Scales list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No hay baremos para esta combinación</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([testName, entries]) => (
              <Card key={testName} className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-foreground flex items-center gap-2">
                    {testName}
                    <Badge variant="outline" className="text-[10px]">{entries[0].unit}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-3 py-2 text-left text-xs text-muted-foreground font-medium">Puntos</th>
                          <th className="px-3 py-2 text-left text-xs text-muted-foreground font-medium">Mín</th>
                          <th className="px-3 py-2 text-left text-xs text-muted-foreground font-medium">Máx</th>
                          <th className="px-3 py-2 text-right text-xs text-muted-foreground font-medium">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map((s) => (
                          <tr key={s.id} className="border-t border-border/50">
                            <td className="px-3 py-2 font-bold text-primary">{s.score}</td>
                            <td className="px-3 py-2 text-foreground">{s.minValue}</td>
                            <td className="px-3 py-2 text-foreground">{s.maxValue}</td>
                            <td className="px-3 py-2 text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(s.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar baremo" : "Nuevo baremo"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Oposición</Label>
                  <Select value={form.oppositionType} onValueChange={(v) => setForm({ ...form, oppositionType: v as OppositionType })}>
                    <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {OPPOSITION_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{oppositionTypeLabels[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Género</Label>
                  <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                    <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GENDERS.map((g) => (
                        <SelectItem key={g} value={g}>{genderLabel(g)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nombre de la prueba</Label>
                <Input value={form.testName} onChange={(e) => setForm({ ...form, testName: e.target.value })} placeholder="Ej: Carrera 1000m" className="bg-background border-border" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Valor mín</Label>
                  <Input type="number" step="0.01" value={form.minValue} onChange={(e) => setForm({ ...form, minValue: e.target.value })} className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Valor máx</Label>
                  <Input type="number" step="0.01" value={form.maxValue} onChange={(e) => setForm({ ...form, maxValue: e.target.value })} className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Puntuación</Label>
                  <Input type="number" min="0" max="10" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} className="bg-background border-border" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Unidad</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seconds">Segundos</SelectItem>
                    <SelectItem value="reps">Repeticiones</SelectItem>
                    <SelectItem value="cm">Centímetros</SelectItem>
                    <SelectItem value="kg">Kilogramos</SelectItem>
                    <SelectItem value="periods">Periodos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
                <Save className="h-4 w-4" />
                {saving ? "Guardando..." : editingId ? "Actualizar" : "Crear baremo"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminBaremos;