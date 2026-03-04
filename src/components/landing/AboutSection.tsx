import { motion, useInView } from "framer-motion";
import { Award, Users, Calendar, GraduationCap } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import coachAbout from "@/assets/coach-about.jpg";
import { useTranslation } from "@/i18n/useTranslation";

const AnimatedNumber = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1200;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, value]);

  return <span ref={ref}>{display}{suffix}</span>;
};

const AboutSection = () => {
  const { t } = useTranslation();

  const stats = [
    { icon: Users, value: 50, suffix: "+", label: t("landing.about.stat1") },
    { icon: Calendar, value: 5, suffix: "+", label: t("landing.about.stat2") },
    { icon: Award, value: 100, suffix: "%", label: t("landing.about.stat3") },
    { icon: GraduationCap, value: 0, displayText: "NSCA", label: t("landing.about.stat4") },
  ];

  return (
    <section id="about" className="relative py-24 sm:py-32 bg-card">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-primary text-xs font-bold uppercase tracking-widest">{t("landing.about.label")}</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-foreground leading-tight">
              {t("landing.about.title")}
            </h2>
            <div className="mt-6 space-y-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
              <p>{t("landing.about.p1")}</p>
              <p>{t("landing.about.p2")}</p>
              <p>{t("landing.about.p3")}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="space-y-6"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-border group"
            >
              <img
                src={coachAbout}
                alt="Coach en competición de powerlifting"
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-primary/10" />
            </motion.div>

            <div className="grid grid-cols-2 gap-3">
              {stats.map(({ icon: Icon, value, suffix, displayText, label }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  whileHover={{ y: -4, borderColor: "hsl(110 100% 54% / 0.3)" }}
                  className="bg-background border border-border rounded-xl p-4 text-center transition-shadow hover:shadow-lg hover:shadow-primary/5"
                >
                  <Icon className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-xl font-black text-foreground">
                    {displayText ? displayText : <AnimatedNumber value={value} suffix={suffix} />}
                  </p>
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
