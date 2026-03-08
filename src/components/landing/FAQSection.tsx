import { motion } from "framer-motion";
import { HelpCircle, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "@/i18n/useTranslation";

const faqsEs = [
  { q: "¿Cómo funciona el proceso de coaching?", a: "Una vez contactes conmigo, tendremos una consulta inicial gratuita para conocer tus objetivos, historial y preferencias. A partir de ahí, diseño tu plan personalizado y empezamos el seguimiento semanal." },
  { q: "¿Necesito experiencia previa para empezar?", a: "No. Trabajo con personas de todos los niveles, desde principiantes hasta atletas de competición. Cada plan se adapta 100% a tu nivel actual." },
  { q: "¿Cómo se realizan los check-ins semanales?", a: "A través de la app de coaching, donde envías tus métricas, fotos de progreso y feedback. Yo reviso todo y ajusto tu plan semanalmente." },
  { q: "¿Puedo cambiar de plan después de empezar?", a: "Sí, puedes cambiar o ampliar tu plan en cualquier momento. Muchos clientes empiezan con nutrición y luego añaden entrenamiento." },
  { q: "¿Qué incluye el seguimiento semanal?", a: "Revisión de adherencia, ajuste de macros o volumen de entrenamiento, feedback sobre tu técnica y soporte continuo por chat para resolver dudas." },
  { q: "¿Es todo online o presencial?", a: "El coaching es 100% online, lo que te permite seguir tu plan desde cualquier lugar. La comunicación es a través de la app y chat." },
  { q: "¿Cómo instalo la app en mi móvil?", a: "¡Es muy fácil! No necesitas App Store ni Play Store. Visita nuestra página de instalación con las instrucciones paso a paso para iPhone y Android.", isInstall: true },
];

const faqsEn = [
  { q: "How does the coaching process work?", a: "Once you contact me, we'll have a free initial consultation to learn about your goals, history, and preferences. From there, I design your custom plan and we start weekly tracking." },
  { q: "Do I need previous experience to start?", a: "No. I work with people of all levels, from beginners to competitive athletes. Each plan is 100% adapted to your current level." },
  { q: "How are weekly check-ins done?", a: "Through the coaching app, where you submit your metrics, progress photos, and feedback. I review everything and adjust your plan weekly." },
  { q: "Can I change plans after starting?", a: "Yes, you can change or upgrade your plan at any time. Many clients start with nutrition and then add training." },
  { q: "What does weekly tracking include?", a: "Adherence review, macro or training volume adjustments, technique feedback, and ongoing chat support for any questions." },
  { q: "Is everything online or in-person?", a: "Coaching is 100% online, allowing you to follow your plan from anywhere. Communication is through the app and chat." },
  { q: "How do I install the app on my phone?", a: "It's very easy! No App Store or Play Store needed. Visit our installation page with step-by-step instructions for iPhone and Android.", isInstall: true },
];

const FAQSection = () => {
  const { t } = useTranslation();
  const isEn = t("landing.faq.label") === "FAQ" && t("landing.faq.title") === "Frequently asked questions";
  const faqs = isEn ? faqsEn : faqsEs;

  return (
    <section id="faq" className="py-24 sm:py-32 bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-14"
        >
          <span className="text-primary text-xs font-bold uppercase tracking-widest">{t("landing.faq.label")}</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-black text-foreground">{t("landing.faq.title")}</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-card border border-border rounded-xl px-5 data-[state=open]:border-primary/30 transition-colors"
              >
                <AccordionTrigger className="text-sm sm:text-base font-semibold text-foreground hover:no-underline py-4">
                  <div className="flex items-center gap-3 text-left">
                    <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                    {faq.q}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4 pl-7">
                  {faq.a}
                  {(faq as any).isInstall && (
                    <Link
                      to="/install"
                      className="inline-flex items-center gap-1.5 mt-2 text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                      Ver instrucciones de instalación
                    </Link>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
