import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "¿Cómo funciona el proceso de coaching?",
    a: "Una vez contactes conmigo, tendremos una consulta inicial gratuita para conocer tus objetivos, historial y preferencias. A partir de ahí, diseño tu plan personalizado y empezamos el seguimiento semanal.",
  },
  {
    q: "¿Necesito experiencia previa para empezar?",
    a: "No. Trabajo con personas de todos los niveles, desde principiantes hasta atletas de competición. Cada plan se adapta 100% a tu nivel actual.",
  },
  {
    q: "¿Cómo se realizan los check-ins semanales?",
    a: "A través de la app de coaching, donde envías tus métricas, fotos de progreso y feedback. Yo reviso todo y ajusto tu plan semanalmente.",
  },
  {
    q: "¿Puedo cambiar de plan después de empezar?",
    a: "Sí, puedes cambiar o ampliar tu plan en cualquier momento. Muchos clientes empiezan con nutrición y luego añaden entrenamiento.",
  },
  {
    q: "¿Qué incluye el seguimiento semanal?",
    a: "Revisión de adherencia, ajuste de macros o volumen de entrenamiento, feedback sobre tu técnica y soporte continuo por chat para resolver dudas.",
  },
  {
    q: "¿Es todo online o presencial?",
    a: "El coaching es 100% online, lo que te permite seguir tu plan desde cualquier lugar. La comunicación es a través de la app y chat.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-24 sm:py-32 bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-14"
        >
          <span className="text-primary text-xs font-bold uppercase tracking-widest">FAQ</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-black text-foreground">
            Preguntas frecuentes
          </h2>
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
