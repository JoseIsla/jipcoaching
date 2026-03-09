import { Router } from "express";
import fs from "fs";
import path from "path";
import { prisma } from "../server";
import { authenticate, requireRole } from "../middleware/auth";
import { uploadVideo } from "../middleware/upload";

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
        template: {
          select: {
            name: true,
            category: true,
            dayOfWeek: true,
            questions: { orderBy: { order: "asc" } },
          },
        },
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

    // Helper: get local date string (avoids UTC timezone shift)
    const toLocalDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // Transform to match frontend QuestionnaireEntry format
    const rawResult = checkins.map((c) => ({
      id: c.id,
      clientId: c.clientId,
      clientName: c.client.name,
      templateId: c.templateId,
      templateName: c.template?.name || "",
      category: c.category.toLowerCase(),
      weekLabel: c.weekLabel,
      date: toLocalDateStr(c.date),
      dayLabel: c.dayLabel,
      status: c.status === "PENDING" ? "pendiente" : c.status === "RESPONDED" ? "respondido" : c.status === "EXPIRED" ? "expirado" : "no_enviado",
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
      templateQuestions: (c.template?.questions || []).map((q: any) => ({
        id: q.id,
        label: q.label,
        type: q.type.toLowerCase().replace("_0_10", "").replace("yes_no", "yesno"),
        required: q.required,
        options: q.optionsJson ? JSON.parse(q.optionsJson) : undefined,
      })),
    }));

    // Deduplicate: if multiple check-ins exist for same client+date+category,
    // keep the one with responses (respondido) or the most recently created
    const seen = new Map<string, typeof rawResult[0]>();
    for (const entry of rawResult) {
      const key = `${entry.clientId}|${entry.date}|${entry.category}`;
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, entry);
      } else {
        // Prefer responded over pending
        const existingResponded = existing.status === "respondido";
        const entryResponded = entry.status === "respondido";
        if (entryResponded && !existingResponded) {
          seen.set(key, entry);
        }
        // If both same status, keep existing (first = most recent due to orderBy desc)
      }
    }
    const result = Array.from(seen.values());

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
    const checkinId = req.params.id as string;

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
    const updatedCheckin = await prisma.checkin.update({
      where: { id: checkinId },
      data: { status: "RESPONDED" },
      include: { client: { select: { name: true } } },
    });

    // Create notification for all admins
    try {
      const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
      const clientName = updatedCheckin.client?.name ?? "Cliente";
      const category = updatedCheckin.category === "NUTRITION" ? "nutrición" : "entrenamiento";
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: "checkin",
            title: "Nuevo check-in recibido",
            message: `${clientName} ha enviado su check-in de ${category}`,
            link: "/admin/questionnaires",
          },
        });
      }
    } catch (notifErr) {
      console.warn("Failed to create checkin notification:", notifErr);
    }

    // If nutrition checkin, find weight response and update weight history
    const checkin = await prisma.checkin.findUnique({
      where: { id: checkinId },
      include: {
        template: {
          include: { questions: { orderBy: { order: "asc" } } },
        },
      },
    });

    if (checkin && checkin.category === "NUTRITION" && responses) {
      // Find the weight question: first NUMBER question, or one whose label contains "peso" or "weight"
      const weightQuestion = checkin.template?.questions?.find(
        (q) =>
          q.type === "NUMBER" &&
          (q.label.toLowerCase().includes("peso") || q.label.toLowerCase().includes("weight"))
      ) || checkin.template?.questions?.find((q) => q.type === "NUMBER");

      // Also support legacy mock ID "q1"
      const weightQuestionId = weightQuestion?.id || "q1";
      const weightValue = responses[weightQuestionId];

      if (weightValue) {
        const weight = parseFloat(String(weightValue));
        if (!isNaN(weight) && weight > 0) {
          const today = new Date(new Date().toISOString().split("T")[0]);
          await prisma.weightEntry.upsert({
            where: {
              clientId_date: {
                clientId: checkin.clientId,
                date: today,
              },
            },
            update: { weight },
            create: {
              clientId: checkin.clientId,
              date: today,
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
      where: { clientId: req.params.clientId as string },
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
      where: { clientId: req.params.clientId as string },
      orderBy: { date: "desc" },
    });
    res.json(records.map((r) => ({
      id: r.id,
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

// POST /api/checkins/rm/:clientId — Admin manually adds an RM record
router.post("/rm/:clientId", requireRole("ADMIN"), async (req, res) => {
  try {
    const { exerciseName, weight, reps, estimated1RM, date } = req.body;
    if (!exerciseName || !weight) {
      res.status(400).json({ message: "exerciseName y weight son obligatorios" });
      return;
    }
    const w = Number(weight);
    const r = Number(reps) || 1;
    const e1rm = Number(estimated1RM) || w;
    const record = await prisma.rMRecord.create({
      data: {
        clientId: req.params.clientId as string,
        exerciseName,
        weight: w,
        reps: r,
        estimated1RM: e1rm,
        date: date ? new Date(date) : new Date(),
      },
    });
    res.status(201).json({
      id: record.id,
      exerciseId: record.exerciseId,
      exerciseName: record.exerciseName,
      weight: record.weight,
      reps: record.reps,
      estimated1RM: record.estimated1RM,
      date: record.date.toISOString().split("T")[0],
    });
  } catch (err: any) {
    console.error("POST /checkins/rm/:clientId error:", err);
    res.status(500).json({ message: "Error al crear RM" });
  }
});

// PUT /api/checkins/rm/record/:id — Admin edits an RM record
router.put("/rm/record/:id", requireRole("ADMIN"), async (req, res) => {
  try {
    const { exerciseName, weight, reps, estimated1RM, date } = req.body;
    const record = await prisma.rMRecord.update({
      where: { id: req.params.id as string },
      data: {
        ...(exerciseName && { exerciseName }),
        ...(weight && { weight: Number(weight) }),
        ...(reps && { reps: Number(reps) }),
        ...(estimated1RM && { estimated1RM: Number(estimated1RM) }),
        ...(date && { date: new Date(date) }),
      },
    });
    res.json({
      id: record.id,
      exerciseId: record.exerciseId,
      exerciseName: record.exerciseName,
      weight: record.weight,
      reps: record.reps,
      estimated1RM: record.estimated1RM,
      date: record.date.toISOString().split("T")[0],
    });
  } catch (err: any) {
    console.error("PUT /checkins/rm/record/:id error:", err);
    res.status(500).json({ message: "Error al editar RM" });
  }
});

// DELETE /api/checkins/rm/record/:id — Admin deletes an RM record
router.delete("/rm/record/:id", requireRole("ADMIN"), async (req, res) => {
  try {
    await prisma.rMRecord.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /checkins/rm/record/:id error:", err);
    res.status(500).json({ message: "Error al eliminar RM" });
  }
});

// ── POST /api/checkins/generate-mine — Auto-generate pending checkins for the current client
router.post("/generate-mine", async (req, res) => {
  try {
    const userId = req.user!.userId;
    const client = await prisma.client.findUnique({ where: { userId } });
    if (!client) { res.status(404).json({ message: "Cliente no encontrado" }); return; }
    if (client.status !== "ACTIVE") { res.json({ created: 0 }); return; }

    const created = await generateCheckinsForClient(client.id, client.packType);
    res.json({ created });
  } catch (err: any) {
    console.error("POST /checkins/generate-mine error:", err);
    res.status(500).json({ message: "Error al generar check-ins" });
  }
});

// ── POST /api/checkins/generate-weekly — Admin batch-generate for all active clients
router.post("/generate-weekly", requireRole("ADMIN"), async (req, res) => {
  try {
    const clients = await prisma.client.findMany({ where: { status: "ACTIVE" } });
    let totalCreated = 0;
    for (const client of clients) {
      totalCreated += await generateCheckinsForClient(client.id, client.packType);
    }
    res.json({ created: totalCreated, clients: clients.length });
  } catch (err: any) {
    console.error("POST /checkins/generate-weekly error:", err);
    res.status(500).json({ message: "Error al generar check-ins semanales" });
  }
});

// ── Helper: generate checkins for a single client ──
async function generateCheckinsForClient(clientId: string, packType: string): Promise<number> {
  const dayLabels: Record<number, string> = {
    0: "Domingo", 1: "Lunes", 2: "Martes", 3: "Miércoles",
    4: "Jueves", 5: "Viernes", 6: "Sábado",
  };

  // Get current week range (Monday to Sunday) — use noon to avoid timezone boundary issues
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const weekNum = getISOWeekNumber(now);
  const weekLabel = `Semana ${weekNum}`;

  let created = 0;

  // ── Nutrition checkins ──
  const hasNutrition = packType === "NUTRITION" || packType === "FULL";
  if (hasNutrition) {
    const allNutritionTemplates = await prisma.questionnaireTemplate.findMany({
      where: { category: "NUTRITION", isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    // Deduplicate: keep only the latest template per dayOfWeek
    const seenDays = new Set<number>();
    const nutritionTemplates = allNutritionTemplates.filter((t) => {
      if (t.dayOfWeek == null || seenDays.has(t.dayOfWeek)) return false;
      seenDays.add(t.dayOfWeek);
      return true;
    });

    for (const template of nutritionTemplates) {
      if (template.dayOfWeek == null) continue;

      // Calculate the date for this day of week in the current week
      // Use noon (12:00) to avoid timezone boundary issues (midnight CET = previous day UTC)
      const targetDate = new Date(monday);
      const diff = template.dayOfWeek === 0 ? 6 : template.dayOfWeek - 1;
      targetDate.setDate(monday.getDate() + diff);
      targetDate.setHours(12, 0, 0, 0);

      // Check if checkin already exists for this client/template/week
      const existing = await prisma.checkin.findFirst({
        where: {
          clientId,
          templateId: template.id,
          date: { gte: monday, lte: sunday },
        },
      });

      if (!existing) {
        await prisma.checkin.create({
          data: {
            clientId,
            templateId: template.id,
            category: "NUTRITION",
            weekLabel,
            date: targetDate,
            dayLabel: dayLabels[template.dayOfWeek] ?? "—",
          },
        });
        created++;
      }
    }
  }

  // ── Training checkins ──
  // Training check-ins should ONLY be created on Saturday or Sunday (the fill window).
  // Before Saturday they don't exist yet (the cron generates them Saturday 7:00 AM).
  const todayDay = now.getDay(); // 0=Sun, 6=Sat
  const isSaturdayOrSunday = todayDay === 6 || todayDay === 0;

  const hasTraining = packType === "TRAINING" || packType === "FULL";
  if (hasTraining && isSaturdayOrSunday) {
    // Deduplicate: pick only the most recently updated active TRAINING template
    const allTrainingTemplates = await prisma.questionnaireTemplate.findMany({
      where: { category: "TRAINING", isActive: true },
      orderBy: { updatedAt: "desc" },
      take: 1,
    });
    const trainingTemplate = allTrainingTemplates[0] ?? null;

    if (trainingTemplate) {
      // Find active training plan for this client
      const activePlan = await prisma.trainingPlan.findFirst({
        where: { clientId, isActive: true },
        include: {
          weeks: {
            where: { status: "ACTIVE" },
            include: {
              days: {
                include: { exercises: true },
                orderBy: { dayNumber: "asc" },
              },
            },
            orderBy: { weekNumber: "asc" },
            take: 1,
          },
        },
      });

      if (activePlan && activePlan.weeks.length > 0) {
        const activeWeek = activePlan.weeks[0];

        // Saturday of current week for training checkin — noon to avoid timezone issues
        const saturday = new Date(monday);
        saturday.setDate(monday.getDate() + 5); // Saturday
        saturday.setHours(12, 0, 0, 0);

        const existing = await prisma.checkin.findFirst({
          where: {
            clientId,
            templateId: trainingTemplate.id,
            date: { gte: monday, lte: sunday },
            category: "TRAINING",
          },
        });

        if (!existing) {
          const checkin = await prisma.checkin.create({
            data: {
              clientId,
              templateId: trainingTemplate.id,
              category: "TRAINING",
              weekLabel: `Semana ${activeWeek.weekNumber}`,
              date: saturday,
              dayLabel: "Sábado",
              planId: activePlan.id,
              weekNumber: activeWeek.weekNumber,
            },
          });

          // Pre-populate training log from the active week's exercises
          for (const day of activeWeek.days) {
            const logExercises = day.exercises.filter((e) => e.type === "BASIC" || e.type === "VARIANT");
            if (logExercises.length === 0) continue;

            const log = await prisma.checkinTrainingLog.create({
              data: {
                checkinId: checkin.id,
                dayNumber: day.dayNumber,
                dayName: day.title || `Día ${day.dayNumber}`,
              },
            });

            await prisma.checkinTrainingExercise.createMany({
              data: logExercises.map((ex) => ({
                logId: log.id,
                exerciseId: ex.id,
                exerciseName: ex.name,
                section: ex.type === "BASIC" ? "basic" : "variant",
                plannedSets: ex.method === "TOP_SET_BACKOFFS"
                  ? `1+${ex.backoffSets ?? 3}`
                  : ex.setsMin ? String(ex.setsMin) : "—",
                plannedReps: ex.method === "TOP_SET_BACKOFFS"
                  ? String(ex.topSetReps ?? "—")
                  : (ex as any).reps || (ex.dropReps ? String(ex.dropReps) : "—"),
                plannedLoad: (ex as any).plannedLoad || "Autoregulada",
                plannedRPE: ex.topSetRpe,
              })),
            });
          }

          created++;
        }
      }
    }
  }

  return created;
}

function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// ── POST /api/checkins/:id/videos — Upload a technique video linked to a check-in ──
router.post("/:id/videos", uploadVideo.single("file"), async (req, res) => {
  try {
    if (!req.file) { res.status(400).json({ message: "No se proporcionó archivo" }); return; }

    const checkinId = req.params.id as string;
    const { exerciseName, notes } = req.body;

    // Verify the checkin exists and get clientId
    const checkin = await prisma.checkin.findUnique({ where: { id: checkinId } });
    if (!checkin) { res.status(404).json({ message: "Check-in no encontrado" }); return; }

    // Ownership check for CLIENT users
    if (req.user?.role === "CLIENT") {
      const client = await prisma.client.findUnique({ where: { userId: req.user.userId } });
      if (!client || client.id !== checkin.clientId) {
        res.status(403).json({ message: "No tienes permiso" }); return;
      }
    }

    const url = `/uploads/videos/${req.file.filename}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 6);

    // Create TechniqueVideo (for 6-day expiry cleanup by cron)
    const techniqueVideo = await prisma.techniqueVideo.create({
      data: {
        clientId: checkin.clientId,
        exerciseName: exerciseName || "Sin nombre",
        url,
        notes,
        expiresAt,
      },
    });

    // Create CheckinVideo (links the video to this specific check-in)
    const checkinVideo = await prisma.checkinVideo.create({
      data: {
        checkinId,
        exerciseName: exerciseName || "Sin nombre",
        url,
        notes,
      },
    });

    // Notify admins
    try {
      const client = await prisma.client.findUnique({ where: { id: checkin.clientId } });
      const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
      const clientName = client?.name ?? "Cliente";
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: "checkin",
            title: "Nuevo vídeo de técnica",
            message: `${clientName} ha subido un vídeo de ${exerciseName || "técnica"}`,
            link: `/admin/clients/${checkin.clientId}`,
          },
        });
      }
    } catch (notifErr) {
      console.warn("Failed to create video notification:", notifErr);
    }

    res.status(201).json({
      id: checkinVideo.id,
      techniqueVideoId: techniqueVideo.id,
      exerciseName: checkinVideo.exerciseName,
      url: checkinVideo.url,
      notes: checkinVideo.notes,
      uploadedAt: checkinVideo.uploadedAt.toISOString(),
    });
  } catch (err: any) {
    console.error("POST /checkins/:id/videos error:", err);
    res.status(500).json({ message: "Error al subir vídeo" });
  }
});

// ── DELETE /api/checkins/:checkinId/videos/:videoId ──
router.delete("/:checkinId/videos/:videoId", async (req, res) => {
  try {
    const { checkinId, videoId } = req.params;

    const checkinVideo = await prisma.checkinVideo.findUnique({ where: { id: videoId as string } });
    if (!checkinVideo || checkinVideo.checkinId !== checkinId) {
      res.status(404).json({ message: "Vídeo no encontrado" }); return;
    }

    // Ownership check for CLIENT users
    if (req.user?.role === "CLIENT") {
      const checkin = await prisma.checkin.findUnique({ where: { id: checkinId } });
      const client = await prisma.client.findUnique({ where: { userId: req.user.userId } });
      if (!checkin || !client || client.id !== checkin.clientId) {
        res.status(403).json({ message: "No tienes permiso" }); return;
      }
    }

    // Delete file from disk
    const uploadDir = process.env.UPLOAD_DIR || "./uploads";
    if (checkinVideo.url) {
      const filePath = path.join(uploadDir, checkinVideo.url.replace(/^\/uploads\//, ""));
      try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
    }

    // Delete both CheckinVideo and matching TechniqueVideo
    await prisma.checkinVideo.delete({ where: { id: videoId as string } });
    await prisma.techniqueVideo.deleteMany({ where: { url: checkinVideo.url } }).catch(() => {});

    res.json({ message: "Vídeo eliminado" });
  } catch (err: any) {
    console.error("DELETE /checkins/:id/videos/:videoId error:", err);
    res.status(500).json({ message: "Error al eliminar vídeo" });
  }
});

export default router;
