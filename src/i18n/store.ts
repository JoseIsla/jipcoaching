import { create } from "zustand";

export type Language = "es" | "en";
export type AppRole = "admin" | "client";

const STORAGE_PREFIX = "app-language-";

function getSavedLanguage(role: AppRole): Language {
  try {
    const saved = localStorage.getItem(STORAGE_PREFIX + role);
    if (saved === "es" || saved === "en") return saved;
  } catch {}
  return "es";
}

interface LanguageState {
  currentRole: AppRole;
  language: Language;
  setCurrentRole: (role: AppRole) => void;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  currentRole: "admin",
  language: getSavedLanguage("admin"),
  setCurrentRole: (role) => {
    set({ currentRole: role, language: getSavedLanguage(role) });
  },
  setLanguage: (language) => {
    const role = get().currentRole;
    try { localStorage.setItem(STORAGE_PREFIX + role, language); } catch {}
    set({ language });
  },
}));
