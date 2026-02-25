// ==================== NUTRITION PLAN DETAIL STORE ====================

export type MacroCategory = "carbohidratos" | "proteinas" | "grasas" | "frutas" | "verduras" | "";

export interface IngredientRow {
  id: string;
  mainIngredient: string;
  alternatives: string[];
  macroCategory: MacroCategory;
}

export interface MealOption {
  id: string;
  name: string; // "Opción 1", "Opción 2"
  rows: IngredientRow[];
  notes?: string; // e.g. "1 porción de Frutas (Tabla 01)"
}

export interface Meal {
  id: string;
  name: string; // "Desayuno", "Snack", "Comida", "Cena"
  description?: string;
  options: MealOption[];
}

export interface Supplement {
  name: string;
  dose: string;
  timing: string;
}

export interface NutritionPlanDetail {
  id: string;
  clientId: string;
  clientName: string;
  planName: string;
  objective: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  active: boolean;
  startDate: string;
  endDate: string | null;
  meals: Meal[];
  recommendations: string[];
}

// Global reference tables
export const globalFruitTable: string[] = [
  "Piña (210g)", "Higo (150g)", "Pitaya (300g)", "Ciruela pasa", "Ciruela (230g)",
  "Albaricoque", "Caqui (85g)", "Níspero (210g)", "Cereza (205g)", "Plátano (110g)",
  "Manzana (210g)", "Mango (180g)", "Melón (310g)", "Fresa (310g)", "Chirimoya (125g)",
  "Melocotón", "Frambuesa", "Kiwi (170g)", "Naranja (220g)", "Guayaba (160g)",
  "Granada (320g)", "Papaya (240g)", "Dátil (40g)", "Sandía (360g)", "Pera (170g)",
  "Nectarina (240g)", "Uva (160g)", "Pasas (30g)", "Mora (240g)",
  "Bowl de frutas mixtas (200g)", "Arándano (190g)", "Pomelo (250g)", "Zumo de naranja (240g)",
  "Mandarina (240g)",
];

export const globalVegetableTable: string[] = [
  "Calabaza", "Berenjena", "Coliflor", "Pimiento", "Tomate",
  "Calabacín", "Remolacha", "Hojas verdes", "Repollo", "Pepino",
  "Espárrago", "Guisantes", "Acelga", "Brócoli", "Ajo",
  "Cebolla", "Zanahoria", "Albahaca", "Rúcula", "Lechuga",
  "Judías verdes", "Alcachofa", "Gazpacho", "Col de Bruselas", "Apio",
  "Pepinillos", "Champiñones", "Rábano", "Puerro", "Tomate cherry",
];

// Global supplements table
export let globalSupplements: Supplement[] = [
  { name: "Creatina", dose: "5 g/día", timing: "A cualquier hora" },
  { name: "Magnesio bisglicinato", dose: "200–300 mg/día", timing: "Noche" },
  { name: "Vitamina D3 + K2", dose: "2000 UI/día", timing: "Con comida rica en grasa" },
  { name: "Omega-3 (EPA+DHA)", dose: "1–2 g/día", timing: "Con comidas principales" },
];

export const setGlobalSupplements = (sups: Supplement[]) => {
  globalSupplements = sups;
};
// ---- Helpers ----
let nextId = 100;
export const genId = () => `np-${++nextId}`;
const rowId = () => `r-${++nextId}`;
const optId = () => `o-${++nextId}`;
const mealId = () => `m-${++nextId}`;

