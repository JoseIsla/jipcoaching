import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, Trash2, GripVertical, Utensils, Save, Apple, Salad,
  Pill, Target, ChevronDown, ChevronUp, X,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  nutritionPlanDetailStore,
  globalFruitTable,
  globalVegetableTable,
  createEmptyMeal,
  createEmptyOption,
  createEmptyRow,
  type NutritionPlanDetail,
  type Meal,
  type MealOption,
  type IngredientRow,
  type Supplement,
} from "@/data/nutritionPlanStore";

// ─── Ingredient Row Editor ───
const RowEditor = ({
  row,
  onUpdate,
  onDelete,
}: {
  row: IngredientRow;
  onUpdate: (r: IngredientRow) => void;
  onDelete: () => void;
}) => {
  const [altText, setAltText] = useState("");

  const addAlt = () => {
    if (!altText.trim()) return;
    onUpdate({ ...row, alternatives: [...row.alternatives, altText.trim()] });
    setAltText("");
  };

  const removeAlt = (i: number) => {
    onUpdate({ ...row, alternatives: row.alternatives.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="bg-muted/20 border border-border/50 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          value={row.mainIngredient}
          onChange={(e) => onUpdate({ ...row, mainIngredient: e.target.value })}
          placeholder="Ingrediente principal (ej: Arroz Blanco 45g)"
          className="bg-background border-border text-sm flex-1"
        />
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      {/* Alternatives */}
      <div className="pl-6 space-y-1.5">
        {row.alternatives.map((alt, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-primary">↳</span>
            <span className="flex-1">{alt}</span>
            <button onClick={() => removeAlt(i)} className="hover:text-destructive transition-colors">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <Input
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAlt())}
            placeholder="Añadir alternativa..."
            className="bg-background border-border text-xs h-7 flex-1"
          />
          <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={addAlt}>
            <Plus className="h-3 w-3 mr-1" />Alt
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Option Editor ───
const OptionEditor = ({
  option,
  onUpdate,
  onDelete,
}: {
  option: MealOption;
  onUpdate: (o: MealOption) => void;
  onDelete: () => void;
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const updateRow = (idx: number, row: IngredientRow) => {
    const rows = [...option.rows];
    rows[idx] = row;
    onUpdate({ ...option, rows });
  };

  const deleteRow = (idx: number) => {
    onUpdate({ ...option, rows: option.rows.filter((_, i) => i !== idx) });
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-3 bg-muted/30 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Input
            value={option.name}
            onChange={(e) => onUpdate({ ...option, name: e.target.value })}
            className="bg-transparent border-none h-7 text-sm font-medium text-foreground w-32 p-0 focus-visible:ring-0"
          />
          <Badge variant="outline" className="text-xs border-primary/30 text-primary">
            {option.rows.length} filas
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {!collapsed && (
        <div className="p-3 space-y-2">
          {option.rows.map((row, i) => (
            <RowEditor key={row.id} row={row} onUpdate={(r) => updateRow(i, r)} onDelete={() => deleteRow(i)} />
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground hover:text-primary border border-dashed border-border"
            onClick={() => onUpdate({ ...option, rows: [...option.rows, createEmptyRow()] })}
          >
            <Plus className="h-3 w-3 mr-1" />Añadir fila de ingrediente
          </Button>
          <div className="pt-1">
            <Input
              value={option.notes ?? ""}
              onChange={(e) => onUpdate({ ...option, notes: e.target.value })}
              placeholder="Notas (ej: 1 porción de Frutas Tabla 01)"
              className="bg-background border-border text-xs h-7"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Meal Editor ───
const MealEditor = ({
  meal,
  onUpdate,
  onDelete,
}: {
  meal: Meal;
  onUpdate: (m: Meal) => void;
  onDelete: () => void;
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const updateOption = (idx: number, opt: MealOption) => {
    const opts = [...meal.options];
    opts[idx] = opt;
    onUpdate({ ...meal, options: opts });
  };

  const deleteOption = (idx: number) => {
    onUpdate({ ...meal, options: meal.options.filter((_, i) => i !== idx) });
  };

  const addOption = () => {
    onUpdate({ ...meal, options: [...meal.options, createEmptyOption(`Opción ${meal.options.length + 1}`)] });
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <Utensils className="h-4 w-4 text-primary" />
          </div>
          <div>
            <Input
              value={meal.name}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onUpdate({ ...meal, name: e.target.value })}
              className="bg-transparent border-none p-0 h-auto text-base font-semibold text-foreground focus-visible:ring-0"
            />
            <p className="text-xs text-muted-foreground">{meal.options.length} opciones</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
          {collapsed ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>
      {!collapsed && (
        <div className="px-4 pb-4 space-y-3">
          <Input
            value={meal.description ?? ""}
            onChange={(e) => onUpdate({ ...meal, description: e.target.value })}
            placeholder="Descripción de la comida (opcional)"
            className="bg-muted/20 border-border text-xs h-8"
          />
          {meal.options.map((opt, i) => (
            <OptionEditor key={opt.id} option={opt} onUpdate={(o) => updateOption(i, o)} onDelete={() => deleteOption(i)} />
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full text-sm border-dashed border-primary/30 text-primary"
            onClick={addOption}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />Añadir opción
          </Button>
        </div>
      )}
    </div>
  );
};

// ─── Supplement Editor ───
const SupplementRow = ({
  sup,
  onUpdate,
  onDelete,
}: {
  sup: Supplement;
  onUpdate: (s: Supplement) => void;
  onDelete: () => void;
}) => (
  <div className="flex items-center gap-2">
    <Input value={sup.name} onChange={(e) => onUpdate({ ...sup, name: e.target.value })} placeholder="Nombre" className="bg-muted/20 border-border text-sm flex-1" />
    <Input value={sup.dose} onChange={(e) => onUpdate({ ...sup, dose: e.target.value })} placeholder="Dosis" className="bg-muted/20 border-border text-sm w-32" />
    <Input value={sup.timing} onChange={(e) => onUpdate({ ...sup, timing: e.target.value })} placeholder="Cuándo" className="bg-muted/20 border-border text-sm w-40" />
    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={onDelete}>
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  </div>
);

// ─── Reference Table Display ───
const ReferenceTable = ({ title, icon, items }: { title: string; icon: React.ReactNode; items: string[] }) => (
  <div className="bg-card border border-border rounded-xl p-4 space-y-3">
    <div className="flex items-center gap-2">
      {icon}
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <Badge key={i} variant="outline" className="text-xs border-border text-muted-foreground font-normal">
          {item}
        </Badge>
      ))}
    </div>
  </div>
);

// ─── Main Page ───
const AdminNutritionPlanDetail = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const stored = planId ? nutritionPlanDetailStore[planId] : undefined;

  const [plan, setPlan] = useState<NutritionPlanDetail | null>(stored ? { ...stored, meals: stored.meals.map((m) => ({ ...m })), supplements: [...stored.supplements] } : null);

  const save = useCallback(() => {
    if (!plan) return;
    nutritionPlanDetailStore[plan.id] = plan;
    toast.success("Plan guardado");
  }, [plan]);

  if (!plan) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <p className="text-muted-foreground">Plan no encontrado</p>
          <Button variant="outline" onClick={() => navigate("/admin/nutrition")}>Volver a Nutrición</Button>
        </div>
      </AdminLayout>
    );
  }

  const updateMeal = (idx: number, meal: Meal) => {
    const meals = [...plan.meals];
    meals[idx] = meal;
    setPlan({ ...plan, meals });
  };

  const deleteMeal = (idx: number) => {
    setPlan({ ...plan, meals: plan.meals.filter((_, i) => i !== idx) });
  };

  const addMeal = () => {
    setPlan({ ...plan, meals: [...plan.meals, createEmptyMeal("Nueva Comida")] });
  };

  const updateSupplement = (idx: number, sup: Supplement) => {
    const supplements = [...plan.supplements];
    supplements[idx] = sup;
    setPlan({ ...plan, supplements });
  };

  const deleteSupplement = (idx: number) => {
    setPlan({ ...plan, supplements: plan.supplements.filter((_, i) => i !== idx) });
  };

  const addSupplement = () => {
    setPlan({ ...plan, supplements: [...plan.supplements, { name: "", dose: "", timing: "" }] });
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in max-w-5xl">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/nutrition")} className="text-muted-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">{plan.planName}</h1>
              <p className="text-sm text-muted-foreground">
                {plan.clientName} · {plan.active ? "Activo" : "Inactivo"}
              </p>
            </div>
          </div>
          <Button className="glow-primary-sm gap-2" onClick={save}>
            <Save className="h-4 w-4" />Guardar
          </Button>
        </div>

        {/* Plan metadata */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Objetivo y resumen</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Nombre del plan</Label>
              <Input value={plan.planName} onChange={(e) => setPlan({ ...plan, planName: e.target.value })} className="bg-muted/20 border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Cliente</Label>
              <Input value={plan.clientName} disabled className="bg-muted/20 border-border opacity-60" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Objetivo principal</Label>
            <Textarea
              value={plan.objective}
              onChange={(e) => setPlan({ ...plan, objective: e.target.value })}
              className="bg-muted/20 border-border min-h-[80px]"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(["calories", "protein", "carbs", "fats"] as const).map((k) => (
              <div key={k} className="space-y-1">
                <Label className="text-muted-foreground text-xs capitalize">
                  {k === "calories" ? "Kcal" : k === "protein" ? "Proteínas (g)" : k === "carbs" ? "CH (g)" : "Grasas (g)"}
                </Label>
                <Input
                  type="number"
                  value={plan[k] ?? ""}
                  onChange={(e) => setPlan({ ...plan, [k]: e.target.value ? Number(e.target.value) : undefined })}
                  className="bg-muted/20 border-border text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Meals editor */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Utensils className="h-5 w-5 text-primary" />
              Comidas
            </h2>
            <Button variant="outline" size="sm" className="text-primary border-primary/30" onClick={addMeal}>
              <Plus className="h-3.5 w-3.5 mr-1" />Añadir comida
            </Button>
          </div>
          {plan.meals.map((meal, i) => (
            <MealEditor key={meal.id} meal={meal} onUpdate={(m) => updateMeal(i, m)} onDelete={() => deleteMeal(i)} />
          ))}
          {plan.meals.length === 0 && (
            <div className="border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
              No hay comidas aún. Añade la primera.
            </div>
          )}
        </div>

        <Separator className="bg-border" />

        {/* Supplements */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Pill className="h-4 w-4 text-primary" />
              Suplementación
            </h2>
            <Button variant="ghost" size="sm" className="text-primary text-xs" onClick={addSupplement}>
              <Plus className="h-3 w-3 mr-1" />Añadir
            </Button>
          </div>
          <div className="space-y-2">
            {plan.supplements.map((sup, i) => (
              <SupplementRow key={i} sup={sup} onUpdate={(s) => updateSupplement(i, s)} onDelete={() => deleteSupplement(i)} />
            ))}
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Recommendations */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Recomendaciones</h2>
          <Textarea
            value={plan.recommendations.join("\n")}
            onChange={(e) => setPlan({ ...plan, recommendations: e.target.value.split("\n") })}
            placeholder="Una recomendación por línea..."
            className="bg-muted/20 border-border min-h-[100px] text-sm"
          />
        </div>

        <Separator className="bg-border" />

        {/* Global reference tables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReferenceTable title="Tabla 01 — Frutas" icon={<Apple className="h-4 w-4 text-primary" />} items={globalFruitTable} />
          <ReferenceTable title="Tabla 02 — Verduras" icon={<Salad className="h-4 w-4 text-primary" />} items={globalVegetableTable} />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminNutritionPlanDetail;
