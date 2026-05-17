import { Dumbbell, Target, Footprints, Activity, Trophy, type LucideIcon } from "lucide-react";

export type ExerciseSection =
  | "basic"
  | "accessory"
  | "running"
  | "running_technique"
  | "official_test";

export interface SectionMeta {
  label: string;
  shortLabel: string;
  Icon: LucideIcon;
  /** Tailwind text color class for headings/badges */
  colorClass: string;
  /** Tailwind bg accent for the row (very subtle) */
  rowAccent?: string;
}

export const SECTION_META: Record<ExerciseSection, SectionMeta> = {
  basic: {
    label: "Básico / Variante",
    shortLabel: "Básico",
    Icon: Dumbbell,
    colorClass: "text-primary",
  },
  accessory: {
    label: "Accesorio",
    shortLabel: "Accesorio",
    Icon: Target,
    colorClass: "text-muted-foreground",
  },
  running: {
    label: "Carrera / Aeróbico",
    shortLabel: "Carrera",
    Icon: Footprints,
    colorClass: "text-sky-400",
    rowAccent: "border-l-2 border-l-sky-400/40",
  },
  running_technique: {
    label: "Técnica de carrera",
    shortLabel: "Técnica",
    Icon: Activity,
    colorClass: "text-violet-400",
    rowAccent: "border-l-2 border-l-violet-400/40",
  },
  official_test: {
    label: "Prueba oficial",
    shortLabel: "Prueba",
    Icon: Trophy,
    colorClass: "text-amber-400",
    rowAccent: "border-l-2 border-l-amber-400/40",
  },
};

/** Sorted list of (id, section, originalIdx) used by drag/drop helpers. */
export const sortByOrder = <T extends { order?: number; id: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));