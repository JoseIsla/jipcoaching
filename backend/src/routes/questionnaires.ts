import { Router, Request, Response } from "express";
import { prisma } from "../server";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

// ── GET /api/questionnaires — List all templates (admin)
router.get("/", authenticate, requireRole("ADMIN"), async (_req: Request, res: Response) => {
  try {
    const templates = await prisma.questionnaireTemplate.findMany({
      include: {
        questions: { orderBy: { order: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(templates);
  } catch (err) {
    console.error("Error fetching questionnaire templates:", err);
    res.status(500).json({ message: "Error al obtener plantillas" });
  }
});

// ── GET /api/questionnaires/:id — Get single template
router.get("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const template = await prisma.questionnaireTemplate.findUnique({
      where: { id: req.params.id },
      include: {
        questions: { orderBy: { order: "asc" } },
      },
    });
    if (!template) return res.status(404).json({ message: "Plantilla no encontrada" });
    res.json(template);
  } catch (err) {
    console.error("Error fetching template:", err);
    res.status(500).json({ message: "Error al obtener plantilla" });
  }
});

// ── POST /api/questionnaires — Create template (admin)
router.post("/", authenticate, requireRole("ADMIN"), async (req: Request, res: Response) => {
  try {
    const { name, description, category, dayOfWeek, scope, clientId, questions } = req.body;

    const template = await prisma.questionnaireTemplate.create({
      data: {
        name,
        description,
        category: category || "NUTRITION",
        dayOfWeek: dayOfWeek ?? null,
        scope: scope || "GLOBAL",
        clientId: clientId ?? null,
        questions: {
          create: (questions || []).map((q: any, idx: number) => ({
            type: q.type,
            label: q.label,
            required: q.required ?? true,
            order: q.order ?? idx,
            optionsJson: q.options ? JSON.stringify(q.options) : null,
          })),
        },
      },
      include: {
        questions: { orderBy: { order: "asc" } },
      },
    });

    res.status(201).json(template);
  } catch (err) {
    console.error("Error creating template:", err);
    res.status(500).json({ message: "Error al crear plantilla" });
  }
});

// ── PUT /api/questionnaires/:id — Update template (admin)
router.put("/:id", authenticate, requireRole("ADMIN"), async (req: Request, res: Response) => {
  try {
    const { name, description, category, dayOfWeek, scope, clientId, isActive, questions } = req.body;

    // Update template fields
    const template = await prisma.questionnaireTemplate.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        category,
        dayOfWeek: dayOfWeek ?? undefined,
        scope,
        clientId: clientId ?? undefined,
        isActive: isActive ?? undefined,
        version: { increment: 1 },
      },
    });

    // If questions provided, replace all
    if (questions) {
      await prisma.questionnaireQuestion.deleteMany({
        where: { templateId: req.params.id },
      });

      await prisma.questionnaireQuestion.createMany({
        data: questions.map((q: any, idx: number) => ({
          templateId: req.params.id,
          type: q.type,
          label: q.label,
          required: q.required ?? true,
          order: q.order ?? idx,
          optionsJson: q.options ? JSON.stringify(q.options) : null,
        })),
      });
    }

    const result = await prisma.questionnaireTemplate.findUnique({
      where: { id: req.params.id },
      include: {
        questions: { orderBy: { order: "asc" } },
      },
    });

    res.json(result);
  } catch (err) {
    console.error("Error updating template:", err);
    res.status(500).json({ message: "Error al actualizar plantilla" });
  }
});

// ── DELETE /api/questionnaires/:id — Delete template (admin)
router.delete("/:id", authenticate, requireRole("ADMIN"), async (req: Request, res: Response) => {
  try {
    await prisma.questionnaireTemplate.delete({
      where: { id: req.params.id },
    });
    res.json({ message: "Plantilla eliminada" });
  } catch (err) {
    console.error("Error deleting template:", err);
    res.status(500).json({ message: "Error al eliminar plantilla" });
  }
});

// ── GET /api/questionnaires/me/active — Get active questionnaire for current client
router.get("/me/active", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const client = await prisma.client.findUnique({ where: { userId } });
    if (!client) return res.status(404).json({ message: "Cliente no encontrado" });

    // Find pending checkin for this client with its template
    const checkin = await prisma.checkin.findFirst({
      where: { clientId: client.id, status: "PENDING" },
      orderBy: { date: "desc" },
      include: {
        template: {
          include: { questions: { orderBy: { order: "asc" } } },
        },
      },
    });

    if (!checkin) return res.status(404).json({ message: "No hay cuestionario activo" });

    res.json({
      checkinId: checkin.id,
      template: checkin.template,
      category: checkin.category,
      weekLabel: checkin.weekLabel,
      date: checkin.date,
    });
  } catch (err) {
    console.error("Error fetching active questionnaire:", err);
    res.status(500).json({ message: "Error al obtener cuestionario activo" });
  }
});

export default router;
