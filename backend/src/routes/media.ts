import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../server";
import { authenticate, requireRole } from "../middleware/auth";
import { uploadProgressPhoto, uploadVideo } from "../middleware/upload";

const router = Router({ mergeParams: true });
router.use(authenticate);

// Helper: resolve clientId from either parent param or route param
const resolveClientId = (req: any): string | undefined =>
  req.params.clientId || req.params.cid;

/**
 * Ownership guard: ensures CLIENT users can only access their own media.
 * ADMINs bypass this check.
 */
const enforceOwnership = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (req.user?.role === "ADMIN") return next();

  const clientId = resolveClientId(req);
  if (!clientId) return next(); // will be caught by the handler

  // Find the client record linked to this user
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client || client.userId !== req.user?.userId) {
    res.status(403).json({ message: "No tienes permiso para acceder a este recurso" });
    return;
  }
  next();
};

// Apply ownership guard to all media routes
router.use(enforceOwnership);

// ── Progress Photos ──

// GET /photos/:cid  OR  (parent)/photos
router.get("/photos/:cid?", async (req, res) => {
  try {
    const clientId = resolveClientId(req);
    if (!clientId) {
      res.status(400).json({ message: "clientId es obligatorio" });
      return;
    }

    const photos = await prisma.progressPhoto.findMany({
      where: { clientId },
      orderBy: { sessionDate: "desc" },
    });
    res.json(photos.map((p) => ({
      id: p.id,
      clientId: p.clientId,
      angle: p.angle.toLowerCase(),
      url: p.url,
      thumbnailUrl: p.thumbnailUrl,
      sessionDate: p.sessionDate.toISOString().split("T")[0],
      uploadedAt: p.uploadedAt.toISOString(),
    })));
  } catch (err: any) {
    res.status(500).json({ message: "Error al obtener fotos" });
  }
});

// POST /photos/:cid  OR  (parent)/photos
router.post("/photos/:cid?", uploadProgressPhoto.single("file"), async (req, res) => {
  try {
    if (!req.file) { res.status(400).json({ message: "No se proporcionó archivo" }); return; }

    const clientId = resolveClientId(req);
    if (!clientId) { res.status(400).json({ message: "clientId es obligatorio" }); return; }

    const { angle, sessionDate } = req.body;
    const url = `/uploads/progress/${req.file.filename}`;

    const photo = await prisma.progressPhoto.create({
      data: {
        clientId,
        angle: angle?.toUpperCase() || "FRONT",
        url,
        sessionDate: new Date(sessionDate || new Date()),
      },
    });

    res.status(201).json({
      id: photo.id,
      clientId: photo.clientId,
      angle: photo.angle.toLowerCase(),
      url: photo.url,
      sessionDate: photo.sessionDate.toISOString().split("T")[0],
      uploadedAt: photo.uploadedAt.toISOString(),
    });
  } catch (err: any) {
    console.error("POST photos error:", err);
    res.status(500).json({ message: "Error al subir foto" });
  }
});

// DELETE /photos/:photoId
router.delete("/photos/:photoId", async (req, res) => {
  try {
    await prisma.progressPhoto.delete({ where: { id: req.params.photoId as string } });
    res.json({ message: "Foto eliminada" });
  } catch (err: any) {
    res.status(500).json({ message: "Error al eliminar foto" });
  }
});

// ── Technique Videos ──

// GET /videos/:cid  OR  (parent)/videos
router.get("/videos/:cid?", async (req, res) => {
  try {
    const clientId = resolveClientId(req);
    if (!clientId) { res.status(400).json({ message: "clientId es obligatorio" }); return; }

    const now = new Date();
    const videos = await prisma.techniqueVideo.findMany({
      where: { clientId, expiresAt: { gt: now } },
      orderBy: { uploadedAt: "desc" },
    });
    res.json(videos.map((v) => ({
      id: v.id,
      clientId: v.clientId,
      exerciseName: v.exerciseName,
      url: v.url,
      notes: v.notes,
      uploadedAt: v.uploadedAt.toISOString(),
      expiresAt: v.expiresAt.toISOString(),
    })));
  } catch (err: any) {
    res.status(500).json({ message: "Error al obtener vídeos" });
  }
});

