import { Router } from "express";
import { prisma } from "../server";
import { authenticate } from "../middleware/auth";

const router = Router();

// GET /api/testimonials — Public
router.get("/", async (_req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(testimonials);
  } catch (err: any) {
    res.status(500).json({ message: "Error al obtener testimonios" });
  }
});

// POST /api/testimonials — Authenticated (client submits their own)
router.post("/", authenticate, async (req, res) => {
  try {
    const { clientName, text, rating } = req.body;

    const client = await prisma.client.findUnique({ where: { userId: req.user!.userId } });
    if (!client) { res.status(404).json({ message: "Cliente no encontrado" }); return; }

    const testimonial = await prisma.testimonial.upsert({
      where: { clientId: client.id },
      update: { clientName: clientName || client.name, text, rating },
      create: {
        clientId: client.id,
        clientName: clientName || client.name,
        text,
        rating,
      },
    });

    res.status(201).json(testimonial);
  } catch (err: any) {
    res.status(500).json({ message: "Error al enviar testimonio" });
  }
});

export default router;
