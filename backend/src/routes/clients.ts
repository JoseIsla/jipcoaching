import { Router } from "express";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { prisma } from "../server";
import { authenticate, requireRole } from "../middleware/auth";
import { buildEmail } from "../utils/emailBuilder";

const FRONTEND_URL = (process.env.FRONTEND_URL || "https://jipcoaching.com").replace(/\/+$/, "");
const FROM_EMAIL = process.env.FROM_EMAIL || "JIP Coaching <info@jipcoaching.com>";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: (process.env.SMTP_SECURE ?? "true") === "true",
  auth: { user: process.env.SMTP_USER || "", pass: process.env.SMTP_PASS || "" },
  tls: { rejectUnauthorized: false },
});

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/clients/me — Client gets their own client record
router.get("/me", async (req, res) => {
  try {
    const client: any = await prisma.client.findUnique({
      where: { userId: req.user!.userId },
      include: {
        user: { select: { avatarUrl: true } },
        nutritionIntake: true,
        trainingIntake: true,
        weightHistory: { orderBy: { date: "asc" } },
      },
    });

    if (!client) {
      res.status(404).json({ message: "Cliente no encontrado" });
      return;
    }

    res.json({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      age: client.age,
      sex: client.sex,
      height: client.height,
      currentWeight: client.currentWeight,
      targetWeight: client.targetWeight,
      packType: client.packType,
      status: client.status,
      monthlyFee: client.monthlyFee,
      notes: client.notes,
      startDate: client.startDate,
      lastPaidAt: client.lastPaidAt,
      avatarUrl: client.user?.avatarUrl || null,
      nutritionIntake: client.nutritionIntake,
      trainingIntake: client.trainingIntake,
      weightHistory: (client.weightHistory || []).map((w: any) => ({
        date: w.date.toISOString().split("T")[0],
        weight: w.weight,
      })),
    });
  } catch (err: any) {
    console.error("GET /clients/me error:", err);
    res.status(500).json({ message: "Error al obtener datos del cliente" });
  }
});

// GET /api/clients/stats/evolution — Admin only: monthly client signups
router.get("/stats/evolution", requireRole("ADMIN"), async (_req, res) => {
  try {
    const clients = await prisma.client.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    // Group by month
    const monthMap = new Map<string, number>();
    for (const c of clients) {
      const key = c.createdAt.toISOString().slice(0, 7); // "YYYY-MM"
      monthMap.set(key, (monthMap.get(key) || 0) + 1);
    }

    // Build cumulative
    let cumulative = 0;
    const data = Array.from(monthMap.entries()).map(([month, newClients]) => {
      cumulative += newClients;
      return { month, newClients, total: cumulative };
    });

    res.json(data);
  } catch (err: any) {
    console.error("GET /clients/stats/evolution error:", err);
    res.status(500).json({ message: "Error al obtener evolución" });
  }
});

// GET /api/clients — Admin only
router.get("/", requireRole("ADMIN"), async (_req, res) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { avatarUrl: true } } },
    });

    const result = clients.map((c: any) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      packType: c.packType,
      status: c.status,
      monthlyFee: c.monthlyFee,
      notes: c.notes,
      avatarUrl: c.user?.avatarUrl || null,
    }));

    res.json(result);
  } catch (err: any) {
    console.error("GET /clients error:", err);
    res.status(500).json({ message: "Error al obtener clientes" });
  }
});