// POST /videos/:cid  OR  (parent)/videos
router.post("/videos/:cid?", uploadVideo.single("file"), async (req, res) => {
  try {
    if (!req.file) { res.status(400).json({ message: "No se proporcionó archivo" }); return; }

    const clientId = resolveClientId(req);
    if (!clientId) { res.status(400).json({ message: "clientId es obligatorio" }); return; }

    const { exerciseName, notes } = req.body;
    const url = `/uploads/videos/${req.file.filename}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 6); // 6-day expiry

    const video = await prisma.techniqueVideo.create({
      data: {
        clientId,
        exerciseName: exerciseName || "Sin nombre",
        url,
        notes,
        expiresAt,
      },
    });

    // Notify all admins about new technique video
    try {
      const client = await prisma.client.findUnique({ where: { id: clientId } });
      const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
      const clientName = client?.name ?? "Cliente";
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: "checkin",
            title: "Nuevo vídeo de técnica",
            message: `${clientName} ha subido un vídeo de ${exerciseName || "técnica"}`,
            link: `/admin/clients/${clientId}`,
          },
        });
      }
    } catch (notifErr) {
      console.warn("Failed to create video notification:", notifErr);
    }

    res.status(201).json({
      id: video.id,
      clientId: video.clientId,
      exerciseName: video.exerciseName,
      url: video.url,
      notes: video.notes,
      uploadedAt: video.uploadedAt.toISOString(),
      expiresAt: video.expiresAt.toISOString(),
    });
  } catch (err: any) {
    console.error("POST videos error:", err);
    res.status(500).json({ message: "Error al subir vídeo" });
  }
});

// DELETE /videos/:videoId
router.delete("/videos/:videoId", async (req, res) => {
  try {
    await prisma.techniqueVideo.delete({ where: { id: req.params.videoId as string } });
    res.json({ message: "Vídeo eliminado" });
  } catch (err: any) {
    res.status(500).json({ message: "Error al eliminar vídeo" });
  }
});

// ── Media Comments ──

// GET /comments?targetType=xxx&targetId=xxx
router.get("/comments", async (req, res) => {
  try {
    const { targetType, targetId, clientId } = req.query;
    const where: any = {};
    if (targetType) where.targetType = (targetType as string).toUpperCase();
    if (targetId) where.targetId = targetId;
    if (clientId) where.clientId = clientId;

    const comments = await prisma.mediaComment.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    res.json(comments);
  } catch (err: any) {
    res.status(500).json({ message: "Error al obtener comentarios" });
  }
});

// POST /comments
router.post("/comments", requireRole("ADMIN"), async (req, res) => {
  try {
    const { targetType, targetId, clientId, authorName, authorAvatarUrl, text } = req.body;
    const comment = await prisma.mediaComment.create({
      data: {
        targetType: targetType.toUpperCase(),
        targetId,
        clientId,
        authorName,
        authorAvatarUrl: authorAvatarUrl || null,
        text,
      },
    });

    // Create a server-side notification for the client
    if (clientId) {
      try {
        const client = await prisma.client.findUnique({ where: { id: clientId } });
        if (client) {
          const isVideo = targetType.toUpperCase() === "VIDEO";
          await prisma.notification.create({
            data: {
              userId: client.userId,
              type: "media_comment",
              title: isVideo ? "💬 Nuevo comentario en tu vídeo" : "💬 Nuevo comentario en tus fotos",
              message: `${authorName} ha dejado un comentario: "${text.substring(0, 100)}${text.length > 100 ? "…" : ""}"`,
              link: "/client/progress",
            },
          });
        }
      } catch (notifErr) {
        console.warn("Failed to create comment notification:", notifErr);
      }
    }

    res.status(201).json(comment);
  } catch (err: any) {
    res.status(500).json({ message: "Error al crear comentario" });
  }
});

// DELETE /comments/:id
router.delete("/comments/:id", requireRole("ADMIN"), async (req, res) => {
  try {
    await prisma.mediaComment.delete({ where: { id: req.params.id as string } });
    res.json({ message: "Comentario eliminado" });
  } catch (err: any) {
    res.status(500).json({ message: "Error al eliminar comentario" });
  }
});

export default router;
