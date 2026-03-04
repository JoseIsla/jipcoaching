import { motion } from "framer-motion";
import { Award, Users, Calendar, GraduationCap } from "lucide-react";
import coachAbout from "@/assets/coach-about.jpg";

const stats = [
  { icon: Users, value: "50+", label: "Clientes activos" },
  { icon: Calendar, value: "5+", label: "Años de experiencia" },
  { icon: Award, value: "100%", label: "Planes a medida" },
  { icon: GraduationCap, value: "NSCA", label: "Certificación" },
];

const AboutSection = () => {
  return (
    <section id="about" className="relative py-24 sm:py-32 bg-card">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-primary text-xs font-bold uppercase tracking-widest">Sobre mí</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-foreground leading-tight">
              Tu coach de rendimiento y nutrición
            </h2>
            <div className="mt-6 space-y-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
              <p>
                Soy un profesional apasionado por el entrenamiento y la nutrición basados en evidencia científica.
                Mi enfoque combina la periodización del entrenamiento con estrategias nutricionales
                personalizadas para maximizar tus resultados.
              </p>
              <p>
                Cada plan que diseño se adapta a tu estilo de vida, tus preferencias y tus objetivos — ya sea
                perder grasa, ganar masa muscular, mejorar tu rendimiento deportivo o simplemente sentirte mejor.
              </p>
              <p>
                No creo en las soluciones rápidas ni en los planes genéricos. Creo en el proceso, la consistencia
                y en la relación de confianza con cada uno de mis clientes.
              </p>
            </div>
          </motion.div>

          {/* Photo + Stats */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="space-y-6"
          >
            {/* Coach photo */}
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-border">
              <img
                src={coachAbout}
                alt="Coach en competición de powerlifting"
                className="w-full h-full object-cover object-top"
                loading="lazy"
              />
              {/* Gradient overlay at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
              {/* Decorative glow */}
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-primary/10" />
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {stats.map(({ icon: Icon, value, label }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="bg-background border border-border rounded-xl p-4 text-center"
                >
                  <Icon className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-xl font-black text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
