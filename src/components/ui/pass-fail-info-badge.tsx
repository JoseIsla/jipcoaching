import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose, DrawerFooter } from "@/components/ui/drawer";
import { HelpCircle, Copy, CheckCheck, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  /** Full BOE citation string, e.g. "BOE Resolución 160/38240/2025, 28 mayo 2025" */
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

/** Structured BOE citation block with copy button */
const BoeCitation = ({ boeRef }: { boeRef: string }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(boeRef);
      setCopied(true);
      toast({ title: "Referencia copiada", description: boeRef, duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "No se pudo copiar", variant: "destructive", duration: 2000 });
    }
  }, [boeRef, toast]);

  return (
    <div className="mt-3 pt-3 border-t border-border/30 space-y-2">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Referencia BOE</p>
      <p className="text-[11px] text-foreground leading-relaxed">📄 {boeRef}</p>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-[10px] gap-1.5 w-full"
        onClick={(e) => { e.stopPropagation(); handleCopy(); }}
      >
        {copied ? <CheckCheck className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
        {copied ? "Copiada" : "Copiar referencia"}
      </Button>
    </div>
  );
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
      {boeRef && <p className="mt-1.5 text-muted-foreground text-[9px]">📄 {boeRef}</p>}
    </>
  );

  if (isTouch) {
    return (
      <>
        {badge}
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} aria-label={title}>
          <DrawerContent className="px-4 pb-safe">
            <DrawerHeader className="px-0 pb-2 relative">
              <DrawerTitle className="text-sm pr-8">{title}</DrawerTitle>
              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-3 h-7 w-7 rounded-full"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </DrawerHeader>
            <DrawerDescription className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </DrawerDescription>
            {boeRef && <BoeCitation boeRef={boeRef} />}
            <DrawerFooter className="px-0 pt-4">
              <DrawerClose asChild>
                <Button variant="secondary" size="sm" className="w-full text-xs">
                  Cerrar
                </Button>
              </DrawerClose>
            </DrawerFooter>
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