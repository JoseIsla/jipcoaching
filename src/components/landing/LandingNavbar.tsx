import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn, LayoutDashboard, Globe } from "lucide-react";
import logoJip from "@/assets/logo-jip.png";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore, type Language } from "@/i18n/store";

const LandingNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { status, role } = useAuth();
  const { t } = useTranslation();
  const appLanguage = useLanguageStore((s) => s.language);
  const setAppLanguage = useLanguageStore((s) => s.setLanguage);
  const isLoggedIn = status === "authenticated" && role;

  const navItems = [
    { label: t("landing.nav.home"), href: "#hero" },
    { label: t("landing.nav.about"), href: "#about" },
    { label: t("landing.nav.plans"), href: "#plans" },
    { label: t("landing.nav.testimonials"), href: "#testimonials" },
    { label: t("landing.nav.faq"), href: "#faq" },
    { label: t("landing.nav.contact"), href: "#contact" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (href: string) => {
    setMobileOpen(false);
    setTimeout(() => {
      const el = document.querySelector(href);
      if (el) {
        const navHeight = 80;
        const y = el.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }, 350);
  };

  const panelPath = role === "admin" ? "/admin" : "/client";

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/90 backdrop-blur-xl border-b border-border shadow-lg shadow-primary/5"
          : "bg-transparent"
      }`}
      role="navigation"
      aria-label="Navegación principal"
    >
      {/* Skip to content link */}
      <a
        href="#hero"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-primary-foreground focus:text-sm focus:font-semibold"
      >
        Ir al contenido principal
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 safe-area-top">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          {/* Logo */}
          <button onClick={() => scrollTo("#hero")} className="flex items-center gap-2" aria-label="Volver al inicio">
            <img src={logoJip} alt="JIP Performance Nutrition" className="h-10 sm:h-12 w-auto" />
          </button>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => scrollTo(item.href)}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Language + Login/Panel + Mobile toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Language toggle */}
            <div className="flex items-center gap-1" role="group" aria-label="Idioma">
              <Globe className="h-4 w-4 text-muted-foreground hidden sm:block" aria-hidden="true" />
              <button
                onClick={() => setAppLanguage("es")}
                aria-pressed={appLanguage === "es"}
                className={`text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-1 rounded-md transition-colors ${appLanguage === "es" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
              >
                ES
              </button>
              <button
                onClick={() => setAppLanguage("en")}
                aria-pressed={appLanguage === "en"}
                className={`text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-1 rounded-md transition-colors ${appLanguage === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
              >
                EN
              </button>
            </div>

            {isLoggedIn ? (
              <Link
                to={panelPath}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:brightness-110 transition-all"
              >
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t("landing.nav.myPanel")}</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:brightness-110 transition-all"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t("landing.nav.login")}</span>
              </Link>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg transition-colors text-foreground bg-background/60 backdrop-blur-sm hover:bg-muted/70"
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background/95 backdrop-blur-xl border-b border-border overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => scrollTo(item.href)}
                  className="block w-full text-left px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default LandingNavbar;