// ---- Mock plan detail based on the PDF ----
const mockPlanDetail: NutritionPlanDetail = {
  id: "p3",
  clientId: "2",
  clientName: "Ana López",
  planName: "Definición Q1",
  objective: "Reducir el porcentaje de grasa corporal sin perder masa muscular, manteniendo un rendimiento óptimo.",
  calories: 1700,
  protein: 153,
  carbs: 204,
  fats: 37,
  active: true,
  startDate: "2025-02-01",
  endDate: null,
  recommendations: [
    "Dormir 7–9 horas por noche.",
    "Mínimo 3–4 L de agua diarios.",
    "90% cumplimiento = éxito.",
    "Priorizar proteína completa en cada comida.",
  ],
  meals: [
    {
      id: "m-des", name: "Desayuno", description: "",
      options: [
        {
          id: "o-des1", name: "Opción 1", notes: "1 porción de Frutas (Tabla 01)",
          rows: [
            { id: "r1", mainIngredient: "Pan de Barra (55g)", alternatives: ["Tortilla de Trigo (50g)", "Tortitas de Maíz/Arroz/Avena (40g)", "Bagels - 1 Unidad"], macroCategory: "carbohidratos" },
            { id: "r2", mainIngredient: "Huevos de Gallina - 2 Unidades", alternatives: ["Jamón Serrano (50g)", "Pechuga de Pavo (80g)", "Queso Havarti Light (50g)", "Queso Cottage (100g)", "Salmón Ahumado (50g)"], macroCategory: "proteinas" },
            { id: "r3", mainIngredient: "Aceite de Oliva Virgen Extra (5g)", alternatives: ["Mix de Frutos Secos (5g)", "Aguacate (25g)", "Crema de Cacahuete (7g)", "Chocolate 85% (8g)"], macroCategory: "grasas" },
          ],
        },
        {
          id: "o-des2", name: "Opción 2", notes: "1 porción de Frutas (Tabla 01)",
          rows: [
            { id: "r4", mainIngredient: "Copos de Avena (30g)", alternatives: ["Corn Flakes S/A (30g)", "Tortitas Maíz/Arroz/Avena (40g)", "Muesli S/A (30g)", "Crema de Arroz (30g)"], macroCategory: "carbohidratos" },
            { id: "r5", mainIngredient: "Leche semidesnatada (200g)", alternatives: ["Yogur proteína – 1 ud", "Queso fresco batido desnatado (150g)", "Whey Protein (30g)"], macroCategory: "proteinas" },
            { id: "r6", mainIngredient: "Mix frutos secos (10g)", alternatives: ["Chocolate 85% (10g)", "Mix semillas (15g)", "Crema de cacahuete (10g)"], macroCategory: "grasas" },
          ],
        },
      ],
    },
    {
      id: "m-snk", name: "Snack / Media mañana", description: "",
      options: [
        {
          id: "o-snk1", name: "Opción 1", notes: "1 porción de Frutas (Tabla 01)",
          rows: [
            { id: "r7", mainIngredient: "Pan de Barra (55g)", alternatives: ["Tortilla de Trigo (50g)", "Tortitas de Maíz/Arroz/Avena (40g)", "Bagels - 1 Unidad"], macroCategory: "carbohidratos" },
            { id: "r8", mainIngredient: "Huevos de Gallina - 2 Unidades", alternatives: ["Jamón Serrano (50g)", "Pechuga de Pavo (80g)", "Queso Havarti Light (50g)", "Queso Cottage (100g)", "Salmón Ahumado (50g)"], macroCategory: "proteinas" },
            { id: "r9", mainIngredient: "Aceite de Oliva Virgen Extra (5g)", alternatives: ["Mix de Frutos Secos (6g)", "Aguacate (25g)", "Crema de Cacahuete (7g)", "Chocolate 85% (8g)"], macroCategory: "grasas" },
          ],
        },
      ],
    },
    {
      id: "m-com", name: "Comida", description: "Debe ser completa, con CH, proteína y verdura.",
      options: [
        {
          id: "o-com1", name: "Opción 1", notes: "1 porción de Verduras (Tabla 02). Aceite de Oliva Virgen Extra (5g).",
          rows: [
            { id: "r10", mainIngredient: "Arroz Blanco Crudo (45g)", alternatives: ["Pasta S/Gluten Cruda (40g)", "Patatas Crudas (205g)", "Boniato Crudo (185g)", "Gnocchis Crudos (100g)", "Pan de Barra (55g)"], macroCategory: "carbohidratos" },
            { id: "r11", mainIngredient: "Pechuga de Pollo Crudo (125g)", alternatives: ["Pechuga de pavo (125g)", "Pescado Blanco Crudo (150g)", "Atún al natural - 2 Latas", "Carne de Ternera Cruda (125g)"], macroCategory: "proteinas" },
          ],
        },
        {
          id: "o-com2", name: "Opción 2", notes: "1 porción de Verduras (Tabla 02). Aceite de Oliva Virgen Extra (5g).",
          rows: [
            { id: "r12", mainIngredient: "Garbanzos Cocidos (200g)", alternatives: ["Alubias Cocidas (245g)", "Lentejas Cocidas (215g)", "Quinua Cruda (50g)"], macroCategory: "carbohidratos" },
            { id: "r13", mainIngredient: "Pechuga de Pollo Crudo (125g)", alternatives: ["Soja Texturizada (125g)", "Pescado Blanco Crudo (125g)", "Atún al natural - 2 Latas", "Carne de Ternera Cruda (125g)"], macroCategory: "proteinas" },
          ],
        },
      ],
    },
    {
      id: "m-cen", name: "Cena", description: "Centrada en recuperación: proteína magra, CH ajustado y verduras.",
      options: [
        {
          id: "o-cen1", name: "Opción 1", notes: "1 porción de Verduras (Tabla 02). Aceite de Oliva Virgen Extra (5g).",
          rows: [
            { id: "r14", mainIngredient: "Arroz Blanco Crudo (45g)", alternatives: ["Pasta S/Gluten Cruda (40g)", "Patatas Crudas (205g)", "Boniato Crudo (185g)", "Gnocchis Crudos (100g)", "Pan de Barra (55g)"], macroCategory: "carbohidratos" },
            { id: "r15", mainIngredient: "Pechuga de Pollo Crudo (125g)", alternatives: ["Pechuga de pavo (125g)", "Pescado Blanco Crudo (150g)", "Atún al natural - 2 Latas", "Carne de Ternera Cruda (125g)"], macroCategory: "proteinas" },
          ],
        },
        {
          id: "o-cen2", name: "Opción 2", notes: "1 porción de Verduras (Tabla 02). Aceite de Oliva Virgen Extra (5g).",
          rows: [
            { id: "r16", mainIngredient: "Garbanzos Cocidos (200g)", alternatives: ["Alubias Cocidas (245g)", "Lentejas Cocidas (215g)", "Quinua Cruda (50g)"], macroCategory: "carbohidratos" },
            { id: "r17", mainIngredient: "Pechuga de Pollo Crudo (125g)", alternatives: ["Soja Texturizada (125g)", "Pescado Blanco Crudo (125g)", "Atún al natural - 2 Latas", "Carne de Ternera Cruda (125g)"], macroCategory: "proteinas" },
          ],
        },
      ],
    },
  ],
};

