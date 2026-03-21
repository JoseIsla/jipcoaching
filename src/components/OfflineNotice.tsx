import { useEffect, useState } from "react";
import { WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "offline-notice-dismissed";

const OfflineNotice = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const syncStatus = () => setIsOffline(!navigator.onLine);
    syncStatus();

    const dismissedState = sessionStorage.getItem(DISMISS_KEY) === "true";
    setDismissed(dismissedState);

    window.addEventListener("online", syncStatus);
    window.addEventListener("offline", syncStatus);

    return () => {
      window.removeEventListener("online", syncStatus);
      window.removeEventListener("offline", syncStatus);
    };
  }, []);

  useEffect(() => {
    if (!isOffline) {
      sessionStorage.removeItem(DISMISS_KEY);
      setDismissed(false);
    }
  }, [isOffline]);

  if (!isOffline || dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 px-4 safe-area-bottom animate-fade-in">
      <div className="mx-auto flex max-w-lg items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-lg shadow-black/30">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground">
          <WifiOff className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Contenido offline limitado</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Sin internet puedes abrir la app y ver recursos estáticos ya cargados. El login, los testimonios,
            los check-ins, los planes en vivo y cualquier cambio o envío requieren conexión.
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Cerrar aviso offline"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default OfflineNotice;