import { useEffect, useState } from "react";
import { Download, PlusSquare, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type BeforeInstallPromptEvent, isIosSafari, isStandaloneMode } from "@/lib/pwa";

const PWAInstallBanner = () => {
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<"ios" | "android" | null>(null);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandaloneMode()) return;

    const dismissed = localStorage.getItem("pwa-banner-dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    if (isIosSafari()) {
      setMode("ios");
      setShow(true);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      const deferredPrompt = event as BeforeInstallPromptEvent;
      deferredPrompt.preventDefault();
      setInstallPromptEvent(deferredPrompt);
      setMode("android");
      setShow(true);
    };

    const handleAppInstalled = () => {
      localStorage.removeItem("pwa-banner-dismissed");
      setInstallPromptEvent(null);
      setShow(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem("pwa-banner-dismissed", Date.now().toString());
    setShow(false);
  };

  const handleInstall = async () => {
    if (!installPromptEvent) return;

    await installPromptEvent.prompt();
    const choice = await installPromptEvent.userChoice;
    setInstallPromptEvent(null);

    if (choice.outcome === "accepted") {
      setShow(false);
      return;
    }

    dismiss();
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 animate-fade-in safe-area-bottom">
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
              {mode === "android"
                ? "Instálala como app para abrir más rápido y con experiencia más nativa."
                : "Añádela a la pantalla de inicio para abrirla como una app real en iPhone."}
            </p>
          </div>
        </div>

        {mode === "android" ? (
          <div className="mt-4 space-y-2">
            <Button onClick={handleInstall} className="w-full h-11 font-semibold">
              <Download className="mr-2 h-4 w-4" />
              Instalar ahora
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={dismiss}
              className="w-full text-xs text-muted-foreground hover:text-foreground"
            >
              Ahora no
            </Button>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
};

export default PWAInstallBanner;
