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

// DELETE /api/training/weeks/:weekId
router.delete("/weeks/:weekId", requireRole("ADMIN"), async (req, res) => {
  try {
    const week = await prisma.trainingWeek.findUnique({
      where: { id: req.params.weekId as string },
      include: {
        plan: true,
        days: true,
      },
    });

    if (!week) {
      res.status(404).json({ message: "Semana no encontrada" });
      return;
    }

    const allWeeks = await prisma.trainingWeek.findMany({
      where: { planId: week.planId },
      orderBy: { weekNumber: "asc" },
    });

    if (allWeeks.length <= 1) {
      res.status(400).json({ message: "El plan debe mantener al menos una semana" });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.trainingWeek.delete({ where: { id: week.id } });

      const remainingWeeks = allWeeks.filter((item) => item.id !== week.id);

      for (const [index, remainingWeek] of remainingWeeks.entries()) {
        const nextWeekNumber = index + 1;
        if (remainingWeek.weekNumber !== nextWeekNumber) {
          await tx.trainingWeek.update({
            where: { id: remainingWeek.id },
            data: { weekNumber: nextWeekNumber },
          });
        }
      }

      const activeWeekStillExists = remainingWeeks.some((item) => item.status === "ACTIVE");

      if (!activeWeekStillExists) {
        const replacementWeek = remainingWeeks.find((item) => item.weekNumber < week.weekNumber)
          ?? remainingWeeks[remainingWeeks.length - 1];

        await tx.trainingWeek.update({
          where: { id: replacementWeek.id },
          data: { status: "ACTIVE" },
        });
      }

      const refreshedWeeks = await tx.trainingWeek.findMany({
        where: { planId: week.planId },
        orderBy: { weekNumber: "asc" },
      });

      const activeWeek = refreshedWeeks.find((item) => item.status === "ACTIVE");
      const lastWeek = refreshedWeeks[refreshedWeeks.length - 1];

      await tx.trainingPlan.update({
        where: { id: week.planId },
        data: {
          block: activeWeek?.block ?? lastWeek?.block ?? week.plan.block,
        },
      });
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /training/weeks/:weekId error:", err);
    res.status(500).json({ message: "Error al eliminar semana" });
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
            intensityType: e.intensityType || null,
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

// ── Physical Test Scales ──

// GET /api/training/physical-scales?oppositionType=POLICIA_NACIONAL&gender=MALE
router.get("/physical-scales", async (req, res) => {
  try {
    const { oppositionType, gender } = req.query;
    const where: any = {};
    if (oppositionType) where.oppositionType = oppositionType as string;
    if (gender) where.gender = gender as string;

    const scales = await prisma.physicalTestScale.findMany({ where, orderBy: [{ testName: "asc" }, { score: "asc" }] });
    res.json(scales);
  } catch (err: any) {
    console.error("GET /training/physical-scales error:", err);
    res.status(500).json({ message: "Error al obtener baremos" });
  }
});

// ── Client Physical Marks ──

// POST /api/training/physical-scales — Admin create new scale entry
router.post("/physical-scales", requireRole("ADMIN"), async (req, res) => {
  try {
    const { oppositionType, testName, gender, minValue, maxValue, unit, score } = req.body;
    if (!oppositionType || !testName || !gender || minValue == null || maxValue == null || score == null) {
      res.status(400).json({ message: "Faltan campos requeridos" }); return;
    }
    const scale = await prisma.physicalTestScale.create({
      data: { oppositionType, testName, gender, minValue: parseFloat(minValue), maxValue: parseFloat(maxValue), unit: unit || "seconds", score: parseInt(score) },
    });
    res.status(201).json(scale);
  } catch (err: any) {
    console.error("POST /training/physical-scales error:", err);
    res.status(500).json({ message: "Error al crear baremo" });
  }
});

// PUT /api/training/physical-scales/:id — Admin update scale entry
router.put("/physical-scales/:id", requireRole("ADMIN"), async (req, res) => {
  try {
    const { oppositionType, testName, gender, minValue, maxValue, unit, score } = req.body;
    const scale = await prisma.physicalTestScale.update({
      where: { id: (req.params as any).id },
      data: {
        ...(oppositionType !== undefined && { oppositionType }),
        ...(testName !== undefined && { testName }),
        ...(gender !== undefined && { gender }),
        ...(minValue !== undefined && { minValue: parseFloat(minValue) }),
        ...(maxValue !== undefined && { maxValue: parseFloat(maxValue) }),
        ...(unit !== undefined && { unit }),
        ...(score !== undefined && { score: parseInt(score) }),
      },
    });
    res.json(scale);
  } catch (err: any) {
    console.error("PUT /training/physical-scales/:id error:", err);
    res.status(500).json({ message: "Error al actualizar baremo" });
  }
});

// DELETE /api/training/physical-scales/:id — Admin delete scale entry
router.delete("/physical-scales/:id", requireRole("ADMIN"), async (req, res) => {
  try {
    await prisma.physicalTestScale.delete({ where: { id: (req.params as any).id } });
    res.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /training/physical-scales/:id error:", err);
    res.status(500).json({ message: "Error al eliminar baremo" });
  }
});

// GET /api/training/physical-marks?clientId=xxx
router.get("/physical-marks", async (req, res) => {
  try {
    let clientId = req.query.clientId as string | undefined;

    if ((req.user as any).role === "CLIENT") {
      const client = await prisma.client.findUnique({ where: { userId: (req.user as any).userId } });
      if (!client) { res.status(404).json({ message: "Cliente no encontrado" }); return; }
      clientId = client.id;
    }

    if (!clientId) { res.status(400).json({ message: "clientId requerido" }); return; }

    const marks = await prisma.clientPhysicalMark.findMany({
      where: { clientId },
      orderBy: { recordedAt: "desc" },
    });
    res.json(marks);
  } catch (err: any) {
    console.error("GET /training/physical-marks error:", err);
    res.status(500).json({ message: "Error al obtener marcas" });
  }
});

// POST /api/training/physical-marks
 router.post("/physical-marks", async (req, res) => {
  try {
    const { clientId: rawClientId, testName, value, unit, notes } = req.body;
    if (!testName || value == null || !unit) {
      res.status(400).json({ message: "Faltan campos requeridos" }); return;
    }

    let resolvedClientId = rawClientId;

    // Clients can only create marks for themselves
    if ((req.user as any).role === "CLIENT") {
      const client = await prisma.client.findUnique({ where: { userId: (req.user as any).userId } });
      if (!client) { res.status(404).json({ message: "Cliente no encontrado" }); return; }
      resolvedClientId = client.id;
    } else if ((req.user as any).role !== "ADMIN") {
      res.status(403).json({ message: "Acceso denegado" }); return;
    }

    if (!resolvedClientId) { res.status(400).json({ message: "clientId requerido" }); return; }

    const mark = await prisma.clientPhysicalMark.create({
      data: { clientId: resolvedClientId, testName, value: parseFloat(value), unit, notes },
    });
    res.status(201).json(mark);
  } catch (err: any) {
    console.error("POST /training/physical-marks error:", err);
    res.status(500).json({ message: "Error al registrar marca" });
  }
});

// PUT /api/training/physical-marks/:id — Update a mark (client: own only, admin: any)
router.put("/physical-marks/:id", async (req, res) => {
  try {
    const markId = (req.params as any).id;
    const { value, notes } = req.body;

    // Verify ownership for clients
    if ((req.user as any).role === "CLIENT") {
      const client = await prisma.client.findUnique({ where: { userId: (req.user as any).userId } });
      if (!client) { res.status(404).json({ message: "Cliente no encontrado" }); return; }
      const mark = await prisma.clientPhysicalMark.findUnique({ where: { id: markId } });
      if (!mark || mark.clientId !== client.id) { res.status(403).json({ message: "Acceso denegado" }); return; }
    }

    const updated = await prisma.clientPhysicalMark.update({
      where: { id: markId },
      data: {
        ...(value !== undefined ? { value: parseFloat(value) } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
    });
    res.json(updated);
  } catch (err: any) {
    console.error("PUT /training/physical-marks/:id error:", err);
    res.status(500).json({ message: "Error al actualizar marca" });
  }
});

// DELETE /api/training/physical-marks/:id
router.delete("/physical-marks/:id", requireRole("ADMIN"), async (req, res) => {
  try {
    await prisma.clientPhysicalMark.delete({ where: { id: (req.params as any).id } });
    res.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /training/physical-marks error:", err);
    res.status(500).json({ message: "Error al eliminar marca" });
  }
});

export default router;
