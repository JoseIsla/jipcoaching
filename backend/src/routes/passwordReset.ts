import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { prisma } from "../server";
import { rateLimit } from "../middleware/rateLimiter";

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY);

const FRONTEND_URL = (process.env.FRONTEND_URL || "https://jipcoaching.com").replace(/\/+$/, "");
const FROM_EMAIL = process.env.FROM_EMAIL || "JIP Coaching <no-reply@jipcoaching.com>";
const TOKEN_EXPIRY_MINUTES = 30;

// Rate limit: max 5 requests per 15 min
const resetLimiter = rateLimit({ windowSec: 15 * 60, max: 5 });

// POST /api/auth/forgot-password
router.post("/forgot-password", resetLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: "Email es obligatorio" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      res.json({ message: "Si el email existe, recibirás un enlace de recuperación." });
      return;
    }

    // Invalidate previous tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Recupera tu contraseña – JIP Coaching",
      html: `
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
          <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 8px;">Recupera tu contraseña</h1>
          <p style="color:#999999;font-size:14px;margin:0;">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="color:#cccccc;font-size:14px;line-height:22px;margin:0 0 24px;">
            Haz clic en el botón de abajo para crear una nueva contraseña. Este enlace expirará en <strong style="color:#ffffff;">${TOKEN_EXPIRY_MINUTES} minutos</strong>.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${resetUrl}" target="_blank" style="display:inline-block;background-color:hsl(110,100%,54%);color:#000000;font-weight:700;font-size:14px;text-decoration:none;padding:14px 32px;border-radius:12px;">
                Restablecer contraseña
              </a>
            </td></tr>
          </table>
          <p style="color:#666666;font-size:12px;line-height:18px;margin:24px 0 0;">
            Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña seguirá siendo la misma.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:0 32px 24px;text-align:center;border-top:1px solid #292929;padding-top:20px;">
          <p style="color:#555555;font-size:11px;margin:0;">© ${new Date().getFullYear()} JIP Performance Nutrition. Todos los derechos reservados.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

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
