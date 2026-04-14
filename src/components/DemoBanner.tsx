import { isDemoMode, disableDemoMode } from "@/config/devMode";
import { useAuth } from "@/contexts/AuthContext";
import { Monitor, X } from "lucide-react";

/**
 * Floating banner shown when the app is running in Demo Mode.
 * Provides a visual indicator + quick exit button.
 */
const DemoBanner = () => {
  const { logout } = useAuth();

  if (!isDemoMode()) return null;

  const handleExit = async () => {
    disableDemoMode();
    await logout();
    window.location.href = "/login";
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-md px-5 py-2.5 shadow-lg">
      <Monitor className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium text-foreground">
        Modo Demo — datos ficticios
      </span>
      <button
        onClick={handleExit}
        className="ml-1 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Salir del modo demo"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default DemoBanner;
