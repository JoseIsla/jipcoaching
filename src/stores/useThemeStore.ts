import { create } from "zustand";

export type ThemeMode = "dark" | "light" | "system";

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  initTheme: (theme: string | undefined | null) => void;
}

const applyTheme = (theme: ThemeMode) => {
  const isLight =
    theme === "light" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: light)").matches);

  // Enable transition class briefly for smooth theme change
  document.documentElement.classList.add("theme-transitioning");
  document.documentElement.classList.toggle("light", isLight);

  // Remove transition class after animation completes to avoid interfering with other transitions
  setTimeout(() => {
    document.documentElement.classList.remove("theme-transitioning");
  }, 400);
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "dark",

  setTheme: (theme: ThemeMode) => {
    applyTheme(theme);
    set({ theme });
  },

  initTheme: (themeFromApi: string | undefined | null) => {
    const t = (themeFromApi === "light" || themeFromApi === "system") ? themeFromApi : "dark";
    get().setTheme(t);
  },
}));

// Listen for system theme changes when mode is "system"
if (typeof window !== "undefined") {
  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
    const { theme } = useThemeStore.getState();
    if (theme === "system") {
      applyTheme("system");
    }
  });
}
