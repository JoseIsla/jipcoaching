import { motion } from "framer-motion";
import { Utensils, Dumbbell, Crown, Check } from "lucide-react";

const plans = [
  {
    icon: Utensils,
    name: "Nutrición",
    description: "Plan nutricional personalizado con seguimiento semanal y ajustes continuos.",
    features: [
      "Plan de alimentación a medida",
      "Ajustes semanales según progreso",
      "Lista de alimentos y alternativas",
      "Soporte por chat",
    ],
    accent: false,
  },
  {
    icon: Crown,
    name: "Nutrición + Entrenamiento",
    description: "El paquete completo. Nutrición y entrenamiento diseñados para trabajar en sinergia.",
    features: [
      "Todo lo del plan de Nutrición",
      "Rutina de entrenamiento periodizada",
      "Vídeos de técnica y correcciones",
      "Check-ins semanales completos",
      "Prioridad en soporte",
    ],
    accent: true,
  },
  {
    icon: Dumbbell,
    name: "Entrenamiento",
    description: "Programa de entrenamiento periodizado y adaptado a tu nivel y equipamiento.",
    features: [
      "Rutina personalizada",
      "Progresiones y deloads planificados",
      "Revisión de técnica con vídeo",
      "Ajustes según feedback",
    ],
    accent: false,
  },
];

const PlansSection = () => {
  return (
    <section id="plans" className="relative py-24 sm:py-32 bg-background">
      {/* Subtle glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <span className="text-primary text-xs font-bold uppercase tracking-widest">Servicios</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-black text-foreground">
            Planes de coaching
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">
            Elige el plan que mejor se adapte a tus necesidades. Contacta conmigo para conocer
            precios y disponibilidad.
          </p>
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
                  Más popular
                </div>
              )}

              <plan.icon className={`h-8 w-8 mb-4 ${plan.accent ? "text-primary" : "text-muted-foreground"}`} />

              <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{plan.description}</p>

              <ul className="mt-6 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {f}
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
                Solicitar información
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlansSection;
