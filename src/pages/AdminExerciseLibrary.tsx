import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Library, Dumbbell, Target, Plus, Trash2, Search, Pencil, ChevronDown, Layers, Apple, Leaf, Pill, Footprints, Activity, Trophy } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useExerciseLibraryStore, type ExerciseLibraryItem } from "@/data/useExerciseLibraryStore";
import { useNutritionPlanStore, type ApiSupplement } from "@/data/useNutritionPlanStore";
import { OppositionType, oppositionTypeLabels } from "@/types/api";
import { extractYouTubeId } from "@/utils/youtube";

const MUSCLE_GROUPS = [
  "Pierna", "Posterior", "Glúteo", "Pecho", "Hombro",
  "Espalda", "Brazos", "Core", "Prehab",
];

// Opposition kinds and units
type OppKind = "RUNNING" | "RUNNING_TECHNIQUE" | "OFFICIAL_TEST";
const OPP_KIND_LABEL: Record<OppKind, string> = {
  RUNNING: "Carrera",
  RUNNING_TECHNIQUE: "Técnica de carrera",
  OFFICIAL_TEST: "Prueba oficial",
};
const OPP_UNITS: { value: string; label: string }[] = [
  { value: "seconds", label: "Segundos" },
  { value: "minutes", label: "Minutos" },
  { value: "meters", label: "Metros" },
  { value: "reps", label: "Repeticiones" },
  { value: "periods", label: "Periodos (Course-Navette)" },
  { value: "cm", label: "Centímetros" },
  { value: "kg", label: "Kilogramos" },
];
const ALL_OPPOSITIONS: OppositionType[] = [
  OppositionType.POLICIA_NACIONAL,
  OppositionType.POLICIA_LOCAL,
  OppositionType.BOMBEROS,
  OppositionType.TROPA_MARINERIA,
  OppositionType.GUARDIA_CIVIL,
];

const parseOppositionTypes = (raw?: string | null): OppositionType[] => {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as OppositionType[]) : [];
  } catch { return []; }
};

// ==================== ADD DIALOG ====================

