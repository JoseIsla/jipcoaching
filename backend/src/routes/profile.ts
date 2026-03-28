import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { prisma } from "../server";
import { authenticate } from "../middleware/auth";
import { uploadAvatar } from "../middleware/upload";
import { rateLimit } from "../middleware/rateLimiter";
import { buildEmail } from "../utils/emailBuilder";

const router = Router();
router.use(authenticate);

const FRONTEND_URL = (process.env.FRONTEND_URL || "https://jipcoaching.com").replace(/\/+$/, "");
const FROM_EMAIL = process.env.FROM_EMAIL || "JIP Coaching <info@jipcoaching.com>";
const TOKEN_EXPIRY_MINUTES = 30;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: (process.env.SMTP_SECURE ?? "true") === "true",
  auth: { user: process.env.SMTP_USER || "", pass: process.env.SMTP_PASS || "" },
  tls: { rejectUnauthorized: false },
});

const emailChangeLimiter = rateLimit({ windowSec: 15 * 60, max: 10 });

// ── Admin Profile ──

// GET /api/profile/admin
router.get("/admin", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { adminProfile: true },
    });
    if (!user || !user.adminProfile) {
      res.status(404).json({ message: "Perfil no encontrado" });
      return;
    }

    res.json({
      name: user.adminProfile.name,
      email: user.email,
      phone: user.adminProfile.phone,
      role: "Coach",
      avatarUrl: user.avatarUrl,
      timezone: user.adminProfile.timezone,
      language: user.adminProfile.language,
      theme: user.adminProfile.theme,
      notifications: {
        email: user.adminProfile.notifEmail,
        push: user.adminProfile.notifPush,
        newClient: user.adminProfile.notifNewClient,
        paymentReminder: user.adminProfile.notifPaymentReminder,
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: "Error al obtener perfil" });
  }
});

// PUT /api/profile/admin
router.put("/admin", async (req, res) => {
  try {
    const { name, phone, timezone, language, theme, notifications } = req.body;
    await prisma.adminProfile.update({
      where: { userId: req.user!.userId },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(timezone !== undefined && { timezone }),
        ...(language !== undefined && { language }),
        ...(theme !== undefined && { theme }),
        ...(notifications && {
          notifEmail: notifications.email,
          notifPush: notifications.push,
          notifNewClient: notifications.newClient,
          notifPaymentReminder: notifications.paymentReminder,
        }),
      },
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: "Error al actualizar perfil" });
  }
});

// ── Client Profile ──

// GET /api/profile/client
router.get("/client", async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { userId: req.user!.userId },
      include: { user: { select: { email: true, avatarUrl: true } } },
    });
    if (!client) { res.status(404).json({ message: "Cliente no encontrado" }); return; }

    res.json({
      id: client.id,
      name: client.name,
      email: client.user.email,
      phone: client.phone,
      avatarUrl: client.user.avatarUrl,
      theme: client.theme,
    });
  } catch (err: any) {
    res.status(500).json({ message: "Error al obtener perfil" });
  }
});

// PUT /api/profile/client
router.put("/client", async (req, res) => {
  try {
    const { name, phone } = req.body;
    await prisma.client.update({
      where: { userId: req.user!.userId },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
      },
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: "Error al actualizar perfil" });
  }
});

// ── Avatar (both admin & client) ──

// POST /api/profile/avatar
router.post("/avatar", uploadAvatar.single("file"), async (req, res) => {
  try {
    if (!req.file) { res.status(400).json({ message: "No se proporcionó archivo" }); return; }
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { avatarUrl },
    });
    res.json({ avatarUrl });
  } catch (err: any) {
    res.status(500).json({ message: "Error al subir avatar" });
  }
});

// DELETE /api/profile/avatar
router.delete("/avatar", async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { avatarUrl: null },
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: "Error al eliminar avatar" });
  }
});

// ── Change Email (with verification) ──

// PUT /api/profile/email — sends verification email to newEmail
router.put("/email", emailChangeLimiter, async (req, res) => {
  try {
    const { newEmail, currentPassword } = req.body;
    if (!newEmail || !currentPassword) {
      res.status(400).json({ message: "Email y contraseña son obligatorios" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) { res.status(404).json({ message: "Usuario no encontrado" }); return; }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) { res.status(400).json({ message: "Contraseña incorrecta" }); return; }

    if (user.email === newEmail) {
      res.status(400).json({ message: "El nuevo email es igual al actual" });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email: newEmail } });
    if (existing) { res.status(400).json({ message: "El email ya está en uso" }); return; }

    // Invalidate previous tokens
    await prisma.emailChangeToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await prisma.emailChangeToken.create({
      data: { userId: user.id, newEmail, token, expiresAt },
    });

    const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

    const { subject, html } = await buildEmail(
      "EMAIL_CHANGE",
      { nombre: user.email, nuevoEmail: newEmail },
      { ctaUrl: verifyUrl },
    );

    await transporter.sendMail({ from: FROM_EMAIL, to: newEmail, subject, html });

    res.json({ success: true, message: "Se ha enviado un email de verificación." });
  } catch (err: any) {
    console.error("Email change error:", err);
    res.status(500).json({ message: "Error al solicitar cambio de email" });
  }
});



// ── Change Password ──

// PUT /api/profile/password
router.put("/password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) { res.status(404).json({ message: "Usuario no encontrado" }); return; }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) { res.status(400).json({ message: "Contraseña actual incorrecta" }); return; }

    if (newPassword.length < 6) {
      res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
      return;
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { password: hashed },
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: "Error al cambiar contraseña" });
  }
});

export default router;
