/**
 * Shared email HTML builder that renders from DB-stored template fields.
 * All email senders should use this instead of hardcoded HTML.
 */

import { prisma } from "../server";

const FRONTEND_URL = (process.env.FRONTEND_URL || "https://jipcoaching.com").replace(/\/+$/, "");

interface TemplateFields {
  subject: string;
  heading: string;
  subheading: string;
  bodyText: string;
  ctaLabel: string;
  extras: Record<string, string>;
}

// Defaults matching the original hardcoded templates
const DEFAULTS: Record<string, TemplateFields> = {
  WELCOME: {
    subject: "Bienvenido/a a JIP Coaching – Tu cuenta está lista",
    heading: "¡Bienvenido/a, {{nombre}}!",
    subheading: "Tu cuenta en JIP Coaching ha sido creada correctamente.",
    bodyText: "Ya puedes acceder a tu panel de cliente donde encontrarás tus planes de entrenamiento, nutrición, check-ins y mucho más.",
    ctaLabel: "Acceder a mi cuenta",
    extras: { warningText: "⚠️ Te recomendamos cambiar tu contraseña después del primer inicio de sesión." },
  },
  PAYMENT_CONFIRMATION: {
    subject: "Pago confirmado – {{mes}} | JIP Coaching",
    heading: "Pago confirmado ✅",
    subheading: "Hola {{nombre}}, tu pago ha sido registrado correctamente.",
    bodyText: "Gracias por confiar en JIP Coaching. ¡Seguimos trabajando juntos! 💪",
    ctaLabel: "",
    extras: {},
  },
  PAYMENT_REMINDER: {
    subject: "Recordatorio de pago – JIP Coaching",
    heading: "Recordatorio de pago",
    subheading: "Hola {{nombre}}, tu cuota mensual está pendiente.",
    bodyText: "Por favor, realiza el pago lo antes posible para mantener tu acceso activo a todos los servicios de JIP Coaching.",
    ctaLabel: "Acceder a mi cuenta",
    extras: {},
  },
  PASSWORD_RESET: {
    subject: "Recupera tu contraseña – JIP Coaching",
    heading: "Recupera tu contraseña",
    subheading: "Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.",
    bodyText: "Haz clic en el botón de abajo para crear una nueva contraseña. Este enlace expirará en 30 minutos.",
    ctaLabel: "Restablecer contraseña",
    extras: { disclaimerText: "Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña seguirá siendo la misma." },
  },
};

/**
 * Load template fields from DB, falling back to hardcoded defaults.
 */
export async function getTemplateFields(type: string): Promise<TemplateFields> {
  try {
    const tpl = await prisma.emailTemplate.findUnique({ where: { type: type as any } });
    if (tpl) {
      return {
        subject: tpl.subject,
        heading: tpl.heading,
        subheading: tpl.subheading,
        bodyText: tpl.bodyText,
        ctaLabel: tpl.ctaLabel,
        extras: tpl.extrasJson ? JSON.parse(tpl.extrasJson) : {},
      };
    }
  } catch (err) {
    console.warn(`[EmailBuilder] Failed to load template ${type} from DB, using defaults`, err);
  }
  return DEFAULTS[type] || DEFAULTS.WELCOME;
}

/**
 * Replace {{variables}} in a string.
 */
function interpolate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

/**
 * Render the full HTML email from template fields + variables + optional custom blocks.
 */
export function renderEmailHtml(
  fields: TemplateFields,
  vars: Record<string, string>,
  options?: {
    /** Extra HTML block inserted before bodyText (e.g. credentials table) */
    preBodyBlock?: string;
    /** Extra HTML block inserted after bodyText (e.g. amount table) */
    postBodyBlock?: string;
    /** Override CTA href */
    ctaUrl?: string;
  },
): string {
  const heading = interpolate(fields.heading, vars);
  const subheading = interpolate(fields.subheading, vars);
  const bodyText = interpolate(fields.bodyText, vars);
  const ctaLabel = interpolate(fields.ctaLabel, vars);
  const warningText = fields.extras?.warningText ? interpolate(fields.extras.warningText, vars) : "";
  const disclaimerText = fields.extras?.disclaimerText ? interpolate(fields.extras.disclaimerText, vars) : "";

  const ctaBlock = ctaLabel && options?.ctaUrl ? `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${options.ctaUrl}" target="_blank" style="display:inline-block;background-color:hsl(110,100%,54%);color:#000000;font-weight:700;font-size:14px;text-decoration:none;padding:14px 32px;border-radius:12px;">
          ${ctaLabel}
        </a>
      </td></tr>
    </table>` : "";

  const warningBlock = warningText ? `
    <p style="color:#ff6b6b;font-size:12px;line-height:18px;margin:0 0 24px;">${warningText}</p>` : "";

  const disclaimerBlock = disclaimerText ? `
    <p style="color:#666666;font-size:12px;line-height:18px;margin:24px 0 0;">${disclaimerText}</p>` : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#000000;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#111111;border-radius:16px;border:1px solid #292929;overflow:hidden;">
        <tr><td style="padding:32px 32px 0;text-align:center;">
          <img src="${FRONTEND_URL}/assets/logo-jip.png" alt="JIP Coaching" width="80" style="display:block;margin:0 auto 24px;" />
          <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 8px;">${heading}</h1>
          <p style="color:#999999;font-size:14px;margin:0;">${subheading}</p>
        </td></tr>
        <tr><td style="padding:32px;">
          ${options?.preBodyBlock || ""}
          ${warningBlock}
          <p style="color:#cccccc;font-size:14px;line-height:22px;margin:0 0 24px;">${bodyText}</p>
          ${options?.postBodyBlock || ""}
          ${ctaBlock}
          ${disclaimerBlock}
        </td></tr>
        <tr><td style="padding:0 32px 24px;text-align:center;border-top:1px solid #292929;padding-top:20px;">
          <p style="color:#555555;font-size:11px;margin:0;">© ${new Date().getFullYear()} JIP Performance Nutrition. Todos los derechos reservados.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Convenience: load from DB + render in one call.
 */
export async function buildEmail(
  type: string,
  vars: Record<string, string>,
  options?: Parameters<typeof renderEmailHtml>[2],
): Promise<{ subject: string; html: string }> {
  const fields = await getTemplateFields(type);
  const subject = interpolate(fields.subject, vars);
  const html = renderEmailHtml(fields, vars, options);
  return { subject, html };
}
