import { Router } from "express";
import { prisma } from "../server";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

// POST /api/leads — Public (from landing page contact form)
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) {
      res.status(400).json({ message: "name, email y message son obligatorios" });
      return;
    }

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
