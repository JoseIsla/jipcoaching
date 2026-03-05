import { Router } from "express";
import { prisma } from "../server";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);

// GET /api/notifications
router.get("/", async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json(notifications);
  } catch (err: any) {
    res.status(500).json({ message: "Error al obtener notificaciones" });
  }
});

// POST /api/notifications
router.post("/", async (req, res) => {
  try {
    const { userId, type, title, message, link } = req.body;
    const notification = await prisma.notification.create({
      data: { userId: userId || req.user!.userId, type, title, message, link },
    });
    res.status(201).json(notification);
  } catch (err: any) {
    res.status(500).json({ message: "Error al crear notificación" });
  }
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", async (req, res) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });
    res.json({ message: "Marcada como leída" });
  } catch (err: any) {
    res.status(500).json({ message: "Error al actualizar notificación" });
  }
});

// PATCH /api/notifications/read-all
router.patch("/read-all", async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, read: false },
      data: { read: true },
    });
    res.json({ message: "Todas marcadas como leídas" });
  } catch (err: any) {
    res.status(500).json({ message: "Error al actualizar notificaciones" });
  }
});

// DELETE /api/notifications/:id
router.delete("/:id", async (req, res) => {
  try {
    await prisma.notification.delete({ where: { id: req.params.id } });
    res.json({ message: "Notificación eliminada" });
  } catch (err: any) {
    res.status(500).json({ message: "Error al eliminar notificación" });
  }
});

export default router;
