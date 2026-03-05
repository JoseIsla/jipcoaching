import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const adminUser = await prisma.user.upsert({
    where: { email: "info@jipcoaching.com" },
    update: {},
    create: {
      email: "info@jipcoaching.com",
      password: adminPassword,
      role: "ADMIN",
      adminProfile: {
        create: {
          name: "Jose Isla Pérez",
          phone: "+34 600 123 456",
        },
      },
    },
  });
  console.log("✅ Admin user created:", adminUser.email);

  // Create sample client
  const clientPassword = await bcrypt.hash("client123", 12);
  const clientUser = await prisma.user.upsert({
    where: { email: "carlos@email.com" },
    update: {},
    create: {
      email: "carlos@email.com",
      password: clientPassword,
      role: "CLIENT",
    },
  });

  const client = await prisma.client.upsert({
    where: { userId: clientUser.id },
    update: {},
    create: {
      userId: clientUser.id,
      name: "Carlos Martínez",
      email: "carlos@email.com",
      phone: "+34 612 345 678",
      age: 28,
      sex: "Masculino",
      height: 178,
      currentWeight: 78.5,
      targetWeight: 83,
      packType: "FULL",
      status: "ACTIVE",
      monthlyFee: 120,
      notes: "Objetivo: ganar 5kg de masa muscular en 6 meses.",
      startDate: new Date("2025-01-15"),
    },
  });
  console.log("✅ Client created:", client.name);

  // Create default exercises
  const exercises = [
    { name: "Sentadilla", category: "BASIC" as const, muscleGroup: "Pierna" },
    { name: "Press Banca", category: "BASIC" as const, muscleGroup: "Pecho" },
    { name: "Peso Muerto", category: "BASIC" as const, muscleGroup: "Posterior" },
    { name: "Sentadilla Pausa", category: "VARIANT" as const, muscleGroup: "Pierna" },
    { name: "Press Banca Estrecho", category: "VARIANT" as const, muscleGroup: "Pecho" },
    { name: "Peso Muerto Déficit", category: "VARIANT" as const, muscleGroup: "Posterior" },
    { name: "Prensa Inclinada", category: "ACCESSORY" as const, muscleGroup: "Pierna" },
    { name: "Curl Femoral Sentado", category: "ACCESSORY" as const, muscleGroup: "Posterior" },
    { name: "Hip Thrust", category: "ACCESSORY" as const, muscleGroup: "Glúteo" },
    { name: "Press Inclinado", category: "ACCESSORY" as const, muscleGroup: "Pecho" },
    { name: "Remo Pecho Apoyado", category: "ACCESSORY" as const, muscleGroup: "Espalda" },
    { name: "Jalón Polea", category: "ACCESSORY" as const, muscleGroup: "Espalda" },
    { name: "Elevaciones Laterales", category: "ACCESSORY" as const, muscleGroup: "Hombro" },
    { name: "Face Pull / Pájaros", category: "ACCESSORY" as const, muscleGroup: "Hombro" },
    { name: "Tríceps Polea (cuerda)", category: "ACCESSORY" as const, muscleGroup: "Brazos" },
    { name: "Curl Bíceps", category: "ACCESSORY" as const, muscleGroup: "Brazos" },
    { name: "Ab Wheel", category: "ACCESSORY" as const, muscleGroup: "Core" },
    { name: "Pallof Press", category: "ACCESSORY" as const, muscleGroup: "Core" },
    { name: "Dominadas / Asistidas", category: "ACCESSORY" as const, muscleGroup: "Espalda" },
  ];

  for (const ex of exercises) {
    await prisma.exercise.upsert({
      where: { id: `seed-${ex.name.toLowerCase().replace(/\s+/g, "-")}` },
      update: {},
      create: {
        id: `seed-${ex.name.toLowerCase().replace(/\s+/g, "-")}`,
        ...ex,
      },
    });
  }
  console.log("✅ Exercises seeded:", exercises.length);

  // Create default supplements
  const supplements = [
    { name: "Creatina monohidrato", dose: "5 g/día", timing: "A cualquier hora con agua" },
    { name: "Proteína whey isolate", dose: "1 scoop (30g)", timing: "Post-entreno o entre comidas" },
    { name: "Vitamina D3 + K2", dose: "2000 UI/día", timing: "Con comida rica en grasa" },
    { name: "Magnesio bisglicinato", dose: "400 mg", timing: "Antes de dormir" },
    { name: "Omega-3 (EPA+DHA)", dose: "2 cápsulas", timing: "Con comida principal" },
  ];

  for (const sup of supplements) {
    await prisma.supplement.create({ data: sup });
  }
  console.log("✅ Supplements seeded:", supplements.length);

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
