import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Mail, Phone, User, MessageSquare, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useContactLeadsStore } from "@/data/useContactLeadsStore";
import { useTranslation } from "@/i18n/useTranslation";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const ContactSection = () => {
  const { t } = useTranslation();
  const addLead = useContactLeadsStore((s) => s.addLead);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = t("landing.contact.name");
    if (!EMAIL_RE.test(form.email.trim())) e.email = "Email no válido";
    if (!form.phone.trim() || form.phone.trim().length < 6) e.phone = t("landing.contact.phone");
    if (!form.message.trim() || form.message.trim().length < 10) e.message = t("landing.contact.message");
    if (!consent) e.consent = t("landing.contact.consentRequired");
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length > 0) { setErrors(v); return; }
    addLead({
      name: form.name.trim().slice(0, 100),
      email: form.email.trim().slice(0, 255),
      phone: form.phone.trim().slice(0, 20),
      message: form.message.trim().slice(0, 1000),
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <section id="contact" className="py-24 sm:py-32 bg-card" aria-label={t("landing.contact.label")}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="max-w-lg mx-auto px-4 text-center"
          role="status"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          >
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6" aria-hidden="true" />
          </motion.div>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">{t("landing.contact.successTitle")}</h2>
          <p className="mt-4 text-muted-foreground">{t("landing.contact.successDesc")}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setSubmitted(false); setForm({ name: "", email: "", phone: "", message: "" }); }}
            className="mt-8 px-6 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted/50 transition-all"
          >
            {t("landing.contact.sendAnother")}
          </motion.button>
        </motion.div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-24 sm:py-32 bg-card" aria-label={t("landing.contact.label")}>
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} className="text-center mb-12">
          <span className="text-primary text-xs font-bold uppercase tracking-widest">{t("landing.contact.label")}</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-black text-foreground">{t("landing.contact.title")}</h2>
          <p className="mt-4 text-muted-foreground text-sm sm:text-base">{t("landing.contact.subtitle")}</p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          noValidate
          className="bg-background border border-border rounded-2xl p-6 sm:p-8 space-y-5 transition-shadow hover:shadow-lg hover:shadow-primary/5"
        >
          {[
            { key: "name", icon: User, type: "text", placeholder: t("landing.contact.namePlaceholder"), label: t("landing.contact.name"), maxLength: 100, autoComplete: "name" },
            { key: "email", icon: Mail, type: "email", placeholder: t("landing.contact.emailPlaceholder"), label: t("landing.contact.email"), maxLength: 255, autoComplete: "email" },
            { key: "phone", icon: Phone, type: "tel", placeholder: t("landing.contact.phonePlaceholder"), label: t("landing.contact.phone"), maxLength: 20, autoComplete: "tel" },
          ].map((field, i) => (
            <motion.div
              key={field.key}
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="space-y-1.5"
            >
              <Label htmlFor={`contact-${field.key}`} className="text-xs text-muted-foreground flex items-center gap-1.5">
                <field.icon className="h-3.5 w-3.5" aria-hidden="true" /> {field.label}
              </Label>
              <Input
                id={`contact-${field.key}`}
                type={field.type}
                value={form[field.key as keyof typeof form]}
                onChange={(e) => { setForm({ ...form, [field.key]: e.target.value }); setErrors({ ...errors, [field.key]: "" }); }}
                placeholder={field.placeholder}
                maxLength={field.maxLength}
                autoComplete={field.autoComplete}
                aria-invalid={!!errors[field.key]}
                aria-describedby={errors[field.key] ? `error-${field.key}` : undefined}
                className="bg-card border-border h-11 transition-all focus:shadow-md focus:shadow-primary/10"
              />
              {errors[field.key] && <p id={`error-${field.key}`} className="text-xs text-destructive" role="alert">{errors[field.key]}</p>}
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.24 }}
            className="space-y-1.5"
          >
            <Label htmlFor="contact-message" className="text-xs text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" /> {t("landing.contact.message")}
            </Label>
            <Textarea
              id="contact-message"
              value={form.message}
              onChange={(e) => { setForm({ ...form, message: e.target.value }); setErrors({ ...errors, message: "" }); }}
              placeholder={t("landing.contact.messagePlaceholder")}
              rows={4}
              maxLength={1000}
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? "error-message" : undefined}
              className="bg-card border-border resize-none transition-all focus:shadow-md focus:shadow-primary/10"
            />
            {errors.message && <p id="error-message" className="text-xs text-destructive" role="alert">{errors.message}</p>}
          </motion.div>
          {/* RGPD Consent checkbox */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.32 }}
            className="space-y-1.5"
          >
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => { setConsent(e.target.checked); setErrors({ ...errors, consent: "" }); }}
                className="mt-0.5 h-4 w-4 rounded border-border accent-primary shrink-0"
                aria-describedby={errors.consent ? "error-consent" : undefined}
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                {t("landing.contact.consentText")}{" "}
                <Link to="/legal/privacidad" className="text-primary hover:underline font-medium">
                  {t("landing.contact.consentLink")}
                </Link>
              </span>
            </label>
            {errors.consent && <p id="error-consent" className="text-xs text-destructive" role="alert">{errors.consent}</p>}
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
          >
            <Send className="h-4 w-4" aria-hidden="true" /> {t("landing.contact.send")}
          </motion.button>
        </motion.form>
      </div>
    </section>
  );
};

export default ContactSection;