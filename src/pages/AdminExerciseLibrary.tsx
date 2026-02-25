import { useState } from "react";
import { Library, Dumbbell, Target, Plus, Trash2, Search, Pencil, ChevronDown, ChevronRight, Layers } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  exerciseLibrary,
  addExerciseToLibrary,
  type ExerciseLibraryItem,
} from "@/data/trainingPlanStore";

const MUSCLE_GROUPS = [
  "Pierna", "Posterior", "Glúteo", "Pecho", "Hombro",
  "Espalda", "Brazos", "Core", "Prehab",
];

// ==================== ADD DIALOG ====================

const AddExerciseDialog = ({
  mode,
  onAdded,
}: {
  mode: "basico" | "variante" | "accesorio";
  onAdded: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [parentId, setParentId] = useState("");
  const { toast } = useToast();

  const basics = exerciseLibrary.filter((e) => e.category === "basico");

  const handleAdd = () => {
    if (!name.trim()) return;
    addExerciseToLibrary({
      name: name.trim(),
      category: mode,
      muscleGroup: muscleGroup || undefined,
      parentExerciseId: mode === "variante" && parentId ? parentId : undefined,
    });
    toast({ title: "Ejercicio añadido", description: `"${name.trim()}" añadido a la biblioteca.` });
    setName("");
    setMuscleGroup("");
    setParentId("");
    setOpen(false);
    onAdded();
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
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
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

const EditExerciseDialog = ({
  exercise,
  onSaved,
}: {
  exercise: ExerciseLibraryItem;
  onSaved: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(exercise.name);
  const [muscleGroup, setMuscleGroup] = useState(exercise.muscleGroup || "");
  const [parentId, setParentId] = useState(exercise.parentExerciseId || "");
  const { toast } = useToast();

  const basics = exerciseLibrary.filter((e) => e.category === "basico" && e.id !== exercise.id);

  const handleSave = () => {
    if (!name.trim()) return;
    const idx = exerciseLibrary.findIndex((e) => e.id === exercise.id);
    if (idx >= 0) {
      exerciseLibrary[idx] = {
        ...exerciseLibrary[idx],
        name: name.trim(),
        muscleGroup: muscleGroup || undefined,
        parentExerciseId: exercise.category === "variante" && parentId ? parentId : undefined,
      };
      toast({ title: "Ejercicio actualizado", description: `"${name.trim()}" guardado.` });
      setOpen(false);
      onSaved();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) { setName(exercise.name); setMuscleGroup(exercise.muscleGroup || ""); setParentId(exercise.parentExerciseId || ""); } }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>Editar ejercicio</DialogTitle>
        </DialogHeader>
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
  onEdit,
  showParent,
}: {
  items: ExerciseLibraryItem[];
  onRemove: (id: string) => void;
  onEdit: () => void;
  showParent?: boolean;
}) => (
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
                {item.parentExerciseId ? exerciseLibrary.find((e) => e.id === item.parentExerciseId)?.name || "—" : "—"}
              </TableCell>
            )}
            <TableCell>
              <div className="flex items-center gap-1">
                <EditExerciseDialog exercise={item} onSaved={onEdit} />
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

// ==================== COLLAPSIBLE SECTION ====================

const ExerciseSection = ({
  icon: Icon,
  iconClass,
  title,
  items,
  mode,
  onRemove,
  onRefresh,
  showParent,
  defaultOpen = false,
}: {
  icon: typeof Dumbbell;
  iconClass: string;
  title: string;
  items: ExerciseLibraryItem[];
  mode: "basico" | "variante" | "accesorio";
  onRemove: (id: string) => void;
  onRefresh: () => void;
  showParent?: boolean;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-3">
            {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            <Icon className={`h-5 w-5 ${iconClass}`} />
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <Badge variant="outline" className="text-xs">{items.length}</Badge>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <AddExerciseDialog mode={mode} onAdded={onRefresh} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-border">
            <ExerciseTable items={items} onRemove={onRemove} onEdit={onRefresh} showParent={showParent} />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

// ==================== MAIN PAGE ====================

const AdminExerciseLibrary = () => {
  const [search, setSearch] = useState("");
  const [, forceUpdate] = useState(0);
  const { toast } = useToast();

  const refresh = () => forceUpdate((n) => n + 1);

  const handleRemove = (id: string) => {
    const idx = exerciseLibrary.findIndex((e) => e.id === id);
    if (idx >= 0) {
      const name = exerciseLibrary[idx].name;
      exerciseLibrary.splice(idx, 1);
      toast({ title: "Ejercicio eliminado", description: `"${name}" eliminado de la biblioteca.` });
      refresh();
    }
  };

  const ls = search.toLowerCase();
  const match = (e: ExerciseLibraryItem) =>
    e.name.toLowerCase().includes(ls) || (e.muscleGroup || "").toLowerCase().includes(ls);

  const basics = exerciseLibrary.filter((e) => e.category === "basico" && match(e));
  const variants = exerciseLibrary.filter((e) => e.category === "variante" && match(e));
  const accessories = exerciseLibrary.filter((e) => e.category === "accesorio" && match(e));

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Library className="h-6 w-6 text-primary" />
            Biblioteca de Ejercicios
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestiona los ejercicios disponibles para tus planes de entrenamiento
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{exerciseLibrary.filter((e) => e.category === "basico").length}</p>
              <p className="text-xs text-muted-foreground">Básicos</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-accent/15 flex items-center justify-center">
              <Layers className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{exerciseLibrary.filter((e) => e.category === "variante").length}</p>
              <p className="text-xs text-muted-foreground">Variantes</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <Target className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{exerciseLibrary.filter((e) => e.category === "accesorio").length}</p>
              <p className="text-xs text-muted-foreground">Accesorios</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre o grupo muscular..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>

        {/* 3 collapsible sections */}
        <div className="space-y-4">
          <ExerciseSection icon={Dumbbell} iconClass="text-primary" title="Básicos" items={basics} mode="basico" onRemove={handleRemove} onRefresh={refresh} defaultOpen />
          <ExerciseSection icon={Layers} iconClass="text-accent" title="Variantes" items={variants} mode="variante" onRemove={handleRemove} onRefresh={refresh} showParent />
          <ExerciseSection icon={Target} iconClass="text-muted-foreground" title="Accesorios" items={accessories} mode="accesorio" onRemove={handleRemove} onRefresh={refresh} />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminExerciseLibrary;
