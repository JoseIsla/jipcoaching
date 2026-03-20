import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const PWAUpdateBanner = () => {
  const [visible, setVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [applyUpdate, setApplyUpdate] = useState<null | (() => Promise<void>)>(null);

  useEffect(() => {
    const handleUpdateAvailable = (event: WindowEventMap["app-update-available"]) => {
      setApplyUpdate(() => event.detail?.update ?? (() => Promise.resolve(window.location.reload())));
      setVisible(true);
    };

    window.addEventListener("app-update-available", handleUpdateAvailable);
    return () => window.removeEventListener("app-update-available", handleUpdateAvailable);
  }, []);

  const handleUpdate = async () => {
    if (!applyUpdate) return;

    try {
      setIsUpdating(true);
      await applyUpdate();
    } finally {
      setVisible(false);
      setIsUpdating(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 top-4 z-50 px-4 animate-fade-in">
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-lg shadow-black/30">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <RefreshCw className={`h-4 w-4 ${isUpdating ? "animate-spin" : ""}`} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Nueva versión disponible</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Actualiza para cargar la última versión de la app y evitar quedarte con caché antigua.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" onClick={handleUpdate} disabled={isUpdating}>
            {isUpdating ? "Actualizando..." : "Actualizar"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setVisible(false)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Cerrar aviso de actualización"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PWAUpdateBanner;