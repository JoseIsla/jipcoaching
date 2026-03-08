import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../server";
import { authenticate, generateToken } from "../middleware/auth";
import { rateLimit } from "../middleware/rateLimiter";

const router = Router();

// Rate limit: max 20 login attempts per IP every 15 minutes
const loginLimiter = rateLimit({ windowSec: 15 * 60, max: 20 });

const registerSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(128),
  name: z.string().trim().max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(128),
});

// POST /api/auth/register
// SECURITY: Role is ALWAYS forced to CLIENT. Only admins can promote users.
router.post("/register", loginLimiter, async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Datos inválidos", errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { email, password, name } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ message: "El email ya está registrado" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "CLIENT", // Always CLIENT — no privilege escalation
      },
    });

    const token = generateToken({ userId: user.id, role: user.role });
    res.status(201).json({ access_token: token });
  } catch (err: any) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Error al registrar usuario" });
  }
});

// POST /api/auth/login
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email y contraseña son obligatorios" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ message: "Credenciales incorrectas" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ message: "Credenciales incorrectas" });
      return;
    }

    const token = generateToken({ userId: user.id, role: user.role });
    res.json({ access_token: token });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Error al iniciar sesión" });
  }
});

// GET /api/auth/me  AND  GET /api/me
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, role: true, avatarUrl: true },
    });
    if (!user) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }
    res.json(user);
  } catch (err: any) {
    console.error("Me error:", err);
    res.status(500).json({ message: "Error al obtener perfil" });
  }
});

export default router;
