import { create } from "zustand";

export type Language = "es" | "en";

const STORAGE_PREFIX = "app-language-";

function getSavedLanguage(userId: string): Language {
  try {
    const saved = localStorage.getItem(STORAGE_PREFIX + userId);
    if (saved === "es" || saved === "en") return saved;
  } catch {}
  return "es";
}

interface LanguageState {
  currentUserId: string;
  language: Language;
  setCurrentUser: (userId: string) => void;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  currentUserId: "default",
  language: getSavedLanguage("default"),
  setCurrentUser: (userId) => {
    set({ currentUserId: userId, language: getSavedLanguage(userId) });
  },
  setLanguage: (language) => {
    const userId = get().currentUserId;
    try { localStorage.setItem(STORAGE_PREFIX + userId, language); } catch {}
    set({ language });
  },
}));
