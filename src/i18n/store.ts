import { create } from "zustand";

export type Language = "es" | "en";

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: "es",
  setLanguage: (language) => set({ language }),
}));
