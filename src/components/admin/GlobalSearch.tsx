import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, Utensils, Dumbbell, Library, X } from "lucide-react";
import { useClientStore } from "@/data/useClientStore";
import { useNutritionPlanStore } from "@/data/useNutritionPlanStore";
import { useTrainingPlanStore } from "@/data/useTrainingPlanStore";
import { useExerciseLibraryStore } from "@/data/useExerciseLibraryStore";
import { useTranslation } from "@/i18n/useTranslation";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
  id: string;
  label: string;
  sublabel: string;
  category: "client" | "nutrition" | "training" | "exercise";
  link: string;
}

const categoryConfig = {
  client: { icon: Users, label: "Clientes", color: "text-primary" },
  nutrition: { icon: Utensils, label: "Planes Nutrición", color: "text-primary" },
  training: { icon: Dumbbell, label: "Planes Entreno", color: "text-accent" },
  exercise: { icon: Library, label: "Ejercicios", color: "text-muted-foreground" },
} as const;

const MAX_PER_CATEGORY = 3;

const GlobalSearch = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const clients = useClientStore((s) => s.clients);
  const nutritionPlans = useNutritionPlanStore((s) => s.plans);
  const trainingPlans = useTrainingPlanStore((s) => s.plans);
  const exercises = useExerciseLibraryStore((s) => s.exercises);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const out: SearchResult[] = [];

    // Clients
    clients
      .filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
      .slice(0, MAX_PER_CATEGORY)
      .forEach((c) =>
        out.push({ id: `c-${c.id}`, label: c.name, sublabel: c.email, category: "client", link: `/admin/clients/${c.id}` })
      );

    // Nutrition plans
    nutritionPlans
      .filter((p) => p.planName.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q))
      .slice(0, MAX_PER_CATEGORY)
      .forEach((p) =>
        out.push({ id: `np-${p.id}`, label: p.planName, sublabel: p.clientName, category: "nutrition", link: `/admin/nutrition/${p.id}` })
      );

    // Training plans
    trainingPlans
      .filter((p) => p.planName.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q))
      .slice(0, MAX_PER_CATEGORY)
      .forEach((p) =>
        out.push({ id: `tp-${p.id}`, label: p.planName, sublabel: p.clientName, category: "training", link: `/admin/training/${p.id}` })
      );

    // Exercises
    exercises
      .filter((e) => e.name.toLowerCase().includes(q) || (e.muscleGroup ?? "").toLowerCase().includes(q))
      .slice(0, MAX_PER_CATEGORY)
      .forEach((e) =>
        out.push({ id: `ex-${e.id}`, label: e.name, sublabel: e.muscleGroup ?? e.category, category: "exercise", link: "/admin/exercises" })
      );

    return out;
  }, [query, clients, nutritionPlans, trainingPlans, exercises]);

  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    results.forEach((r) => {
      if (!map.has(r.category)) map.set(r.category, []);
      map.get(r.category)!.push(r);
    });
    return map;
  }, [results]);

  const handleSelect = (result: SearchResult) => {
    setQuery("");
    setOpen(false);
    navigate(result.link);
  };

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative w-48 sm:w-72 lg:w-80">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={t("header.searchPlaceholder")}
          className="w-full pl-9 pr-16 h-9 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              className="text-muted-foreground hover:text-foreground p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-card px-1.5 text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </div>
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto"
          >
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <Search className="h-6 w-6 mb-1.5 opacity-30" />
                <p className="text-xs">{t("header.noResults")}</p>
              </div>
            ) : (
              Array.from(grouped.entries()).map(([cat, items]) => {
                const config = categoryConfig[cat as keyof typeof categoryConfig];
                const Icon = config.icon;
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border-b border-border/50">
                      <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {config.label}
                      </span>
                    </div>
                    {items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{item.sublabel}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlobalSearch;
