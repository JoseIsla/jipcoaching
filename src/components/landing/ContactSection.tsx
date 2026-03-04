import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Mail, Phone, User, MessageSquare, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useContactLeadsStore } from "@/data/useContactLeadsStore";

const ContactSection = () => {
  const addLead = useContactLeadsStore((s) => s.addLead);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "El nombre es obligatorio";
    if (!form.email.includes("@")) e.email = "Introduce un email válido";
    if (!form.phone.trim()) e.phone = "El teléfono es obligatorio";
    if (!form.message.trim()) e.message = "Escribe un mensaje";
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length > 0) {
      setErrors(v);
      return;
    }
    addLead({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), message: form.message.trim() });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <section id="contact" className="py-24 sm:py-32 bg-card">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg mx-auto px-4 text-center"
        >
          <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6" />
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">¡Mensaje enviado!</h2>
          <p className="mt-4 text-muted-foreground">
            Gracias por tu interés. Me pondré en contacto contigo lo antes posible para concertar una consulta.
          </p>
          <button
            onClick={() => { setSubmitted(false); setForm({ name: "", email: "", phone: "", message: "" }); }}
            className="mt-8 px-6 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted/50 transition-all"
          >
            Enviar otro mensaje
          </button>
        </motion.div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-24 sm:py-32 bg-card">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-12"
        >
          <span className="text-primary text-xs font-bold uppercase tracking-widest">Contacto</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-black text-foreground">
            ¿Listo para empezar?
          </h2>
          <p className="mt-4 text-muted-foreground text-sm sm:text-base">
            Rellena el formulario y me pondré en contacto contigo para una consulta inicial gratuita.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          className="bg-background border border-border rounded-2xl p-6 sm:p-8 space-y-5"
        >
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Nombre completo
            </Label>
            <Input
              value={form.name}
              onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: "" }); }}
              placeholder="Tu nombre"
              className="bg-card border-border h-11"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Email
            </Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: "" }); }}
              placeholder="tu@email.com"
              className="bg-card border-border h-11"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> Teléfono
            </Label>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => { setForm({ ...form, phone: e.target.value }); setErrors({ ...errors, phone: "" }); }}
              placeholder="+34 600 000 000"
              className="bg-card border-border h-11"
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" /> Mensaje
            </Label>
            <Textarea
              value={form.message}
              onChange={(e) => { setForm({ ...form, message: e.target.value }); setErrors({ ...errors, message: "" }); }}
              placeholder="Cuéntame un poco sobre tus objetivos..."
              rows={4}
              className="bg-card border-border resize-none"
            />
            {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
          >
            <Send className="h-4 w-4" />
            Enviar mensaje
          </button>
        </motion.form>
      </div>
    </section>
  );
};

export default ContactSection;