const AddExerciseDialog = ({ mode }: { mode: "basico" | "variante" | "accesorio" }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [parentId, setParentId] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const { toast } = useToast();

  const allExercises = useExerciseLibraryStore((s) => s.exercises);
  const basics = allExercises.filter((e) => e.category === "basico");
  const addExercise = useExerciseLibraryStore((s) => s.addExercise);

  const handleAdd = async () => {
    if (!name.trim()) return;
    const trimmed = name.trim();
    if (allExercises.some((e) => e.category === mode && e.name.toLowerCase() === trimmed.toLowerCase())) {
      toast({ title: "Duplicado", description: `"${trimmed}" ya existe en esta categoría.`, variant: "destructive" });
      return;
    }
    const ytUrl = videoUrl.trim();
    if (ytUrl && !extractYouTubeId(ytUrl)) {
      toast({ title: "URL inválida", description: "Pega un enlace de YouTube válido.", variant: "destructive" });
      return;
    }
    await addExercise({
      name: trimmed,
      category: mode,
      muscleGroup: muscleGroup || undefined,
      parentExerciseId: mode === "variante" && parentId ? parentId : undefined,
      videoUrl: ytUrl || null,
    });
    toast({ title: "Ejercicio añadido", description: `"${trimmed}" añadido a la biblioteca.` });
    setName(""); setMuscleGroup(""); setParentId(""); setVideoUrl(""); setOpen(false);
  };

  const title = mode === "basico" ? "Nuevo básico" : mode === "variante" ? "Nueva variante" : "Nuevo accesorio";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={(e) => e.stopPropagation()}>
          <Plus className="h-3.5 w-3.5" /> Añadir
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Nombre del ejercicio</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Sentadilla Zercher" className="bg-background border-border" />
          </div>
          {mode === "variante" && (
            <div className="space-y-2">
              <Label>Variante de</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Seleccionar básico" /></SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  {basics.map((b) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Grupo muscular</Label>
            <Select value={muscleGroup} onValueChange={setMuscleGroup}>
              <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Seleccionar grupo" /></SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                {MUSCLE_GROUPS.map((g) => (<SelectItem key={g} value={g}>{g}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Vídeo de YouTube (opcional)</Label>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtu.be/..."
              className="bg-background border-border"
            />
            <p className="text-[11px] text-muted-foreground">Si añades un enlace, el cliente verá un icono ℹ️ para ver la técnica.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={!name.trim()}>Añadir</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ==================== EDIT DIALOG ====================

const EditExerciseDialog = ({ exercise }: { exercise: ExerciseLibraryItem }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(exercise.name);
  const [muscleGroup, setMuscleGroup] = useState(exercise.muscleGroup || "");
  const [parentId, setParentId] = useState(exercise.parentExerciseId || "");
  const [videoUrl, setVideoUrl] = useState(exercise.videoUrl || "");
  const { toast } = useToast();

  const allExercises = useExerciseLibraryStore((s) => s.exercises);
  const basics = allExercises.filter((e) => e.category === "basico" && e.id !== exercise.id);
  const updateExercise = useExerciseLibraryStore((s) => s.updateExercise);

  const handleSave = async () => {
    if (!name.trim()) return;
    const trimmed = name.trim();
    if (allExercises.some((e) => e.id !== exercise.id && e.category === exercise.category && e.name.toLowerCase() === trimmed.toLowerCase())) {
      toast({ title: "Duplicado", description: `"${trimmed}" ya existe en esta categoría.`, variant: "destructive" });
      return;
    }
    const ytUrl = videoUrl.trim();
    if (ytUrl && !extractYouTubeId(ytUrl)) {
      toast({ title: "URL inválida", description: "Pega un enlace de YouTube válido.", variant: "destructive" });
      return;
    }
    await updateExercise(exercise.id, {
      name: trimmed,
      muscleGroup: muscleGroup || undefined,
      parentExerciseId: exercise.category === "variante" && parentId ? parentId : undefined,
      videoUrl: ytUrl ? ytUrl : null,
    });
    toast({ title: "Ejercicio actualizado", description: `"${trimmed}" guardado.` });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) { setName(exercise.name); setMuscleGroup(exercise.muscleGroup || ""); setParentId(exercise.parentExerciseId || ""); setVideoUrl(exercise.videoUrl || ""); } }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader><DialogTitle>Editar ejercicio</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-background border-border" />
          </div>
          {exercise.category === "variante" && (
            <div className="space-y-2">
              <Label>Variante de</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Seleccionar básico" /></SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  {basics.map((b) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Grupo muscular</Label>
            <Select value={muscleGroup} onValueChange={setMuscleGroup}>
              <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Seleccionar grupo" /></SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                {MUSCLE_GROUPS.map((g) => (<SelectItem key={g} value={g}>{g}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Vídeo de YouTube (opcional)</Label>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtu.be/..."
              className="bg-background border-border"
            />
            <p className="text-[11px] text-muted-foreground">Déjalo vacío para ocultar el icono de vídeo al cliente.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!name.trim()}>Guardar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ==================== EXERCISE TABLE ====================

const ExerciseTable = ({
  items,
  onRemove,
  showParent,
}: {
  items: ExerciseLibraryItem[];
  onRemove: (id: string) => void;
  showParent?: boolean;
}) => {
  const exercises = useExerciseLibraryStore((s) => s.exercises);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground">Ejercicio</TableHead>
            <TableHead className="text-muted-foreground">Grupo muscular</TableHead>
            {showParent && <TableHead className="text-muted-foreground">Variante de</TableHead>}
            <TableHead className="text-muted-foreground w-20"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="border-border/50 hover:bg-muted/30">
              <TableCell className="font-medium text-foreground">{item.name}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{item.muscleGroup || "—"}</TableCell>
              {showParent && (
                <TableCell className="text-muted-foreground text-sm">
                  {item.parentExerciseId ? exercises.find((e) => e.id === item.parentExerciseId)?.name || "—" : "—"}
                </TableCell>
              )}
              <TableCell>
                <div className="flex items-center gap-1">
                  <EditExerciseDialog exercise={item} />
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={() => onRemove(item.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={showParent ? 4 : 3} className="text-center text-muted-foreground py-8">
                No hay ejercicios en esta categoría
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

// ==================== COLLAPSIBLE SECTION ====================

const ExerciseSection = ({
  icon: Icon,
  iconClass,
  title,
  items,
  mode,
  onRemove,
  showParent,
  defaultOpen = false,
}: {
  icon: typeof Dumbbell;
  iconClass: string;
  title: string;
  items: ExerciseLibraryItem[];
  mode: "basico" | "variante" | "accesorio";
  onRemove: (id: string) => void;
  showParent?: boolean;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-3">
            <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.2, ease: "easeInOut" }}>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
            <Icon className={`h-5 w-5 ${iconClass}`} />
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <Badge variant="outline" className="text-xs">{items.length}</Badge>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <AddExerciseDialog mode={mode} />
          </div>
        </CollapsibleTrigger>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="border-t border-border">
                <ExerciseTable items={items} onRemove={onRemove} showParent={showParent} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Collapsible>
  );
};

// ==================== FOOD TABLE SECTION ====================

const FoodTableSection = ({
  icon: Icon,
  iconClass,
  title,
  items,
  onAdd,
  onRemove,
  onEdit,
  defaultOpen = false,
}: {
  icon: typeof Apple;
  iconClass: string;
  title: string;
  items: string[];
  onAdd: (name: string) => void;
  onRemove: (index: number) => void;
  onEdit: (index: number, name: string) => void;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const [newItem, setNewItem] = useState("");
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editVal, setEditVal] = useState("");

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-3">
            <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.2, ease: "easeInOut" }}>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
            <Icon className={`h-5 w-5 ${iconClass}`} />
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <Badge variant="outline" className="text-xs">{items.length}</Badge>
          </div>
        </CollapsibleTrigger>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="border-t border-border p-4 space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nuevo alimento..."
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    className="bg-background border-border text-sm h-8"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newItem.trim()) {
                        onAdd(newItem.trim());
                        setNewItem("");
                      }
                    }}
                  />
                  <Button
                    size="sm" variant="outline" className="h-8 text-xs gap-1"
                    disabled={!newItem.trim()}
                    onClick={() => { onAdd(newItem.trim()); setNewItem(""); }}
                  >
                    <Plus className="h-3 w-3" /> Añadir
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 max-h-[400px] overflow-y-auto">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-background/50 border border-border/50 rounded-lg px-3 py-1.5 text-sm group">
                      {editIdx === idx ? (
                        <Input
                          value={editVal}
                          onChange={(e) => setEditVal(e.target.value)}
                          className="h-6 text-xs bg-background border-border flex-1"
                          autoFocus
                          onBlur={() => { if (editVal.trim()) onEdit(idx, editVal.trim()); setEditIdx(null); }}
                          onKeyDown={(e) => { if (e.key === "Enter") { if (editVal.trim()) onEdit(idx, editVal.trim()); setEditIdx(null); } }}
                        />
                      ) : (
                        <>
                          <span className="flex-1 text-foreground truncate">{item}</span>
                          <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground" onClick={() => { setEditIdx(idx); setEditVal(item); }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive/60 hover:text-destructive" onClick={() => onRemove(idx)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Collapsible>
  );
};

// ==================== SUPPLEMENT SECTION ====================

const SupplementSection = ({
  supplements,
  onAdd,
  onEdit,
  onRemove,
}: {
  supplements: ApiSupplement[];
  onAdd: (name: string, dose: string, timing: string) => void;
  onEdit: (id: string, name: string, dose: string, timing: string) => void;
  onRemove: (id: string) => void;
}) => {
  const [newName, setNewName] = useState("");
  const [newDose, setNewDose] = useState("");
  const [newTiming, setNewTiming] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDose, setEditDose] = useState("");
  const [editTiming, setEditTiming] = useState("");

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd(newName.trim(), newDose.trim(), newTiming.trim());
    setNewName("");
    setNewDose("");
    setNewTiming("");
  };

  const handleSaveEdit = () => {
    if (editId && editName.trim()) {
      onEdit(editId, editName.trim(), editDose.trim(), editTiming.trim());
      setEditId(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <Pill className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Suplementos Recomendados</h2>
          <Badge variant="outline" className="text-xs">{supplements.length}</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <Input
            placeholder="Nombre..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="bg-background border-border text-sm h-9"
          />
          <Input
            placeholder="Dosis..."
            value={newDose}
            onChange={(e) => setNewDose(e.target.value)}
            className="bg-background border-border text-sm h-9"
          />
          <Input
            placeholder="Cuándo..."
            value={newTiming}
            onChange={(e) => setNewTiming(e.target.value)}
            className="bg-background border-border text-sm h-9"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button
            size="sm"
            variant="outline"
            className="h-9 text-xs gap-1"
            disabled={!newName.trim()}
            onClick={handleAdd}
          >
            <Plus className="h-3.5 w-3.5" /> Añadir
          </Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="text-xs font-medium">Suplemento</TableHead>
            <TableHead className="text-xs font-medium">Dosis</TableHead>
            <TableHead className="text-xs font-medium">Cuándo</TableHead>
            <TableHead className="text-xs font-medium w-[80px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {supplements.map((sup) => (
            <TableRow key={sup.id} className="group">
              {editId === sup.id ? (
                <>
                  <TableCell>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-7 text-xs bg-background border-border"
                      autoFocus
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={editDose}
                      onChange={(e) => setEditDose(e.target.value)}
                      className="h-7 text-xs bg-background border-border"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={editTiming}
                      onChange={(e) => setEditTiming(e.target.value)}
                      className="h-7 text-xs bg-background border-border"
                      onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleSaveEdit}>
                        Guardar
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditId(null)}>
                        ✕
                      </Button>
                    </div>
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell className="text-sm text-foreground font-medium">{sup.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{sup.dose}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{sup.timing}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setEditId(sup.id);
                          setEditName(sup.name);
                          setEditDose(sup.dose);
                          setEditTiming(sup.timing);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive/60 hover:text-destructive"
                        onClick={() => onRemove(sup.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
          {supplements.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground text-sm py-8">
                No hay suplementos. Añade uno arriba.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

// ==================== MAIN PAGE ====================

// ==================== OPPOSITION DIALOGS ====================

const OppositionForm = ({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial?: { name: string; kind: OppKind; oppositionTypes: OppositionType[]; defaultUnit: string };
  onSubmit: (v: { name: string; kind: OppKind; oppositionTypes: OppositionType[]; defaultUnit: string }) => void;
  onCancel: () => void;
  submitLabel: string;
}) => {
  const [name, setName] = useState(initial?.name ?? "");
  const [kind, setKind] = useState<OppKind>(initial?.kind ?? "RUNNING");
  const [opps, setOpps] = useState<OppositionType[]>(initial?.oppositionTypes ?? [...ALL_OPPOSITIONS]);
  const [unit, setUnit] = useState<string>(initial?.defaultUnit ?? "seconds");

  const toggleOpp = (o: OppositionType) =>
    setOpps((prev) => (prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]));

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label>Nombre</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Series 800 m" className="bg-background border-border" />
      </div>
      <div className="space-y-2">
        <Label>Tipo</Label>
        <Select value={kind} onValueChange={(v) => setKind(v as OppKind)}>
          <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-card border-border z-50">
            {(Object.keys(OPP_KIND_LABEL) as OppKind[]).map((k) => (
              <SelectItem key={k} value={k}>{OPP_KIND_LABEL[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Oposiciones</Label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_OPPOSITIONS.map((o) => {
            const active = opps.includes(o);
            return (
              <button
                key={o}
                type="button"
                onClick={() => toggleOpp(o)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                  active
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                }`}
              >
                {oppositionTypeLabels[o]}
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Unidad por defecto {kind === "OFFICIAL_TEST" ? "(para baremo)" : "(referencia)"}</Label>
        <Select value={unit} onValueChange={setUnit}>
          <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-card border-border z-50">
            {OPP_UNITS.map((u) => (<SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button
          onClick={() => onSubmit({ name: name.trim(), kind, oppositionTypes: opps, defaultUnit: unit })}
          disabled={!name.trim() || opps.length === 0}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
};

const AddOppositionDialog = ({ defaultKind }: { defaultKind: OppKind }) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const allExercises = useExerciseLibraryStore((s) => s.exercises);
  const addExercise = useExerciseLibraryStore((s) => s.addExercise);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={(e) => e.stopPropagation()}>
          <Plus className="h-3.5 w-3.5" /> Añadir
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader><DialogTitle>Nuevo ejercicio de oposición</DialogTitle></DialogHeader>
        {open && (
          <OppositionForm
            initial={{ name: "", kind: defaultKind, oppositionTypes: [...ALL_OPPOSITIONS], defaultUnit: defaultKind === "OFFICIAL_TEST" ? "seconds" : "minutes" }}
            submitLabel="Añadir"
            onCancel={() => setOpen(false)}
            onSubmit={async ({ name, kind, oppositionTypes, defaultUnit }) => {
              if (allExercises.some((e) => (e.kind || "") === kind && e.name.toLowerCase() === name.toLowerCase())) {
                toast({ title: "Duplicado", description: `"${name}" ya existe en esta categoría.`, variant: "destructive" });
                return;
              }
              await addExercise({
                name,
                // Persist as ACCESSORY for non-test items; tests as BASIC to mirror seed conventions.
                category: "accesorio",
                muscleGroup: kind === "RUNNING" ? "Cardio" : kind === "RUNNING_TECHNIQUE" ? "Técnica" : "Prueba oficial",
                kind,
                oppositionTypes: JSON.stringify(oppositionTypes),
                defaultUnit,
              });
              toast({ title: "Ejercicio añadido", description: `"${name}" añadido a la biblioteca.` });
              setOpen(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

const EditOppositionDialog = ({ exercise }: { exercise: ExerciseLibraryItem }) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const updateExercise = useExerciseLibraryStore((s) => s.updateExercise);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader><DialogTitle>Editar ejercicio de oposición</DialogTitle></DialogHeader>
        {open && (
          <OppositionForm
            initial={{
              name: exercise.name,
              kind: (exercise.kind as OppKind) || "RUNNING",
              oppositionTypes: parseOppositionTypes(exercise.oppositionTypes),
              defaultUnit: exercise.defaultUnit || "seconds",
            }}
            submitLabel="Guardar"
            onCancel={() => setOpen(false)}
            onSubmit={async ({ name, kind, oppositionTypes, defaultUnit }) => {
              await updateExercise(exercise.id, {
                name,
                kind,
                oppositionTypes: JSON.stringify(oppositionTypes),
                defaultUnit,
              });
              toast({ title: "Ejercicio actualizado", description: `"${name}" guardado.` });
              setOpen(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

const OppositionSection = ({
  icon: Icon,
  iconClass,
  title,
  kind,
  items,
  onRemove,
}: {
  icon: typeof Footprints;
  iconClass: string;
  title: string;
  kind: OppKind;
  items: ExerciseLibraryItem[];
  onRemove: (id: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-3">
            <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.2, ease: "easeInOut" }}>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
            <Icon className={`h-5 w-5 ${iconClass}`} />
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <Badge variant="outline" className="text-xs">{items.length}</Badge>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <AddOppositionDialog defaultKind={kind} />
          </div>
        </CollapsibleTrigger>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="border-t border-border">
                <div className="bg-card overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">Ejercicio</TableHead>
                        <TableHead className="text-muted-foreground">Oposiciones</TableHead>
                        <TableHead className="text-muted-foreground">Unidad</TableHead>
                        <TableHead className="text-muted-foreground w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => {
                        const opps = parseOppositionTypes(item.oppositionTypes);
                        return (
                          <TableRow key={item.id} className="border-border/50 hover:bg-muted/30">
                            <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              <div className="flex flex-wrap gap-1">
                                {opps.length === 0 && <span>—</span>}
                                {opps.map((o) => (
                                  <Badge key={o} variant="outline" className="text-[10px]">{oppositionTypeLabels[o]}</Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{item.defaultUnit || "—"}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <EditOppositionDialog exercise={item} />
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={() => onRemove(item.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {items.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No hay ejercicios en esta categoría
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Collapsible>
  );
};

const AdminExerciseLibrary = () => {
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const exercises = useExerciseLibraryStore((s) => s.exercises);
  const fetchExercises = useExerciseLibraryStore((s) => s.fetchExercises);
  const fetchFoods = useExerciseLibraryStore((s) => s.fetchFoods);
  const removeExercise = useExerciseLibraryStore((s) => s.removeExercise);
  const fruits = useExerciseLibraryStore((s) => s.fruits);
  const vegetables = useExerciseLibraryStore((s) => s.vegetables);
  const addFruit = useExerciseLibraryStore((s) => s.addFruit);
  const removeFruit = useExerciseLibraryStore((s) => s.removeFruit);
  const editFruit = useExerciseLibraryStore((s) => s.editFruit);
  const addVegetable = useExerciseLibraryStore((s) => s.addVegetable);
  const removeVegetable = useExerciseLibraryStore((s) => s.removeVegetable);
  const editVegetable = useExerciseLibraryStore((s) => s.editVegetable);

  // Supplements
  const supplements = useNutritionPlanStore((s) => s.supplements);
  const fetchSupplements = useNutritionPlanStore((s) => s.fetchSupplements);
  const createSupplement = useNutritionPlanStore((s) => s.createSupplement);
  const updateSupplementApi = useNutritionPlanStore((s) => s.updateSupplementApi);
  const deleteSupplementApi = useNutritionPlanStore((s) => s.deleteSupplementApi);

  useEffect(() => {
    fetchExercises();
    fetchFoods();
    fetchSupplements();
  }, [fetchExercises, fetchFoods, fetchSupplements]);

  const handleRemove = async (id: string) => {
    const ex = exercises.find((e) => e.id === id);
    if (ex) {
      await removeExercise(id);
      toast({ title: "Ejercicio eliminado", description: `"${ex.name}" eliminado de la biblioteca.` });
    }
  };

  const ls = search.toLowerCase();
  const match = (e: ExerciseLibraryItem) =>
    e.name.toLowerCase().includes(ls) || (e.muscleGroup || "").toLowerCase().includes(ls);

  const isGym = (e: ExerciseLibraryItem) => !e.kind || e.kind === "GYM";
  const isOppKind = (e: ExerciseLibraryItem, k: OppKind) => (e.kind || "") === k;
  const basics = exercises.filter((e) => e.category === "basico" && isGym(e) && match(e));
  const variants = exercises.filter((e) => e.category === "variante" && isGym(e) && match(e));
  const accessories = exercises.filter((e) => e.category === "accesorio" && isGym(e) && match(e));
  const runs = exercises.filter((e) => isOppKind(e, "RUNNING") && match(e));
  const techs = exercises.filter((e) => isOppKind(e, "RUNNING_TECHNIQUE") && match(e));
  const tests = exercises.filter((e) => isOppKind(e, "OFFICIAL_TEST") && match(e));

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Library className="h-6 w-6 text-primary" />
            Biblioteca
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestiona ejercicios, alimentos y suplementos disponibles para tus planes
          </p>
        </div>

        <Tabs defaultValue="exercises" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="exercises" className="gap-1.5"><Dumbbell className="h-4 w-4" /> Ejercicios</TabsTrigger>
            <TabsTrigger value="foods" className="gap-1.5"><Apple className="h-4 w-4" /> Alimentos</TabsTrigger>
            <TabsTrigger value="supplements" className="gap-1.5"><Pill className="h-4 w-4" /> Suplementos</TabsTrigger>
          </TabsList>

          {/* ======= EXERCISES TAB ======= */}
          <TabsContent value="exercises" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Dumbbell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{exercises.filter((e) => e.category === "basico").length}</p>
                  <p className="text-xs text-muted-foreground">Básicos</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-accent/15 flex items-center justify-center">
                  <Layers className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{exercises.filter((e) => e.category === "variante").length}</p>
                  <p className="text-xs text-muted-foreground">Variantes</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <Target className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{exercises.filter((e) => e.category === "accesorio").length}</p>
                  <p className="text-xs text-muted-foreground">Accesorios</p>
                </div>
              </div>
            </div>

            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nombre o grupo muscular..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
            </div>

            <div className="space-y-4">
              <ExerciseSection icon={Dumbbell} iconClass="text-primary" title="Básicos" items={basics} mode="basico" onRemove={handleRemove} />
              <ExerciseSection icon={Layers} iconClass="text-accent" title="Variantes" items={variants} mode="variante" onRemove={handleRemove} showParent />
              <ExerciseSection icon={Target} iconClass="text-muted-foreground" title="Accesorios" items={accessories} mode="accesorio" onRemove={handleRemove} />
              <div className="pt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Oposiciones</p>
                <div className="space-y-4">
                  <OppositionSection icon={Footprints} iconClass="text-sky-400" title="Carrera" kind="RUNNING" items={runs} onRemove={handleRemove} />
                  <OppositionSection icon={Activity} iconClass="text-violet-400" title="Técnica de carrera" kind="RUNNING_TECHNIQUE" items={techs} onRemove={handleRemove} />
                  <OppositionSection icon={Trophy} iconClass="text-amber-400" title="Pruebas oficiales" kind="OFFICIAL_TEST" items={tests} onRemove={handleRemove} />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ======= FOODS TAB ======= */}
          <TabsContent value="foods" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Apple className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{fruits.length}</p>
                  <p className="text-xs text-muted-foreground">Frutas</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-accent/15 flex items-center justify-center">
                  <Leaf className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{vegetables.length}</p>
                  <p className="text-xs text-muted-foreground">Verduras</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <FoodTableSection
                icon={Apple}
                iconClass="text-primary"
                title="Tabla 01 — Frutas"
                items={fruits}
                onAdd={(name) => {
                  if (fruits.some((f) => f.toLowerCase() === name.toLowerCase())) {
                    toast({ title: "Duplicado", description: `"${name}" ya existe en frutas.`, variant: "destructive" });
                    return;
                  }
                  addFruit(name); toast({ title: "Fruta añadida", description: `"${name}" añadida.` });
                }}
                onRemove={(idx) => { const name = fruits[idx]; removeFruit(idx); toast({ title: "Fruta eliminada", description: `"${name}" eliminada.` }); }}
                onEdit={(idx, name) => {
                  if (fruits.some((f, i) => i !== idx && f.toLowerCase() === name.toLowerCase())) {
                    toast({ title: "Duplicado", description: `"${name}" ya existe en frutas.`, variant: "destructive" });
                    return;
                  }
                  editFruit(idx, name);
                }}
              />
              <FoodTableSection
                icon={Leaf}
                iconClass="text-accent"
                title="Tabla 02 — Verduras"
                items={vegetables}
                onAdd={(name) => {
                  if (vegetables.some((v) => v.toLowerCase() === name.toLowerCase())) {
                    toast({ title: "Duplicado", description: `"${name}" ya existe en verduras.`, variant: "destructive" });
                    return;
                  }
                  addVegetable(name); toast({ title: "Verdura añadida", description: `"${name}" añadida.` });
                }}
                onRemove={(idx) => { const name = vegetables[idx]; removeVegetable(idx); toast({ title: "Verdura eliminada", description: `"${name}" eliminada.` }); }}
                onEdit={(idx, name) => {
                  if (vegetables.some((v, i) => i !== idx && v.toLowerCase() === name.toLowerCase())) {
                    toast({ title: "Duplicado", description: `"${name}" ya existe en verduras.`, variant: "destructive" });
                    return;
                  }
                  editVegetable(idx, name);
                }}
              />
            </div>
          </TabsContent>

          {/* ======= SUPPLEMENTS TAB ======= */}
          <TabsContent value="supplements" className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 max-w-xs">
              <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
                <Pill className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{supplements.length}</p>
                <p className="text-xs text-muted-foreground">Suplementos</p>
              </div>
            </div>

            <SupplementSection
              supplements={supplements}
              onAdd={async (name, dose, timing) => {
                if (supplements.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
                  toast({ title: "Duplicado", description: `"${name}" ya existe.`, variant: "destructive" });
                  return;
                }
                await createSupplement({ name, dose, timing });
                toast({ title: "Suplemento añadido", description: `"${name}" añadido.` });
              }}
              onEdit={async (id, name, dose, timing) => {
                await updateSupplementApi(id, { name, dose, timing });
                toast({ title: "Suplemento actualizado", description: `"${name}" actualizado.` });
              }}
              onRemove={async (id) => {
                const sup = supplements.find((s) => s.id === id);
                await deleteSupplementApi(id);
                toast({ title: "Suplemento eliminado", description: `"${sup?.name}" eliminado.` });
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminExerciseLibrary;
