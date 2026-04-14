import logoJip from "@/assets/logo-jip.png";
import logoJipDark from "@/assets/logo-jip-dark.png";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { useThemeStore } from "@/stores/useThemeStore";

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen = ({ message }: LoadingScreenProps) => {
  const { t } = useTranslation();
  const theme = useThemeStore((s) => s.theme);
  const isLightActive = theme === "light" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches);
  const activeLogo = isLightActive ? logoJipDark : logoJip;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
      <div className="animate-fade-in flex flex-col items-center gap-6">
        <img
          src={activeLogo}
          alt="JIP Performance Nutrition"
          className="h-20 w-auto animate-pulse"
        />
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium">{message || t("common.loadingPanel")}</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
