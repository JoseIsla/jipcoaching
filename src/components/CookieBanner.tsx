import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "@/i18n/useTranslation";

const COOKIE_CONSENT_KEY = "jip-cookie-consent";

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay so it doesn't flash on load
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "rejected");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 z-[100] sm:left-auto sm:right-6 sm:max-w-md"
        >
          <div className="relative rounded-2xl border border-border bg-background/95 backdrop-blur-xl shadow-2xl shadow-primary/10 p-5">
            {/* Close button */}
            <button
              onClick={reject}
              className="absolute top-3 right-3 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Content */}
            <div className="flex gap-3 items-start pr-6">
              <div className="flex-shrink-0 mt-0.5 p-2 rounded-xl bg-primary/10">
                <Cookie className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {t("cookies.title")}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("cookies.description")}{" "}
                  <Link
                    to="/legal/cookies"
                    className="text-primary hover:underline font-medium"
                  >
                    {t("cookies.learnMore")}
                  </Link>
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 mt-4 ml-12">
              <button
                onClick={reject}
                className="flex-1 px-4 py-2 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                {t("cookies.reject")}
              </button>
              <button
                onClick={accept}
                className="flex-1 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:brightness-110 transition-all"
              >
                {t("cookies.accept")}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;
