import { useState } from "react";
import ClientLayout from "@/components/client/ClientLayout";
import { useClient } from "@/contexts/ClientContext";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Utensils, Apple, Leaf, Target, Flame, Droplets } from "lucide-react";
import { nutritionPlanDetailStore, globalFruitTable, globalVegetableTable, macroCategoryLabels, type Meal, type MealOption } from "@/data/nutritionPlanStore";
import { nutritionPlanList } from "@/data/nutritionPlanStore";
import { globalSupplements } from "@/data/nutritionPlanStore";

const OptionCard = ({ option, optionIdx }: { option: MealOption; optionIdx: number }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <Badge className="text-[10px] bg-primary/15 text-primary border-0">Opción {optionIdx + 1}</Badge>
      {option.notes && <span className="text-xs text-muted-foreground italic">{option.notes}</span>}
    </div>
    {option.rows.map((row) => (
      <div key={row.id} className="bg-background/50 border border-border/40 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          {row.macroCategory && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {macroCategoryLabels[row.macroCategory]}
            </span>
          )}
          <span className="text-sm font-medium text-foreground">{row.mainIngredient}</span>
        </div>
        {row.alternatives.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {row.alternatives.map((alt, i) => (
              <span key={i} className="text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                ↻ {alt}
              </span>
            ))}
          </div>
        )}
      </div>
    ))}
  </div>
);

const MealCard = ({ meal }: { meal: Meal }) => {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-2">
            {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            <span className="font-semibold text-foreground">{meal.name}</span>
            <Badge variant="outline" className="text-[10px]">{meal.options.length} opción{meal.options.length > 1 ? "es" : ""}</Badge>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-4">
            {meal.description && <p className="text-xs text-muted-foreground italic">{meal.description}</p>}
            {meal.options.map((opt, i) => (
              <OptionCard key={opt.id} option={opt} optionIdx={i} />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

const ClientNutrition = () => {
  const { client } = useClient();

  // Find active plan detail
  const activePlanSummary = nutritionPlanList.find((p) => p.clientId === client.id && p.active);
  const planDetail = activePlanSummary ? nutritionPlanDetailStore[activePlanSummary.id] : null;

  if (!activePlanSummary) {
    return (
      <ClientLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Utensils className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold text-foreground">Sin plan activo</h2>
          <p className="text-sm text-muted-foreground mt-1">Tu coach aún no te ha asignado un plan nutricional.</p>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="space-y-6 max-w-lg mx-auto animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Utensils className="h-5 w-5 text-primary" />
            {activePlanSummary.planName}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Plan nutricional activo</p>
        </div>

        {/* Macros overview */}
        {planDetail && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Objetivo diario</h3>
            {planDetail.objective && (
              <p className="text-sm text-foreground mb-3">{planDetail.objective}</p>
            )}
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <Flame className="h-4 w-4 text-orange-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{planDetail.calories || "—"}</p>
                <p className="text-[10px] text-muted-foreground">Kcal</p>
              </div>
              <div className="text-center">
                <Target className="h-4 w-4 text-red-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{planDetail.protein || "—"}g</p>
                <p className="text-[10px] text-muted-foreground">Proteína</p>
              </div>
              <div className="text-center">
                <Droplets className="h-4 w-4 text-amber-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{planDetail.carbs || "—"}g</p>
                <p className="text-[10px] text-muted-foreground">CH</p>
              </div>
              <div className="text-center">
                <span className="text-base">🥑</span>
                <p className="text-lg font-bold text-foreground">{planDetail.fats || "—"}g</p>
                <p className="text-[10px] text-muted-foreground">Grasas</p>
              </div>
            </div>
          </div>
        )}

        {/* Meals */}
        {planDetail && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Comidas</h2>
            {planDetail.meals.map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </div>
        )}

        {/* Supplements */}
        {globalSupplements.length > 0 && (
          <Collapsible>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">💊 Suplementación</span>
                  <Badge variant="outline" className="text-[10px]">{globalSupplements.length}</Badge>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 space-y-2">
                  {globalSupplements.map((s, i) => (
                    <div key={i} className="bg-background/50 border border-border/40 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.dose}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{s.timing}</Badge>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        )}

        {/* Recommendations */}
        {planDetail && planDetail.recommendations.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">📋 Recomendaciones</h3>
            <ul className="space-y-1.5">
              {planDetail.recommendations.map((r, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span> {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Fruit & Vegetable tables */}
        <div className="grid grid-cols-1 gap-3">
          <Collapsible>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2">
                  <Apple className="h-4 w-4 text-green-500" />
                  <span className="font-semibold text-foreground text-sm">Tabla 01 — Frutas</span>
                  <Badge variant="outline" className="text-[10px]">{globalFruitTable.length}</Badge>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 flex flex-wrap gap-1.5">
                  {globalFruitTable.map((f, i) => (
                    <span key={i} className="text-xs bg-muted/50 text-muted-foreground px-2 py-1 rounded-full">{f}</span>
                  ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          <Collapsible>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-emerald-500" />
                  <span className="font-semibold text-foreground text-sm">Tabla 02 — Verduras</span>
                  <Badge variant="outline" className="text-[10px]">{globalVegetableTable.length}</Badge>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 flex flex-wrap gap-1.5">
                  {globalVegetableTable.map((v, i) => (
                    <span key={i} className="text-xs bg-muted/50 text-muted-foreground px-2 py-1 rounded-full">{v}</span>
                  ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </div>
      </div>
    </ClientLayout>
  );
};

export default ClientNutrition;
