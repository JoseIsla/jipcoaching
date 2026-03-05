import { Router } from "express";
import { prisma } from "../server";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();
router.use(authenticate);

// GET /api/checkins?clientId=xxx
router.get("/", async (req, res) => {
  try {
    const { clientId, category, status } = req.query;
    const where: any = {};

    if (req.user!.role === "CLIENT") {
      const client = await prisma.client.findUnique({ where: { userId: req.user!.userId } });
      if (!client) { res.status(404).json({ message: "Cliente no encontrado" }); return; }
      where.clientId = client.id;
    } else if (clientId) {
      where.clientId = clientId as string;
    }

    if (category) where.category = category;
    if (status) where.status = status;

    const checkins = await prisma.checkin.findMany({
      where,
      include: {
        template: { select: { name: true } },
        responses: { include: { question: true } },
        trainingLogs: {
          include: { exercises: true },
          orderBy: { dayNumber: "asc" },
        },
        videos: true,
        client: { select: { name: true } },
      },
      orderBy: { date: "desc" },
    });

    // Transform to match frontend QuestionnaireEntry format
    const result = checkins.map((c) => ({
      id: c.id,
      clientId: c.clientId,
      clientName: c.client.name,
      templateId: c.templateId,
      templateName: c.template?.name || "",
      category: c.category.toLowerCase(),
      weekLabel: c.weekLabel,
      date: c.date.toISOString().split("T")[0],
      dayLabel: c.dayLabel,
      status: c.status === "PENDING" ? "pendiente" : c.status === "RESPONDED" ? "respondido" : "no_enviado",
      responses: c.responses.reduce((acc: any, r) => {
        acc[r.questionId] = r.value;
        return acc;
      }, {}),
      trainingLog: c.trainingLogs.map((log) => ({
        dayNumber: log.dayNumber,
        dayName: log.dayName,
        exercises: log.exercises.map((e) => ({
          exerciseId: e.exerciseId,
          exerciseName: e.exerciseName,
          section: e.section,
          plannedSets: e.plannedSets,
          plannedReps: e.plannedReps,
          plannedLoad: e.plannedLoad,
          plannedRPE: e.plannedRPE,
          actualWeight: e.actualWeight,
          actualRPE: e.actualRPE,
          actualSets: e.actualSets,
          actualReps: e.actualReps,
        })),
      })),
      techniqueVideos: c.videos.map((v) => ({
        id: v.id,
        exerciseName: v.exerciseName,
        url: v.url,
        notes: v.notes,
        uploadedAt: v.uploadedAt.toISOString(),
      })),
      planId: c.planId,
      weekNumber: c.weekNumber,
    }));

    res.json(result);
  } catch (err: any) {
    console.error("GET /checkins error:", err);
    res.status(500).json({ message: "Error al obtener check-ins" });
  }
});

// POST /api/checkins — Create a new check-in entry
router.post("/", async (req, res) => {
  try {
    const { clientId, templateId, category, weekLabel, date, dayLabel, planId, weekNumber } = req.body;

    const resolvedClientId = clientId || (() => {
      if (req.user!.role === "CLIENT") return undefined; // will resolve below
      return undefined;
    })();

    let finalClientId = resolvedClientId;
    if (!finalClientId && req.user!.role === "CLIENT") {
      const client = await prisma.client.findUnique({ where: { userId: req.user!.userId } });
      if (!client) { res.status(404).json({ message: "Cliente no encontrado" }); return; }
      finalClientId = client.id;
    }

    const checkin = await prisma.checkin.create({
      data: {
        clientId: finalClientId,
        templateId,
        category: category?.toUpperCase() || "NUTRITION",
        weekLabel,
        date: new Date(date),
        dayLabel,
        planId,
        weekNumber,
      },
    });

    res.status(201).json(checkin);
  } catch (err: any) {
    console.error("POST /checkins error:", err);
    res.status(500).json({ message: "Error al crear check-in" });
  }
});

// POST /api/checkins/:id/submit — Submit responses
router.post("/:id/submit", async (req, res) => {
  try {
    const { responses, trainingLog } = req.body;
    const checkinId = req.params.id;

    // Save responses
    if (responses && typeof responses === "object") {
      const responseEntries = Object.entries(responses).map(([questionId, value]) => ({
        checkinId,
        questionId,
        value: String(value),
      }));

      await prisma.checkinResponse.createMany({ data: responseEntries });
    }

    // Save training log
    if (trainingLog && Array.isArray(trainingLog)) {
      for (const day of trainingLog) {
        const log = await prisma.checkinTrainingLog.create({
          data: {
            checkinId,
            dayNumber: day.dayNumber,
            dayName: day.dayName,
          },
        });

        if (day.exercises && Array.isArray(day.exercises)) {
          await prisma.checkinTrainingExercise.createMany({
            data: day.exercises.map((e: any) => ({
              logId: log.id,
              exerciseId: e.exerciseId,
              exerciseName: e.exerciseName,
              section: e.section || "basic",
              plannedSets: e.plannedSets,
              plannedReps: e.plannedReps,
              plannedLoad: e.plannedLoad,
              plannedRPE: e.plannedRPE,
              actualWeight: e.actualWeight,
              actualRPE: e.actualRPE,
              actualSets: e.actualSets,
              actualReps: e.actualReps,
            })),
          });
        }
      }
    }

    // Update status
    await prisma.checkin.update({
      where: { id: checkinId },
      data: { status: "RESPONDED" },
    });

    // If nutrition checkin with weight (q1), update weight history
    const checkin = await prisma.checkin.findUnique({ where: { id: checkinId } });
    if (checkin && responses?.q1) {
      const weight = parseFloat(responses.q1);
      if (!isNaN(weight) && weight > 0) {
        await prisma.weightEntry.upsert({
          where: {
            clientId_date: {
              clientId: checkin.clientId,
              date: new Date(new Date().toISOString().split("T")[0]),
            },
          },
          update: { weight },
          create: {
            clientId: checkin.clientId,
            date: new Date(new Date().toISOString().split("T")[0]),
            weight,
          },
        });

        // Update client's current weight
        await prisma.client.update({
          where: { id: checkin.clientId },
          data: { currentWeight: weight },
        });
      }
    }

    res.json({ message: "Check-in enviado correctamente" });
  } catch (err: any) {
    console.error("POST /checkins/:id/submit error:", err);
    res.status(500).json({ message: "Error al enviar check-in" });
  }
});

// GET /api/checkins/weight/:clientId
router.get("/weight/:clientId", async (req, res) => {
  try {
    const entries = await prisma.weightEntry.findMany({
      where: { clientId: req.params.clientId },
      orderBy: { date: "asc" },
    });
    res.json(entries.map((e) => ({
      date: e.date.toISOString().split("T")[0],
      weight: e.weight,
    })));
  } catch (err: any) {
    res.status(500).json({ message: "Error al obtener historial de peso" });
  }
});

// GET /api/checkins/rm/:clientId
router.get("/rm/:clientId", async (req, res) => {
  try {
    const records = await prisma.rMRecord.findMany({
      where: { clientId: req.params.clientId },
      orderBy: { date: "desc" },
    });
    res.json(records.map((r) => ({
      exerciseId: r.exerciseId,
      exerciseName: r.exerciseName,
      weight: r.weight,
      reps: r.reps,
      estimated1RM: r.estimated1RM,
      date: r.date.toISOString().split("T")[0],
    })));
  } catch (err: any) {
    res.status(500).json({ message: "Error al obtener RMs" });
  }
});

export default router;
