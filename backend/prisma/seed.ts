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

  await ensureTestAccounts();

  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
