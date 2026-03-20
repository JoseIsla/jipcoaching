import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    __APP_UPDATE_SW__?: (reloadPage?: boolean) => Promise<void>;
  }
}

const UPDATE_EVENT = "app-update-available";

const PWAUpdateBanner = () => {
  const [visible, setVisible] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const handleShow = () => setVisible(true);
    window.addEventListener(UPDATE_EVENT, handleShow);

    return () => window.removeEventListener(UPDATE_EVENT, handleShow);
  }, []);

  const handleUpdate = async () => {
    if (!window.__APP_UPDATE_SW__) return;

    try {
      setUpdating(true);
      await window.__APP_UPDATE_SW__(true);
    } finally {
      setUpdating(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] safe-area-bottom animate-fade-in px-3 pb-3">
      <div className="mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-primary/30 bg-card px-4 py-3 shadow-lg shadow-black/40">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <RefreshCw className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Nueva versión disponible</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Actualiza ahora para cargar la última versión de la app sin quedarte con una caché antigua.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleUpdate} size="sm" className="min-w-24 font-semibold" disabled={updating}>
            {updating ? "Actualizando" : "Actualizar"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            onClick={() => setVisible(false)}
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