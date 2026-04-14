import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
          initial={{ y: 56, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 56, opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
          className="fixed bottom-3 left-3 right-3 z-[100] sm:bottom-5 sm:left-1/2 sm:right-auto sm:w-[25rem] sm:max-w-[calc(100vw-2rem)] sm:-translate-x-1/2"
        >
          <div className="relative rounded-2xl border border-border/80 bg-background/88 p-3.5 shadow-2xl shadow-primary/10 backdrop-blur-xl sm:rounded-xl sm:p-3">
            <button
              onClick={reject}
              className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              aria-label="Cerrar"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-start gap-2.5 pr-6">
              <div className="mt-0.5 shrink-0 rounded-lg bg-primary/10 p-1.5">
                <Cookie className="h-4 w-4 text-primary" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground sm:text-[0.8125rem]">
                  {t("cookies.title")}
                </p>
                <p className="mt-1 text-[11px] leading-5 text-muted-foreground sm:text-[0.72rem] sm:leading-4">
                  {t("cookies.description")}{" "}
                  <Link to="/legal/cookies" className="font-medium text-primary hover:underline">
                    {t("cookies.learnMore")}
                  </Link>
                </p>
              </div>
            </div>

            <div className="mt-3 flex gap-2 sm:mt-2 sm:justify-end">
              <button
                onClick={reject}
                className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground sm:flex-none sm:px-2.5 sm:py-1.5 sm:text-[0.7rem]"
              >
                {t("cookies.reject")}
              </button>
              <button
                onClick={accept}
                className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-all hover:brightness-110 sm:flex-none sm:px-3 sm:py-1.5 sm:text-[0.7rem]"
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
