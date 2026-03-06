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

  // ── Exercise Library ──

  // Helper to create an exercise with a stable seed ID
  const seedEx = async (
    name: string,
    category: "BASIC" | "VARIANT" | "ACCESSORY",
    muscleGroup: string,
    parentName?: string,
  ) => {
    const id = `seed-${name.toLowerCase().replace(/[\s\/()]+/g, "-")}`;
    const parentId = parentName
      ? `seed-${parentName.toLowerCase().replace(/[\s\/()]+/g, "-")}`
      : null;
    await prisma.exercise.upsert({
      where: { id },
      update: {},
      create: { id, name, category, muscleGroup, parentExerciseId: parentId },
    });
    return id;
  };

  // ─── BASIC (SBD + OHP) ───
  await seedEx("Sentadilla", "BASIC", "Pierna");
  await seedEx("Press Banca", "BASIC", "Pecho");
  await seedEx("Peso Muerto", "BASIC", "Posterior");
  await seedEx("Press Militar", "BASIC", "Hombro");

  // ─── VARIANTES de Sentadilla ───
  await seedEx("Sentadilla Pausa", "VARIANT", "Pierna", "Sentadilla");
  await seedEx("Sentadilla Tempo", "VARIANT", "Pierna", "Sentadilla");
  await seedEx("Sentadilla Pin / Anderson", "VARIANT", "Pierna", "Sentadilla");
  await seedEx("Sentadilla Frontal", "VARIANT", "Pierna", "Sentadilla");
  await seedEx("Sentadilla SSB", "VARIANT", "Pierna", "Sentadilla");
  await seedEx("Sentadilla Goblet", "VARIANT", "Pierna", "Sentadilla");
  await seedEx("Sentadilla Búlgara", "VARIANT", "Pierna", "Sentadilla");
  await seedEx("Sentadilla Hack", "VARIANT", "Pierna", "Sentadilla");
  await seedEx("Sentadilla con Cadenas", "VARIANT", "Pierna", "Sentadilla");
  await seedEx("Sentadilla con Bandas", "VARIANT", "Pierna", "Sentadilla");

  // ─── VARIANTES de Press Banca ───
  await seedEx("Press Banca Estrecho", "VARIANT", "Pecho", "Press Banca");
  await seedEx("Press Banca Pausa", "VARIANT", "Pecho", "Press Banca");
  await seedEx("Press Banca Tempo", "VARIANT", "Pecho", "Press Banca");
  await seedEx("Press Banca Spoto", "VARIANT", "Pecho", "Press Banca");
  await seedEx("Press Banca Larsen", "VARIANT", "Pecho", "Press Banca");
  await seedEx("Press Banca con Cadenas", "VARIANT", "Pecho", "Press Banca");
  await seedEx("Press Banca con Bandas", "VARIANT", "Pecho", "Press Banca");
  await seedEx("Press Banca Inclinado", "VARIANT", "Pecho", "Press Banca");
  await seedEx("Press Banca Floor Press", "VARIANT", "Pecho", "Press Banca");
  await seedEx("Press Banca Pin Press", "VARIANT", "Pecho", "Press Banca");

  // ─── VARIANTES de Peso Muerto ───
  await seedEx("Peso Muerto Déficit", "VARIANT", "Posterior", "Peso Muerto");
  await seedEx("Peso Muerto Pausa", "VARIANT", "Posterior", "Peso Muerto");
  await seedEx("Peso Muerto Tempo", "VARIANT", "Posterior", "Peso Muerto");
  await seedEx("Peso Muerto Sumo", "VARIANT", "Posterior", "Peso Muerto");
  await seedEx("Peso Muerto Rumano", "VARIANT", "Posterior", "Peso Muerto");
  await seedEx("Peso Muerto Rack Pull", "VARIANT", "Posterior", "Peso Muerto");
  await seedEx("Peso Muerto con Cadenas", "VARIANT", "Posterior", "Peso Muerto");
  await seedEx("Peso Muerto con Bandas", "VARIANT", "Posterior", "Peso Muerto");
  await seedEx("Peso Muerto Stiff Leg", "VARIANT", "Posterior", "Peso Muerto");
  await seedEx("Peso Muerto Trap Bar", "VARIANT", "Posterior", "Peso Muerto");

  // ─── VARIANTES de Press Militar ───
  await seedEx("Press Militar Sentado", "VARIANT", "Hombro", "Press Militar");
  await seedEx("Press Militar con Mancuernas", "VARIANT", "Hombro", "Press Militar");
  await seedEx("Push Press", "VARIANT", "Hombro", "Press Militar");
  await seedEx("Press Militar Z Press", "VARIANT", "Hombro", "Press Militar");
  await seedEx("Press Militar Landmine", "VARIANT", "Hombro", "Press Militar");

  // ─── ACCESORIOS — Pierna ───
  await seedEx("Prensa Inclinada", "ACCESSORY", "Pierna");
  await seedEx("Prensa Horizontal", "ACCESSORY", "Pierna");
  await seedEx("Extensión de Cuádriceps", "ACCESSORY", "Pierna");
  await seedEx("Sentadilla Pendulum", "ACCESSORY", "Pierna");
  await seedEx("Zancadas", "ACCESSORY", "Pierna");
  await seedEx("Step Up", "ACCESSORY", "Pierna");
  await seedEx("Sissy Squat", "ACCESSORY", "Pierna");
  await seedEx("Belt Squat", "ACCESSORY", "Pierna");

  // ─── ACCESORIOS — Posterior / Isquios ───
  await seedEx("Curl Femoral Sentado", "ACCESSORY", "Posterior");
  await seedEx("Curl Femoral Tumbado", "ACCESSORY", "Posterior");
  await seedEx("Nordic Curl", "ACCESSORY", "Posterior");
  await seedEx("Good Morning", "ACCESSORY", "Posterior");
  await seedEx("Hiperextensiones", "ACCESSORY", "Posterior");
  await seedEx("Hiperextensiones Inversas", "ACCESSORY", "Posterior");
  await seedEx("Back Extension GHD", "ACCESSORY", "Posterior");

  // ─── ACCESORIOS — Glúteo ───
  await seedEx("Hip Thrust", "ACCESSORY", "Glúteo");
  await seedEx("Hip Thrust con Banda", "ACCESSORY", "Glúteo");
  await seedEx("Glute Bridge", "ACCESSORY", "Glúteo");
  await seedEx("Abducción en Máquina", "ACCESSORY", "Glúteo");
  await seedEx("Clamshell con Banda", "ACCESSORY", "Glúteo");
  await seedEx("Kickback en Polea", "ACCESSORY", "Glúteo");

  // ─── ACCESORIOS — Pecho ───
  await seedEx("Press Inclinado con Mancuernas", "ACCESSORY", "Pecho");
  await seedEx("Press Plano con Mancuernas", "ACCESSORY", "Pecho");
  await seedEx("Aperturas con Mancuernas", "ACCESSORY", "Pecho");
  await seedEx("Aperturas en Polea", "ACCESSORY", "Pecho");
  await seedEx("Fondos en Paralelas", "ACCESSORY", "Pecho");
  await seedEx("Pec Deck / Contractora", "ACCESSORY", "Pecho");
  await seedEx("Press en Máquina", "ACCESSORY", "Pecho");

  // ─── ACCESORIOS — Espalda ───
  await seedEx("Remo Pecho Apoyado", "ACCESSORY", "Espalda");
  await seedEx("Jalón Polea", "ACCESSORY", "Espalda");
  await seedEx("Dominadas / Asistidas", "ACCESSORY", "Espalda");
  await seedEx("Remo con Barra", "ACCESSORY", "Espalda");
  await seedEx("Remo con Mancuerna", "ACCESSORY", "Espalda");
  await seedEx("Remo en Máquina", "ACCESSORY", "Espalda");
  await seedEx("Remo Gironda", "ACCESSORY", "Espalda");
  await seedEx("Pullover en Polea", "ACCESSORY", "Espalda");
  await seedEx("Jalón al Pecho Agarre Neutro", "ACCESSORY", "Espalda");
  await seedEx("Remo Meadows", "ACCESSORY", "Espalda");
  await seedEx("Pulldown Recto", "ACCESSORY", "Espalda");

  // ─── ACCESORIOS — Hombro ───
  await seedEx("Elevaciones Laterales", "ACCESSORY", "Hombro");
  await seedEx("Elevaciones Laterales en Polea", "ACCESSORY", "Hombro");
  await seedEx("Face Pull / Pájaros", "ACCESSORY", "Hombro");
  await seedEx("Face Pull en Polea", "ACCESSORY", "Hombro");
  await seedEx("Pájaros con Mancuernas", "ACCESSORY", "Hombro");
  await seedEx("Pájaros en Máquina", "ACCESSORY", "Hombro");
  await seedEx("Press Arnold", "ACCESSORY", "Hombro");
  await seedEx("Elevaciones Frontales", "ACCESSORY", "Hombro");
  await seedEx("Encogimientos / Shrugs", "ACCESSORY", "Hombro");
  await seedEx("Y-T-W Raises", "ACCESSORY", "Hombro");
  await seedEx("Rotación Externa con Banda", "ACCESSORY", "Hombro");

  // ─── ACCESORIOS — Brazos ───
  await seedEx("Tríceps Polea (cuerda)", "ACCESSORY", "Brazos");
  await seedEx("Tríceps Polea (barra V)", "ACCESSORY", "Brazos");
  await seedEx("Tríceps Francés / Skullcrusher", "ACCESSORY", "Brazos");
  await seedEx("Tríceps Overhead en Polea", "ACCESSORY", "Brazos");
  await seedEx("Tríceps Kickback", "ACCESSORY", "Brazos");
  await seedEx("Fondos en Banco", "ACCESSORY", "Brazos");
  await seedEx("Curl Bíceps", "ACCESSORY", "Brazos");
  await seedEx("Curl Bíceps con Barra", "ACCESSORY", "Brazos");
  await seedEx("Curl Bíceps en Polea", "ACCESSORY", "Brazos");
  await seedEx("Curl Martillo", "ACCESSORY", "Brazos");
  await seedEx("Curl Predicador", "ACCESSORY", "Brazos");
  await seedEx("Curl Inclinado con Mancuernas", "ACCESSORY", "Brazos");
  await seedEx("Curl Concentrado", "ACCESSORY", "Brazos");
  await seedEx("Curl Spider", "ACCESSORY", "Brazos");

  // ─── ACCESORIOS — Core ───
  await seedEx("Ab Wheel", "ACCESSORY", "Core");
  await seedEx("Pallof Press", "ACCESSORY", "Core");
  await seedEx("Plancha Frontal", "ACCESSORY", "Core");
  await seedEx("Plancha Lateral", "ACCESSORY", "Core");
  await seedEx("Cable Crunch", "ACCESSORY", "Core");
  await seedEx("Crunch en Máquina", "ACCESSORY", "Core");
  await seedEx("Leg Raise Colgado", "ACCESSORY", "Core");
  await seedEx("Dragon Flag", "ACCESSORY", "Core");
  await seedEx("Farmer Walk", "ACCESSORY", "Core");
  await seedEx("Dead Bug", "ACCESSORY", "Core");
  await seedEx("Bird Dog", "ACCESSORY", "Core");

  // ─── ACCESORIOS — Gemelos ───
  await seedEx("Elevación de Gemelos de Pie", "ACCESSORY", "Gemelos");
  await seedEx("Elevación de Gemelos Sentado", "ACCESSORY", "Gemelos");
  await seedEx("Elevación de Gemelos en Prensa", "ACCESSORY", "Gemelos");

  console.log("✅ Exercise library seeded");

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
