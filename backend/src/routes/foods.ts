import { Router } from "express";
import { prisma } from "../server";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();
router.use(authenticate);

// GET /api/foods?type=FRUIT|VEGETABLE
router.get("/", async (req, res) => {
  try {
    const type = req.query.type as string | undefined;
    const where = type ? { type: type as any } : {};
    const items = await prisma.globalFoodItem.findMany({
      where,
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });
    res.json(items);
  } catch (err: any) {
    console.error("GET /foods error:", err);
    res.status(500).json({ message: "Error al obtener alimentos" });
  }
});

// POST /api/foods — Admin only
router.post("/", requireRole("ADMIN"), async (req, res) => {
  try {
    const { type, name } = req.body;
    if (!type || !name) {
      res.status(400).json({ message: "type y name son obligatorios" });
      return;
    }

    const count = await prisma.globalFoodItem.count({ where: { type } });
    const item = await prisma.globalFoodItem.create({
      data: { type, name: name.trim(), order: count },
    });
    res.status(201).json(item);
  } catch (err: any) {
    if (err?.code === "P2002") {
      res.status(400).json({ message: "Este alimento ya existe" });
      return;
    }
    console.error("POST /foods error:", err);
    res.status(500).json({ message: "Error al crear alimento" });
  }
});

// PUT /api/foods/:id — Admin only
router.put("/:id", requireRole("ADMIN"), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ message: "name es obligatorio" });
      return;
    }
    const item = await prisma.globalFoodItem.update({
      where: { id: req.params.id as string },
      data: { name: name.trim() },
    });
    res.json(item);
  } catch (err: any) {
    console.error("PUT /foods/:id error:", err);
    res.status(500).json({ message: "Error al actualizar alimento" });
  }
});

// DELETE /api/foods/:id — Admin only
router.delete("/:id", requireRole("ADMIN"), async (req, res) => {
  try {
    await prisma.globalFoodItem.delete({ where: { id: req.params.id as string } });
    res.json({ message: "Alimento eliminado" });
  } catch (err: any) {
    console.error("DELETE /foods/:id error:", err);
    res.status(500).json({ message: "Error al eliminar alimento" });
  }
});

export default router;
