import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ════════════════════════════════════════════
  // 1. ADMIN USER
  // ════════════════════════════════════════════
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

  // ════════════════════════════════════════════
  // 2. CLIENT — Carlos Martínez
  // ════════════════════════════════════════════
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
      currentWeight: 82,
      targetWeight: 77,
      packType: "FULL",
      status: "ACTIVE",
      monthlyFee: 150,
      notes: "Objetivo: recomposición muscular. Reducir peso a 75-77kg manteniendo rendimiento. Pack nutrición + entreno.",
      startDate: new Date("2026-02-01"),
    },
  });
  console.log("✅ Client created:", client.name);

  // ════════════════════════════════════════════
  // 3. EXERCISE LIBRARY
  // ════════════════════════════════════════════
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
  await seedEx("Peso Muerto desde Bloques", "VARIANT", "Posterior", "Peso Muerto");

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
  await seedEx("Remo Dorian Yates", "ACCESSORY", "Espalda");

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

  // ════════════════════════════════════════════
  // 4. SUPPLEMENTS
  // ════════════════════════════════════════════
  const supplements = [
    { name: "Creatina monohidrato", dose: "5 g/día", timing: "A cualquier hora con agua" },
    { name: "Proteína whey isolate", dose: "1 scoop (30g)", timing: "Post-entreno o entre comidas" },
    { name: "Vitamina D3 + K2", dose: "2000 UI/día", timing: "Con comida rica en grasa" },
    { name: "Magnesio bisglicinato", dose: "200-300 mg/día", timing: "Antes de dormir" },
    { name: "Omega-3 (EPA+DHA)", dose: "1-2 g/día", timing: "Con comidas principales" },
    { name: "Cafeína o pre-entreno", dose: "Dosis recomendada por fabricante", timing: "60-30 min antes de entrenar" },
    { name: "Ashwagandha", dose: "1 pastilla", timing: "1 vez al día" },
  ];

  for (const sup of supplements) {
    await prisma.supplement.create({ data: sup });
  }
  console.log("✅ Supplements seeded:", supplements.length);

  // ════════════════════════════════════════════
  // 5. NUTRITION PLAN — Carlos Martínez
  // ════════════════════════════════════════════
  // Based on reference: Recomposición muscular plan adapted for Carlos
  const nutritionPlan = await prisma.nutritionPlan.create({
    data: {
      clientId: client.id,
      title: "Plan Recomposición - Marzo 2026",
      isActive: true,
      objective: "Recomposición muscular: Reducir el peso corporal hasta un rango pautado [75-77kg], llevar al cuerpo a un escenario de pérdida de grasa y ganancia de masa muscular sin resentimientos en el rendimiento.",
      recommendations: JSON.stringify({
        descanso: "Dormir 7-9 horas por noche. Evitar dispositivos electrónicos antes de dormir. Si es posible, incluir siesta breve (<45 min).",
        hidratacion: "Mínimo 3-4 L diarios, más en días calurosos o de entrenamiento intenso.",
        variedad: "Este plan te da libertad: 90% cumplimiento = éxito.",
        formato: "Cada comida tiene una opción principal y varias alternativas equivalentes. Escoge primero una opción de cada comida, después elige un ingrediente de cada fila.",
      }),
      kcalMin: 2500,
      kcalMax: 2600,
      proteinG: 190,
      carbsG: 230,
      fatsG: 80,
      version: 1,
      startDate: new Date("2026-03-01"),
    },
  });

  // ── Meals ──

  // DESAYUNO
  const desayuno = await prisma.nutritionMeal.create({
    data: {
      planId: nutritionPlan.id,
      name: "Desayuno",
      order: 0,
      description: "Primera comida del día. Elige entre opción salada o dulce.",
    },
  });

  // Desayuno - Opción Salada
  const desayunoSalado = await prisma.nutritionMealOption.create({
    data: { mealId: desayuno.id, name: "Opción Salada", order: 0 },
  });

  const desayunoSaladoRows = [
    { main: "Pan de Barra (90g)", alts: ["Tortilla de Trigo (75g)", "Copos de Avena (60g)", "Pan Wasa (60g)", "Pan de Pita (90g)", "Bagels - 1 Unidad"], cat: "CARB" },
    { main: "Huevos de Gallina - 3 Unidades", alts: ["Jamón Serrano (75g)", "Pechuga de Pavo (120g)", "Queso Havarti Light (75g)", "Queso Cottage (150g)", "Queso Fresco de Burgos (150g)", "Salmón Ahumado (75g)"], cat: "PROTEIN" },
    { main: "Aceite de Oliva Virgen Extra (10g)", alts: ["Mix de Frutos Secos (15g)", "Aguacate (58g)", "Crema de Cacahuete (15g)", "Chocolate 85% (15g)"], cat: "FAT" },
    { main: "1 porción de Frutas (Tabla 01)", alts: [], cat: "FRUIT" },
  ];

  for (let i = 0; i < desayunoSaladoRows.length; i++) {
    const r = desayunoSaladoRows[i];
    await prisma.nutritionIngredientRow.create({
      data: {
        optionId: desayunoSalado.id,
        mainIngredient: r.main,
        alternatives: JSON.stringify(r.alts),
        macroCategory: r.cat,
        order: i,
      },
    });
  }

  // Desayuno - Opción Dulce
  const desayunoDulce = await prisma.nutritionMealOption.create({
    data: { mealId: desayuno.id, name: "Opción Dulce", order: 1 },
  });

  const desayunoDulceRows = [
    { main: "Copos de Avena (60g)", alts: ["Corn Flakes S/A (60g)", "Tortitas Maíz/Arroz/Avena (60g)", "Muesli S/A (60g)", "Crema de Arroz (60g)", "Papilla 8 cereales (60g)"], cat: "CARB" },
    { main: "Leche semidesnatada (400g)", alts: ["Yogur proteína - 2 ud", "Queso fresco batido desnatado (270g)", "Yogur griego light (270g)", "Whey Protein (30g)"], cat: "PROTEIN" },
    { main: "Mix frutos secos (20g)", alts: ["Chocolate 85% (20g)", "Mix semillas (30g)", "Crema de cacahuete (20g)"], cat: "FAT" },
    { main: "1 porción de Frutas (Tabla 01)", alts: [], cat: "FRUIT" },
  ];

  for (let i = 0; i < desayunoDulceRows.length; i++) {
    const r = desayunoDulceRows[i];
    await prisma.nutritionIngredientRow.create({
      data: {
        optionId: desayunoDulce.id,
        mainIngredient: r.main,
        alternatives: JSON.stringify(r.alts),
        macroCategory: r.cat,
        order: i,
      },
    });
  }

  // MEDIA MAÑANA
  const mediaMañana = await prisma.nutritionMeal.create({
    data: {
      planId: nutritionPlan.id,
      name: "Media Mañana",
      order: 1,
      description: "Snack de media mañana. Elige entre opción salada o dulce.",
    },
  });

  const mmSalada = await prisma.nutritionMealOption.create({
    data: { mealId: mediaMañana.id, name: "Opción Salada", order: 0 },
  });

  const mmSaladaRows = [
    { main: "Pan de Barra (90g)", alts: ["Tortilla de Trigo (75g)", "Copos de Avena (60g)", "Pan Wasa (60g)", "Pan de Pita (90g)", "Bagels - 1 Unidad"], cat: "CARB" },
    { main: "Huevos de Gallina - 3 Unidades", alts: ["Jamón Serrano (75g)", "Pechuga de Pavo (120g)", "Queso Havarti Light (75g)", "Queso Cottage (150g)", "Queso Fresco de Burgos (150g)", "Salmón Ahumado (75g)"], cat: "PROTEIN" },
    { main: "Aceite de Oliva Virgen Extra (10g)", alts: ["Mix de Frutos Secos (15g)", "Aguacate (60g)", "Crema de Cacahuete (15g)", "Chocolate 85% (15g)"], cat: "FAT" },
    { main: "1 porción de Frutas (Tabla 01)", alts: [], cat: "FRUIT" },
  ];

  for (let i = 0; i < mmSaladaRows.length; i++) {
    const r = mmSaladaRows[i];
    await prisma.nutritionIngredientRow.create({
      data: { optionId: mmSalada.id, mainIngredient: r.main, alternatives: JSON.stringify(r.alts), macroCategory: r.cat, order: i },
    });
  }

  const mmDulce = await prisma.nutritionMealOption.create({
    data: { mealId: mediaMañana.id, name: "Opción Dulce", order: 1 },
  });

  const mmDulceRows = [
    { main: "Copos de Avena (60g)", alts: ["Corn Flakes S/A (60g)", "Tortitas Maíz/Arroz/Avena (60g)", "Muesli S/A (60g)", "Crema de Arroz (60g)", "Papilla 8 cereales (60g)"], cat: "CARB" },
    { main: "Leche semidesnatada (400g)", alts: ["Yogur proteína - 2 ud", "Queso fresco batido desnatado (270g)", "Yogur griego light (270g)", "Whey Protein (30g)"], cat: "PROTEIN" },
    { main: "Mix frutos secos (20g)", alts: ["Chocolate 85% (20g)", "Mix semillas (30g)", "Crema de cacahuete (20g)"], cat: "FAT" },
    { main: "1 porción de Frutas (Tabla 01)", alts: [], cat: "FRUIT" },
  ];

  for (let i = 0; i < mmDulceRows.length; i++) {
    const r = mmDulceRows[i];
    await prisma.nutritionIngredientRow.create({
      data: { optionId: mmDulce.id, mainIngredient: r.main, alternatives: JSON.stringify(r.alts), macroCategory: r.cat, order: i },
    });
  }

  // COMIDA
  const comida = await prisma.nutritionMeal.create({
    data: {
      planId: nutritionPlan.id,
      name: "Comida",
      order: 2,
      description: "Comida principal. Debe ser completa: carbohidrato + proteína + verdura.",
    },
  });

  // Comida - Opción 1 (Arroz/Pasta + Carne)
  const comidaOp1 = await prisma.nutritionMealOption.create({
    data: { mealId: comida.id, name: "Opción 1 - Arroz/Pasta + Carne", order: 0 },
  });

  const comidaOp1Rows = [
    { main: "Arroz Blanco Crudo (75g)", alts: ["Pasta S/Gluten Cruda (70g)", "Patatas Crudas (345g)", "Boniato Crudo (305g)", "Gnocchis Crudos (170g)", "Tortitas Maíz/Arroz (70g)", "Pan de Barra (95g)"], cat: "CARB" },
    { main: "Pechuga/Contramuslo de Pollo Crudo (200g)", alts: ["Pechuga de pavo (200g)", "Pescado Blanco Crudo (400g)", "Pescado azul crudo (200g)", "Atún al natural - 4 Latas", "Carne de Ternera Cruda (200g)"], cat: "PROTEIN" },
    { main: "Aceite de Oliva Virgen Extra (5g)", alts: [], cat: "FAT" },
    { main: "1 porción de Verduras (Tabla 02)", alts: [], cat: "VEG" },
  ];

  for (let i = 0; i < comidaOp1Rows.length; i++) {
    const r = comidaOp1Rows[i];
    await prisma.nutritionIngredientRow.create({
      data: { optionId: comidaOp1.id, mainIngredient: r.main, alternatives: JSON.stringify(r.alts), macroCategory: r.cat, order: i },
    });
  }

  // Comida - Opción 2 (Legumbres)
  const comidaOp2 = await prisma.nutritionMealOption.create({
    data: { mealId: comida.id, name: "Opción 2 - Legumbres", order: 1 },
  });

  const comidaOp2Rows = [
    { main: "Garbanzos Cocidos (200g)", alts: ["Alubias Cocidas (245g)", "Lentejas Cocidas (215g)", "Quinua Cruda (50g)"], cat: "CARB" },
    { main: "Pechuga/Contramuslo de Pollo Crudo (200g)", alts: ["Pechuga de pavo (200g)", "Pescado Blanco Crudo (400g)", "Pescado azul crudo (200g)", "Atún al natural - 4 Latas", "Carne de Ternera Cruda (200g)"], cat: "PROTEIN" },
    { main: "Aceite de Oliva Virgen Extra (5g)", alts: [], cat: "FAT" },
    { main: "1 porción de Verduras (Tabla 02)", alts: [], cat: "VEG" },
  ];

  for (let i = 0; i < comidaOp2Rows.length; i++) {
    const r = comidaOp2Rows[i];
    await prisma.nutritionIngredientRow.create({
      data: { optionId: comidaOp2.id, mainIngredient: r.main, alternatives: JSON.stringify(r.alts), macroCategory: r.cat, order: i },
    });
  }

  // Comida - Opción 3 (Huevos)
  const comidaOp3 = await prisma.nutritionMealOption.create({
    data: { mealId: comida.id, name: "Opción 3 - Huevos", order: 2 },
  });

  const comidaOp3Rows = [
    { main: "Arroz Blanco Crudo (75g)", alts: ["Pasta S/Gluten Cruda (70g)", "Patatas Crudas (345g)", "Boniato Crudo (305g)", "Gnocchis Crudos (170g)", "Tortitas Maíz/Arroz (70g)", "Pan de Barra (95g)"], cat: "CARB" },
    { main: "Huevos de Gallina - 4 Unidades", alts: ["Jamón Serrano (100g)"], cat: "PROTEIN" },
    { main: "Aceite de Oliva Virgen Extra (5g)", alts: [], cat: "FAT" },
    { main: "1 porción de Verduras (Tabla 02)", alts: [], cat: "VEG" },
    { main: "Yogur de Proteínas - 1 Unidad", alts: [], cat: "PROTEIN" },
  ];

  for (let i = 0; i < comidaOp3Rows.length; i++) {
    const r = comidaOp3Rows[i];
    await prisma.nutritionIngredientRow.create({
      data: { optionId: comidaOp3.id, mainIngredient: r.main, alternatives: JSON.stringify(r.alts), macroCategory: r.cat, order: i },
    });
  }

  // CENA
  const cena = await prisma.nutritionMeal.create({
    data: {
      planId: nutritionPlan.id,
      name: "Cena",
      order: 3,
      description: "Centrada en recuperación: proteína magra, CH ajustado y verduras.",
    },
  });

  const cenaOp1 = await prisma.nutritionMealOption.create({
    data: { mealId: cena.id, name: "Ensalada Completa", order: 0, notes: "Ensalada de las hortalizas que más te gusten. Puedes usar especias y sal al gusto." },
  });

  const cenaRows = [
    { main: "1 porción de verdura (Tabla 02)", alts: ["Puré de verduras estilo Mercadona o casero"], cat: "VEG" },
    { main: "Pechuga/Contramuslo de Pollo Crudo (200g)", alts: ["Atún al natural - 4 Latas", "Pechuga de pavo (200g)", "4 huevos cocidos"], cat: "PROTEIN" },
    { main: "Aceite de Oliva Virgen Extra (10g)", alts: [], cat: "FAT" },
  ];

  for (let i = 0; i < cenaRows.length; i++) {
    const r = cenaRows[i];
    await prisma.nutritionIngredientRow.create({
      data: { optionId: cenaOp1.id, mainIngredient: r.main, alternatives: JSON.stringify(r.alts), macroCategory: r.cat, order: i },
    });
  }

  console.log("✅ Nutrition plan seeded for Carlos");

  // ════════════════════════════════════════════
  // 6. TRAINING PLAN — Carlos Martínez
  // ════════════════════════════════════════════
  // Based on reference: Macrociclo Bloque 1 — Hipertrofia, 4 days/week, Load Drop method
  const trainingPlan = await prisma.trainingPlan.create({
    data: {
      clientId: client.id,
      title: "Macrociclo Bloque 1 — Hipertrofia",
      isActive: true,
      modality: "Powerbuilding",
      block: "Bloque 1 - Hipertrofia",
      daysPerWeek: 4,
      blockVariants: JSON.stringify({
        sentadilla: "Safety Bar Squat (SSB)",
        banca: "Banca competición con pausa",
        pesoMuerto: "Peso muerto desde bloques (3-5 cm)",
      }),
    },
  });

  // Helper to create a full week
  const createWeek = async (weekNum: number, status: "DRAFT" | "ACTIVE" | "COMPLETED", notes: string) => {
    const week = await prisma.trainingWeek.create({
      data: {
        planId: trainingPlan.id,
        weekNumber: weekNum,
        block: "Hipertrofia",
        status,
        notes,
      },
    });

    // ── Day 1: SSB + Banca ──
    const day1 = await prisma.trainingDay.create({
      data: {
        weekId: week.id,
        dayNumber: 1,
        title: "SSB + Banca (base técnica + volumen controlado)",
        warmup: "McGill Big 3 (curl-up mod., side plank, bird dog) 1-2 rondas + movilidad cadera suave (5-8 min)",
      },
    });

    const day1Exercises = [
      { name: "Safety Bar Squat (SSB)", type: "VARIANT" as const, method: "LOAD_DROP" as const, topSetReps: 6, topSetRpe: 7, fatiguePct: 7.5, setsMin: 3, setsMax: 5, notes: "Brace 360°, control lumbar neutro. Si lumbar ≥4/10: baja a 5%", order: 0 },
      { name: "Banca comp. pausa", type: "BASIC" as const, method: "LOAD_DROP" as const, topSetReps: weekNum === 1 ? 8 : 6, topSetRpe: 7, fatiguePct: weekNum === 1 ? 7.5 : 5, setsMin: 2, setsMax: 5, notes: "Pausa real en el pecho, leg drive estable. Nada de grinders", order: 1 },
      { name: "Prensa Inclinada", type: "ACCESSORY" as const, method: "STRAIGHT_SETS" as const, setsMin: 3, setsMax: 4, rirMin: 2, rirMax: 3, notes: "Rango completo sin despegar lumbar, 10-15 reps", order: 2 },
      { name: "Remo Pecho Apoyado", type: "ACCESSORY" as const, method: "STRAIGHT_SETS" as const, setsMin: 4, setsMax: 4, rirMin: 2, rirMax: 2, notes: "Pausa 1s en contracción, 8-12 reps", order: 3 },
      { name: "Curl Femoral Sentado", type: "ACCESSORY" as const, method: "STRAIGHT_SETS" as const, setsMin: 3, setsMax: 3, rirMin: 2, rirMax: 2, notes: "Control excéntrica, 10-15 reps", order: 4 },
      { name: "Core anti-extensión (Dead Bug / Ab Wheel)", type: "ACCESSORY" as const, method: "STRAIGHT_SETS" as const, setsMin: 3, setsMax: 4, notes: "Sin dolor lumbar", order: 5 },
    ];

    for (const ex of day1Exercises) {
      await prisma.exercisePrescription.create({ data: { dayId: day1.id, ...ex } });
    }

    // ── Day 2: DL Bloques + Torso ──
    const day2 = await prisma.trainingDay.create({
      data: {
        weekId: week.id,
        dayNumber: 2,
        title: "DL Bloques + Torso (confianza DL + hipertrofia torso)",
        warmup: "Respiración/brace 2-3 min + bird dog 2x6/lado + bisagra con palo 2x8",
      },
    });

    const day2Exercises = [
      { name: "Peso Muerto desde Bloques (3-5cm)", type: "VARIANT" as const, method: "LOAD_DROP" as const, topSetReps: 5, topSetRpe: 6, fatiguePct: 5, setsMin: 2, setsMax: 4, notes: "Bar pegada, 'empuja desde el suelo', cero prisa. Si miedo ≥7/10: RPE 5.5", order: 0 },
      { name: "Press Inclinado (manc./máquina)", type: "ACCESSORY" as const, method: "STRAIGHT_SETS" as const, setsMin: 4, setsMax: 4, rirMin: 2, rirMax: 2, notes: "Control y recorrido, 8-12 reps", order: 1 },
      { name: "Jalón Polea / Dominadas Asistidas", type: "ACCESSORY" as const, method: "STRAIGHT_SETS" as const, setsMin: 4, setsMax: 4, rirMin: 2, rirMax: 2, notes: "Depresión escapular, 8-12 reps", order: 2 },
      { name: "Remo Dorian Yates / en Punta", type: "ACCESSORY" as const, method: "STRAIGHT_SETS" as const, setsMin: 3, setsMax: 3, rirMin: 2, rirMax: 2, notes: "Tronco estable, 8-12 reps", order: 3 },
      { name: "Hiperextensiones suaves", type: "ACCESSORY" as const, method: "STRAIGHT_SETS" as const, setsMin: 2, setsMax: 3, rirMin: 3, rirMax: 4, notes: "'Bombeo' sin dolor, 12-15 reps", order: 4 },
      { name: "Pallof Press (anti-rotación)", type: "ACCESSORY" as const, method: "STRAIGHT_SETS" as const, setsMin: 3, setsMax: 3, notes: "Cadera quieta, 10-15/lado", order: 5 },
    ];

    for (const ex of day2Exercises) {
      await prisma.exercisePrescription.create({ data: { dayId: day2.id, ...ex } });
    }

    // ── Day 3: Banca Énfasis + Pierna sin carga axial ──
    const day3 = await prisma.trainingDay.create({
      data: {
        weekId: week.id,
        dayNumber: 3,
        title: "Banca énfasis + Pierna sin carga axial",
        warmup: "Movilidad hombro/escápula + Big 3 1 ronda",
      },
    });

    const day3Exercises = [
      { name: "Banca comp. pausa", type: "BASIC" as const, method: "LOAD_DROP" as const, topSetReps: 6, topSetRpe: 7, fatiguePct: 7.5, setsMin: 3, setsMax: 5, notes: "Aquí sí buscamos más volumen de banca", order: 0 },
      { name: "Hack Squat", type: "ACCESSORY" as const, method: "STRAIGHT_SETS" as const, setsMin: 4, setsMax: 4, rirMin: 2, rirMax: 3, notes: "Profundidad cómoda, sin carga axial, 8-12 reps", order: 1 },
      { name: "Elevaciones Laterales", type: "ACCESSORY" as const, method: "STRAIGHT_SETS" as const, setsMin: 4, setsMax: 4, rirMin: 2, rirMax: 2, notes: "Control total, 12-20 reps", order: 2 },
      { name: "Tríceps Polea (cuerda)", type: "ACCESSORY" as const, method: "STRAIGHT_SETS" as const, setsMin: 3, setsMax: 4, rirMin: 1, rirMax: 2, notes: "Bloqueo limpio, 10-15 reps", order: 3 },
      { name: "Face Pull / Pájaros", type: "ACCESSORY" as const, method: "STRAIGHT_SETS" as const, setsMin: 3, setsMax: 3, rirMin: 2, rirMax: 3, notes: "Escápula manda, salud hombro, 15-25 reps", order: 4 },
      { name: "Cable Crunch", type: "ACCESSORY" as const, method: "STRAIGHT_SETS" as const, setsMin: 3, setsMax: 4, notes: "Sin tirar de lumbar, 12-20 reps", order: 5 },
    ];

    for (const ex of day3Exercises) {
      await prisma.exercisePrescription.create({ data: { dayId: day3.id, ...ex } });
    }

    // ── Day 4: Posterior + Torso (hipertrofia + bisagra sin miedo) ──
    const day4 = await prisma.trainingDay.create({
      data: {
        weekId: week.id,
        dayNumber: 4,
        title: "Posterior + Torso (hipertrofia, cuidando lumbar)",
        warmup: "Bisagra ligera + activación glúteo (puentes 2x10)",
      },
    });

    const day4Exercises = [
      { name: "RDL Barra (Peso Muerto Rumano)", type: "ACCESSORY" as const, method: "STRAIGHT_SETS" as const, setsMin: 4, setsMax: 4, rirMin: 2, rirMax: 3, notes: "Espalda 'larga', control excéntrica, 8-10 reps. Si lumbar ≥4/10: 3 series", order: 0 },
      { name: "GHD / Curl Femoral Sentado", type: "ACCESSORY" as const, method: "STRAIGHT_SETS" as const, setsMin: 3, setsMax: 3, rirMin: 2, rirMax: 3, notes: "Prioriza el que NO moleste, 8-12 reps", order: 1 },
      { name: "Pecho máquina inclinado", type: "ACCESSORY" as const, method: "STRAIGHT_SETS" as const, setsMin: 3, setsMax: 4, rirMin: 2, rirMax: 2, notes: "Buscar bombeo, 10-15 reps", order: 2 },
      { name: "Remo (apoyado/polea baja)", type: "ACCESSORY" as const, method: "STRAIGHT_SETS" as const, setsMin: 4, setsMax: 4, rirMin: 2, rirMax: 2, notes: "Calidad de rep, 10-15 reps", order: 3 },
      { name: "Elevación de Gemelos", type: "ACCESSORY" as const, method: "STRAIGHT_SETS" as const, setsMin: 3, setsMax: 4, rirMin: 1, rirMax: 2, notes: "Pausa arriba, 10-20 reps", order: 4 },
      { name: "Farmer Walk", type: "ACCESSORY" as const, method: "STRAIGHT_SETS" as const, setsMin: 1, setsMax: 1, notes: "6-10 min total. Sin dolor lumbar, ayuda al brace", order: 5 },
    ];

    for (const ex of day4Exercises) {
      await prisma.exercisePrescription.create({ data: { dayId: day4.id, ...ex } });
    }

    return week;
  };

  // Create 4 weeks
  await createWeek(1, "COMPLETED", "Semana 1: volver a meter patrón S/B/D con técnica sólida, RPE moderado y controlar volumen con %fatiga.");
  await createWeek(2, "COMPLETED", "Semana 2: mantener estructura, ajustar banca (bajamos reps para evitar fallo). Priorizar consistencia.");
  await createWeek(3, "ACTIVE", "Semana 3: mantener técnica y sostenibilidad. Progresar clavando mejor el RPE o haciendo 1 back-off más.");
  await createWeek(4, "DRAFT", "Semana 4: consolidar técnica y subir estímulo donde el cuerpo lo permita. Controlar donde hubo señal de riesgo.");

  console.log("✅ Training plan seeded for Carlos (4 weeks, 4 days each)");

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
