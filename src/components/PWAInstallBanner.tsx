import { useState, useEffect } from "react";
import { X, Share, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";

const PWAInstallBanner = () => {
  const [show, setShow] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Don't show if already installed as PWA
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    if (isStandalone) return;

    // Don't show if dismissed within last 7 days
    const dismissed = localStorage.getItem("pwa-banner-dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    // Only show on iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isSafari = /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|Chrome/.test(navigator.userAgent);

    if (isIOS && isSafari) {
      setShow(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem("pwa-banner-dismissed", Date.now().toString());
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 animate-fade-in">
      <div className="mx-3 mb-3 bg-card border border-border rounded-2xl p-4 shadow-lg shadow-black/40">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <img src="/assets/logo-jip-black.png" alt="JIP" className="w-7 h-7 rounded-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Instala JIP Coaching
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Añade la app a tu pantalla de inicio para acceder más rápido
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl p-3">
          <span className="font-medium text-foreground">1.</span>
          <span>Pulsa</span>
          <Share className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="font-medium text-foreground">Compartir</span>
          <span className="mx-1">→</span>
          <span className="font-medium text-foreground">2.</span>
          <PlusSquare className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="font-medium text-foreground whitespace-nowrap">Añadir a inicio</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={dismiss}
          className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Ahora no
        </Button>
      </div>
    </div>
  );
};

export default PWAInstallBanner;
