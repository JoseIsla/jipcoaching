import { motion } from "framer-motion";
import { Utensils, Dumbbell, Crown, Check } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";

const PlansSection = () => {
  const { t } = useTranslation();

  const plans = [
    {
      icon: Utensils,
      name: "Nutrición",
      nameEn: "Nutrition",
      description: "Plan nutricional personalizado con seguimiento semanal y ajustes continuos.",
      descriptionEn: "Personalized nutrition plan with weekly tracking and continuous adjustments.",
      features: [
        { es: "Plan de alimentación a medida", en: "Custom meal plan" },
        { es: "Ajustes semanales según progreso", en: "Weekly adjustments based on progress" },
        { es: "Lista de alimentos y alternativas", en: "Food list and alternatives" },
        { es: "Soporte por chat", en: "Chat support" },
      ],
      accent: false,
    },
    {
      icon: Crown,
      name: "Nutrición + Entrenamiento",
      nameEn: "Nutrition + Training",
      description: "El paquete completo. Nutrición y entrenamiento diseñados para trabajar en sinergia.",
      descriptionEn: "The complete package. Nutrition and training designed to work in synergy.",
      features: [
        { es: "Todo lo del plan de Nutrición", en: "Everything in Nutrition plan" },
        { es: "Rutina de entrenamiento periodizada", en: "Periodized training routine" },
        { es: "Vídeos de técnica y correcciones", en: "Technique videos and corrections" },
        { es: "Check-ins semanales completos", en: "Complete weekly check-ins" },
        { es: "Prioridad en soporte", en: "Priority support" },
      ],
      accent: true,
    },
    {
      icon: Dumbbell,
      name: "Entrenamiento",
      nameEn: "Training",
      description: "Programa de entrenamiento periodizado y adaptado a tu nivel y equipamiento.",
      descriptionEn: "Periodized training program adapted to your level and equipment.",
      features: [
        { es: "Rutina personalizada", en: "Custom routine" },
        { es: "Progresiones y deloads planificados", en: "Planned progressions and deloads" },
        { es: "Revisión de técnica con vídeo", en: "Video technique review" },
        { es: "Ajustes según feedback", en: "Adjustments based on feedback" },
      ],
      accent: false,
    },
  ];

  const lang = t("landing.plans.label") === "Services" ? "en" : "es";

  return (
    <section id="plans" className="relative py-24 sm:py-32 bg-background">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <span className="text-primary text-xs font-bold uppercase tracking-widest">{t("landing.plans.label")}</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-black text-foreground">{t("landing.plans.title")}</h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">{t("landing.plans.subtitle")}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className={`relative rounded-2xl p-6 sm:p-8 border transition-all ${
                plan.accent
                  ? "bg-gradient-to-b from-primary/10 to-card border-primary/40 shadow-xl shadow-primary/10 scale-[1.03] md:scale-105"
                  : "bg-card border-border hover:border-primary/20"
              }`}
            >
              {plan.accent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
                  {t("landing.plans.popular")}
                </div>
              )}

              <plan.icon className={`h-8 w-8 mb-4 ${plan.accent ? "text-primary" : "text-muted-foreground"}`} />
              <h3 className="text-xl font-bold text-foreground">{lang === "en" ? plan.nameEn : plan.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{lang === "en" ? plan.descriptionEn : plan.description}</p>

              <ul className="mt-6 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f.es} className="flex items-start gap-2 text-sm text-foreground/80">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {lang === "en" ? f.en : f.es}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })}
                className={`mt-8 w-full py-3 rounded-xl text-sm font-bold transition-all ${
                  plan.accent
                    ? "bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/25"
                    : "border border-border text-foreground hover:bg-muted/50"
                }`}
              >
                {t("landing.plans.cta")}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlansSection;
