import { WifiOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

const OfflineNotice = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <Alert className="border-primary/20 bg-card">
      <WifiOff className="h-4 w-4 text-primary" />
      <AlertTitle>Estás sin conexión</AlertTitle>
      <AlertDescription>
        Estás viendo la última versión guardada de tu plan y progreso. Cuando vuelva internet, la app se actualizará sola.
      </AlertDescription>
    </Alert>
  );
};

export default OfflineNotice;