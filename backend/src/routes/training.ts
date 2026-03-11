import { Router } from "express";
import { prisma } from "../server";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();
router.use(authenticate);

// ── Plans ──

// GET /api/training/plans?clientId=xxx
router.get("/plans", async (req, res) => {
  try {
    const { clientId } = req.query;
    const where: any = {};

    if (req.user!.role === "CLIENT") {
      const client = await prisma.client.findUnique({ where: { userId: req.user!.userId } });
      if (!client) { res.status(404).json({ message: "Cliente no encontrado" }); return; }
      where.clientId = client.id;
    } else if (clientId) {
      where.clientId = clientId as string;
    }

    const plans = await prisma.trainingPlan.findMany({
      where,
      include: {
        client: { select: { name: true } },
        weeks: {
          include: { days: { include: { exercises: { orderBy: { order: "asc" } } } } },
          orderBy: { weekNumber: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(plans);
  } catch (err: any) {
    console.error("GET /training/plans error:", err);
    res.status(500).json({ message: "Error al obtener planes" });
  }
});

// GET /api/training/plans/:id
router.get("/plans/:id", async (req, res) => {
  try {
    const plan = await prisma.trainingPlan.findUnique({
      where: { id: req.params.id as string },
      include: {
        client: { select: { name: true } },
        weeks: {
          include: { days: { include: { exercises: { orderBy: { order: "asc" } } } } },
          orderBy: { weekNumber: "asc" },
        },
      },
    });

    if (!plan) { res.status(404).json({ message: "Plan no encontrado" }); return; }

    // Client can only see their own plans
    if (req.user!.role === "CLIENT") {
      const client = await prisma.client.findUnique({ where: { userId: req.user!.userId } });
      if (!client || plan.clientId !== client.id) {
        res.status(403).json({ message: "Acceso denegado" });
        return;
      }
    }

    res.json(plan);
  } catch (err: any) {
    console.error("GET /training/plans/:id error:", err);
    res.status(500).json({ message: "Error al obtener plan" });
  }
});

// GET /api/training/me/active — Client gets their active plan
router.get("/me/active", async (req, res) => {
  try {
    const client = await prisma.client.findUnique({ where: { userId: req.user!.userId } });
    if (!client) { res.status(404).json({ message: "Cliente no encontrado" }); return; }

    const plan = await prisma.trainingPlan.findFirst({
      where: { clientId: client.id, isActive: true },
      include: {
        weeks: {
          include: { days: { include: { exercises: { orderBy: { order: "asc" } } } } },
          orderBy: { weekNumber: "asc" },
        },
      },
    });

    if (!plan) { res.status(404).json({ message: "No hay plan activo" }); return; }
    res.json(plan);
  } catch (err: any) {
    res.status(500).json({ message: "Error al obtener plan activo" });
  }
});

// POST /api/training/plans — Admin only
router.post("/plans", requireRole("ADMIN"), async (req, res) => {
  try {
    const { clientId, title, modality, block, daysPerWeek, blockVariants, weeks } = req.body;

    if (!clientId || !title) {
      res.status(400).json({ message: "clientId y title son obligatorios" });
      return;
    }

    // Deactivate existing active plans for client
    await prisma.trainingPlan.updateMany({
      where: { clientId, isActive: true },
      data: { isActive: false },
    });

    const plan = await prisma.trainingPlan.create({
      data: {
        clientId,
        title,
        modality,
        block,
        daysPerWeek: daysPerWeek || 4,
        blockVariants,
        weeks: weeks ? {
          create: weeks.map((w: any, wi: number) => ({
            weekNumber: w.weekNumber || wi + 1,
            block: w.block || block,
            status: w.status || (wi === 0 ? "ACTIVE" : "DRAFT"),
            notes: w.notes,
            days: w.days ? {
              create: w.days.map((d: any, di: number) => ({
                dayNumber: d.dayNumber || di + 1,
                title: d.title || d.name,
                warmup: d.warmup,
                notes: d.notes,
                exercises: d.exercises ? {
                  create: d.exercises.map((e: any, ei: number) => ({
                    name: e.name || e.exerciseName,
                    type: e.type || "BASIC",
                    method: e.method || "STRAIGHT_SETS",
                    topSetReps: e.topSetReps,
                    topSetRpe: e.topSetRpe || e.topSetRPE,
                    fatiguePct: e.fatiguePct || e.fatiguePercent,
                    setsMin: e.setsMin,
                    setsMax: e.setsMax,
                    rirMin: e.rirMin,
                    rirMax: e.rirMax,
                    restSec: e.restSec,
                    notes: e.notes || e.technicalNotes,
                    videoRequired: e.videoRequired || false,
                    order: e.order || ei,
                    backoffSets: e.backoffSets,
                    backoffPercent: e.backoffPercent,
                    backoffReps: e.backoffReps || null,
                    technicalNotes: e.technicalNotes,
                    reps: e.reps || null,
                    plannedLoad: e.plannedLoad || null,
                    estimatedSeries: e.estimatedSeries || null,
                    backoffRule: e.backoffRule || null,
                    customMethodName: e.customMethodName || null,
                    customMethodDescription: e.customMethodDescription || null,
                    intensityType: e.intensityType || null,
                    customMethodDescription: e.customMethodDescription || null,
                  })),
                } : undefined,
              })),
            } : undefined,
          })),
        } : {
          create: [{
            weekNumber: 1,
            block: block || "Hipertrofia",
            status: "ACTIVE",
            days: {
              create: Array.from({ length: daysPerWeek || 4 }, (_, i) => ({
                dayNumber: i + 1,
                title: `Día ${i + 1}`,
              })),
            },
          }],
        },
      },
      include: {
        weeks: {
          include: { days: { include: { exercises: { orderBy: { order: "asc" } } } } },
          orderBy: { weekNumber: "asc" },
        },
      },
    });

    // Notify the client about new training plan
    try {
      const client = await prisma.client.findUnique({ where: { id: clientId } });
      if (client) {
        await prisma.notification.create({
          data: {
            userId: client.userId,
            type: "plan",
            title: "Nuevo plan de entrenamiento",
            message: `Se te ha asignado el plan "${title}"`,
            link: "/client/training",
          },
        });
      }
    } catch (notifErr) {
      console.warn("Failed to create training plan notification:", notifErr);
    }

    res.status(201).json(plan);
  } catch (err: any) {
    console.error("POST /training/plans error:", err);
    res.status(500).json({ message: "Error al crear plan" });
  }
});

// PUT /api/training/plans/:id — Admin only
router.put("/plans/:id", requireRole("ADMIN"), async (req, res) => {
  try {
    const { title, modality, block, daysPerWeek, blockVariants, isActive } = req.body;

    const plan = await prisma.trainingPlan.update({
      where: { id: req.params.id as string },
      data: {
        ...(title !== undefined && { title }),
        ...(modality !== undefined && { modality }),
        ...(block !== undefined && { block }),
        ...(daysPerWeek !== undefined && { daysPerWeek }),
        ...(blockVariants !== undefined && { blockVariants }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json(plan);
  } catch (err: any) {
    console.error("PUT /training/plans/:id error:", err);
    res.status(500).json({ message: "Error al actualizar plan" });
  }
});

// PATCH /api/training/plans/:id/toggle — Admin only
router.patch("/plans/:id/toggle", requireRole("ADMIN"), async (req, res) => {
  try {
    const { isActive } = req.body;
    const plan = await prisma.trainingPlan.findUnique({ where: { id: req.params.id as string } });
    if (!plan) { res.status(404).json({ message: "Plan no encontrado" }); return; }

    if (isActive) {
      await prisma.trainingPlan.updateMany({
        where: { clientId: plan.clientId, isActive: true },
        data: { isActive: false },
      });
    }

    const updated = await prisma.trainingPlan.update({
      where: { id: req.params.id as string },
      data: { isActive },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: "Error al cambiar estado del plan" });
  }
});

// ── Weeks ──

// POST /api/training/plans/:planId/weeks
router.post("/plans/:planId/weeks", requireRole("ADMIN"), async (req, res) => {
  try {
    const { block, notes } = req.body;
    const plan: any = await prisma.trainingPlan.findUnique({
      where: { id: req.params.planId as string },
      include: { weeks: true },
    });
    if (!plan) { res.status(404).json({ message: "Plan no encontrado" }); return; }

    // Mark current active week as completed
    await prisma.trainingWeek.updateMany({
      where: { planId: plan.id, status: "ACTIVE" },
      data: { status: "COMPLETED" },
    });

    const nextNum = plan.weeks.length + 1;
    const week = await prisma.trainingWeek.create({
      data: {
        planId: plan.id,
        weekNumber: nextNum,
        block: block || plan.block,
        status: "ACTIVE",
        notes,
        days: {
          create: Array.from({ length: plan.daysPerWeek }, (_, i) => ({
            dayNumber: i + 1,
            title: `Día ${i + 1}`,
          })),
        },
      },
      include: { days: { include: { exercises: true } } },
    });

    res.status(201).json(week);
  } catch (err: any) {
    console.error("POST weeks error:", err);
    res.status(500).json({ message: "Error al crear semana" });
  }
});

// PUT /api/training/weeks/:weekId
router.put("/weeks/:weekId", requireRole("ADMIN"), async (req, res) => {
  try {
    const { block, status, notes } = req.body;
    const week = await prisma.trainingWeek.update({
      where: { id: req.params.weekId as string },
      data: {
        ...(block !== undefined && { block }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
      },
      include: { days: { include: { exercises: { orderBy: { order: "asc" } } } } },
    });
    res.json(week);
  } catch (err: any) {
    res.status(500).json({ message: "Error al actualizar semana" });
  }
});

// ── Days ──

// PUT /api/training/days/:dayId
router.put("/days/:dayId", requireRole("ADMIN"), async (req, res) => {
  try {
    const { title, warmup, notes, exercises } = req.body;

    const day = await prisma.trainingDay.update({
      where: { id: req.params.dayId as string },
      data: {
        ...(title !== undefined && { title }),
        ...(warmup !== undefined && { warmup }),
        ...(notes !== undefined && { notes }),
      },
    });

    // If exercises provided, replace all
    if (exercises && Array.isArray(exercises)) {
      await prisma.exercisePrescription.deleteMany({ where: { dayId: day.id } });
      const validExercises = exercises.filter((e: any) => (e.name || e.exerciseName)?.trim());
      if (validExercises.length > 0) {
        const validTypes = ["BASIC", "VARIANT", "ACCESSORY"];
        const validMethods = ["STRAIGHT_SETS", "RIR_SETS", "LOAD_DROP", "REPEATS", "REPS_DROP", "LOAD_REPS_DROP", "TOP_SET_BACKOFFS", "CUSTOM", "RAMP", "WAVE"];
        await prisma.exercisePrescription.createMany({
          data: validExercises.map((e: any, i: number) => ({
            dayId: day.id,
            name: (e.name || e.exerciseName).trim(),
            type: validTypes.includes(e.type) ? e.type : "BASIC",
            method: validMethods.includes(e.method) ? e.method : "STRAIGHT_SETS",
            topSetReps: e.topSetReps ? parseInt(e.topSetReps) : null,
            topSetRpe: e.topSetRpe || e.topSetRPE ? parseFloat(e.topSetRpe || e.topSetRPE) : null,
            fatiguePct: e.fatiguePct ? parseFloat(e.fatiguePct) : null,
            setsMin: e.setsMin ? parseInt(e.setsMin) : null,
            setsMax: e.setsMax ? parseInt(e.setsMax) : null,
            rirMin: e.rirMin ? parseInt(e.rirMin) : null,
            rirMax: e.rirMax ? parseInt(e.rirMax) : null,
            restSec: e.restSec ? parseInt(e.restSec) : null,
            notes: e.notes || e.technicalNotes || null,
            videoRequired: e.videoRequired || false,
            order: e.order ?? i,
            backoffSets: e.backoffSets ? parseInt(e.backoffSets) : null,
            backoffPercent: e.backoffPercent ? parseFloat(e.backoffPercent) : null,
            backoffReps: e.backoffReps || null,
            technicalNotes: e.technicalNotes || null,
            reps: e.reps || null,
            plannedLoad: e.plannedLoad || null,
            estimatedSeries: e.estimatedSeries || null,
            backoffRule: e.backoffRule || null,
            customMethodName: e.customMethodName || null,
            customMethodDescription: e.customMethodDescription || null,
          })),
        });
      }
    }

    const updated = await prisma.trainingDay.findUnique({
      where: { id: day.id },
      include: { exercises: { orderBy: { order: "asc" } } },
    });

    res.json(updated);
  } catch (err: any) {
    console.error("PUT /training/days/:id error:", err);
    res.status(500).json({ message: "Error al actualizar día" });
  }
});

export default router;