// GET /api/clients/:id — Admin only
router.get("/:id", requireRole("ADMIN"), async (req, res) => {
  try {
    const client: any = await prisma.client.findUnique({
      where: { id: req.params.id as string },
      include: {
        user: { select: { avatarUrl: true } },
        nutritionIntake: true,
        trainingIntake: true,
        weightHistory: { orderBy: { date: "asc" } },
      },
    });

    if (!client) {
      res.status(404).json({ message: "Cliente no encontrado" });
      return;
    }

    res.json({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      age: client.age,
      sex: client.sex,
      height: client.height,
      currentWeight: client.currentWeight,
      targetWeight: client.targetWeight,
      packType: client.packType,
      status: client.status,
      monthlyFee: client.monthlyFee,
      notes: client.notes,
      startDate: client.startDate,
      lastPaidAt: client.lastPaidAt,
      avatarUrl: client.user?.avatarUrl || null,
      nutritionIntake: client.nutritionIntake,
      trainingIntake: client.trainingIntake,
      weightHistory: client.weightHistory.map((w: any) => ({
        date: w.date.toISOString().split("T")[0],
        weight: w.weight,
      })),
    });
  } catch (err: any) {
    console.error("GET /clients/:id error:", err);
    res.status(500).json({ message: "Error al obtener cliente" });
  }
});

// POST /api/clients — Admin only
router.post("/", requireRole("ADMIN"), async (req, res) => {
  try {
    const { name, email, password, packType, status, monthlyFee, notes, nutritionIntake, trainingIntake } = req.body;

    if (!name || !email || !password || !packType) {
      res.status(400).json({ message: "Campos obligatorios: name, email, password, packType" });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ message: "El email ya está registrado" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, role: "CLIENT" },
    });

    const initialWeight = nutritionIntake?.currentWeight ? Number(nutritionIntake.currentWeight) : null;

    const client = await prisma.client.create({
      data: {
        userId: user.id,
        name,
        email,
        packType,
        status: status || "ACTIVE",
        monthlyFee: monthlyFee || 0,
        notes,
        startDate: new Date(),
        ...(initialWeight && { currentWeight: initialWeight }),
        ...(nutritionIntake?.targetWeight && { targetWeight: Number(nutritionIntake.targetWeight) }),
        ...(nutritionIntake?.height && { height: Number(nutritionIntake.height) }),
        ...(nutritionIntake?.age && { age: Number(nutritionIntake.age) }),
      },
    });

    // Create initial weight history entry if weight provided
    if (initialWeight) {
      await prisma.weightEntry.create({
        data: {
          clientId: client.id,
          date: new Date(),
          weight: initialWeight,
        },
      });
    }

    // Save intake forms if provided
    if (nutritionIntake && (packType === "NUTRITION" || packType === "FULL")) {
      await prisma.nutritionIntake.create({
        data: {
          clientId: client.id,
          goal: nutritionIntake.goal || null,
          goalTimeframe: nutritionIntake.goalTimeframe || null,
          goalMotivation: nutritionIntake.goalMotivation || null,
          targetWeight: nutritionIntake.targetWeight ? Number(nutritionIntake.targetWeight) : null,
          mealsPerDay: nutritionIntake.mealsPerDay ? Number(nutritionIntake.mealsPerDay) : null,
          sleepHours: nutritionIntake.sleepHours ? Number(nutritionIntake.sleepHours) : null,
          stressLevel: nutritionIntake.stressLevel ? Number(nutritionIntake.stressLevel) : null,
          occupation: nutritionIntake.occupation || null,
          supplements: nutritionIntake.supplements || null,
          excludedFoods: nutritionIntake.excludedFoods || null,
          allergies: nutritionIntake.allergies || null,
          pathologies: nutritionIntake.pathologies || null,
          digestiveIssues: nutritionIntake.digestiveIssues || null,
        },
      });
    }

    if (trainingIntake && (packType === "TRAINING" || packType === "FULL")) {
      await prisma.trainingIntake.create({
        data: {
          clientId: client.id,
          experience: trainingIntake.experience || null,
          sessionsPerWeek: trainingIntake.sessionsPerWeek || null,
          intensity: trainingIntake.intensity ? Number(trainingIntake.intensity) : null,
          otherSports: trainingIntake.otherSports || null,
          modality: trainingIntake.modality || null,
          goal: trainingIntake.goal || null,
          currentSBD: trainingIntake.currentSBD || null,
          injuries: trainingIntake.injuries || null,
        },
      });

      // Create initial RM records from SBD string (e.g. "180/120/200")
      if (trainingIntake.currentSBD) {
        const parts = trainingIntake.currentSBD.split("/").map((s: string) => parseFloat(s.trim()));
        const sbd = [
          { name: "Sentadilla", weight: parts[0] },
          { name: "Press Banca", weight: parts[1] },
          { name: "Peso Muerto", weight: parts[2] },
        ];
        for (const lift of sbd) {
          if (lift.weight && !isNaN(lift.weight) && lift.weight > 0) {
            await prisma.rMRecord.create({
              data: {
                clientId: client.id,
                exerciseName: lift.name,
                weight: lift.weight,
                reps: 1,
                estimated1RM: lift.weight,
                date: new Date(),
              },
            });
          }
        }
      }
    }

    // Notify all admins about new client
    try {
      const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: "client",
            title: "Nuevo cliente registrado",
            message: `${name} se ha añadido con el pack ${packType}`,
            link: `/admin/clients/${client.id}`,
          },
        });
      }
    } catch (notifErr) {
      console.warn("Failed to create new client notification:", notifErr);
    }

    // Send welcome email to the new client (from DB template)
    try {
      const loginUrl = `${FRONTEND_URL}/login`;
      const credentialsBlock = `
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:12px;border:1px solid #292929;margin-bottom:24px;">
          <tr><td style="padding:20px;">
            <p style="color:#999999;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Tus credenciales</p>
            <p style="color:#ffffff;font-size:14px;margin:0 0 4px;"><strong>Email:</strong> ${email}</p>
            <p style="color:#ffffff;font-size:14px;margin:0;"><strong>Contraseña:</strong> ${password}</p>
          </td></tr>
        </table>`;

      const { subject, html } = await buildEmail(
        "WELCOME",
        { nombre: name, email },
        { preBodyBlock: credentialsBlock, ctaUrl: loginUrl },
      );

      await transporter.sendMail({ from: FROM_EMAIL, to: email, subject, html });
    } catch (mailErr) {
      console.warn("Failed to send welcome email:", mailErr);
    }

    res.status(201).json({
      id: client.id,
      name: client.name,
      email: client.email,
      packType: client.packType,
      status: client.status,
      monthlyFee: client.monthlyFee,
      notes: client.notes,
    });
  } catch (err: any) {
    console.error("POST /clients error:", err);
    res.status(500).json({ message: "Error al crear cliente" });
  }
});

