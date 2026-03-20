import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
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

interface GlobalFoodItem {
  id: string;
  type: "FRUIT" | "VEGETABLE";
  name: string;
  order: number;
}

interface ExerciseLibraryState {
  exercises: ExerciseLibraryItem[];
  fruits: string[];
  vegetables: string[];
  fruitsRaw: GlobalFoodItem[];
  vegetablesRaw: GlobalFoodItem[];
  loading: boolean;
  error: string | null;

  // API-backed exercises
  fetchExercises: () => Promise<void>;
  addExercise: (item: Omit<ExerciseLibraryItem, "id">) => Promise<ExerciseLibraryItem>;
  updateExercise: (id: string, updates: Partial<Omit<ExerciseLibraryItem, "id">>) => Promise<void>;
  removeExercise: (id: string) => Promise<void>;
  getByCategory: (category: ExerciseLibraryItem["category"]) => ExerciseLibraryItem[];

  // Fruits (API-backed)
  fetchFoods: () => Promise<void>;
  addFruit: (name: string) => void;
  removeFruit: (index: number) => void;
  editFruit: (index: number, name: string) => void;

  // Vegetables (API-backed)
  addVegetable: (name: string) => void;
  removeVegetable: (index: number) => void;
  editVegetable: (index: number, name: string) => void;
}

export const useExerciseLibraryStore = create<ExerciseLibraryState>()(persist((set, get) => ({
  exercises: [...initialExercises],
  fruits: [...initialFruits],
  vegetables: [...initialVegetables],
  fruitsRaw: [],
  vegetablesRaw: [],
  loading: false,
  error: null,

  // ── Fetch global food items from API ──
  fetchFoods: async () => {
    if (DEV_MOCK) return;
    try {
      const data = await api.get<GlobalFoodItem[]>("/foods", { silent: true });
      const fruitsRaw = (data ?? []).filter((f) => f.type === "FRUIT").sort((a, b) => a.order - b.order);
      const vegetablesRaw = (data ?? []).filter((f) => f.type === "VEGETABLE").sort((a, b) => a.order - b.order);
      set({
        fruitsRaw,
        vegetablesRaw,
        fruits: fruitsRaw.map((f) => f.name),
        vegetables: vegetablesRaw.map((f) => f.name),
      });
    } catch (err: any) {
      console.warn("Failed to fetch foods from API, using local fallback:", err?.message);
    }
  },

  // ── API-backed exercises ──

  fetchExercises: async () => {
    if (DEV_MOCK) {
      set({ loading: false });
      return;
    }

    set({ loading: true, error: null });
    try {
      const data = await api.get<ApiExercise[]>("/exercises", { silent: true });
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
      console.warn("Failed to add exercise via API, adding locally:", err?.message);
      const newItem: ExerciseLibraryItem = { ...item, id: `ex-local-${Date.now()}` };
      set((s) => ({ exercises: [...s.exercises, newItem] }));
      return newItem;
    }
  },

  updateExercise: async (id, updates) => {
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
    const prev = get().exercises;
    set((s) => ({ exercises: s.exercises.filter((e) => e.id !== id) }));

    try {
      await api.delete(`/exercises/${id}`);
    } catch (err: any) {
      console.warn("Failed to delete exercise via API:", err?.message);
      set({ exercises: prev });
    }
  },

  getByCategory: (category) =>
    get().exercises.filter((e) => e.category === category),

  // ── Fruits (API-backed) ──
  addFruit: (name) => {
    set((s) => ({ fruits: [...s.fruits, name] }));
    if (!DEV_MOCK) {
      api.post("/foods", { type: "FRUIT", name }).catch((err) =>
        console.warn("Failed to add fruit:", err?.message)
      );
    }
  },
  removeFruit: (index) => {
    const raw = get().fruitsRaw[index];
    set((s) => ({
      fruits: s.fruits.filter((_, i) => i !== index),
      fruitsRaw: s.fruitsRaw.filter((_, i) => i !== index),
    }));
    if (!DEV_MOCK && raw?.id) {
      api.delete(`/foods/${raw.id}`).catch((err) =>
        console.warn("Failed to delete fruit:", err?.message)
      );
    }
  },
  editFruit: (index, name) => {
    const raw = get().fruitsRaw[index];
    set((s) => ({
      fruits: s.fruits.map((f, i) => (i === index ? name : f)),
      fruitsRaw: s.fruitsRaw.map((f, i) => (i === index ? { ...f, name } : f)),
    }));
    if (!DEV_MOCK && raw?.id) {
      api.put(`/foods/${raw.id}`, { name }).catch((err) =>
        console.warn("Failed to update fruit:", err?.message)
      );
    }
  },

  // ── Vegetables (API-backed) ──
  addVegetable: (name) => {
    set((s) => ({ vegetables: [...s.vegetables, name] }));
    if (!DEV_MOCK) {
      api.post("/foods", { type: "VEGETABLE", name }).catch((err) =>
        console.warn("Failed to add vegetable:", err?.message)
      );
    }
  },
  removeVegetable: (index) => {
    const raw = get().vegetablesRaw[index];
    set((s) => ({
      vegetables: s.vegetables.filter((_, i) => i !== index),
      vegetablesRaw: s.vegetablesRaw.filter((_, i) => i !== index),
    }));
    if (!DEV_MOCK && raw?.id) {
      api.delete(`/foods/${raw.id}`).catch((err) =>
        console.warn("Failed to delete vegetable:", err?.message)
      );
    }
  },
  editVegetable: (index, name) => {
    const raw = get().vegetablesRaw[index];
    set((s) => ({
      vegetables: s.vegetables.map((v, i) => (i === index ? name : v)),
      vegetablesRaw: s.vegetablesRaw.map((v, i) => (i === index ? { ...v, name } : v)),
    }));
    if (!DEV_MOCK && raw?.id) {
      api.put(`/foods/${raw.id}`, { name }).catch((err) =>
        console.warn("Failed to update vegetable:", err?.message)
      );
    }
  },
}), {
  name: "jip-library-offline-cache",
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    exercises: state.exercises,
    fruits: state.fruits,
    vegetables: state.vegetables,
    fruitsRaw: state.fruitsRaw,
    vegetablesRaw: state.vegetablesRaw,
  }),
}));
