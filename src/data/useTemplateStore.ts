import { create } from "zustand";
import {
  nutritionTemplates as initialNutritionTemplates,
  trainingTemplate as initialTrainingTemplate,
  type NutritionTemplate,
  type TrainingTemplate,
  type QuestionDefinition,
} from "@/data/questionnaireDefs";
import { api } from "@/services/api";
import { DEV_MOCK } from "@/config/devMode";

// ── API → Frontend mappers ──

interface ApiQuestion {
  id: string;
  type: string;
  label: string;
  required: boolean;
  order: number;
  optionsJson: string | null;
}

interface ApiTemplate {
  id: string;
  name: string;
  description?: string;
  category: "NUTRITION" | "TRAINING";
  dayOfWeek: number | null;
  scope: string;
  isActive: boolean;
  questions: ApiQuestion[];
}

const mapApiQuestion = (q: ApiQuestion): QuestionDefinition => ({
  id: q.id,
  label: q.label,
  type: q.type as QuestionDefinition["type"],
  required: q.required,
  ...(q.optionsJson ? { options: JSON.parse(q.optionsJson) } : {}),
});

const mapApiToNutrition = (t: ApiTemplate): NutritionTemplate => {
  const dayLabels: Record<number, string> = {
    0: "Domingo", 1: "Lunes", 2: "Martes", 3: "Miércoles",
    4: "Jueves", 5: "Viernes", 6: "Sábado",
  };
  return {
    id: t.id,
    name: t.name,
    dayOfWeek: t.dayOfWeek ?? 2,
    dayLabel: dayLabels[t.dayOfWeek ?? 2] ?? "Martes",
    questions: t.questions.map(mapApiQuestion),
  };
};

const mapApiToTraining = (t: ApiTemplate, base: TrainingTemplate): TrainingTemplate => ({
  ...base,
  id: t.id,
  name: t.name,
  questions: t.questions.map(mapApiQuestion),
});

// ── Helpers to build API payload from frontend questions ──

const questionsToApi = (questions: QuestionDefinition[]) =>
  questions.map((q, idx) => ({
    type: q.type,
    label: q.label,
    required: q.required,
    order: idx,
    options: q.options ?? undefined,
  }));

// ── Store ──

interface TemplateState {
  nutritionTemplates: NutritionTemplate[];
  trainingTemplate: TrainingTemplate;
  loading: boolean;
  error: string | null;

  // API actions
  fetchTemplates: () => Promise<void>;
  saveTemplate: (templateId: string) => Promise<void>;

  // Nutrition template operations
  updateNutritionQuestion: (templateId: string, questionId: string, updates: Partial<QuestionDefinition>) => void;
  deleteNutritionQuestion: (templateId: string, questionId: string) => void;
  addNutritionQuestion: (templateId: string, question: QuestionDefinition) => void;
  reorderNutritionQuestions: (templateId: string, questionIds: string[]) => void;

  // Training template operations (questions only)
  updateTrainingQuestion: (questionId: string, updates: Partial<QuestionDefinition>) => void;
  deleteTrainingQuestion: (questionId: string) => void;
  addTrainingQuestion: (question: QuestionDefinition) => void;
  reorderTrainingQuestions: (questionIds: string[]) => void;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  nutritionTemplates: [...initialNutritionTemplates.map((t) => ({ ...t, questions: [...t.questions] }))],
  trainingTemplate: { ...initialTrainingTemplate, questions: [...initialTrainingTemplate.questions] },
  loading: false,
  error: null,

  // ── API actions ──

  fetchTemplates: async () => {
    if (DEV_MOCK) return;
    set({ loading: true, error: null });
    try {
      const data = await api.get<ApiTemplate[]>("/questionnaires");
      if (!data) { set({ loading: false }); return; }

      const nutritionOnes = data.filter((t) => t.category === "NUTRITION" && t.isActive);
      const trainingOne = data.find((t) => t.category === "TRAINING" && t.isActive);

      set((s) => ({
        nutritionTemplates: nutritionOnes.length > 0
          ? nutritionOnes.map(mapApiToNutrition)
          : s.nutritionTemplates,
        trainingTemplate: trainingOne
          ? mapApiToTraining(trainingOne, s.trainingTemplate)
          : s.trainingTemplate,
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err?.message ?? "Error al cargar plantillas", loading: false });
    }
  },

  saveTemplate: async (templateId: string) => {
    if (DEV_MOCK) return;
    const state = get();
    const nutTemplate = state.nutritionTemplates.find((t) => t.id === templateId);
    if (nutTemplate) {
      await api.put(`/questionnaires/${templateId}`, {
        name: nutTemplate.name,
        category: "NUTRITION",
        dayOfWeek: nutTemplate.dayOfWeek,
        questions: questionsToApi(nutTemplate.questions),
      });
      return;
    }
    if (state.trainingTemplate.id === templateId) {
      await api.put(`/questionnaires/${templateId}`, {
        name: state.trainingTemplate.name,
        category: "TRAINING",
        questions: questionsToApi(state.trainingTemplate.questions),
      });
    }
  },

  // ── Local mutations (same as before) ──

  updateNutritionQuestion: (templateId, questionId, updates) =>
    set((s) => ({
      nutritionTemplates: s.nutritionTemplates.map((t) =>
        t.id === templateId
          ? { ...t, questions: t.questions.map((q) => (q.id === questionId ? { ...q, ...updates } : q)) }
          : t
      ),
    })),

  deleteNutritionQuestion: (templateId, questionId) =>
    set((s) => ({
      nutritionTemplates: s.nutritionTemplates.map((t) =>
        t.id === templateId ? { ...t, questions: t.questions.filter((q) => q.id !== questionId) } : t
      ),
    })),

  addNutritionQuestion: (templateId, question) =>
    set((s) => ({
      nutritionTemplates: s.nutritionTemplates.map((t) =>
        t.id === templateId ? { ...t, questions: [...t.questions, question] } : t
      ),
    })),

  reorderNutritionQuestions: (templateId, questionIds) =>
    set((s) => ({
      nutritionTemplates: s.nutritionTemplates.map((t) => {
        if (t.id !== templateId) return t;
        const ordered = questionIds.map((id) => t.questions.find((q) => q.id === id)!).filter(Boolean);
        return { ...t, questions: ordered };
      }),
    })),

  updateTrainingQuestion: (questionId, updates) =>
    set((s) => ({
      trainingTemplate: {
        ...s.trainingTemplate,
        questions: s.trainingTemplate.questions.map((q) => (q.id === questionId ? { ...q, ...updates } : q)),
      },
    })),

  deleteTrainingQuestion: (questionId) =>
    set((s) => ({
      trainingTemplate: {
        ...s.trainingTemplate,
        questions: s.trainingTemplate.questions.filter((q) => q.id !== questionId),
      },
    })),

  addTrainingQuestion: (question) =>
    set((s) => ({
      trainingTemplate: {
        ...s.trainingTemplate,
        questions: [...s.trainingTemplate.questions, question],
      },
    })),

  reorderTrainingQuestions: (questionIds) =>
    set((s) => {
      const ordered = questionIds.map((id) => s.trainingTemplate.questions.find((q) => q.id === id)!).filter(Boolean);
      return { trainingTemplate: { ...s.trainingTemplate, questions: ordered } };
    }),
}));
