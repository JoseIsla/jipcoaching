import { Lock, LogOut, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/i18n/useTranslation";

interface Props {
  onLogout: () => void;
  isLoggingOut: boolean;
}

const WHATSAPP_NUMBER = "34676188961";
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hola José, me gustaría reactivar mi cuenta en JIP Coaching. ¿Podrías indicarme cómo proceder con el pago?"
);

const ClientDeactivatedScreen = ({ onLogout, isLoggingOut }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Lock icon */}
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <Lock className="h-10 w-10 text-destructive" />
          </div>
        </div>

        {/* Main card */}
        <Card className="border-border">
          <CardContent className="pt-6 text-center space-y-4">
            <h1 className="text-xl font-bold text-foreground">
              {t("deactivated.title")}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("deactivated.message")}
            </p>

            {/* WhatsApp CTA */}
            <Button
              className="w-full gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold"
              size="lg"
              asChild
            >
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-5 w-5" />
                {t("deactivated.whatsappButton")}
              </a>
            </Button>

            {/* Logout */}
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={onLogout}
              disabled={isLoggingOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t("deactivated.logoutButton")}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} JIP Performance Nutrition
        </p>
      </div>
    </div>
  );
};

export default ClientDeactivatedScreen;