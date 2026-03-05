import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Mail, Phone, User, MessageSquare, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useContactLeadsStore } from "@/data/useContactLeadsStore";
import { useTranslation } from "@/i18n/useTranslation";

const ContactSection = () => {
  const { t } = useTranslation();
  const addLead = useContactLeadsStore((s) => s.addLead);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t("landing.contact.name");
    if (!form.email.includes("@")) e.email = "Email";
    if (!form.phone.trim()) e.phone = t("landing.contact.phone");
    if (!form.message.trim()) e.message = t("landing.contact.message");
    if (!consent) e.consent = t("landing.contact.consentRequired");
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length > 0) { setErrors(v); return; }
    addLead({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), message: form.message.trim() });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <section id="contact" className="py-24 sm:py-32 bg-card">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="max-w-lg mx-auto px-4 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          >
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6" />
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
    <section id="contact" className="py-24 sm:py-32 bg-card">
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
          className="bg-background border border-border rounded-2xl p-6 sm:p-8 space-y-5 transition-shadow hover:shadow-lg hover:shadow-primary/5"
        >
          {[
            { key: "name", icon: User, type: "text", placeholder: t("landing.contact.namePlaceholder"), label: t("landing.contact.name") },
            { key: "email", icon: Mail, type: "email", placeholder: t("landing.contact.emailPlaceholder"), label: t("landing.contact.email") },
            { key: "phone", icon: Phone, type: "tel", placeholder: t("landing.contact.phonePlaceholder"), label: t("landing.contact.phone") },
          ].map((field, i) => (
            <motion.div
              key={field.key}
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="space-y-1.5"
            >
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5"><field.icon className="h-3.5 w-3.5" /> {field.label}</Label>
              <Input
                type={field.type}
                value={form[field.key as keyof typeof form]}
                onChange={(e) => { setForm({ ...form, [field.key]: e.target.value }); setErrors({ ...errors, [field.key]: "" }); }}
                placeholder={field.placeholder}
                className="bg-card border-border h-11 transition-all focus:shadow-md focus:shadow-primary/10"
              />
              {errors[field.key] && <p className="text-xs text-destructive">{errors[field.key]}</p>}
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.24 }}
            className="space-y-1.5"
          >
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> {t("landing.contact.message")}</Label>
            <Textarea
              value={form.message}
              onChange={(e) => { setForm({ ...form, message: e.target.value }); setErrors({ ...errors, message: "" }); }}
              placeholder={t("landing.contact.messagePlaceholder")}
              rows={4}
              className="bg-card border-border resize-none transition-all focus:shadow-md focus:shadow-primary/10"
            />
            {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
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
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                {t("landing.contact.consentText")}{" "}
                <Link to="/legal/privacidad" className="text-primary hover:underline font-medium">
                  {t("landing.contact.consentLink")}
                </Link>
              </span>
            </label>
            {errors.consent && <p className="text-xs text-destructive">{errors.consent}</p>}
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
          >
            <Send className="h-4 w-4" /> {t("landing.contact.send")}
          </motion.button>
        </motion.form>
      </div>
    </section>
  );
};

export default ContactSection;