// PUT /api/clients/:id — Admin only
router.put("/:id", requireRole("ADMIN"), async (req, res) => {
  try {
    const { name, email, packType, status, monthlyFee, notes, phone, age, sex, height, currentWeight, targetWeight } = req.body;

    const client = await prisma.client.update({
      where: { id: req.params.id as string },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(packType !== undefined && { packType }),
        ...(status !== undefined && { status }),
        ...(monthlyFee !== undefined && { monthlyFee }),
        ...(notes !== undefined && { notes }),
        ...(phone !== undefined && { phone }),
        ...(age !== undefined && { age }),
        ...(sex !== undefined && { sex }),
        ...(height !== undefined && { height }),
        ...(currentWeight !== undefined && { currentWeight }),
        ...(targetWeight !== undefined && { targetWeight }),
      },
    });

    res.json(client);
  } catch (err: any) {
    console.error("PUT /clients/:id error:", err);
    res.status(500).json({ message: "Error al actualizar cliente" });
  }
});

// DELETE /api/clients/:id — Admin only
router.delete("/:id", requireRole("ADMIN"), async (req, res) => {
  try {
    const client = await prisma.client.findUnique({ where: { id: req.params.id as string } });
    if (!client) {
      res.status(404).json({ message: "Cliente no encontrado" });
      return;
    }

    await prisma.user.delete({ where: { id: client.userId } });
    res.json({ message: "Cliente eliminado" });
  } catch (err: any) {
    console.error("DELETE /clients/:id error:", err);
    res.status(500).json({ message: "Error al eliminar cliente" });
  }
});

