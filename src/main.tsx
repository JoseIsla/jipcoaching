import { createRoot } from "react-dom/client";
import { ToastAction } from "@/components/ui/toast";
import { toast } from "@/hooks/use-toast";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

const updateSW = registerSW({
  immediate: true,
  onOfflineReady() {
    toast({
      title: "App lista para usar sin conexión",
      description: "La interfaz básica de JIP ya está preparada para abrirse más rápido en móvil.",
    });
  },
  onNeedRefresh() {
    const notification = toast({
      title: "Nueva versión disponible",
      description: "Actualiza la app para cargar los últimos cambios en tu móvil.",
      action: (
        <ToastAction
          altText="Actualizar aplicación"
          onClick={() => {
            notification.dismiss();
            void updateSW(true);
          }}
        >
          Actualizar
        </ToastAction>
      ),
    });
  },
});

createRoot(document.getElementById("root")!).render(<App />);
