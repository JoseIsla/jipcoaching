import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Utensils, Apple, Salad, Pill, Target, Pencil,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  useNutritionPlanStore,
  globalFruitTable,
  globalVegetableTable,
  macroCategoryLabels,
  type MacroCategory,
} from "@/data/useNutritionPlanStore";

const macroCategoryColors: Record<MacroCategory, string> = {
  carbohidratos: "border-amber-500/40 text-amber-400 bg-amber-500/10",
  proteinas: "border-red-500/40 text-red-400 bg-red-500/10",
  grasas: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
  frutas: "border-pink-500/40 text-pink-400 bg-pink-500/10",
  verduras: "border-green-500/40 text-green-400 bg-green-500/10",
  "": "border-border text-muted-foreground",
};

const AdminNutritionPlanView = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const details = useNutritionPlanStore((s) => s.details);
  const supplements = useNutritionPlanStore((s) => s.supplements);
  const plan = planId ? details[planId] : undefined;

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
          <Button variant="outline" className="gap-2" onClick={() => navigate(`/admin/nutrition/${plan.id}/edit`)}>
            <Pencil className="h-4 w-4" />Editar
          </Button>
        </div>

        {/* Plan metadata */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Objetivo y resumen</h2>
          </div>
          <p className="text-sm text-muted-foreground">{plan.objective}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Kcal", value: plan.calories },
              { label: "Proteínas (g)", value: plan.protein },
              { label: "CH (g)", value: plan.carbs },
              { label: "Grasas (g)", value: plan.fats },
            ].map((item) => (
              <div key={item.label} className="bg-muted/20 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-lg font-bold text-foreground">{item.value ?? "—"}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Meals read-only */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Utensils className="h-5 w-5 text-primary" />
            Comidas
          </h2>
          {plan.meals.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay comidas configuradas.</p>
          )}
          {plan.meals.map((meal) => (
            <div key={meal.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border/50 bg-muted/20">
                <h3 className="font-semibold text-foreground">{meal.name}</h3>
                {meal.description && <p className="text-xs text-muted-foreground mt-1">{meal.description}</p>}
              </div>
              <div className="p-4 space-y-4">
                {meal.options.map((opt) => (
                  <div key={opt.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary">{opt.name}</Badge>
                      {opt.notes && <span className="text-xs text-muted-foreground italic">{opt.notes}</span>}
                    </div>
                    <div className="space-y-1.5 pl-2">
                      {opt.rows.map((row) => (
                        <div key={row.id} className="space-y-1">
                          <div className="flex items-center gap-2">
                            {row.macroCategory && (
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${macroCategoryColors[row.macroCategory]}`}>
                                {macroCategoryLabels[row.macroCategory]}
                              </Badge>
                            )}
                            <span className="text-sm font-medium text-foreground">{row.mainIngredient}</span>
                          </div>
                          {row.alternatives.length > 0 && (
                            <div className="pl-4 flex flex-wrap gap-1">
                              {row.alternatives.map((alt, i) => (
                                <span key={i} className="text-xs text-muted-foreground">
                                  <span className="text-primary/60">↳</span> {alt}{i < row.alternatives.length - 1 ? " ·" : ""}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Separator className="bg-border" />

        {/* Supplements */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Pill className="h-4 w-4 text-primary" />
            Suplementación Recomendada
          </h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left p-3 text-muted-foreground font-medium">Suplemento</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Dosis</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Cuándo</th>
                </tr>
              </thead>
              <tbody>
                {supplements.map((sup, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="p-3 text-foreground">{sup.name}</td>
                    <td className="p-3 text-muted-foreground">{sup.dose}</td>
                    <td className="p-3 text-muted-foreground">{sup.timing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {plan.recommendations.filter(r => r.trim()).length > 0 && (
          <>
            <Separator className="bg-border" />
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">Recomendaciones</h2>
              <ul className="space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
                {plan.recommendations.filter(r => r.trim()).map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </>
        )}

        <Separator className="bg-border" />

        {/* Reference tables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Apple className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Tabla 01 — Frutas</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {globalFruitTable.map((item, i) => (
                <span key={i} className="text-xs text-muted-foreground bg-muted/30 rounded px-2 py-0.5">{item}</span>
              ))}
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Salad className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Tabla 02 — Verduras</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {globalVegetableTable.map((item, i) => (
                <span key={i} className="text-xs text-muted-foreground bg-muted/30 rounded px-2 py-0.5">{item}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminNutritionPlanView;
