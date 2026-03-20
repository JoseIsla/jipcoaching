import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Share, PlusSquare, MoreVertical, Download, Smartphone, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoJip from "@/assets/logo-jip.png";
import { type BeforeInstallPromptEvent, getMobilePlatform, isStandaloneMode } from "@/lib/pwa";

type Platform = "ios" | "android" | "other";

const InstallPage = () => {
  const [platform, setPlatform] = useState<Platform>("other");
  const [isInstalled, setIsInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState<Platform>("ios");
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    document.title = "Instalar App — JIP Performance Nutrition";
    const meta = document.querySelector('meta[name="description"]');
    const original = meta?.getAttribute("content") || "";
    meta?.setAttribute("content", "Instala la app de JIP Performance Nutrition en tu móvil. Instrucciones paso a paso para iPhone y Android, sin App Store ni Play Store.");
    const link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const origCanonical = link?.getAttribute("href") || "";
    link?.setAttribute("href", "https://jipcoaching.com/install");
    return () => {
      meta?.setAttribute("content", original);
      link?.setAttribute("href", origCanonical);
    };
  }, []);

  useEffect(() => {
    const detected = getMobilePlatform();
    setPlatform(detected);
    setActiveTab(detected === "other" ? "ios" : detected);
    setIsInstalled(isStandaloneMode());
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      const deferredPrompt = event as BeforeInstallPromptEvent;
      deferredPrompt.preventDefault();
      setInstallPromptEvent(deferredPrompt);
    };

    const handleInstalled = () => {
      setInstallPromptEvent(null);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleAndroidInstall = async () => {
    if (!installPromptEvent) return;

    await installPromptEvent.prompt();
    const choice = await installPromptEvent.userChoice;
    setInstallPromptEvent(null);

    if (choice.outcome === "accepted") {
      setIsInstalled(true);
    }
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">¡App instalada!</h1>
          <p className="text-muted-foreground text-sm">
            Ya tienes JIP Coaching instalada en tu dispositivo. Ábrela desde tu pantalla de inicio.
          </p>
          <Link to="/login">
            <Button className="mt-4">Ir al login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/home" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-semibold text-foreground">Instalar App</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-card border border-border flex items-center justify-center mx-auto shadow-lg">
            <img src={logoJip} alt="JIP Coaching" className="w-14 h-14" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">JIP Performance Nutrition</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Instala la app en tu móvil para acceder más rápido a tus planes y check-ins
            </p>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5 text-primary" />
              Sin App Store
            </span>
            <span className="flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5 text-primary" />
              Gratis
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              Acceso offline
            </span>
          </div>
        </div>

        {/* Platform tabs */}
        <div className="flex bg-muted rounded-xl p-1">
          <button
            onClick={() => setActiveTab("ios")}
            className={`flex-1 text-sm font-medium py-2.5 rounded-lg transition-all ${
              activeTab === "ios"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            iPhone / iPad
          </button>
          <button
            onClick={() => setActiveTab("android")}
            className={`flex-1 text-sm font-medium py-2.5 rounded-lg transition-all ${
              activeTab === "android"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Android
          </button>
        </div>

        {/* iOS Instructions */}
        {activeTab === "ios" && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-xs text-muted-foreground text-center">
              Asegúrate de estar usando <span className="text-foreground font-medium">Safari</span>
            </p>

            <Step
              number={1}
              icon={<Share className="h-5 w-5 text-primary" />}
              title="Pulsa el botón Compartir"
              description="Es el icono con la flecha hacia arriba en la barra inferior de Safari"
            />
            <Step
              number={2}
              icon={<PlusSquare className="h-5 w-5 text-primary" />}
              title='Selecciona "Añadir a pantalla de inicio"'
              description="Desliza hacia abajo en el menú si no lo ves de primeras"
            />
            <Step
              number={3}
              icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
              title='Pulsa "Añadir"'
              description="La app aparecerá en tu pantalla de inicio como cualquier otra app"
            />
          </div>
        )}

        {/* Android Instructions */}
        {activeTab === "android" && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-xs text-muted-foreground text-center">
              Usa <span className="text-foreground font-medium">Chrome</span> para mejor compatibilidad
            </p>

            {platform === "android" && installPromptEvent && (
              <Button onClick={handleAndroidInstall} className="w-full h-12 font-semibold text-base">
                <Download className="mr-2 h-4 w-4" />
                Instalar ahora
              </Button>
            )}

            <Step
              number={1}
              icon={<MoreVertical className="h-5 w-5 text-primary" />}
              title="Pulsa el menú (⋮)"
              description="Son los tres puntos verticales en la esquina superior derecha de Chrome"
            />
            <Step
              number={2}
              icon={<Download className="h-5 w-5 text-primary" />}
              title='Selecciona "Instalar aplicación"'
              description='También puede aparecer como "Añadir a pantalla de inicio"'
            />
            <Step
              number={3}
              icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
              title='Confirma pulsando "Instalar"'
              description="La app se instalará y aparecerá en tu pantalla de inicio"
            />
          </div>
        )}

        {/* CTA */}
        <div className="pt-4 text-center">
          {activeTab === "android" && installPromptEvent ? (
            <Link to="/login">
              <Button variant="outline" className="w-full h-12 font-semibold text-base">
                Ir al login
              </Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button className="w-full h-12 font-semibold text-base">
                Ir al login
              </Button>
            </Link>
          )}
          <Link to="/home" className="block mt-3">
            <span className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Volver a la web
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

const Step = ({
  number,
  icon,
  title,
  description,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="flex gap-4 items-start bg-card border border-border rounded-xl p-4">
    <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
      {number}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        {icon}
        <p className="font-semibold text-sm text-foreground">{title}</p>
      </div>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
    </div>
  </div>
);

export default InstallPage;
