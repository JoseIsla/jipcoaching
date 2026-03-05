import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../server";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

// All routes require authentication
router.use(authenticate);

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

export default router;
