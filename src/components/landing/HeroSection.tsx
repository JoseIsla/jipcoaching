import { motion } from "framer-motion";
import { ArrowDown, Zap, Target, TrendingUp } from "lucide-react";
import coachHero from "@/assets/coach-hero.jpg";

const HeroSection = () => {
  const scrollToAbout = () => {
    document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background"
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={coachHero}
          alt="Competición de powerlifting"
          className="w-full h-full object-cover object-[center_70%] opacity-25"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(110_100%_54%/0.08)_0%,transparent_60%)]" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold mb-8 uppercase tracking-wider"
          >
            <Zap className="h-3.5 w-3.5" />
            Coaching personalizado
          </motion.div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-foreground leading-[1.05] tracking-tight">
            Transforma tu{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              rendimiento
            </span>
            <br />
            al siguiente nivel
          </h1>

          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Nutrición y entrenamiento basados en ciencia, diseñados a medida para tus objetivos.
            Sin plantillas genéricas, sin atajos — resultados reales.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })}
              className="px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/25 animate-pulse-glow"
            >
              Empieza ahora
            </button>
            <button
              onClick={() => document.querySelector("#plans")?.scrollIntoView({ behavior: "smooth" })}
              className="px-8 py-3.5 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-muted/50 transition-all"
            >
              Ver planes
            </button>
          </div>

          {/* Feature pills */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-3 sm:gap-6">
            {[
              { icon: Target, text: "100% personalizado" },
              { icon: TrendingUp, text: "Seguimiento semanal" },
              { icon: Zap, text: "Basado en ciencia" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/40 border border-border/50 text-xs sm:text-sm text-muted-foreground"
              >
                <Icon className="h-3.5 w-3.5 text-primary" />
                {text}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Scroll indicator */}
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
