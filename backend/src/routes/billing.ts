import { Router } from "express";
import { prisma } from "../server";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();
router.use(authenticate);
router.use(requireRole("ADMIN"));

// GET /api/billing/accounts
router.get("/accounts", async (_req, res) => {
  try {
    const accounts = await prisma.billingAccount.findMany({
      include: { billings: { orderBy: { month: "desc" } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(accounts);
  } catch (err: any) {
    res.status(500).json({ message: "Error al obtener cuentas de facturación" });
  }
});

// POST /api/billing/accounts
router.post("/accounts", async (req, res) => {
  try {
    const { payerUserId, monthlyFee, notes } = req.body;
    const account = await prisma.billingAccount.create({
      data: { payerUserId, monthlyFee, notes },
    });
    res.status(201).json(account);
  } catch (err: any) {
    res.status(500).json({ message: "Error al crear cuenta" });
  }
});

// POST /api/billing/accounts/:id/months
router.post("/accounts/:id/months", async (req, res) => {
  try {
    const { month, amount, status, method, notes } = req.body;
    const billing = await prisma.billingMonth.create({
      data: {
        billingAccountId: req.params.id,
        month,
        amount,
        status: status || "PENDING",
        method: method || "TRANSFER",
        notes,
      },
    });
    res.status(201).json(billing);
  } catch (err: any) {
    res.status(500).json({ message: "Error al crear mes de facturación" });
  }
});

// PATCH /api/billing/months/:id
router.patch("/months/:id", async (req, res) => {
  try {
    const { status, method, paidAt, notes } = req.body;
    const billing = await prisma.billingMonth.update({
      where: { id: req.params.id },
      data: {
        ...(status !== undefined && { status }),
        ...(method !== undefined && { method }),
        ...(paidAt !== undefined && { paidAt: new Date(paidAt) }),
        ...(notes !== undefined && { notes }),
      },
    });
    res.json(billing);
  } catch (err: any) {
    res.status(500).json({ message: "Error al actualizar facturación" });
  }
});

export default router;
