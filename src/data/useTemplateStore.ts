import { create } from "zustand";
import {
  nutritionTemplates as initialNutritionTemplates,
  trainingTemplate as initialTrainingTemplate,
  type NutritionTemplate,
  type TrainingTemplate,
  type QuestionDefinition,
} from "@/data/questionnaireDefs";

interface TemplateState {
  nutritionTemplates: NutritionTemplate[];
  trainingTemplate: TrainingTemplate;

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

export const useTemplateStore = create<TemplateState>((set) => ({
  nutritionTemplates: [...initialNutritionTemplates.map((t) => ({ ...t, questions: [...t.questions] }))],
  trainingTemplate: { ...initialTrainingTemplate, questions: [...initialTrainingTemplate.questions] },

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
