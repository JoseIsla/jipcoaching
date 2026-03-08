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

const buildWelcomeEmail = (name: string, email: string, password: string, loginUrl: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#000000;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#111111;border-radius:16px;border:1px solid #292929;overflow:hidden;">
        <!-- Header -->
        <tr><td style="padding:32px 32px 0;text-align:center;">
          <img src="${FRONTEND_URL}/assets/logo-jip.png" alt="JIP Coaching" width="80" style="display:block;margin:0 auto 24px;" />
          <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 8px;">¡Bienvenido/a, ${name}!</h1>
          <p style="color:#999999;font-size:14px;margin:0;">Tu cuenta en JIP Coaching ha sido creada correctamente.</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="color:#cccccc;font-size:14px;line-height:22px;margin:0 0 20px;">
            Ya puedes acceder a tu panel de cliente donde encontrarás tus planes de entrenamiento, nutrición, check-ins y mucho más.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:12px;border:1px solid #292929;margin-bottom:24px;">
            <tr><td style="padding:20px;">
              <p style="color:#999999;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Tus credenciales</p>
              <p style="color:#ffffff;font-size:14px;margin:0 0 4px;"><strong>Email:</strong> ${email}</p>
              <p style="color:#ffffff;font-size:14px;margin:0;"><strong>Contraseña:</strong> ${password}</p>
            </td></tr>
          </table>
          <p style="color:#ff6b6b;font-size:12px;line-height:18px;margin:0 0 24px;">
            ⚠️ Te recomendamos cambiar tu contraseña después del primer inicio de sesión.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${loginUrl}" target="_blank" style="display:inline-block;background-color:hsl(110,100%,54%);color:#000000;font-weight:700;font-size:14px;text-decoration:none;padding:14px 32px;border-radius:12px;">
                Acceder a mi cuenta
              </a>
            </td></tr>
          </table>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:0 32px 24px;text-align:center;border-top:1px solid #292929;padding-top:20px;">
          <p style="color:#555555;font-size:11px;margin:0;">© ${new Date().getFullYear()} JIP Performance Nutrition. Todos los derechos reservados.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const buildPaymentConfirmationEmail = (name: string, monthName: string, amount: number) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#000000;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#111111;border-radius:16px;border:1px solid #292929;overflow:hidden;">
        <tr><td style="padding:32px 32px 0;text-align:center;">
          <img src="${FRONTEND_URL}/assets/logo-jip.png" alt="JIP Coaching" width="80" style="display:block;margin:0 auto 24px;" />
          <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 8px;">Pago confirmado ✅</h1>
          <p style="color:#999999;font-size:14px;margin:0;">Hola ${name}, tu pago ha sido registrado correctamente.</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:12px;border:1px solid #292929;margin-bottom:24px;">
            <tr><td style="padding:20px;">
              <p style="color:#999999;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Detalle</p>
              <p style="color:#ffffff;font-size:14px;margin:0 0 4px;"><strong>Período:</strong> ${monthName}</p>
              <p style="color:#ffffff;font-size:14px;margin:0;"><strong>Importe:</strong> ${amount}€</p>
            </td></tr>
          </table>
          <p style="color:#cccccc;font-size:14px;line-height:22px;margin:0;">
            Gracias por confiar en JIP Coaching. ¡Seguimos trabajando juntos! 💪
          </p>
        </td></tr>
        <tr><td style="padding:0 32px 24px;text-align:center;border-top:1px solid #292929;padding-top:20px;">
          <p style="color:#555555;font-size:11px;margin:0;">© ${new Date().getFullYear()} JIP Performance Nutrition. Todos los derechos reservados.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

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
    const { name, email, password, packType, status, monthlyFee, notes } = req.body;

    if (!name || !email || !password || !packType) {
      res.status(400).json({ message: "Campos obligatorios: name, email, password, packType" });
      return;
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ message: "El email ya está registrado" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, role: "CLIENT" },
    });

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
      },
    });

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

    // Send welcome email to the new client
    try {
      const loginUrl = `${FRONTEND_URL}/login`;
      await transporter.sendMail({
        from: FROM_EMAIL,
        to: email,
        subject: "Bienvenido/a a JIP Coaching – Tu cuenta está lista",
        html: buildWelcomeEmail(name, email, password, loginUrl),
      });
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

    // Delete user (cascades to client)
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

    // Create in-app notification for the client
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

      // Send payment confirmation email to client
      try {
        await transporter.sendMail({
          from: FROM_EMAIL,
          to: client.email,
          subject: `Pago confirmado – ${monthName} | JIP Coaching`,
          html: buildPaymentConfirmationEmail(client.name, monthName, client.monthlyFee),
        });
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

// PATCH /api/clients/:id/status — Admin only
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