// PATCH /api/clients/:id/mark-paid — Admin marks client as paid, resets 30-day counter
router.patch("/:id/mark-paid", requireRole("ADMIN"), async (req, res) => {
  try {
    const client = await prisma.client.update({
      where: { id: req.params.id as string },
      data: { lastPaidAt: new Date() },
    });

    try {
      const monthName = new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" });

      await prisma.notification.create({
        data: {
          userId: client.userId,
          type: "payment",
          title: "✅ Pago confirmado",
          message: `Tu pago de ${client.monthlyFee}€ correspondiente a ${monthName} ha sido registrado. ¡Gracias!`,
          link: "/client",
        },
      });

      // Send payment confirmation email from DB template
      try {
        const paymentBlock = `
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:12px;border:1px solid #292929;margin-bottom:24px;">
            <tr><td style="padding:20px;">
              <p style="color:#999999;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Detalle</p>
              <p style="color:#ffffff;font-size:14px;margin:0 0 4px;"><strong>Período:</strong> ${monthName}</p>
              <p style="color:#ffffff;font-size:14px;margin:0;"><strong>Importe:</strong> ${client.monthlyFee}€</p>
            </td></tr>
          </table>`;

        const { subject, html } = await buildEmail(
          "PAYMENT_CONFIRMATION",
          { nombre: client.name, mes: monthName, importe: `${client.monthlyFee}` },
          { preBodyBlock: paymentBlock },
        );

        await transporter.sendMail({ from: FROM_EMAIL, to: client.email, subject, html });
      } catch (mailErr) {
        console.warn("Failed to send payment confirmation email:", mailErr);
      }
    } catch (notifErr) {
      console.warn("Failed to create payment notification:", notifErr);
    }

    res.json({ message: "Pago registrado", lastPaidAt: client.lastPaidAt });
  } catch (err: any) {
    console.error("PATCH /clients/:id/mark-paid error:", err);
    res.status(500).json({ message: "Error al registrar pago" });
  }
});

// PATCH /api/clients/:id/set-paid-date — Admin adjusts lastPaidAt silently (no email/notification)
router.patch("/:id/set-paid-date", requireRole("ADMIN"), async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) { res.status(400).json({ message: "Se requiere una fecha" }); return; }

    const client = await prisma.client.update({
      where: { id: req.params.id as string },
      data: { lastPaidAt: new Date(date) },
    });

    res.json({ message: "Fecha de pago actualizada", lastPaidAt: client.lastPaidAt });
  } catch (err: any) {
    console.error("PATCH /clients/:id/set-paid-date error:", err);
    res.status(500).json({ message: "Error al actualizar fecha de pago" });
  }
});


router.patch("/:id/status", requireRole("ADMIN"), async (req, res) => {
  try {
    const { status } = req.body;
    const client = await prisma.client.update({
      where: { id: req.params.id as string },
      data: { status },
    });
    res.json(client);
  } catch (err: any) {
    console.error("PATCH /clients/:id/status error:", err);
    res.status(500).json({ message: "Error al actualizar estado" });
  }
});

// PUT /api/clients/:id/password — Admin resets client password
router.put("/:id/password", requireRole("ADMIN"), async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
      return;
    }

    const client = await prisma.client.findUnique({ where: { id: req.params.id as string } });
    if (!client) {
      res.status(404).json({ message: "Cliente no encontrado" });
      return;
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: client.userId },
      data: { password: hashed },
    });

    res.json({ message: "Contraseña actualizada" });
  } catch (err: any) {
    console.error("PUT /clients/:id/password error:", err);
    res.status(500).json({ message: "Error al cambiar contraseña" });
  }
});

export default router;
