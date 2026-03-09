import { Router } from "express";
import { prisma } from "../server";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();
router.use(authenticate);

// GET /api/nutrition/plans?clientId=xxx
router.get("/plans", async (req, res) => {
  try {
    const { clientId } = req.query;
    const where: any = {};

    if (req.user!.role === "CLIENT") {
      const client = await prisma.client.findUnique({ where: { userId: req.user!.userId } });
      if (!client) { res.status(404).json({ message: "Cliente no encontrado" }); return; }
      where.clientId = client.id;
    } else if (clientId) {
      where.clientId = clientId as string;
    }

    const plans = await prisma.nutritionPlan.findMany({
      where,
      include: {
        client: { select: { name: true } },
        meals: {
          include: {
            options: {
              include: { rows: { orderBy: { order: "asc" } } },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
        sections: { orderBy: { order: "asc" } },
        foodItems: { include: { portions: true } },
        planSupplements: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(plans);
  } catch (err: any) {
    console.error("GET /nutrition/plans error:", err);
    res.status(500).json({ message: "Error al obtener planes" });
  }
});

// GET /api/nutrition/plans/:id
router.get("/plans/:id", async (req, res) => {
  try {
    const plan = await prisma.nutritionPlan.findUnique({
      where: { id: req.params.id as string },
      include: {
        meals: {
          include: {
            options: {
              include: { rows: { orderBy: { order: "asc" } } },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
        sections: { orderBy: { order: "asc" } },
        foodItems: { include: { portions: true } },
        planSupplements: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!plan) { res.status(404).json({ message: "Plan no encontrado" }); return; }
    res.json(plan);
  } catch (err: any) {
    res.status(500).json({ message: "Error al obtener plan" });
  }
});

// GET /api/nutrition/me/active
router.get("/me/active", async (req, res) => {
  try {
    const client = await prisma.client.findUnique({ where: { userId: req.user!.userId } });
    if (!client) { res.status(404).json({ message: "Cliente no encontrado" }); return; }

    const plan = await prisma.nutritionPlan.findFirst({
      where: { clientId: client.id, isActive: true },
      include: {
        meals: {
          include: {
            options: {
              include: { rows: { orderBy: { order: "asc" } } },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
        sections: { orderBy: { order: "asc" } },
        foodItems: { include: { portions: true } },
        planSupplements: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!plan) { res.status(404).json({ message: "No hay plan activo" }); return; }
    res.json(plan);
  } catch (err: any) {
    res.status(500).json({ message: "Error al obtener plan activo" });
  }
});

// POST /api/nutrition/plans — Admin only
router.post("/plans", requireRole("ADMIN"), async (req, res) => {
  try {
    const { clientId, title, objective, recommendations, kcalMin, kcalMax, proteinG, carbsG, fatsG, meals, startDate } = req.body;

    if (!clientId || !title) {
      res.status(400).json({ message: "clientId y title son obligatorios" });
      return;
    }

    // Deactivate existing active plans
    await prisma.nutritionPlan.updateMany({
      where: { clientId, isActive: true },
      data: { isActive: false },
    });

    const plan = await prisma.nutritionPlan.create({
      data: {
        clientId,
        title,
        objective,
        recommendations: Array.isArray(recommendations) ? JSON.stringify(recommendations) : recommendations,
        kcalMin,
        kcalMax,
        proteinG,
        carbsG,
        fatsG,
        startDate: startDate ? new Date(startDate) : new Date(),
        meals: meals ? {
          create: meals.map((m: any, mi: number) => ({
            name: m.name,
            order: mi,
            description: m.description,
            notes: m.notes,
            options: m.options ? {
              create: m.options.map((o: any, oi: number) => ({
                name: o.name,
                notes: o.notes,
                order: oi,
                rows: o.rows ? {
                  create: o.rows.map((r: any, ri: number) => ({
                    mainIngredient: r.mainIngredient,
                    alternatives: JSON.stringify(r.alternatives || []),
                    macroCategory: r.macroCategory || "",
                    order: ri,
                  })),
                } : undefined,
              })),
            } : undefined,
          })),
        } : undefined,
      },
      include: {
        meals: {
          include: { options: { include: { rows: true } } },
        },
      },
    });

    // Notify the client about new nutrition plan
    try {
      const client = await prisma.client.findUnique({ where: { id: clientId } });
      if (client) {
        await prisma.notification.create({
          data: {
            userId: client.userId,
            type: "plan",
            title: "Nuevo plan de nutrición",
            message: `Se te ha asignado el plan "${title}"`,
            link: "/client/nutrition",
          },
        });
      }
    } catch (notifErr) {
      console.warn("Failed to create nutrition plan notification:", notifErr);
    }

    res.status(201).json(plan);
  } catch (err: any) {
    console.error("POST /nutrition/plans error:", err);
    res.status(500).json({ message: "Error al crear plan" });
  }
});

// PUT /api/nutrition/plans/:id — Admin only
router.put("/plans/:id", requireRole("ADMIN"), async (req, res) => {
  try {
    const { title, objective, recommendations, kcalMin, kcalMax, proteinG, carbsG, fatsG, isActive, meals } = req.body;

    const plan = await prisma.nutritionPlan.update({
      where: { id: req.params.id as string },
      data: {
        ...(title !== undefined && { title }),
        ...(objective !== undefined && { objective }),
        ...(recommendations !== undefined && { recommendations: Array.isArray(recommendations) ? JSON.stringify(recommendations) : recommendations }),
        ...(kcalMin !== undefined && { kcalMin }),
        ...(kcalMax !== undefined && { kcalMax }),
        ...(proteinG !== undefined && { proteinG }),
        ...(carbsG !== undefined && { carbsG }),
        ...(fatsG !== undefined && { fatsG }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    // If meals provided, rebuild them
    if (meals && Array.isArray(meals)) {
      await prisma.nutritionMeal.deleteMany({ where: { planId: plan.id } });
      for (let mi = 0; mi < meals.length; mi++) {
        const m = meals[mi];
        await prisma.nutritionMeal.create({
          data: {
            planId: plan.id,
            name: m.name,
            order: mi,
            description: m.description,
            notes: m.notes,
            options: m.options ? {
              create: m.options.map((o: any, oi: number) => ({
                name: o.name,
                notes: o.notes,
                order: oi,
                rows: o.rows ? {
                  create: o.rows.map((r: any, ri: number) => ({
                    mainIngredient: r.mainIngredient,
                    alternatives: JSON.stringify(r.alternatives || []),
                    macroCategory: r.macroCategory || "",
                    order: ri,
                  })),
                } : undefined,
              })),
            } : undefined,
          },
        });
      }
    }

    const result = await prisma.nutritionPlan.findUnique({
      where: { id: plan.id },
      include: {
        meals: {
          include: { options: { include: { rows: true } } },
          orderBy: { order: "asc" },
        },
        sections: { orderBy: { order: "asc" } },
      },
    });

    res.json(result);
  } catch (err: any) {
    console.error("PUT /nutrition/plans/:id error:", err);
    res.status(500).json({ message: "Error al actualizar plan" });
  }
});

// PATCH /api/nutrition/plans/:id/toggle
router.patch("/plans/:id/toggle", requireRole("ADMIN"), async (req, res) => {
  try {
    const { isActive } = req.body;
    const plan = await prisma.nutritionPlan.findUnique({ where: { id: req.params.id as string } });
    if (!plan) { res.status(404).json({ message: "Plan no encontrado" }); return; }

    if (isActive) {
      await prisma.nutritionPlan.updateMany({
        where: { clientId: plan.clientId, isActive: true },
        data: { isActive: false },
      });
    }

    const updated = await prisma.nutritionPlan.update({
      where: { id: req.params.id as string },
      data: { isActive },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: "Error al cambiar estado del plan" });
  }
});

export default router;
