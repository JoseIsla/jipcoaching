import { useState } from "react";
import { Library, Dumbbell, Target, Plus, Trash2, Search } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const AddExerciseDialog = ({
  mode,
  onAdded,
}: {
  mode: "basic" | "accessory";
  onAdded: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"basico" | "variante" | "accesorio">(
    mode === "basic" ? "basico" : "accesorio"
  );
  const [muscleGroup, setMuscleGroup] = useState("");
  const [parentId, setParentId] = useState("");
  const { toast } = useToast();

  const basics = exerciseLibrary.filter((e) => e.category === "basico");

  const handleAdd = () => {
    if (!name.trim()) return;
    addExerciseToLibrary({
      name: name.trim(),
      category,
      muscleGroup: muscleGroup || undefined,
      parentExerciseId: category === "variante" && parentId ? parentId : undefined,
    });
    toast({ title: "Ejercicio añadido", description: `"${name.trim()}" añadido a la biblioteca.` });
    setName("");
    setMuscleGroup("");
    setParentId("");
    setOpen(false);
    onAdded();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> Añadir
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "basic" ? "Nuevo básico / variante" : "Nuevo accesorio"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Nombre del ejercicio</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Sentadilla Zercher"
              className="bg-background border-border"
            />
          </div>

          {mode === "basic" && (
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as "basico" | "variante")}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basico">Básico</SelectItem>
                  <SelectItem value="variante">Variante</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {category === "variante" && (
            <div className="space-y-2">
              <Label>Variante de</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Seleccionar básico" />
                </SelectTrigger>
                <SelectContent>
                  {basics.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Grupo muscular</Label>
            <Select value={muscleGroup} onValueChange={setMuscleGroup}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Seleccionar grupo" />
              </SelectTrigger>
              <SelectContent>
                {MUSCLE_GROUPS.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdd} disabled={!name.trim()}>
              Añadir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ExerciseTable = ({
  items,
  onRemove,
  showParent,
}: {
  items: ExerciseLibraryItem[];
  onRemove: (id: string) => void;
  showParent?: boolean;
}) => (
  <div className="bg-card border border-border rounded-xl overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow className="border-border hover:bg-transparent">
          <TableHead className="text-muted-foreground">Ejercicio</TableHead>
          <TableHead className="text-muted-foreground">Tipo</TableHead>
          <TableHead className="text-muted-foreground">Grupo muscular</TableHead>
          {showParent && (
            <TableHead className="text-muted-foreground">Variante de</TableHead>
          )}
          <TableHead className="text-muted-foreground w-10"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id} className="border-border/50 hover:bg-muted/30">
            <TableCell className="font-medium text-foreground">
              {item.name}
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={
                  item.category === "basico"
                    ? "border-primary/30 text-primary bg-primary/10 text-xs"
                    : item.category === "variante"
                    ? "border-amber-500/30 text-amber-400 bg-amber-500/10 text-xs"
                    : "border-muted-foreground/30 text-muted-foreground text-xs"
                }
              >
                {item.category === "basico"
                  ? "Básico"
                  : item.category === "variante"
                  ? "Variante"
                  : "Accesorio"}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {item.muscleGroup || "—"}
            </TableCell>
            {showParent && (
              <TableCell className="text-muted-foreground text-sm">
                {item.parentExerciseId
                  ? exerciseLibrary.find((e) => e.id === item.parentExerciseId)
                      ?.name || "—"
                  : "—"}
              </TableCell>
            )}
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive/60 hover:text-destructive"
                onClick={() => onRemove(item.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {items.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={showParent ? 5 : 4}
              className="text-center text-muted-foreground py-12"
            >
              No hay ejercicios en esta categoría
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </div>
);

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

  const lowerSearch = search.toLowerCase();
  const basicsVariants = exerciseLibrary.filter(
    (e) =>
      (e.category === "basico" || e.category === "variante") &&
      (e.name.toLowerCase().includes(lowerSearch) ||
        (e.muscleGroup || "").toLowerCase().includes(lowerSearch))
  );
  const accessories = exerciseLibrary.filter(
    (e) =>
      e.category === "accesorio" &&
      (e.name.toLowerCase().includes(lowerSearch) ||
        (e.muscleGroup || "").toLowerCase().includes(lowerSearch))
  );

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
              <p className="text-2xl font-bold text-foreground">
                {exerciseLibrary.filter((e) => e.category === "basico").length}
              </p>
              <p className="text-xs text-muted-foreground">Básicos</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {exerciseLibrary.filter((e) => e.category === "variante").length}
              </p>
              <p className="text-xs text-muted-foreground">Variantes</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-accent/15 flex items-center justify-center">
              <Target className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {exerciseLibrary.filter((e) => e.category === "accesorio").length}
              </p>
              <p className="text-xs text-muted-foreground">Accesorios</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o grupo muscular..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>

        {/* Basics / Variants */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              Básicos / Variantes
              <span className="text-xs font-normal text-muted-foreground ml-1">
                ({basicsVariants.length})
              </span>
            </h2>
            <AddExerciseDialog mode="basic" onAdded={refresh} />
          </div>
          <ExerciseTable
            items={basicsVariants}
            onRemove={handleRemove}
            showParent
          />
        </div>

        {/* Accessories */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Target className="h-5 w-5 text-muted-foreground" />
              Accesorios
              <span className="text-xs font-normal text-muted-foreground ml-1">
                ({accessories.length})
              </span>
            </h2>
            <AddExerciseDialog mode="accessory" onAdded={refresh} />
          </div>
          <ExerciseTable items={accessories} onRemove={handleRemove} />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminExerciseLibrary;
