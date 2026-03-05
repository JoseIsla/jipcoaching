import { Router } from "express";
import { prisma } from "../server";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();
router.use(authenticate);

// GET /api/exercises
router.get("/", async (_req, res) => {
  try {
    const exercises = await prisma.exercise.findMany({ orderBy: { name: "asc" } });
    res.json(exercises);
  } catch (err: any) {
    res.status(500).json({ message: "Error al obtener ejercicios" });
  }
});

// POST /api/exercises — Admin only
router.post("/", requireRole("ADMIN"), async (req, res) => {
  try {
    const { name, category, muscleGroup, videoUrl, notes, parentExerciseId } = req.body;
    if (!name || !category) {
      res.status(400).json({ message: "name y category son obligatorios" });
      return;
    }
    const exercise = await prisma.exercise.create({
      data: { name, category, muscleGroup, videoUrl, notes, parentExerciseId },
    });
    res.status(201).json(exercise);
  } catch (err: any) {
    res.status(500).json({ message: "Error al crear ejercicio" });
  }
});

// PATCH /api/exercises/:id — Admin only
router.patch("/:id", requireRole("ADMIN"), async (req, res) => {
  try {
    const { name, category, muscleGroup, videoUrl, notes, parentExerciseId } = req.body;
    const exercise = await prisma.exercise.update({
      where: { id: req.params.id as string },
      data: {
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(muscleGroup !== undefined && { muscleGroup }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(notes !== undefined && { notes }),
        ...(parentExerciseId !== undefined && { parentExerciseId }),
      },
    });
    res.json(exercise);
  } catch (err: any) {
    res.status(500).json({ message: "Error al actualizar ejercicio" });
  }
});

// DELETE /api/exercises/:id — Admin only
router.delete("/:id", requireRole("ADMIN"), async (req, res) => {
  try {
    await prisma.exercise.delete({ where: { id: req.params.id as string } });
    res.json({ message: "Ejercicio eliminado" });
  } catch (err: any) {
    res.status(500).json({ message: "Error al eliminar ejercicio" });
  }
});

export default router;
