import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import logoJip from "@/assets/logo-jip.png";
import { useTranslation } from "@/i18n/useTranslation";

const LandingFooter = () => {
  const { t } = useTranslation();

  const legalLinks = [
    { label: t("landing.footerLegal.legalNotice"), to: "/legal/aviso-legal" },
    { label: t("landing.footerLegal.privacy"), to: "/legal/privacidad" },
    { label: t("landing.footerLegal.cookies"), to: "/legal/cookies" },
  ];

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="bg-background border-t border-border py-10"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Top row: logo + legal links */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <img src={logoJip} alt="JIP Performance Nutrition" className="h-8 w-auto opacity-60" />
          <div className="flex items-center gap-4">
            {legalLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Bottom row: copyright + hosting */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} JIP Performance Nutrition. {t("landing.footer")}
          </p>
          <p>
            {t("landing.footerLegal.hostedBy")}{" "}
            <a
              href="https://www.islacloudsolutions.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Isla Cloud Solutions
            </a>
          </p>
        </div>
      </div>
    </motion.footer>
  );
};

export default LandingFooter;
