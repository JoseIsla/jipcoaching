import { create } from "zustand";
import { api } from "@/services/api";
import { DEV_MOCK } from "@/config/devMode";
import {
  exerciseLibrary as initialExercises,
  type ExerciseLibraryItem,
} from "@/data/trainingPlanStore";
import {
  globalFruitTable as initialFruits,
  globalVegetableTable as initialVegetables,
} from "@/data/nutritionPlanStore";
import type { ApiExercise, CreateExerciseDto } from "@/types/api";
import { exerciseCategoryToApi, exerciseCategoryFromApi } from "@/types/api";

// Re-export type
export type { ExerciseLibraryItem };

/** Convert API exercise to frontend format */
const toLibraryItem = (e: ApiExercise): ExerciseLibraryItem => ({
  id: e.id,
  name: e.name,
  category: exerciseCategoryFromApi(e.category),
  muscleGroup: e.muscleGroup,
  parentExerciseId: e.parentExerciseId,
});

interface ExerciseLibraryState {
  exercises: ExerciseLibraryItem[];
  fruits: string[];
  vegetables: string[];
  loading: boolean;
  error: string | null;

  // API-backed exercises
  fetchExercises: () => Promise<void>;
  addExercise: (item: Omit<ExerciseLibraryItem, "id">) => Promise<ExerciseLibraryItem>;
  updateExercise: (id: string, updates: Partial<Omit<ExerciseLibraryItem, "id">>) => Promise<void>;
  removeExercise: (id: string) => Promise<void>;
  getByCategory: (category: ExerciseLibraryItem["category"]) => ExerciseLibraryItem[];

  // Fruits (local — no backend endpoint yet)
  addFruit: (name: string) => void;
  removeFruit: (index: number) => void;
  editFruit: (index: number, name: string) => void;

  // Vegetables (local — no backend endpoint yet)
  addVegetable: (name: string) => void;
  removeVegetable: (index: number) => void;
  editVegetable: (index: number, name: string) => void;
}

export const useExerciseLibraryStore = create<ExerciseLibraryState>((set, get) => ({
  exercises: [...initialExercises],
  fruits: [...initialFruits],
  vegetables: [...initialVegetables],
  loading: false,
  error: null,

  // ── API-backed exercises ──

  fetchExercises: async () => {
    if (DEV_MOCK) {
      // In dev mode, use local exercise library (already loaded as initialExercises)
      set({ loading: false });
      return;
    }

    set({ loading: true, error: null });
    try {
      const data = await api.get<ApiExercise[]>("/exercises");
      set({ exercises: (data ?? []).map(toLibraryItem), loading: false });
    } catch (err: any) {
      console.warn("Failed to fetch exercises from API, using local fallback:", err?.message);
      set({ loading: false });
    }
  },

  addExercise: async (item) => {
    const dto: CreateExerciseDto = {
      name: item.name,
      category: exerciseCategoryToApi(item.category),
      muscleGroup: item.muscleGroup,
      parentExerciseId: item.parentExerciseId,
    };

    try {
      const created = await api.post<ApiExercise>("/exercises", dto);
      const newItem = toLibraryItem(created);
      set((s) => ({ exercises: [...s.exercises, newItem] }));
      return newItem;
    } catch (err: any) {
      // Fallback: add locally if API is unavailable
      console.warn("Failed to add exercise via API, adding locally:", err?.message);
      const newItem: ExerciseLibraryItem = { ...item, id: `ex-local-${Date.now()}` };
      set((s) => ({ exercises: [...s.exercises, newItem] }));
      return newItem;
    }
  },

  updateExercise: async (id, updates) => {
    // Optimistic update
    set((s) => ({
      exercises: s.exercises.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));

    try {
      const dto: Partial<CreateExerciseDto> = {};
      if (updates.name !== undefined) dto.name = updates.name;
      if (updates.muscleGroup !== undefined) dto.muscleGroup = updates.muscleGroup;
      if (updates.parentExerciseId !== undefined) dto.parentExerciseId = updates.parentExerciseId;
      if (updates.category !== undefined) dto.category = exerciseCategoryToApi(updates.category);

      await api.patch(`/exercises/${id}`, dto);
    } catch (err: any) {
      console.warn("Failed to update exercise via API:", err?.message);
    }
  },

  removeExercise: async (id) => {
    // Optimistic delete
    const prev = get().exercises;
    set((s) => ({ exercises: s.exercises.filter((e) => e.id !== id) }));

    try {
      await api.delete(`/exercises/${id}`);
    } catch (err: any) {
      console.warn("Failed to delete exercise via API:", err?.message);
      // Revert on failure
      set({ exercises: prev });
    }
  },

  getByCategory: (category) =>
    get().exercises.filter((e) => e.category === category),

  // ── Fruits (local) ──
  addFruit: (name) =>
    set((s) => ({ fruits: [...s.fruits, name] })),
  removeFruit: (index) =>
    set((s) => ({ fruits: s.fruits.filter((_, i) => i !== index) })),
  editFruit: (index, name) =>
    set((s) => ({ fruits: s.fruits.map((f, i) => (i === index ? name : f)) })),

  // ── Vegetables (local) ──
  addVegetable: (name) =>
    set((s) => ({ vegetables: [...s.vegetables, name] })),
  removeVegetable: (index) =>
    set((s) => ({ vegetables: s.vegetables.filter((_, i) => i !== index) })),
  editVegetable: (index, name) =>
    set((s) => ({ vegetables: s.vegetables.map((v, i) => (i === index ? name : v)) })),
}));
