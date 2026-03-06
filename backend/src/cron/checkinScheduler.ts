import cron from "node-cron";
import fs from "fs";
import path from "path";
import { prisma } from "../server";

// ── Shared helper ──

const dayLabels: Record<number, string> = {
  0: "Domingo", 1: "Lunes", 2: "Martes", 3: "Miércoles",
  4: "Jueves", 5: "Viernes", 6: "Sábado",
};

function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// ── Generate nutrition checkins for all active clients ──

async function generateNutritionCheckins() {
  console.log(`[CRON] 🍎 Generating nutrition check-ins at ${new Date().toISOString()}`);
  try {
    const clients = await prisma.client.findMany({
      where: { status: "ACTIVE", packType: { in: ["NUTRITION", "FULL"] } },
    });

    const templates = await prisma.questionnaireTemplate.findMany({
      where: { category: "NUTRITION", isActive: true },
    });

    const now = new Date();
    const today = now.getDay(); // 0=Sun, 2=Tue, 5=Fri
    const weekNum = getISOWeekNumber(now);
    const weekLabel = `Semana ${weekNum}`;

    // Get current week range
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    let totalCreated = 0;

    // Only create checkins for templates matching today's day of week
    const todayTemplates = templates.filter((t) => t.dayOfWeek === today);

    for (const client of clients) {
      for (const template of todayTemplates) {
        // Check if already exists
        const existing = await prisma.checkin.findFirst({
          where: {
            clientId: client.id,
            templateId: template.id,
            date: { gte: monday, lte: sunday },
          },
        });

        if (!existing) {
          const targetDate = new Date(now);
          targetDate.setHours(7, 0, 0, 0);

          await prisma.checkin.create({
            data: {
              clientId: client.id,
              templateId: template.id,
              category: "NUTRITION",
              weekLabel,
              date: targetDate,
              dayLabel: dayLabels[today] ?? "—",
            },
          });

          // Create push notification for the client
          await prisma.notification.create({
            data: {
              userId: client.userId,
              type: "checkin_reminder",
              title: "📋 Nuevo check-in de nutrición",
              message: `Tu check-in de nutrición del ${dayLabels[today] ?? "hoy"} está disponible. Tienes 48h para completarlo.`,
              link: "/client/checkins",
            },
          });

          totalCreated++;
        }
      }
    }

    console.log(`[CRON] ✅ Created ${totalCreated} nutrition check-ins for ${clients.length} clients`);

    // ── Auto-expire old pending nutrition checkins (>48h) ──
    const expirationThreshold = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const expired = await prisma.checkin.updateMany({
      where: {
        category: "NUTRITION",
        status: "PENDING",
        date: { lt: expirationThreshold },
      },
      data: { status: "EXPIRED" },
    });
    if (expired.count > 0) {
      console.log(`[CRON] ⏰ Expired ${expired.count} old nutrition check-ins`);
    }
  } catch (err) {
    console.error("[CRON] ❌ Error generating nutrition check-ins:", err);
  }
}

// ── Generate training checkins for all active clients ──

