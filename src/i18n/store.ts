import { create } from "zustand";

export type Language = "es" | "en";

const STORAGE_KEY = "app-language";

function getSavedLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "es" || saved === "en") return saved;
  } catch {}
  return "es";
}

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: getSavedLanguage(),
  setLanguage: (language) => {
    try { localStorage.setItem(STORAGE_KEY, language); } catch {}
    set({ language });
  },
}));
