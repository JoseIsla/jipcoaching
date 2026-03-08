import { Router } from "express";
import { z } from "zod";
import { prisma } from "../server";
import { authenticate, requireRole } from "../middleware/auth";
import { rateLimit } from "../middleware/rateLimiter";

const router = Router();

// Rate limit: max 10 lead submissions per IP every 15 minutes
const leadLimiter = rateLimit({ windowSec: 15 * 60, max: 10 });

const leadSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(20).optional(),
  message: z.string().trim().min(1).max(2000),
});

// POST /api/leads — Public (from landing page contact form)
router.post("/", leadLimiter, async (req, res) => {
  try {
    const parsed = leadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Datos inválidos", errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { name, email, phone, message } = parsed.data;

    const lead = await prisma.contactLead.create({
      data: { name, email, phone, message },
    });

    // Create notification for all admin users
    try {
      const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: "client",
            title: "Nuevo lead recibido",
            message: `${name} ha enviado un mensaje desde la web`,
            link: "/admin/leads",
          },
        });
      }
    } catch (notifErr) {
      console.warn("Failed to create lead notification:", notifErr);
    }

    res.status(201).json(lead);
  } catch (err: any) {
    res.status(500).json({ message: "Error al enviar mensaje" });
  }
});

// GET /api/leads — Admin only
router.get("/", authenticate, requireRole("ADMIN"), async (_req, res) => {
  try {
    const leads = await prisma.contactLead.findMany({ orderBy: { createdAt: "desc" } });
    res.json(leads);
  } catch (err: any) {
    res.status(500).json({ message: "Error al obtener leads" });
  }
});

// PATCH /api/leads/:id/read — Admin only
router.patch("/:id/read", authenticate, requireRole("ADMIN"), async (req, res) => {
  try {
    await prisma.contactLead.update({
      where: { id: req.params.id as string },
      data: { read: true },
    });
    res.json({ message: "Marcado como leído" });
  } catch (err: any) {
    res.status(500).json({ message: "Error al actualizar lead" });
  }
});

// DELETE /api/leads/:id — Admin only
router.delete("/:id", authenticate, requireRole("ADMIN"), async (req, res) => {
  try {
    await prisma.contactLead.delete({ where: { id: req.params.id as string } });
    res.json({ message: "Lead eliminado" });
  } catch (err: any) {
    res.status(500).json({ message: "Error al eliminar lead" });
  }
});

export default router;