// Mutable store keyed by plan id
export const nutritionPlanDetailStore: Record<string, NutritionPlanDetail> = {
  [mockPlanDetail.id]: mockPlanDetail,
};

export const addNutritionPlanDetail = (plan: NutritionPlanDetail) => {
  nutritionPlanDetailStore[plan.id] = plan;
};

export const createEmptyMeal = (name: string): Meal => ({
  id: mealId(),
  name,
  description: "",
  options: [createEmptyOption("Opción 1")],
});

export const createEmptyOption = (name: string): MealOption => ({
  id: optId(),
  name,
  rows: [createEmptyRow()],
  notes: "",
});

export const createEmptyRow = (macroCategory: MacroCategory = ""): IngredientRow => ({
  id: rowId(),
  mainIngredient: "",
  alternatives: [],
  macroCategory,
});

export const macroCategoryLabels: Record<MacroCategory, string> = {
  carbohidratos: "🍚 Carbohidratos",
  proteinas: "🥩 Proteínas",
  grasas: "🥑 Grasas",
  frutas: "🍎 Frutas (Tabla 01)",
  verduras: "🥦 Verduras (Tabla 02)",
  "": "Sin categoría",
};

export const macroCategoryOptions: MacroCategory[] = ["carbohidratos", "proteinas", "grasas", "frutas", "verduras"];
