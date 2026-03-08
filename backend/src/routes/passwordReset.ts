import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { prisma } from "../server";
import { rateLimit } from "../middleware/rateLimiter";
import { buildEmail } from "../utils/emailBuilder";

const router = Router();

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

const forgotLimiter = rateLimit({ windowSec: 15 * 60, max: 5 });
const resetLimiter = rateLimit({ windowSec: 15 * 60, max: 10 });

// POST /api/auth/forgot-password
router.post("/forgot-password", resetLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: "Email es obligatorio" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.json({ message: "Si el email existe, recibirás un enlace de recuperación." });
      return;
    }

    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

    // Use DB template for password reset email
    const { subject, html } = await buildEmail(
      "PASSWORD_RESET",
      { nombre: user.email },
      { ctaUrl: resetUrl },
    );

    await transporter.sendMail({ from: FROM_EMAIL, to: email, subject, html });

    res.json({ message: "Si el email existe, recibirás un enlace de recuperación." });
  } catch (err: any) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Error al procesar la solicitud" });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", resetLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      res.status(400).json({ message: "Token y contraseña son obligatorios" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
      return;
    }

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (!resetToken || resetToken.usedAt || new Date() > resetToken.expiresAt) {
      res.status(400).json({ message: "El enlace ha expirado o ya fue utilizado. Solicita uno nuevo." });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({ where: { id: resetToken.userId }, data: { password: hashedPassword } }),
      prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    ]);

    res.json({ message: "Contraseña actualizada correctamente." });
  } catch (err: any) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Error al restablecer la contraseña" });
  }
});

export default router;