async function generateTrainingCheckins() {
  console.log(`[CRON] 🏋️ Generating training check-ins at ${new Date().toISOString()}`);
  try {
    const clients = await prisma.client.findMany({
      where: { status: "ACTIVE", packType: { in: ["TRAINING", "FULL"] } },
    });

    const trainingTemplate = await prisma.questionnaireTemplate.findFirst({
      where: { category: "TRAINING", isActive: true },
    });

    if (!trainingTemplate) {
      console.log("[CRON] ⚠️ No active training template found");
      return;
    }

    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    let totalCreated = 0;

    for (const client of clients) {
      // Check if training checkin already exists this week
      const existing = await prisma.checkin.findFirst({
        where: {
          clientId: client.id,
          templateId: trainingTemplate.id,
          date: { gte: monday, lte: sunday },
          category: "TRAINING",
        },
      });

      if (existing) continue;

      // Find active training plan
      const activePlan = await prisma.trainingPlan.findFirst({
        where: { clientId: client.id, isActive: true },
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

      if (!activePlan || activePlan.weeks.length === 0) continue;

      const activeWeek = activePlan.weeks[0];

      // Saturday date (today) at 7:00
      const saturdayDate = new Date(now);
      saturdayDate.setHours(7, 0, 0, 0);

      const checkin = await prisma.checkin.create({
        data: {
          clientId: client.id,
          templateId: trainingTemplate.id,
          category: "TRAINING",
          weekLabel: `Semana ${activeWeek.weekNumber}`,
          date: saturdayDate,
          dayLabel: "Sábado",
          planId: activePlan.id,
          weekNumber: activeWeek.weekNumber,
        },
      });

      // Pre-populate training log
      for (const day of activeWeek.days) {
        const basicExercises = day.exercises.filter((e) => e.type === "BASIC");
        if (basicExercises.length === 0) continue;

        const log = await prisma.checkinTrainingLog.create({
          data: {
            checkinId: checkin.id,
            dayNumber: day.dayNumber,
            dayName: day.title || `Día ${day.dayNumber}`,
          },
        });

        await prisma.checkinTrainingExercise.createMany({
          data: basicExercises.map((ex) => ({
            logId: log.id,
            exerciseId: ex.id,
            exerciseName: ex.name,
            section: "basic",
            plannedSets: ex.method === "TOP_SET_BACKOFFS"
              ? `1+${ex.backoffSets ?? 3}`
              : ex.setsMin ? String(ex.setsMin) : "—",
            plannedReps: ex.method === "TOP_SET_BACKOFFS"
              ? String(ex.topSetReps ?? "—")
              : ex.dropReps ? String(ex.dropReps) : "—",
            plannedLoad: "—",
            plannedRPE: ex.topSetRpe,
          })),
        });
      }

      totalCreated++;
    }

    console.log(`[CRON] ✅ Created ${totalCreated} training check-ins for ${clients.length} clients`);
  } catch (err) {
    console.error("[CRON] ❌ Error generating training check-ins:", err);
  }
}

// ── Expire training checkins past Sunday midnight ──

async function expireTrainingCheckins() {
  try {
    const now = new Date();
    // Find training checkins that are PENDING and whose Sunday midnight has passed
    // Training checkins have date = Saturday 7:00 AM
    // Deadline = that Sunday at 23:59:59 = date + ~41 hours
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 1); // Yesterday
    cutoff.setHours(23, 59, 59, 999);

    const expired = await prisma.checkin.updateMany({
      where: {
        category: "TRAINING",
        status: "PENDING",
        date: { lt: cutoff },
      },
      data: { status: "EXPIRED" },
    });

    if (expired.count > 0) {
      console.log(`[CRON] ⏰ Expired ${expired.count} old training check-ins`);
    }
  } catch (err) {
    console.error("[CRON] ❌ Error expiring training check-ins:", err);
  }
}

// ── Clean up expired video files from disk ──

async function cleanupExpiredVideos() {
  try {
    const now = new Date();
    const expiredVideos = await prisma.techniqueVideo.findMany({
      where: { expiresAt: { lt: now } },
    });

    if (expiredVideos.length === 0) return;

    const uploadDir = process.env.UPLOAD_DIR || "./uploads";

    for (const video of expiredVideos) {
      // Delete file from disk
      if (video.url) {
        const filePath = path.join(uploadDir, video.url.replace(/^\/uploads\//, ""));
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[CRON] 🗑️ Deleted video file: ${filePath}`);
          }
        } catch (fileErr) {
          console.warn(`[CRON] ⚠️ Could not delete file ${filePath}:`, fileErr);
        }
      }

      // Delete DB record
      await prisma.techniqueVideo.delete({ where: { id: video.id } }).catch(() => {});
    }

    console.log(`[CRON] ✅ Cleaned up ${expiredVideos.length} expired video(s)`);
  } catch (err) {
    console.error("[CRON] ❌ Error cleaning up expired videos:", err);
  }
}

// ── Schedule ──

export function startCheckinScheduler() {
  // Nutrition: Tuesday and Friday at 7:00 AM (Europe/Madrid)
  cron.schedule("0 7 * * 2", () => {
    console.log("[CRON] 📅 Tuesday 7:00 — Nutrition check-in generation");
    generateNutritionCheckins();
  }, { timezone: "Europe/Madrid" });

  cron.schedule("0 7 * * 5", () => {
    console.log("[CRON] 📅 Friday 7:00 — Nutrition check-in generation");
    generateNutritionCheckins();
  }, { timezone: "Europe/Madrid" });

  // Training: Saturday at 7:00 AM (Europe/Madrid)
  cron.schedule("0 7 * * 6", () => {
    console.log("[CRON] 📅 Saturday 7:00 — Training check-in generation");
    generateTrainingCheckins();
  }, { timezone: "Europe/Madrid" });

  // Expiration check: runs every day at 1:00 AM
  cron.schedule("0 1 * * *", () => {
    console.log("[CRON] 🧹 Daily expiration + cleanup check");
    expireTrainingCheckins();
    cleanupExpiredVideos();
  }, { timezone: "Europe/Madrid" });

  console.log("⏱️  Check-in scheduler started:");
  console.log("   📅 Nutrition: Martes y Viernes a las 7:00 (48h ventana)");
  console.log("   📅 Entrenamiento: Sábado a las 7:00 (hasta Domingo 23:59)");
  console.log("   🗑️ Limpieza videos: Diaria a la 1:00 (expiran a los 6 días)");
  console.log("   🧹 Expiración check-ins: Diaria a la 1:00");
}
