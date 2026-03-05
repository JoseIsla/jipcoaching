import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { PrismaClient } from "@prisma/client";

// Routes
import authRoutes from "./routes/auth";
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

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──
app.use(cors({
  origin: process.env.CORS_ORIGIN || "https://jipcoaching.com",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

// Serve uploaded files statically
const uploadDir = process.env.UPLOAD_DIR || "./uploads";
app.use("/uploads", express.static(path.resolve(uploadDir)));

// ── API Routes ──
app.use("/api/auth", authRoutes);
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

// GET /api/me — alias used by frontend
app.use("/api/me", (req, res, next) => {
  // Redirect to auth/me handler
  req.url = "/me";
  authRoutes(req, res, next);
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

// ── Start ──
app.listen(PORT, () => {
  console.log(`🚀 JIP Coaching API running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
