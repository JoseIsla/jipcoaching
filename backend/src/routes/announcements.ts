import { Router } from "express";
import { z } from "zod";
import { prisma } from "../server";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();
router.use(authenticate);

const upsertSchema = z.object({
  title: z.string().trim().min(1).max(180),
  body: z.string().trim().min(1).max(5000),
  bullets: z.array(z.string().trim().min(1).max(300)).max(20).optional().default([]),
  audience: z.enum(["NUTRITION", "TRAINING", "ALL"]),
  version: z.string().trim().max(40).optional().nullable(),
  active: z.boolean().optional().default(true),
});

// GET /api/announcements/pending  (client)
// Returns the single most recent active announcement matching client's pack
// that the client hasn't acknowledged yet.
router.get("/pending", async (req, res) => {
  try {
    const client = await prisma.client.findFirst({ where: { userId: req.user!.userId } });
    if (!client) { res.json(null); return; }

    const audienceFilter: ("NUTRITION" | "TRAINING" | "ALL")[] =
      client.packType === "NUTRITION" ? ["NUTRITION", "ALL"]
      : client.packType === "TRAINING" ? ["TRAINING", "ALL"]
      : ["NUTRITION", "TRAINING", "ALL"];

    const latest = await prisma.announcement.findFirst({
      where: {
        active: true,
        audience: { in: audienceFilter as any },
        reads: { none: { clientId: client.id } },
      },
      orderBy: { publishedAt: "desc" },
    });

    res.json(latest ?? null);
  } catch (err: any) {
    console.error("announcements/pending error", err);
    res.status(500).json({ message: "Error al obtener novedades" });
  }
});

// POST /api/announcements/:id/read  (client)
router.post("/:id/read", async (req, res) => {
  try {
    const client = await prisma.client.findFirst({ where: { userId: req.user!.userId } });
    if (!client) { res.status(403).json({ message: "Solo clientes" }); return; }
    const id = req.params.id as string;
    await prisma.announcementRead.upsert({
      where: { announcementId_clientId: { announcementId: id, clientId: client.id } },
      update: {},
      create: { announcementId: id, clientId: client.id },
    });
    res.json({ ok: true });
  } catch (err: any) {
    console.error("announcements/read error", err);
    res.status(500).json({ message: "Error al marcar como leído" });
  }
});

// ── Admin endpoints ──
router.use(requireRole("ADMIN"));

// GET /api/announcements  (admin list)
router.get("/", async (_req, res) => {
  try {
    const list = await prisma.announcement.findMany({
      orderBy: { publishedAt: "desc" },
      include: { _count: { select: { reads: true } } },
    });
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ message: "Error al listar novedades" });
  }
});

// POST /api/announcements  (admin create)
router.post("/", async (req, res) => {
  try {
    const parsed = upsertSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Datos inválidos", errors: parsed.error.flatten().fieldErrors });
      return;
    }
    const created = await prisma.announcement.create({
      data: {
        title: parsed.data.title,
        body: parsed.data.body,
        bullets: parsed.data.bullets as any,
        audience: parsed.data.audience,
        version: parsed.data.version ?? null,
        active: parsed.data.active ?? true,
        publishedAt: new Date(),
      },
    });
    res.status(201).json(created);
  } catch (err: any) {
    console.error("announcements POST error", err);
    res.status(500).json({ message: "Error al crear novedad" });
  }
});

// PATCH /api/announcements/:id  (admin update)
router.patch("/:id", async (req, res) => {
  try {
    const parsed = upsertSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Datos inválidos" });
      return;
    }
    const data: any = { ...parsed.data };
    if (data.bullets !== undefined) data.bullets = data.bullets as any;
    const updated = await prisma.announcement.update({
      where: { id: req.params.id as string },
      data,
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: "Error al actualizar novedad" });
  }
});

// DELETE /api/announcements/:id  (admin)
router.delete("/:id", async (req, res) => {
  try {
    await prisma.announcement.delete({ where: { id: req.params.id as string } });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ message: "Error al eliminar novedad" });
  }
});

export default router;