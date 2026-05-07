import { useState, useEffect } from "react";
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
  label: string;
  title: string;
  description: string;
  boeRef?: string;
  variant?: "default" | "apto" | "noApto";
}

/** Badge that shows tooltip on desktop, drawer on mobile — explains BOE pass/fail system */
const PassFailInfoBadge = ({
  label,
  title,
  description,
  boeRef,
  variant = "default",
}: PassFailInfoBadgeProps) => {
  const isTouch = useIsTouchDevice();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const colorClass =
    variant === "noApto"
      ? "border-destructive/30 text-destructive"
      : "border-green-500/30 text-green-400";

  const badge = (
    <Badge
      variant="outline"
      className={`text-[9px] flex items-center gap-1 cursor-help ${colorClass}`}
      onClick={(e) => {
        if (isTouch) {
          e.stopPropagation();
          e.preventDefault();
          setDrawerOpen(true);
        }
      }}
    >
      {label}
      <HelpCircle className="h-2.5 w-2.5" />
    </Badge>
  );

  const infoContent = (
    <>
      <p className="font-semibold mb-1">{title}</p>
      <p>{description}</p>
      {boeRef && <p className="mt-1 text-muted-foreground">Fuente: {boeRef}</p>}
    </>
  );

  if (isTouch) {
    return (
      <>
        {badge}
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent className="px-4 pb-6">
            <DrawerHeader className="px-0 pb-2">
              <DrawerTitle className="text-sm">{title}</DrawerTitle>
            </DrawerHeader>
            <DrawerDescription className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </DrawerDescription>
            {boeRef && (
              <p className="text-[11px] text-muted-foreground mt-3 pt-3 border-t border-border/30">
                📄 Fuente: {boeRef}
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
        <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-[240px] text-[10px] leading-relaxed">
          {infoContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PassFailInfoBadge;