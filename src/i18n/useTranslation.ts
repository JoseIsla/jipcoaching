import { useLanguageStore } from "./store";
import es from "./es";
import en from "./en";

const translations = { es, en } as const;

type NestedKeyOf<T> = T extends object
  ? { [K in keyof T]: K extends string ? (T[K] extends object ? `${K}.${NestedKeyOf<T[K]>}` : `${K}`) : never }[keyof T]
  : never;

type TranslationKey = NestedKeyOf<typeof es>;

function getNestedValue(obj: any, path: string): string {
  return path.split(".").reduce((acc, key) => acc?.[key], obj) ?? path;
}

export function useTranslation() {
  const language = useLanguageStore((s) => s.language);
  const dict = translations[language];

  function t(key: string, vars?: Record<string, string | number>): string {
    let value = getNestedValue(dict, key);
    if (typeof value !== "string") return key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        value = value.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      });
    }
    return value;
  }

  return { t, language };
}
