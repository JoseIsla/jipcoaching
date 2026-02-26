import logoJip from "@/assets/logo-jip.png";
import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen = ({ message = "Cargando panel..." }: LoadingScreenProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
      <div className="animate-fade-in flex flex-col items-center gap-6">
        <img
          src={logoJip}
          alt="JIP Performance Nutrition"
          className="h-20 w-auto animate-pulse"
        />
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium">{message}</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
