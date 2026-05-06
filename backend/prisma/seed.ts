import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TEST_ADMIN = {
  email: "jose_isla@jipcoaching.com",
  password: "admin123",
  name: "José Isla Pérez",
  phone: "+34676188961",
};

const TEST_CLIENT = {
  email: "adrianclv@icloud.com",
  password: "AdriTemp123",
  name: "Adrián Cliente",
  packType: "FULL" as const,
};

async function ensureTestAccounts() {
  console.log("🔐 Seeding test accounts...");

  const [adminPasswordHash, clientPasswordHash] = await Promise.all([
    bcrypt.hash(TEST_ADMIN.password, 12),
    bcrypt.hash(TEST_CLIENT.password, 12),
  ]);

  const adminUser = await prisma.user.upsert({
    where: { email: TEST_ADMIN.email },
    update: {
      password: adminPasswordHash,
      role: "ADMIN",
    },
    create: {
      email: TEST_ADMIN.email,
      password: adminPasswordHash,
      role: "ADMIN",
    },
  });

  await prisma.adminProfile.upsert({
    where: { userId: adminUser.id },
    update: {
      name: TEST_ADMIN.name,
      phone: TEST_ADMIN.phone,
      timezone: "Europe/Madrid",
      language: "Español",
    },
    create: {
      userId: adminUser.id,
      name: TEST_ADMIN.name,
      phone: TEST_ADMIN.phone,
      timezone: "Europe/Madrid",
      language: "Español",
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { email: TEST_CLIENT.email },
    update: {
      password: clientPasswordHash,
      role: "CLIENT",
    },
    create: {
      email: TEST_CLIENT.email,
      password: clientPasswordHash,
      role: "CLIENT",
    },
  });

  await prisma.client.upsert({
    where: { userId: clientUser.id },
    update: {
      name: TEST_CLIENT.name,
      email: TEST_CLIENT.email,
      packType: TEST_CLIENT.packType,
      status: "ACTIVE",
      monthlyFee: 0,
    },
    create: {
      userId: clientUser.id,
      name: TEST_CLIENT.name,
      email: TEST_CLIENT.email,
      packType: TEST_CLIENT.packType,
      status: "ACTIVE",
      monthlyFee: 0,
      startDate: new Date(),
    },
  });

  console.log("✅ Test accounts ready:", TEST_ADMIN.email, TEST_CLIENT.email);
}

async function main() {
  console.log("🌱 Seeding global tables (supplements, fruits, vegetables)...");

  // ════════════════════════════════════════════
  // 1. SUPPLEMENTS
  // ════════════════════════════════════════════
  await prisma.supplement.deleteMany({});

  const supplements = [
    { name: "Creatina", dose: "5 g/día", timing: "A cualquier hora" },
    { name: "Cafeína o preentreno", dose: "Dosis recomendada por fabricante", timing: "60-30 min antes de entrenar" },
    { name: "Magnesio bisglicinato", dose: "200–300 mg/día", timing: "Noche" },
    { name: "Ashwagandha", dose: "1 pastilla", timing: "1 vez por día" },
    { name: "Vitamina D3 + K2", dose: "2000 UI/día", timing: "Con comida rica en grasa" },
    { name: "Omega-3 (EPA+DHA)", dose: "1–2 g/día", timing: "Con comidas principales" },
  ];

  for (const sup of supplements) {
    await prisma.supplement.create({ data: sup });
  }
  console.log("✅ Supplements seeded:", supplements.length);

  // ════════════════════════════════════════════
  // 2. GLOBAL FOOD ITEMS — Fruits
  // ════════════════════════════════════════════
  await prisma.globalFoodItem.deleteMany({});

  const fruits = [
    "Piña (210g)", "Higo (150g)", "Pitaya (300g)", "Ciruela pasa (45g)", "Ciruela (230g)",
    "Albaricoque (220g)", "Caqui (85g)", "Níspero (210g)", "Cereza (205g)", "Plátano (110g)",
    "Manzana (210g)", "Mango (180g)", "Melón (310g)", "Fresa (310g)", "Chirimoya (125g)",
    "Melocotón (270g)", "Frambuesa (190g)", "Kiwi (170g)", "Naranja (220g)", "Guayaba (160g)",
    "Granada (320g)", "Papaya (240g)", "Dátil (40g)", "Sandía (360g)", "Pera (170g)",
    "Nectarina (240g)", "Mandarina (240g)", "Uva (160g)", "Pasas (30g)", "Mora (240g)",
    "Bowl de frutas mixtas (200g)", "Arándano (190g)", "Pomelo (250g)", "Zumo de naranja (240g)",
  ];

  for (let i = 0; i < fruits.length; i++) {
    await prisma.globalFoodItem.create({
      data: { type: "FRUIT", name: fruits[i], order: i },
    });
  }
  console.log("✅ Fruits seeded:", fruits.length);

  // ════════════════════════════════════════════
  // 3. GLOBAL FOOD ITEMS — Vegetables
  // ════════════════════════════════════════════
  const vegetables = [
    "Calabaza", "Berenjena", "Coliflor", "Pimiento", "Tomate",
    "Calabacín", "Remolacha", "Hojas verdes", "Repollo", "Pepino",
    "Espárrago", "Guisantes", "Acelga", "Brócoli", "Ajo",
    "Cebolla", "Zanahoria", "Albahaca", "Rúcula", "Lechuga",
    "Judías verdes", "Alcachofa", "Gazpacho", "Col de Bruselas", "Apio",
    "Pepinillos", "Champiñones", "Rábano", "Puerro", "Tomate cherry",
  ];

  for (let i = 0; i < vegetables.length; i++) {
    await prisma.globalFoodItem.create({
      data: { type: "VEGETABLE", name: vegetables[i], order: i },
    });
  }
  console.log("✅ Vegetables seeded:", vegetables.length);

  await seedPhysicalTestScales();

  await ensureTestAccounts();

  console.log("🎉 Seed complete!");
}

async function seedPhysicalTestScales() {
  console.log("🏋️ Seeding physical test scales...");
  await prisma.physicalTestScale.deleteMany({});

  type Row = { oppositionType: any; testName: string; gender: string; minValue: number; maxValue: number; unit: string; score: number };
  const rows: Row[] = [];

  // Helper: for "lower is better" tests (time), minValue is the upper bound of the range
  // We store ranges so that: score awarded when value >= minValue AND value <= maxValue
  // For time-based: lower time = higher score, so minValue < maxValue

  // ═══════════════════════════════════════
  // POLICÍA NACIONAL — Circuito de agilidad (seconds, lower = better)
  // ═══════════════════════════════════════
  const pnAgilidadH: [number, number, number][] = [
    [11.7, 99, 0], [11.5, 11.6, 1], [11.0, 11.4, 2], [10.5, 11.2, 3],
    [10.6, 10.9, 4], [10.2, 10.5, 5], [9.8, 10.1, 6], [9.4, 9.7, 7],
    [8.9, 9.3, 8], [8.3, 8.8, 9], [0, 8.2, 10],
  ];
  for (const [min, max, score] of pnAgilidadH) {
    rows.push({ oppositionType: "POLICIA_NACIONAL", testName: "Circuito de agilidad", gender: "MALE", minValue: min, maxValue: max, unit: "seconds", score });
  }
  const pnAgilidadM: [number, number, number][] = [
    [12.8, 99, 0], [12.6, 12.7, 1], [12.4, 12.5, 2], [12.1, 12.3, 3],
    [11.7, 12.0, 4], [11.3, 11.6, 5], [10.9, 11.2, 6], [10.4, 10.8, 7],
    [9.9, 10.3, 8], [9.4, 9.8, 9], [0, 9.3, 10],
  ];
  for (const [min, max, score] of pnAgilidadM) {
    rows.push({ oppositionType: "POLICIA_NACIONAL", testName: "Circuito de agilidad", gender: "FEMALE", minValue: min, maxValue: max, unit: "seconds", score });
  }

  // POLICÍA NACIONAL — Dominadas hombres (reps, higher = better)
  const pnDominadasH: [number, number, number][] = [
    [0, 4, 0], [5, 5, 1], [6, 6, 2], [7, 7, 3], [8, 9, 4],
    [10, 11, 5], [12, 13, 6], [14, 14, 7], [15, 15, 8], [16, 16, 9], [17, 99, 10],
  ];
  for (const [min, max, score] of pnDominadasH) {
    rows.push({ oppositionType: "POLICIA_NACIONAL", testName: "Dominadas", gender: "MALE", minValue: min, maxValue: max, unit: "reps", score });
  }

  // POLICÍA NACIONAL — Suspensión mujeres (seconds, higher = better)
  const pnSuspensionM: [number, number, number][] = [
    [0, 35, 0], [36, 40, 1], [41, 45, 2], [46, 51, 3], [52, 56, 4],
    [57, 62, 5], [63, 69, 6], [70, 77, 7], [78, 85, 8], [86, 94, 9], [95, 999, 10],
  ];
  for (const [min, max, score] of pnSuspensionM) {
    rows.push({ oppositionType: "POLICIA_NACIONAL", testName: "Suspensión en barra", gender: "FEMALE", minValue: min, maxValue: max, unit: "seconds", score });
  }

  // POLICÍA NACIONAL — Carrera 1000m (seconds, lower = better)
  // Converting mm:ss to total seconds
  const pnCarreraH: [number, number, number][] = [
    [229, 999, 0], [223, 228, 1], [217, 222, 2], [211, 216, 3],
    [205, 210, 4], [199, 204, 5], [193, 198, 6], [187, 192, 7],
    [181, 186, 8], [175, 180, 9], [0, 174, 10],
  ];
  for (const [min, max, score] of pnCarreraH) {
    rows.push({ oppositionType: "POLICIA_NACIONAL", testName: "Carrera 1000m", gender: "MALE", minValue: min, maxValue: max, unit: "seconds", score });
  }
  const pnCarreraM: [number, number, number][] = [
    [286, 999, 0], [277, 285, 1], [268, 276, 2], [259, 267, 3],
    [250, 258, 4], [241, 249, 5], [232, 240, 6], [223, 231, 7],
    [214, 222, 8], [205, 213, 9], [0, 204, 10],
  ];
  for (const [min, max, score] of pnCarreraM) {
    rows.push({ oppositionType: "POLICIA_NACIONAL", testName: "Carrera 1000m", gender: "FEMALE", minValue: min, maxValue: max, unit: "seconds", score });
  }

  // ═══════════════════════════════════════
  // BOMBEROS — Reference marks (pass/fail style, score 0 or 5 for simplicity)
  // ═══════════════════════════════════════
  const bomberoTests: { test: string; gender: string; pass: number; unit: string; lowerBetter: boolean }[] = [
    { test: "Carrera 60m", gender: "MALE", pass: 8, unit: "seconds", lowerBetter: true },
    { test: "Carrera 60m", gender: "FEMALE", pass: 9, unit: "seconds", lowerBetter: true },
    { test: "Carrera 100m", gender: "MALE", pass: 14, unit: "seconds", lowerBetter: true },
    { test: "Carrera 100m", gender: "FEMALE", pass: 16, unit: "seconds", lowerBetter: true },
    { test: "Carrera 1000m", gender: "MALE", pass: 210, unit: "seconds", lowerBetter: true },
    { test: "Carrera 1000m", gender: "FEMALE", pass: 240, unit: "seconds", lowerBetter: true },
    { test: "Carrera 2000m", gender: "MALE", pass: 480, unit: "seconds", lowerBetter: true },
    { test: "Carrera 2000m", gender: "FEMALE", pass: 540, unit: "seconds", lowerBetter: true },
    { test: "Natación 50m", gender: "MALE", pass: 40, unit: "seconds", lowerBetter: true },
    { test: "Natación 50m", gender: "FEMALE", pass: 50, unit: "seconds", lowerBetter: true },
    { test: "Salto vertical", gender: "MALE", pass: 45, unit: "cm", lowerBetter: false },
    { test: "Salto vertical", gender: "FEMALE", pass: 38, unit: "cm", lowerBetter: false },
    { test: "Press de banca", gender: "MALE", pass: 45, unit: "kg", lowerBetter: false },
    { test: "Press de banca", gender: "FEMALE", pass: 27, unit: "kg", lowerBetter: false },
    { test: "Dominadas", gender: "MALE", pass: 12, unit: "reps", lowerBetter: false },
    { test: "Dominadas", gender: "FEMALE", pass: 6, unit: "reps", lowerBetter: false },
    { test: "Circuito de agilidad", gender: "MALE", pass: 19, unit: "seconds", lowerBetter: true },
    { test: "Circuito de agilidad", gender: "FEMALE", pass: 22, unit: "seconds", lowerBetter: true },
  ];
  for (const t of bomberoTests) {
    if (t.lowerBetter) {
      rows.push({ oppositionType: "BOMBEROS", testName: t.test, gender: t.gender, minValue: 0, maxValue: t.pass, unit: t.unit, score: 5 });
      rows.push({ oppositionType: "BOMBEROS", testName: t.test, gender: t.gender, minValue: t.pass + 0.01, maxValue: 9999, unit: t.unit, score: 0 });
    } else {
      rows.push({ oppositionType: "BOMBEROS", testName: t.test, gender: t.gender, minValue: t.pass, maxValue: 9999, unit: t.unit, score: 5 });
      rows.push({ oppositionType: "BOMBEROS", testName: t.test, gender: t.gender, minValue: 0, maxValue: t.pass - 0.01, unit: t.unit, score: 0 });
    }
  }

  // ═══════════════════════════════════════
  // POLICÍA LOCAL — Same tests as Policía Nacional (reference)
  // ═══════════════════════════════════════
  for (const r of rows.filter(r => r.oppositionType === "POLICIA_NACIONAL")) {
    rows.push({ ...r, oppositionType: "POLICIA_LOCAL" });
  }

  // ═══════════════════════════════════════
  // TROPA Y MARINERÍA
  // ═══════════════════════════════════════
  const tropaTests: { test: string; gender: string; pass: number; unit: string; lowerBetter: boolean }[] = [
    { test: "Salto vertical", gender: "MALE", pass: 49, unit: "cm", lowerBetter: false },
    { test: "Salto vertical", gender: "FEMALE", pass: 36, unit: "cm", lowerBetter: false },
    { test: "Flexiones de brazos", gender: "MALE", pass: 19, unit: "reps", lowerBetter: false },
    { test: "Flexiones de brazos", gender: "FEMALE", pass: 10, unit: "reps", lowerBetter: false },
    { test: "Course Navette", gender: "MALE", pass: 7, unit: "periods", lowerBetter: false },
    { test: "Course Navette", gender: "FEMALE", pass: 4.5, unit: "periods", lowerBetter: false },
  ];
  for (const t of tropaTests) {
    if (t.lowerBetter) {
      rows.push({ oppositionType: "TROPA_MARINERIA", testName: t.test, gender: t.gender, minValue: 0, maxValue: t.pass, unit: t.unit, score: 5 });
      rows.push({ oppositionType: "TROPA_MARINERIA", testName: t.test, gender: t.gender, minValue: t.pass + 0.01, maxValue: 9999, unit: t.unit, score: 0 });
    } else {
      rows.push({ oppositionType: "TROPA_MARINERIA", testName: t.test, gender: t.gender, minValue: t.pass, maxValue: 9999, unit: t.unit, score: 5 });
      rows.push({ oppositionType: "TROPA_MARINERIA", testName: t.test, gender: t.gender, minValue: 0, maxValue: t.pass - 0.01, unit: t.unit, score: 0 });
    }
  }

  for (const row of rows) {
    await prisma.physicalTestScale.create({ data: row });
  }
  console.log("✅ Physical test scales seeded:", rows.length);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
