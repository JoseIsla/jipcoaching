import cron from "node-cron";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { prisma } from "../server";
import { buildEmail } from "../utils/emailBuilder";

const FRONTEND_URL = (process.env.FRONTEND_URL || "https://jipcoaching.com").replace(/\/+$/, "");
const FROM_EMAIL = process.env.FROM_EMAIL || "JIP Coaching <info@jipcoaching.com>";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: (process.env.SMTP_SECURE ?? "true") === "true",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
  tls: { rejectUnauthorized: false },
});

// Payment reminder email is now rendered from DB templates via buildEmail()

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

    const allTemplates = await prisma.questionnaireTemplate.findMany({
      where: { category: "NUTRITION", isActive: true },
      orderBy: { updatedAt: "desc" },
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

    // Deduplicate: keep only the latest template per dayOfWeek
    const seenDays = new Set<number>();
    const templates = allTemplates.filter((t) => {
      if (t.dayOfWeek == null || seenDays.has(t.dayOfWeek)) return false;
      seenDays.add(t.dayOfWeek);
      return true;
    });

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
          // Use noon to avoid timezone boundary issues (midnight CET = previous day UTC)
          const targetDate = new Date(now);
          targetDate.setHours(12, 0, 0, 0);

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

    // ── Auto-expire old pending nutrition checkins (>48h from publish time 7:00 AM) ──
    // The date stored is noon of the publish day, so subtract 5h to get 7:00 AM equivalent
    // Then check if 48h have passed since that 7:00 AM
    const expirationThreshold = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    // Adjust: stored date is noon, publish is 7AM = 5h earlier, so threshold should be 5h later
    expirationThreshold.setHours(expirationThreshold.getHours() + 5);
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

    // Pick only the most recently updated active TRAINING template (deduplicate)
    const allTrainingTemplates = await prisma.questionnaireTemplate.findMany({
      where: { category: "TRAINING", isActive: true },
      orderBy: { updatedAt: "desc" },
      take: 1,
    });
    const trainingTemplate = allTrainingTemplates[0] ?? null;

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

      // Saturday date at noon (avoids timezone boundary issues)
      const saturdayDate = new Date(now);
      saturdayDate.setHours(12, 0, 0, 0);

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

      // Create push notification for the client
      await prisma.notification.create({
        data: {
          userId: client.userId,
          type: "checkin_reminder",
          title: "🏋️ Nuevo check-in de entrenamiento",
          message: `Tu check-in de entrenamiento (${activeWeek.weekNumber ? `Semana ${activeWeek.weekNumber}` : "esta semana"}) está disponible. Tienes hasta el domingo a las 23:59 para completarlo.`,
          link: "/client/checkins",
        },
      });

      // Pre-populate training log
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
    // Training checkins have date = Saturday at noon (stored)
    // Deadline = Sunday at 23:59:59 = ~36 hours after noon Saturday
    // So expire if date < (now - 36h)
    const cutoff = new Date(now.getTime() - 36 * 60 * 60 * 1000);

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

// ── Payment reminder: check daily for clients whose 30-day cycle is due ──

async function sendPaymentReminders() {
  console.log(`[CRON] 💰 Checking payment reminders at ${new Date().toISOString()}`);
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Find active clients whose lastPaidAt is null or > 30 days ago
    const clients = await prisma.client.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { lastPaidAt: null },
          { lastPaidAt: { lt: thirtyDaysAgo } },
        ],
      },
    });

    if (clients.length === 0) return;

    const loginUrl = `${FRONTEND_URL}/login`;
    let totalSent = 0;

    for (const client of clients) {
      // Create in-app notification
      await prisma.notification.create({
        data: {
          userId: client.userId,
          type: "payment_reminder",
          title: "💰 Recordatorio de pago",
          message: `Tu cuota mensual de ${client.monthlyFee}€ está pendiente de pago.`,
          link: "/client",
        },
      });

      // Notify admins too
      const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: "payment_reminder",
            title: "💰 Pago pendiente",
            message: `${client.name} tiene el pago mensual pendiente (${client.monthlyFee}€).`,
            link: `/admin/clients/${client.id}`,
          },
        });
      }

      // Send email reminder from DB template
      try {
        const amountBlock = `
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:12px;border:1px solid #292929;margin-bottom:24px;">
            <tr><td style="padding:20px;text-align:center;">
              <p style="color:#999999;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Importe pendiente</p>
              <p style="color:#ff6b6b;font-size:28px;font-weight:800;margin:0;">${client.monthlyFee}€</p>
            </td></tr>
          </table>`;

        const { subject, html } = await buildEmail(
          "PAYMENT_REMINDER",
          { nombre: client.name, importe: `${client.monthlyFee}` },
          { preBodyBlock: amountBlock, ctaUrl: loginUrl },
        );

        await transporter.sendMail({ from: FROM_EMAIL, to: client.email, subject, html });
        totalSent++;
      } catch (mailErr) {
        console.warn(`[CRON] ⚠️ Failed to send payment reminder to ${client.email}:`, mailErr);
      }
    }

    console.log(`[CRON] ✅ Sent ${totalSent} payment reminders for ${clients.length} clients`);
  } catch (err) {
    console.error("[CRON] ❌ Error sending payment reminders:", err);
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

  // Payment reminders: every day at 9:00 AM (Europe/Madrid)
  cron.schedule("0 9 * * *", () => {
    console.log("[CRON] 💰 Daily payment reminder check");
    sendPaymentReminders();
  }, { timezone: "Europe/Madrid" });

  console.log("⏱️  Check-in scheduler started:");
  console.log("   📅 Nutrition: Martes y Viernes a las 7:00 (48h ventana)");
  console.log("   📅 Entrenamiento: Sábado a las 7:00 (hasta Domingo 23:59)");
  console.log("   🗑️ Limpieza videos: Diaria a la 1:00 (expiran a los 6 días)");
  console.log("   🧹 Expiración check-ins: Diaria a la 1:00");
  console.log("   💰 Recordatorio pagos: Diaria a las 9:00");
}
