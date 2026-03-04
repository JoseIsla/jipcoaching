import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useTestimonialStore } from "@/data/useTestimonialStore";

const TestimonialsSection = () => {
  const testimonials = useTestimonialStore((s) => s.testimonials);

  if (testimonials.length === 0) return null;

  return (
    <section id="testimonials" className="py-24 sm:py-32 bg-card">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <span className="text-primary text-xs font-bold uppercase tracking-widest">Testimonios</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-black text-foreground">
            Lo que dicen mis clientes
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative bg-background border border-border rounded-2xl p-6 sm:p-8"
            >
              <Quote className="h-6 w-6 text-primary/30 absolute top-5 right-5" />
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-foreground/80 text-sm sm:text-base leading-relaxed italic">
                "{t.text}"
              </p>
              <p className="mt-4 text-sm font-bold text-foreground">
                {t.clientName.split(" ")[0]} {t.clientName.split(" ")[1]?.[0] ? `${t.clientName.split(" ")[1][0]}.` : ""}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
