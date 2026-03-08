import { Router } from "express";
import { prisma } from "../server";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();
router.use(authenticate);
router.use(requireRole("ADMIN"));

// GET /api/email-templates — list all templates
router.get("/", async (_req, res) => {
  try {
    const templates = await prisma.emailTemplate.findMany({ orderBy: { type: "asc" } });
    // Map to frontend-friendly format
    const result = templates.map((t) => ({
      id: t.id,
      type: t.type.toLowerCase(),
      subject: t.subject,
      heading: t.heading,
      subheading: t.subheading,
      bodyText: t.bodyText,
      ctaLabel: t.ctaLabel,
      extras: t.extrasJson ? JSON.parse(t.extrasJson) : {},
      updatedAt: t.updatedAt,
    }));
    res.json(result);
  } catch (err: any) {
    console.error("GET /email-templates error:", err);
    res.status(500).json({ message: "Error al obtener plantillas" });
  }
});

// PUT /api/email-templates/:type — upsert a template by type
router.put("/:type", async (req, res) => {
  try {
    const typeMap: Record<string, string> = {
      welcome: "WELCOME",
      payment_confirmation: "PAYMENT_CONFIRMATION",
      payment_reminder: "PAYMENT_REMINDER",
      password_reset: "PASSWORD_RESET",
      email_change: "EMAIL_CHANGE",
    };
    const dbType = typeMap[req.params.type];
    if (!dbType) {
      res.status(400).json({ message: "Tipo de plantilla no válido" });
      return;
    }

    const { subject, heading, subheading, bodyText, ctaLabel, extras } = req.body;

    const template = await prisma.emailTemplate.upsert({
      where: { type: dbType as any },
      update: {
        subject,
        heading,
        subheading,
        bodyText,
        ctaLabel: ctaLabel || "",
        extrasJson: extras ? JSON.stringify(extras) : null,
      },
      create: {
        type: dbType as any,
        subject,
        heading,
        subheading,
        bodyText,
        ctaLabel: ctaLabel || "",
        extrasJson: extras ? JSON.stringify(extras) : null,
      },
    });

    res.json({
      id: template.id,
      type: template.type.toLowerCase(),
      subject: template.subject,
      heading: template.heading,
      subheading: template.subheading,
      bodyText: template.bodyText,
      ctaLabel: template.ctaLabel,
      extras: template.extrasJson ? JSON.parse(template.extrasJson) : {},
      updatedAt: template.updatedAt,
    });
  } catch (err: any) {
    console.error("PUT /email-templates/:type error:", err);
    res.status(500).json({ message: "Error al guardar plantilla" });
  }
});

export default router;
