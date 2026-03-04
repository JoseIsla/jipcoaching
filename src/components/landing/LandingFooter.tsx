import logoJip from "@/assets/logo-jip.png";
import { useTranslation } from "@/i18n/useTranslation";

const LandingFooter = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-background border-t border-border py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <img src={logoJip} alt="JIP Performance Nutrition" className="h-8 w-auto opacity-60" />
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} JIP Performance Nutrition. {t("landing.footer")}
        </p>
      </div>
    </footer>
  );
};

export default LandingFooter;
