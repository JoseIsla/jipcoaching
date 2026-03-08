import { Router, Request, Response } from "express";
import { prisma } from "../server";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

// ── IMPORTANT: /me/active MUST be before /:id to avoid being captured by the param route ──

// ── GET /api/questionnaires/me/active — Get active questionnaire for current client
router.get("/me/active", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const client = await prisma.client.findUnique({ where: { userId } });
    if (!client) return res.status(404).json({ message: "Cliente no encontrado" });

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
      where: { id: req.params.id as string },
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

    console.log("[Questionnaires] POST body:", JSON.stringify({ name, category, dayOfWeek, scope, questionsCount: questions?.length }));

    // Validate required fields
    if (!name) {
      res.status(400).json({ message: "El nombre es obligatorio" });
      return;
    }

    // Validate enum values
    const validCategories = ["NUTRITION", "TRAINING"];
    const validScopes = ["GLOBAL", "CLIENT"];
    const cat = validCategories.includes(category) ? category : "NUTRITION";
    const sc = validScopes.includes(scope) ? scope : "GLOBAL";

    const validQuestionTypes = ["SCALE_0_10", "YES_NO", "NUMBER", "TEXT", "SELECT"];

    const questionsData = (questions || []).map((q: any, idx: number) => {
      const qType = validQuestionTypes.includes(q.type) ? q.type : "TEXT";
      return {
        type: qType,
        label: q.label || `Pregunta ${idx + 1}`,
        required: q.required ?? true,
        order: q.order ?? idx,
        optionsJson: q.options ? JSON.stringify(q.options) : null,
      };
    });

    console.log("[Questionnaires] Creating template with", questionsData.length, "questions");

    const template = await prisma.questionnaireTemplate.create({
      data: {
        name,
        description: description ?? null,
        category: cat,
        dayOfWeek: dayOfWeek ?? null,
        scope: sc,
        clientId: clientId ?? null,
        questions: {
          create: questionsData,
        },
      },
      include: {
        questions: { orderBy: { order: "asc" } },
      },
    });

    console.log("[Questionnaires] ✅ Template created:", template.id);
    res.status(201).json(template);
  } catch (err: any) {
    console.error("[Questionnaires] ❌ Error creating template:", err?.message, err?.code, err?.meta);
    res.status(500).json({ message: "Error al crear plantilla", detail: err?.message });
  }
});

// ── PUT /api/questionnaires/:id — Update template (admin)
router.put("/:id", authenticate, requireRole("ADMIN"), async (req: Request, res: Response) => {
  try {
    const { name, description, category, dayOfWeek, scope, clientId, isActive, questions } = req.body;

    const template = await prisma.questionnaireTemplate.update({
      where: { id: req.params.id as string },
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

    if (questions) {
      // First delete any checkin responses referencing these questions (FK constraint)
      const existingQuestionIds = await prisma.questionnaireQuestion.findMany({
        where: { templateId: req.params.id as string },
        select: { id: true },
      });
      const qIds = existingQuestionIds.map((q) => q.id);
      if (qIds.length > 0) {
        await prisma.checkinResponse.deleteMany({
          where: { questionId: { in: qIds } },
        });
      }

      await prisma.questionnaireQuestion.deleteMany({
        where: { templateId: req.params.id as string },
      });

      const validQuestionTypes = ["SCALE_0_10", "YES_NO", "NUMBER", "TEXT", "SELECT"];

      await prisma.questionnaireQuestion.createMany({
        data: questions.map((q: any, idx: number) => ({
          templateId: req.params.id as string,
          type: validQuestionTypes.includes(q.type) ? q.type : "TEXT",
          label: q.label,
          required: q.required ?? true,
          order: q.order ?? idx,
          optionsJson: q.options ? JSON.stringify(q.options) : null,
        })),
      });
    }

    const result = await prisma.questionnaireTemplate.findUnique({
      where: { id: req.params.id as string },
      include: {
        questions: { orderBy: { order: "asc" } },
      },
    });

    res.json(result);
  } catch (err: any) {
    console.error("[Questionnaires] Error updating template:", err?.message, err?.code);
    res.status(500).json({ message: "Error al actualizar plantilla", detail: err?.message });
  }
});

// ── DELETE /api/questionnaires/:id — Delete template (admin)
router.delete("/:id", authenticate, requireRole("ADMIN"), async (req: Request, res: Response) => {
  try {
    await prisma.questionnaireTemplate.delete({
      where: { id: req.params.id as string },
    });
    res.json({ message: "Plantilla eliminada" });
  } catch (err) {
    console.error("Error deleting template:", err);
    res.status(500).json({ message: "Error al eliminar plantilla" });
  }
});

export default router;
