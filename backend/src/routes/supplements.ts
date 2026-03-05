import { Router } from "express";
import { prisma } from "../server";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();
router.use(authenticate);

// GET /api/supplements
router.get("/", async (_req, res) => {
  try {
    const supplements = await prisma.supplement.findMany({ orderBy: { name: "asc" } });
    res.json(supplements);
  } catch (err: any) {
    res.status(500).json({ message: "Error al obtener suplementos" });
  }
});

// POST /api/supplements — Admin only
router.post("/", requireRole("ADMIN"), async (req, res) => {
  try {
    const { name, dose, timing } = req.body;
    const supplement = await prisma.supplement.create({ data: { name, dose, timing } });
    res.status(201).json(supplement);
  } catch (err: any) {
    res.status(500).json({ message: "Error al crear suplemento" });
  }
});

// PUT /api/supplements/:id — Admin only
router.put("/:id", requireRole("ADMIN"), async (req, res) => {
  try {
    const { name, dose, timing } = req.body;
    const supplement = await prisma.supplement.update({
      where: { id: req.params.id },
      data: { name, dose, timing },
    });
    res.json(supplement);
  } catch (err: any) {
    res.status(500).json({ message: "Error al actualizar suplemento" });
  }
});

// DELETE /api/supplements/:id — Admin only
router.delete("/:id", requireRole("ADMIN"), async (req, res) => {
  try {
    await prisma.supplement.delete({ where: { id: req.params.id } });
    res.json({ message: "Suplemento eliminado" });
  } catch (err: any) {
    res.status(500).json({ message: "Error al eliminar suplemento" });
  }
});

export default router;
