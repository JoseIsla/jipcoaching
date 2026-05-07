import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { HelpCircle } from "lucide-react";

/** Detect touch-primary device */
const useIsTouchDevice = () => {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);
  return isTouch;
};

export interface PassFailInfoBadgeProps {
  /** Override label text. Defaults based on variant. */
  label?: string;
  /** Override title text. Defaults based on variant. */
  title?: string;
  /** Override description text. Defaults based on variant. */
  description?: string;
  boeRef?: string;
  variant?: "default" | "apto" | "noApto";
}

/** Canonical copy per variant — single source of truth */
const VARIANT_DEFAULTS: Record<string, { label: string; title: string; description: string }> = {
  default: {
    label: "Apto / No Apto",
    title: "Sistema eliminatorio",
    description:
      "El aspirante debe alcanzar la marca mínima establecida en el baremo oficial para obtener «Apto». No alcanzarla supone la calificación de «No Apto» y la eliminación del proceso selectivo.",
  },
  apto: {
    label: "Apto",
    title: "Marca apta",
    description:
      "La marca registrada alcanza o supera el mínimo exigido en el baremo oficial. Resultado: «Apto».",
  },
  noApto: {
    label: "No Apto",
    title: "Marca no apta",
    description:
      "La marca registrada no alcanza el mínimo exigido en el baremo oficial. Resultado: «No Apto» — el aspirante queda eliminado del proceso selectivo.",
  },
};

/** Badge that shows tooltip on desktop, drawer on mobile — explains BOE pass/fail system */
const PassFailInfoBadge = ({
  label: labelProp,
  title: titleProp,
  description: descProp,
  boeRef,
  variant = "default",
}: PassFailInfoBadgeProps) => {
  const isTouch = useIsTouchDevice();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const defaults = VARIANT_DEFAULTS[variant] ?? VARIANT_DEFAULTS.default;
  const label = labelProp ?? defaults.label;
  const title = titleProp ?? defaults.title;
  const description = descProp ?? defaults.description;

  const colorClass =
    variant === "noApto"
      ? "border-destructive/30 text-destructive"
      : "border-green-500/30 text-green-400";

  const boeSource = boeRef ? `Fuente: ${boeRef}` : "";
  const ariaLabel = `${label} — ${title}. ${description}${boeSource ? ` ${boeSource}` : ""}`;

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      setDrawerOpen(true);
    }
  }, []);

  const badge = (
    <Badge
      variant="outline"
      className={`text-[9px] flex items-center gap-1 cursor-help ${colorClass} focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`}
      tabIndex={0}
      role="button"
      aria-label={ariaLabel}
      onClick={(e) => {
        if (isTouch) {
          e.stopPropagation();
          e.preventDefault();
          setDrawerOpen(true);
        }
      }}
      onKeyDown={handleKeyDown}
    >
      {label}
      <HelpCircle className="h-2.5 w-2.5" />
    </Badge>
  );

  const infoContent = (
    <>
      <p className="font-semibold mb-1">{title}</p>
      <p>{description}</p>
      {boeRef && <p className="mt-1 text-muted-foreground">📄 {boeSource}</p>}
    </>
  );

  if (isTouch) {
    return (
      <>
        {badge}
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} aria-label={title}>
          <DrawerContent className="px-4 pb-6">
            <DrawerHeader className="px-0 pb-2">
              <DrawerTitle className="text-sm">{title}</DrawerTitle>
            </DrawerHeader>
            <DrawerDescription className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </DrawerDescription>
            {boeRef && (
              <p className="text-[11px] text-muted-foreground mt-3 pt-3 border-t border-border/30">
                📄 {boeSource}
              </p>
            )}
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild onClick={(e) => e.stopPropagation()} aria-describedby={undefined}>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-[240px] text-[10px] leading-relaxed" role="tooltip">
          {infoContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PassFailInfoBadge;