import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { PrismaClient } from "@prisma/client";

// Routes
import authRoutes from "./routes/auth";
import passwordResetRoutes from "./routes/passwordReset";
import clientRoutes from "./routes/clients";
import exerciseRoutes from "./routes/exercises";
import trainingRoutes from "./routes/training";
import nutritionRoutes from "./routes/nutrition";
import checkinRoutes from "./routes/checkins";
import mediaRoutes from "./routes/media";
import notificationRoutes from "./routes/notifications";
import leadRoutes from "./routes/leads";
import testimonialRoutes from "./routes/testimonials";
import profileRoutes from "./routes/profile";
import billingRoutes from "./routes/billing";
import supplementRoutes from "./routes/supplements";
import questionnaireRoutes from "./routes/questionnaires";

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──
const allowedOrigins = (process.env.CORS_ORIGIN || "https://jipcoaching.com,https://www.jipcoaching.com").split(",").map(s => s.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

// Serve uploaded files with authentication — clients can only access their own files
const uploadDir = process.env.UPLOAD_DIR || "./uploads";

// Protected file serving: requires valid token, clients restricted to own files
app.use("/uploads", authenticate, async (req, res, next) => {
  // ADMINs can access all files
  if (req.user?.role === "ADMIN") return next();

  // For CLIENT role: check if the requested file belongs to them
  const filePath = req.path; // e.g., /progress/filename.jpg or /videos/filename.mp4

  if (filePath.startsWith("/progress/") || filePath.startsWith("/videos/")) {
    // Look up the file in the database to verify ownership
    const client = await prisma.client.findFirst({ where: { userId: req.user?.userId } });
    if (!client) {
      res.status(403).json({ message: "Acceso denegado" });
      return;
    }

    const fullUrl = `/uploads${filePath}`;

    // Check if this file belongs to the client (photo or video)
    const isOwner = await prisma.progressPhoto.findFirst({ where: { clientId: client.id, url: fullUrl } })
      || await prisma.techniqueVideo.findFirst({ where: { clientId: client.id, url: fullUrl } });

    if (!isOwner) {
      res.status(403).json({ message: "No tienes permiso para acceder a este archivo" });
      return;
    }
  }

  next();
}, express.static(path.resolve(uploadDir)));

// ── API Routes ──
app.use("/api/auth", authRoutes);
app.use("/api/auth", passwordResetRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use("/api/training", trainingRoutes);
app.use("/api/nutrition", nutritionRoutes);
app.use("/api/checkins", checkinRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/supplements", supplementRoutes);
app.use("/api/questionnaires", questionnaireRoutes);

// Mount media routes also under /api/clients/:clientId/media
// so frontend calls like /clients/abc/media/photos work
app.use("/api/clients/:clientId/media", mediaRoutes);

// GET /api/me — convenience alias forwarding to auth router's /me handler
import { authenticate } from "./middleware/auth";
app.get("/api/me", authenticate, async (req, res) => {
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
    console.error("Me alias error:", err);
    res.status(500).json({ message: "Error al obtener perfil" });
  }
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Error interno del servidor" });
});

// ── Cron scheduler ──
import { startCheckinScheduler } from "./cron/checkinScheduler";

// ── Start ──
app.listen(PORT, () => {
  console.log(`🚀 JIP Coaching API running on port ${PORT}`);
  startCheckinScheduler();
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
