import { motion } from "framer-motion";
import { ArrowDown, Zap, Target, TrendingUp } from "lucide-react";
import coachHero from "@/assets/coach-hero.jpg";
import { useTranslation } from "@/i18n/useTranslation";

const floatingVariants = {
  animate: {
    y: [0, -8, 0],
    transition: { repeat: Infinity, duration: 4, ease: "easeInOut" as const },
  },
};

const HeroSection = () => {
  const { t } = useTranslation();

  const scrollToAbout = () => {
    document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background"
    >
      {/* Background image with subtle zoom */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.8, ease: "easeOut" }}
      >
        <img
          src={coachHero}
          alt="Competición de powerlifting"
          className="w-full h-full object-cover object-[center_55%] opacity-[0.18]"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </motion.div>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(110_100%_54%/0.08)_0%,transparent_60%)]" />

      {/* Floating ambient particles */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-primary/10 blur-2xl pointer-events-none"
          style={{
            width: 80 + i * 60,
            height: 80 + i * 60,
            top: `${20 + i * 25}%`,
            left: `${10 + i * 30}%`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            repeat: Infinity,
            duration: 5 + i * 2,
            ease: "easeInOut",
            delay: i * 0.8,
          }}
        />
      ))}

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold mb-8 uppercase tracking-wider"
          >
            <Zap className="h-3.5 w-3.5" />
            {t("landing.hero.badge")}
          </motion.div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-foreground leading-[1.05] tracking-tight">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="inline-block"
            >
              {t("landing.hero.titleLine1")}{" "}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.6 }}
              className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent"
            >
              {t("landing.hero.titleHighlight")}
            </motion.span>
            <br />
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="inline-block"
            >
              {t("landing.hero.titleLine2")}
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            {t("landing.hero.subtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })}
              className="px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/25 animate-pulse-glow"
            >
              {t("landing.hero.cta")}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => document.querySelector("#plans")?.scrollIntoView({ behavior: "smooth" })}
              className="px-8 py-3.5 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-muted/50 transition-all"
            >
              {t("landing.hero.ctaSecondary")}
            </motion.button>
          </motion.div>

          <motion.div
            variants={floatingVariants}
            animate="animate"
            className="mt-14 flex flex-wrap items-center justify-center gap-3 sm:gap-6"
          >
            {[
              { icon: Target, text: t("landing.hero.pill1") },
              { icon: TrendingUp, text: t("landing.hero.pill2") },
              { icon: Zap, text: t("landing.hero.pill3") },
            ].map(({ icon: Icon, text }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + i * 0.15 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/40 border border-border/50 text-xs sm:text-sm text-muted-foreground backdrop-blur-sm"
              >
                <Icon className="h-3.5 w-3.5 text-primary" />
                {text}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.button
          onClick={scrollToAbout}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground hover:text-primary transition-colors"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          >
            <ArrowDown className="h-5 w-5" />
          </motion.div>
        </motion.button>
      </div>
    </section>
  );
};

export default HeroSection;
