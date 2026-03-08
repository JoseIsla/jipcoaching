import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AnimatedPage from "@/components/admin/AnimatedPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, Save, RotateCcw, Mail, UserPlus, CreditCard, AlertTriangle, KeyRound, MailCheck, Loader2, CloudOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import { DEV_MOCK } from "@/config/devMode";
import { useTranslation } from "@/i18n/useTranslation";

/* ── Shared style tokens ── */
const DEFAULTS = {
  logoUrl: "/assets/logo-jip.png",
  primaryColor: "hsl(110,100%,54%)",
  bgColor: "#000000",
  cardBg: "#111111",
  borderColor: "#292929",
  textColor: "#cccccc",
  mutedColor: "#999999",
  footerText: `© ${new Date().getFullYear()} JIP Performance Nutrition. Todos los derechos reservados.`,
};

/* ── Template definitions ── */
interface TemplateConfig {
  id: string;
  labelKey: string;
  icon: typeof Mail;
  descriptionKey: string;
  subject: string;
  heading: string;
  subheading: string;
  bodyText: string;
  ctaLabel: string;
  extraFields?: { key: string; labelKey: string; placeholderKey: string; defaultValue: string }[];
}

const TEMPLATE_DEFS: TemplateConfig[] = [
  {
    id: "welcome",
    labelKey: "emailTemplates.welcomeLabel",
    icon: UserPlus,
    descriptionKey: "emailTemplates.welcomeDesc",
    subject: "Bienvenido/a a JIP Coaching – Tu cuenta está lista",
    heading: "¡Bienvenido/a, {{nombre}}!",
    subheading: "Tu cuenta en JIP Coaching ha sido creada correctamente.",
    bodyText: "Ya puedes acceder a tu panel de cliente donde encontrarás tus planes de entrenamiento, nutrición, check-ins y mucho más.",
    ctaLabel: "Acceder a mi cuenta",
    extraFields: [
      { key: "warningText", labelKey: "emailTemplates.warningTextLabel", placeholderKey: "emailTemplates.warningTextPlaceholder", defaultValue: "⚠️ Te recomendamos cambiar tu contraseña después del primer inicio de sesión." },
    ],
  },
  {
    id: "payment_confirmation",
    labelKey: "emailTemplates.paymentConfirmationLabel",
    icon: CreditCard,
    descriptionKey: "emailTemplates.paymentConfirmationDesc",
    subject: "Pago confirmado – {{mes}} | JIP Coaching",
    heading: "Pago confirmado ✅",
    subheading: "Hola {{nombre}}, tu pago ha sido registrado correctamente.",
    bodyText: "Gracias por confiar en JIP Coaching. ¡Seguimos trabajando juntos! 💪",
    ctaLabel: "",
  },
  {
    id: "payment_reminder",
    labelKey: "emailTemplates.paymentReminderLabel",
    icon: AlertTriangle,
    descriptionKey: "emailTemplates.paymentReminderDesc",
    subject: "Recordatorio de pago – JIP Coaching",
    heading: "Recordatorio de pago",
    subheading: "Hola {{nombre}}, tu cuota mensual está pendiente.",
    bodyText: "Por favor, realiza el pago lo antes posible para mantener tu acceso activo a todos los servicios de JIP Coaching.",
    ctaLabel: "Acceder a mi cuenta",
  },
  {
    id: "password_reset",
    labelKey: "emailTemplates.passwordResetLabel",
    icon: KeyRound,
    descriptionKey: "emailTemplates.passwordResetDesc",
    subject: "Recupera tu contraseña – JIP Coaching",
    heading: "Recupera tu contraseña",
    subheading: "Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.",
    bodyText: "Haz clic en el botón de abajo para crear una nueva contraseña. Este enlace expirará en 30 minutos.",
    ctaLabel: "Restablecer contraseña",
    extraFields: [
      { key: "disclaimerText", labelKey: "emailTemplates.disclaimerTextLabel", placeholderKey: "emailTemplates.disclaimerTextPlaceholder", defaultValue: "Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña seguirá siendo la misma." },
    ],
  },
  {
    id: "email_change",
    labelKey: "emailTemplates.emailChangeLabel",
    icon: MailCheck,
    descriptionKey: "emailTemplates.emailChangeDesc",
    subject: "Confirma tu nuevo email – JIP Coaching",
    heading: "Confirma tu nuevo email",
    subheading: "Hemos recibido una solicitud para cambiar el email de tu cuenta a {{nuevoEmail}}.",
    bodyText: "Haz clic en el botón de abajo para confirmar el cambio. Este enlace expirará en 30 minutos.",
    ctaLabel: "Confirmar nuevo email",
    extraFields: [
      { key: "disclaimerText", labelKey: "emailTemplates.disclaimerTextLabel", placeholderKey: "emailTemplates.disclaimerTextPlaceholder", defaultValue: "Si no solicitaste este cambio, puedes ignorar este email. Tu email seguirá siendo el mismo." },
    ],
  },
];

