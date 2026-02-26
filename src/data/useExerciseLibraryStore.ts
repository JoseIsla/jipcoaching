import { create } from "zustand";
import {
  exerciseLibrary as initialExercises,
  type ExerciseLibraryItem,
} from "@/data/trainingPlanStore";
import {
  globalFruitTable as initialFruits,
  globalVegetableTable as initialVegetables,
} from "@/data/nutritionPlanStore";

// Re-export type
export type { ExerciseLibraryItem };

interface ExerciseLibraryState {
  exercises: ExerciseLibraryItem[];
  fruits: string[];
  vegetables: string[];

  // Exercises
  addExercise: (item: Omit<ExerciseLibraryItem, "id">) => ExerciseLibraryItem;
  updateExercise: (id: string, updates: Partial<Omit<ExerciseLibraryItem, "id">>) => void;
  removeExercise: (id: string) => void;
  getByCategory: (category: ExerciseLibraryItem["category"]) => ExerciseLibraryItem[];

  // Fruits
  addFruit: (name: string) => void;
  removeFruit: (index: number) => void;
  editFruit: (index: number, name: string) => void;

  // Vegetables
  addVegetable: (name: string) => void;
  removeVegetable: (index: number) => void;
  editVegetable: (index: number, name: string) => void;
}

export const useExerciseLibraryStore = create<ExerciseLibraryState>((set, get) => ({
  exercises: [...initialExercises],
  fruits: [...initialFruits],
  vegetables: [...initialVegetables],

  // Exercises
  addExercise: (item) => {
    const newItem: ExerciseLibraryItem = { ...item, id: `ex-custom-${Date.now()}` };
    set((s) => ({ exercises: [...s.exercises, newItem] }));
    return newItem;
  },

  updateExercise: (id, updates) =>
    set((s) => ({
      exercises: s.exercises.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    })),

  removeExercise: (id) =>
    set((s) => ({ exercises: s.exercises.filter((e) => e.id !== id) })),

  getByCategory: (category) =>
    get().exercises.filter((e) => e.category === category),

  // Fruits
  addFruit: (name) =>
    set((s) => ({ fruits: [...s.fruits, name] })),

  removeFruit: (index) =>
    set((s) => ({ fruits: s.fruits.filter((_, i) => i !== index) })),

  editFruit: (index, name) =>
    set((s) => ({
      fruits: s.fruits.map((f, i) => (i === index ? name : f)),
    })),

  // Vegetables
  addVegetable: (name) =>
    set((s) => ({ vegetables: [...s.vegetables, name] })),

  removeVegetable: (index) =>
    set((s) => ({ vegetables: s.vegetables.filter((_, i) => i !== index) })),

  editVegetable: (index, name) =>
    set((s) => ({
      vegetables: s.vegetables.map((v, i) => (i === index ? name : v)),
    })),
}));