/* ── Stored state per template ── */
interface TemplateState {
  subject: string;
  heading: string;
  subheading: string;
  bodyText: string;
  ctaLabel: string;
  extras: Record<string, string>;
}

const defaultStateFrom = (def: TemplateConfig): TemplateState => ({
  subject: def.subject,
  heading: def.heading,
  subheading: def.subheading,
  bodyText: def.bodyText,
  ctaLabel: def.ctaLabel,
  extras: Object.fromEntries((def.extraFields ?? []).map((f) => [f.key, f.defaultValue])),
});

/* ── HTML renderer ── */
const renderPreview = (tpl: TemplateState, def: TemplateConfig): string => {
  const d = DEFAULTS;
  const credentialsBlock = def.id === "welcome" ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:12px;border:1px solid ${d.borderColor};margin-bottom:24px;">
      <tr><td style="padding:20px;">
        <p style="color:${d.mutedColor};font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Tus credenciales</p>
        <p style="color:#ffffff;font-size:14px;margin:0 0 4px;"><strong>Email:</strong> cliente@email.com</p>
        <p style="color:#ffffff;font-size:14px;margin:0;"><strong>Contraseña:</strong> ••••••••</p>
      </td></tr>
    </table>` : "";

  const paymentBlock = def.id === "payment_confirmation" ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:12px;border:1px solid ${d.borderColor};margin-bottom:24px;">
      <tr><td style="padding:20px;">
        <p style="color:${d.mutedColor};font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Detalle</p>
        <p style="color:#ffffff;font-size:14px;margin:0 0 4px;"><strong>Período:</strong> marzo de 2026</p>
        <p style="color:#ffffff;font-size:14px;margin:0;"><strong>Importe:</strong> 120€</p>
      </td></tr>
    </table>` : "";

  const reminderAmountBlock = def.id === "payment_reminder" ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:12px;border:1px solid ${d.borderColor};margin-bottom:24px;">
      <tr><td style="padding:20px;text-align:center;">
        <p style="color:${d.mutedColor};font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Importe pendiente</p>
        <p style="color:#ff6b6b;font-size:28px;font-weight:800;margin:0;">120€</p>
      </td></tr>
    </table>` : "";

  const warningBlock = tpl.extras?.warningText ? `
    <p style="color:#ff6b6b;font-size:12px;line-height:18px;margin:0 0 24px;">${tpl.extras.warningText}</p>` : "";

  const disclaimerBlock = tpl.extras?.disclaimerText ? `
    <p style="color:#666666;font-size:12px;line-height:18px;margin:24px 0 0;">${tpl.extras.disclaimerText}</p>` : "";

  const ctaBlock = tpl.ctaLabel ? `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="#" style="display:inline-block;background-color:${d.primaryColor};color:#000000;font-weight:700;font-size:14px;text-decoration:none;padding:14px 32px;border-radius:12px;">
          ${tpl.ctaLabel}
        </a>
      </td></tr>
    </table>` : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:${d.bgColor};font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${d.bgColor};padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:${d.cardBg};border-radius:16px;border:1px solid ${d.borderColor};overflow:hidden;">
        <tr><td style="padding:32px 32px 0;text-align:center;">
          <img src="${d.logoUrl}" alt="JIP Coaching" width="80" style="display:block;margin:0 auto 24px;" />
          <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 8px;">${tpl.heading}</h1>
          <p style="color:${d.mutedColor};font-size:14px;margin:0;">${tpl.subheading}</p>
        </td></tr>
        <tr><td style="padding:32px;">
          ${credentialsBlock}
          ${paymentBlock}
          ${reminderAmountBlock}
          ${warningBlock}
          <p style="color:${d.textColor};font-size:14px;line-height:22px;margin:0 0 24px;">${tpl.bodyText}</p>
          ${ctaBlock}
          ${disclaimerBlock}
        </td></tr>
        <tr><td style="padding:0 32px 24px;text-align:center;border-top:1px solid ${d.borderColor};padding-top:20px;">
          <p style="color:#555555;font-size:11px;margin:0;">${d.footerText}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

/* ── Component ── */

const TemplateEditor = ({ def, apiData, onSaved }: { def: TemplateConfig; apiData?: TemplateState; onSaved: () => void }) => {
  const [state, setState] = useState<TemplateState>(() => apiData ?? defaultStateFrom(def));
  const [showPreview, setShowPreview] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Sync when API data arrives
  useEffect(() => {
    if (apiData) setState(apiData);
  }, [apiData]);

  const update = (field: keyof TemplateState, value: string) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  const updateExtra = (key: string, value: string) => {
    setState((prev) => ({ ...prev, extras: { ...prev.extras, [key]: value } }));
  };

  const handleSave = async () => {
    if (DEV_MOCK) {
      toast({ title: t("emailTemplates.devSaveTitle"), description: t("emailTemplates.devSaveDesc") });
      return;
    }

    setSaving(true);
    try {
      await api.put(`/email-templates/${def.id}`, {
        subject: state.subject,
        heading: state.heading,
        subheading: state.subheading,
        bodyText: state.bodyText,
        ctaLabel: state.ctaLabel,
        extras: state.extras,
      });
      toast({ title: t("emailTemplates.savedTitle"), description: t("emailTemplates.savedDesc") });
      onSaved();
    } catch {
      // api.ts already shows error toast
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setState(defaultStateFrom(def));
    toast({ title: t("emailTemplates.restoredTitle"), description: t("emailTemplates.restoredDesc") });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Editor */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <def.icon className="h-4 w-4 text-primary" />
              {t("emailTemplates.editTemplate")}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground">
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> {t("emailTemplates.restore")}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                {t("emailTemplates.save")}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{t(def.descriptionKey)}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">{t("emailTemplates.subjectLabel")}</Label>
            <Input value={state.subject} onChange={(e) => update("subject", e.target.value)} className="mt-1 bg-background" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">{t("emailTemplates.headingLabel")}</Label>
            <Input value={state.heading} onChange={(e) => update("heading", e.target.value)} className="mt-1 bg-background" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">{t("emailTemplates.subheadingLabel")}</Label>
            <Input value={state.subheading} onChange={(e) => update("subheading", e.target.value)} className="mt-1 bg-background" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">{t("emailTemplates.bodyTextLabel")}</Label>
            <Textarea value={state.bodyText} onChange={(e) => update("bodyText", e.target.value)} className="mt-1 bg-background min-h-[80px]" />
          </div>
          {state.ctaLabel !== undefined && (
            <div>
              <Label className="text-xs text-muted-foreground">{t("emailTemplates.ctaLabelField")}</Label>
              <Input value={state.ctaLabel} onChange={(e) => update("ctaLabel", e.target.value)} className="mt-1 bg-background" />
            </div>
          )}
          {(def.extraFields ?? []).map((ef) => (
            <div key={ef.key}>
              <Label className="text-xs text-muted-foreground">{t(ef.labelKey)}</Label>
              <Textarea
                value={state.extras[ef.key] ?? ""}
                onChange={(e) => updateExtra(ef.key, e.target.value)}
                placeholder={t(ef.placeholderKey)}
                className="mt-1 bg-background min-h-[60px]"
              />
            </div>
          ))}
          <div className="pt-2 border-t border-border">
            <p className="text-[11px] text-muted-foreground">
              {t("emailTemplates.variablesHint")} <code className="text-primary/80">{"{{nombre}}"}</code>, <code className="text-primary/80">{"{{email}}"}</code>, <code className="text-primary/80">{"{{mes}}"}</code>, <code className="text-primary/80">{"{{importe}}"}</code>, <code className="text-primary/80">{"{{nuevoEmail}}"}</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              {t("emailTemplates.preview")}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowPreview((v) => !v)}>
              {showPreview ? t("emailTemplates.hide") : t("emailTemplates.show")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t("emailTemplates.previewSubject")} <span className="text-foreground">{state.subject}</span></p>
        </CardHeader>
        {showPreview && (
          <CardContent className="p-0">
            <div className="border-t border-border">
              <iframe
                srcDoc={renderPreview(state, def)}
                className="w-full border-0 rounded-b-lg"
                style={{ minHeight: 520 }}
                title={`Preview ${t(def.labelKey)}`}
              />
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

const AdminEmailTemplates = () => {
  const [apiTemplates, setApiTemplates] = useState<Record<string, TemplateState>>({});
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  const fetchTemplates = useCallback(async () => {
    if (DEV_MOCK) { setLoading(false); return; }
    try {
      const data = await api.get<any[]>("/email-templates");
      const map: Record<string, TemplateState> = {};
      for (const t of data) {
        map[t.type] = {
          subject: t.subject,
          heading: t.heading,
          subheading: t.subheading,
          bodyText: t.bodyText,
          ctaLabel: t.ctaLabel,
          extras: t.extras || {},
        };
      }
      setApiTemplates(map);
    } catch {
      // Error toast shown by api client
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  return (
    <AdminLayout>
      <AnimatedPage>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("emailTemplates.title")}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t("emailTemplates.subtitle")}
            </p>
            {DEV_MOCK && (
              <div className="flex items-center gap-2 mt-2 text-xs text-amber-500">
                <CloudOff className="h-3.5 w-3.5" />
                {t("emailTemplates.devMode")}
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs defaultValue="welcome" className="space-y-6">
              <TabsList className="bg-muted/50 h-auto flex-wrap gap-1 p-1">
                {TEMPLATE_DEFS.map((def) => (
                  <TabsTrigger
                    key={def.id}
                    value={def.id}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 text-xs sm:text-sm"
                  >
                    <def.icon className="h-3.5 w-3.5" />
                    {t(def.labelKey)}
                  </TabsTrigger>
                ))}
              </TabsList>

              {TEMPLATE_DEFS.map((def) => (
                <TabsContent key={def.id} value={def.id}>
                  <TemplateEditor
                    def={def}
                    apiData={apiTemplates[def.id]}
                    onSaved={fetchTemplates}
                  />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </AnimatedPage>
    </AdminLayout>
  );
};

export default AdminEmailTemplates;
