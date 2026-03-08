import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database (Carlos Martínez only)...");

  // ════════════════════════════════════════════
  // 1. CLIENT — Carlos Martínez
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
  // 2. EXERCISE LIBRARY
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
  // 3. SUPPLEMENTS
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
  // 4. NUTRITION PLAN — Carlos Martínez
  // ════════════════════════════════════════════
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
      data: { optionId: desayunoSalado.id, mainIngredient: r.main, alternatives: JSON.stringify(r.alts), macroCategory: r.cat, order: i },
    });
  }

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
      data: { optionId: desayunoDulce.id, mainIngredient: r.main, alternatives: JSON.stringify(r.alts), macroCategory: r.cat, order: i },
    });
  }

  // MEDIA MAÑANA
  const mediaMañana = await prisma.nutritionMeal.create({
    data: { planId: nutritionPlan.id, name: "Media Mañana", order: 1, description: "Snack de media mañana. Elige entre opción salada o dulce." },
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
    data: { planId: nutritionPlan.id, name: "Comida", order: 2, description: "Comida principal. Debe ser completa: carbohidrato + proteína + verdura." },
  });

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
    data: { planId: nutritionPlan.id, name: "Cena", order: 3, description: "Centrada en recuperación: proteína magra, CH ajustado y verduras." },
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
  // 5. TRAINING PLAN — Carlos Martínez
  // ════════════════════════════════════════════
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
      data: { weekId: week.id, dayNumber: 1, title: "SSB + Banca (base técnica + volumen controlado)", warmup: "McGill Big 3 (curl-up mod., side plank, bird dog) 1-2 rondas + movilidad cadera suave (5-8 min)" },
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
      data: { weekId: week.id, dayNumber: 2, title: "DL Bloques + Torso (confianza DL + hipertrofia torso)", warmup: "Respiración/brace 2-3 min + bird dog 2x6/lado + bisagra con palo 2x8" },
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
      data: { weekId: week.id, dayNumber: 3, title: "Banca énfasis + Pierna sin carga axial", warmup: "Movilidad hombro/escápula + Big 3 1 ronda" },
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

    // ── Day 4: Posterior + Torso ──
    const day4 = await prisma.trainingDay.create({
      data: { weekId: week.id, dayNumber: 4, title: "Posterior + Torso (hipertrofia, cuidando lumbar)", warmup: "Bisagra ligera + activación glúteo (puentes 2x10)" },
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

  // ════════════════════════════════════════════
  // 6. WEIGHT HISTORY — Carlos Martínez
  // ════════════════════════════════════════════
  // Simulates ~5 weeks of daily weigh-ins from Feb 1 to Mar 8
  // Starting at 82kg, trending down to ~80kg with natural fluctuation
  const weightEntries: { date: Date; weight: number }[] = [];
  const startDate = new Date("2026-02-01");
  const endDate = new Date("2026-03-08");
  let currentWeight = 82.0;

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    // Skip some days randomly (weekends sometimes missed)
    const dayOfWeek = d.getDay();
    if ((dayOfWeek === 0 || dayOfWeek === 6) && Math.random() > 0.6) continue;

    // Trend downward ~0.3kg/week with daily fluctuation ±0.4kg
    const trend = -0.3 / 7; // daily trend
    const fluctuation = (Math.random() - 0.5) * 0.8;
    currentWeight = Math.max(79.0, currentWeight + trend + fluctuation);
    currentWeight = Math.round(currentWeight * 10) / 10;

    weightEntries.push({ date: new Date(d), weight: currentWeight });
  }

  for (const entry of weightEntries) {
    await prisma.weightEntry.create({
      data: {
        clientId: client.id,
        date: entry.date,
        weight: entry.weight,
      },
    });
  }
  console.log(`✅ Weight history seeded: ${weightEntries.length} entries (${weightEntries[0]?.weight}kg → ${weightEntries[weightEntries.length - 1]?.weight}kg)`);

  // ════════════════════════════════════════════
  // 7. RM RECORDS — Carlos Martínez
  // ════════════════════════════════════════════
  // Simulate RM progression across the completed weeks
  const rmRecords = [
    // ── SSB (Safety Bar Squat) — Week 1 & 2 ──
    { exerciseName: "Safety Bar Squat (SSB)", weight: 100, reps: 6, date: new Date("2026-02-03") },  // W1 top set
    { exerciseName: "Safety Bar Squat (SSB)", weight: 105, reps: 6, date: new Date("2026-02-10") },  // W2 top set
    { exerciseName: "Safety Bar Squat (SSB)", weight: 107.5, reps: 6, date: new Date("2026-02-17") }, // W3 top set

    // ── Banca comp. pausa — Week 1 (8 reps), Week 2-3 (6 reps) ──
    { exerciseName: "Press Banca Pausa", weight: 80, reps: 8, date: new Date("2026-02-03") },    // W1 D1
    { exerciseName: "Press Banca Pausa", weight: 82.5, reps: 8, date: new Date("2026-02-05") },  // W1 D3
    { exerciseName: "Press Banca Pausa", weight: 85, reps: 6, date: new Date("2026-02-10") },    // W2 D1
    { exerciseName: "Press Banca Pausa", weight: 87.5, reps: 6, date: new Date("2026-02-12") },  // W2 D3
    { exerciseName: "Press Banca Pausa", weight: 87.5, reps: 6, date: new Date("2026-02-17") },  // W3 D1
    { exerciseName: "Press Banca Pausa", weight: 90, reps: 6, date: new Date("2026-02-19") },    // W3 D3

    // ── Peso Muerto desde Bloques — Week 1-3 ──
    { exerciseName: "Peso Muerto desde Bloques", weight: 140, reps: 5, date: new Date("2026-02-04") }, // W1
    { exerciseName: "Peso Muerto desde Bloques", weight: 145, reps: 5, date: new Date("2026-02-11") }, // W2
    { exerciseName: "Peso Muerto desde Bloques", weight: 150, reps: 5, date: new Date("2026-02-18") }, // W3

    // ── RDL — Week 1-3 ──
    { exerciseName: "Peso Muerto Rumano", weight: 90, reps: 8, date: new Date("2026-02-06") },   // W1
    { exerciseName: "Peso Muerto Rumano", weight: 95, reps: 8, date: new Date("2026-02-13") },   // W2
    { exerciseName: "Peso Muerto Rumano", weight: 97.5, reps: 8, date: new Date("2026-02-20") }, // W3

    // ── Prensa Inclinada — Week 1-3 ──
    { exerciseName: "Prensa Inclinada", weight: 180, reps: 12, date: new Date("2026-02-03") },
    { exerciseName: "Prensa Inclinada", weight: 190, reps: 12, date: new Date("2026-02-10") },
    { exerciseName: "Prensa Inclinada", weight: 200, reps: 11, date: new Date("2026-02-17") },

    // ── Remo Pecho Apoyado — Week 1-3 ──
    { exerciseName: "Remo Pecho Apoyado", weight: 40, reps: 10, date: new Date("2026-02-03") },
    { exerciseName: "Remo Pecho Apoyado", weight: 42.5, reps: 10, date: new Date("2026-02-10") },
    { exerciseName: "Remo Pecho Apoyado", weight: 42.5, reps: 12, date: new Date("2026-02-17") },
  ];

  // Epley formula: e1RM = weight × (1 + reps/30)
  for (const rm of rmRecords) {
    const estimated1RM = Math.round(rm.weight * (1 + rm.reps / 30) * 10) / 10;
    await prisma.rMRecord.create({
      data: {
        clientId: client.id,
        exerciseName: rm.exerciseName,
        weight: rm.weight,
        reps: rm.reps,
        estimated1RM,
        date: rm.date,
      },
    });
  }
  console.log(`✅ RM records seeded: ${rmRecords.length} entries`);

  // ════════════════════════════════════════════
  // 8. QUESTIONNAIRE TEMPLATES
  // ════════════════════════════════════════════

  // Nutrition - Martes
  const nutTueTemplate = await prisma.questionnaireTemplate.create({
    data: {
      name: "Check-in Martes",
      description: "Check-in nutricional de mitad de semana",
      isActive: true,
      scope: "GLOBAL",
      category: "NUTRITION",
      dayOfWeek: 2,
    },
  });

  const nutTueQuestions = [
    { type: "NUMBER" as const, label: "Peso en ayunas (kg)", required: true, order: 0 },
    { type: "SCALE_0_10" as const, label: "¿Cómo te has sentido con la dieta esta semana?", required: true, order: 1 },
    { type: "YES_NO" as const, label: "¿Has tenido malestares digestivos?", required: true, order: 2 },
    { type: "TEXT" as const, label: "Describe los malestares si los hubo", required: false, order: 3 },
    { type: "YES_NO" as const, label: "¿Has comido libre esta semana?", required: true, order: 4 },
    { type: "NUMBER" as const, label: "Nº de comidas libres", required: false, order: 5 },
    { type: "SCALE_0_10" as const, label: "Nivel de hambre general (1-10)", required: true, order: 6 },
    { type: "NUMBER" as const, label: "Horas de sueño media", required: true, order: 7 },
  ];

  const tueQIds: string[] = [];
  for (const q of nutTueQuestions) {
    const created = await prisma.questionnaireQuestion.create({
      data: { templateId: nutTueTemplate.id, ...q },
    });
    tueQIds.push(created.id);
  }

  // Nutrition - Viernes
  const nutFriTemplate = await prisma.questionnaireTemplate.create({
    data: {
      name: "Check-in Viernes",
      description: "Check-in nutricional de fin de semana",
      isActive: true,
      scope: "GLOBAL",
      category: "NUTRITION",
      dayOfWeek: 5,
    },
  });

  const nutFriQuestions = [
    { type: "NUMBER" as const, label: "Peso en ayunas (kg)", required: true, order: 0 },
    { type: "YES_NO" as const, label: "¿Has seguido el plan al 100%?", required: true, order: 1 },
    { type: "SELECT" as const, label: "¿Qué comida te ha costado más?", required: true, order: 2, optionsJson: JSON.stringify(["Desayuno", "Comida", "Merienda", "Cena", "Ninguna"]) },
    { type: "SCALE_0_10" as const, label: "Nivel de energía en los entrenos (1-10)", required: true, order: 3 },
    { type: "SELECT" as const, label: "Retención de líquidos percibida", required: true, order: 4, optionsJson: JSON.stringify(["Nada", "Poca", "Moderada", "Mucha"]) },
    { type: "TEXT" as const, label: "Comentarios adicionales", required: false, order: 5 },
  ];

  const friQIds: string[] = [];
  for (const q of nutFriQuestions) {
    const created = await prisma.questionnaireQuestion.create({
      data: { templateId: nutFriTemplate.id, ...q },
    });
    friQIds.push(created.id);
  }

  // Training template
  const trainingTemplate = await prisma.questionnaireTemplate.create({
    data: {
      name: "Check-in Entrenamiento",
      description: "Check-in semanal de entrenamiento",
      isActive: true,
      scope: "GLOBAL",
      category: "TRAINING",
      dayOfWeek: 6,
    },
  });

  const trainingQuestions = [
    { type: "SCALE_0_10" as const, label: "Nivel de fatiga general esta semana (0-10)", required: true, order: 0 },
    { type: "SCALE_0_10" as const, label: "Dolor lumbar esta semana (0-10)", required: true, order: 1 },
    { type: "SCALE_0_10" as const, label: "Calidad de sueño (0-10)", required: true, order: 2 },
    { type: "TEXT" as const, label: "Comentarios o problemas durante los entrenos", required: false, order: 3 },
  ];

  const trainQIds: string[] = [];
  for (const q of trainingQuestions) {
    const created = await prisma.questionnaireQuestion.create({
      data: { templateId: trainingTemplate.id, ...q },
    });
    trainQIds.push(created.id);
  }

  console.log("✅ Questionnaire templates seeded");

  // ════════════════════════════════════════════
  // 9. CHECK-INS — Semana actual (W10, Marzo 2026)
  // ════════════════════════════════════════════

  // ── Nutrition check-in Martes 3 Mar ──
  const checkinNutTue = await prisma.checkin.create({
    data: {
      clientId: client.id,
      templateId: nutTueTemplate.id,
      category: "NUTRITION",
      weekLabel: "Semana 10",
      dayLabel: "Martes",
      date: new Date("2026-03-03T08:30:00"),
      status: "RESPONDED",
    },
  });

  const tueResponses = [
    { questionId: tueQIds[0], value: "80.3" },       // Peso
    { questionId: tueQIds[1], value: "7" },           // Cómo te has sentido
    { questionId: tueQIds[2], value: "No" },          // Malestares digestivos
    { questionId: tueQIds[3], value: "" },             // Describe malestares
    { questionId: tueQIds[4], value: "Sí" },          // Comida libre
    { questionId: tueQIds[5], value: "1" },            // Nº comidas libres
    { questionId: tueQIds[6], value: "4" },            // Hambre
    { questionId: tueQIds[7], value: "7.5" },          // Sueño
  ];

  for (const r of tueResponses) {
    await prisma.checkinResponse.create({
      data: { checkinId: checkinNutTue.id, ...r },
    });
  }

  // ── Nutrition check-in Viernes 6 Mar ──
  const checkinNutFri = await prisma.checkin.create({
    data: {
      clientId: client.id,
      templateId: nutFriTemplate.id,
      category: "NUTRITION",
      weekLabel: "Semana 10",
      dayLabel: "Viernes",
      date: new Date("2026-03-06T09:00:00"),
      status: "RESPONDED",
    },
  });

  const friResponses = [
    { questionId: friQIds[0], value: "79.8" },         // Peso
    { questionId: friQIds[1], value: "Sí" },           // Plan al 100%
    { questionId: friQIds[2], value: "Cena" },         // Comida que más cuesta
    { questionId: friQIds[3], value: "8" },            // Energía entrenos
    { questionId: friQIds[4], value: "Poca" },         // Retención líquidos
    { questionId: friQIds[5], value: "Todo bien, noto el cuerpo más definido esta semana. La banca sube bien." },
  ];

  for (const r of friResponses) {
    await prisma.checkinResponse.create({
      data: { checkinId: checkinNutFri.id, ...r },
    });
  }

  // ── Training check-in Sábado 7 Mar ──
  const checkinTraining = await prisma.checkin.create({
    data: {
      clientId: client.id,
      templateId: trainingTemplate.id,
      category: "TRAINING",
      weekLabel: "Semana 10",
      dayLabel: "Sábado",
      date: new Date("2026-03-07T10:00:00"),
      status: "RESPONDED",
      planId: trainingPlan.id,
      weekNumber: 3,
    },
  });

  // Training questionnaire responses
  const trainResponses = [
    { questionId: trainQIds[0], value: "5" },   // Fatiga general
    { questionId: trainQIds[1], value: "2" },   // Dolor lumbar
    { questionId: trainQIds[2], value: "7" },   // Calidad sueño
    { questionId: trainQIds[3], value: "Día 1 la SSB fue bien, subí 2.5kg respecto a la semana pasada. La banca del día 3 se sintió fuerte. Lumbar controlada." },
  ];

  for (const r of trainResponses) {
    await prisma.checkinResponse.create({
      data: { checkinId: checkinTraining.id, ...r },
    });
  }

  // ── Training logs (actual performance for each training day of week 3) ──

  // Day 1 log
  const log1 = await prisma.checkinTrainingLog.create({
    data: { checkinId: checkinTraining.id, dayNumber: 1, dayName: "SSB + Banca" },
  });

  const day1Actual = [
    { exerciseName: "Safety Bar Squat (SSB)", section: "main", plannedSets: "1+3-5", plannedReps: "6", plannedLoad: "~107.5kg", plannedRPE: 7, actualWeight: 107.5, actualRPE: 7, actualSets: "1+4", actualReps: "6" },
    { exerciseName: "Banca comp. pausa", section: "main", plannedSets: "1+2-5", plannedReps: "6", plannedLoad: "~87.5kg", plannedRPE: 7, actualWeight: 87.5, actualRPE: 6.5, actualSets: "1+4", actualReps: "6" },
    { exerciseName: "Prensa Inclinada", section: "acc", plannedSets: "3-4", plannedReps: "10-15", actualWeight: 200, actualRPE: 7, actualSets: "4", actualReps: "12,12,11,10" },
    { exerciseName: "Remo Pecho Apoyado", section: "acc", plannedSets: "4", plannedReps: "8-12", actualWeight: 42.5, actualRPE: 7.5, actualSets: "4", actualReps: "12,10,10,9" },
    { exerciseName: "Curl Femoral Sentado", section: "acc", plannedSets: "3", plannedReps: "10-15", actualWeight: 55, actualRPE: 7, actualSets: "3", actualReps: "13,12,11" },
    { exerciseName: "Dead Bug", section: "acc", plannedSets: "3-4", plannedReps: "10-12", actualSets: "3", actualReps: "12" },
  ];

  for (const ex of day1Actual) {
    await prisma.checkinTrainingExercise.create({ data: { logId: log1.id, ...ex } });
  }

  // Day 2 log
  const log2 = await prisma.checkinTrainingLog.create({
    data: { checkinId: checkinTraining.id, dayNumber: 2, dayName: "DL Bloques + Torso" },
  });

  const day2Actual = [
    { exerciseName: "Peso Muerto desde Bloques", section: "main", plannedSets: "1+2-4", plannedReps: "5", plannedLoad: "~150kg", plannedRPE: 6, actualWeight: 150, actualRPE: 6, actualSets: "1+3", actualReps: "5" },
    { exerciseName: "Press Inclinado Mancuernas", section: "acc", plannedSets: "4", plannedReps: "8-12", actualWeight: 32, actualRPE: 7.5, actualSets: "4", actualReps: "10,10,9,8" },
    { exerciseName: "Jalón Polea", section: "acc", plannedSets: "4", plannedReps: "8-12", actualWeight: 70, actualRPE: 7, actualSets: "4", actualReps: "12,11,10,10" },
    { exerciseName: "Remo Dorian Yates", section: "acc", plannedSets: "3", plannedReps: "8-12", actualWeight: 60, actualRPE: 7.5, actualSets: "3", actualReps: "10,9,9" },
    { exerciseName: "Hiperextensiones", section: "acc", plannedSets: "2-3", plannedReps: "12-15", actualSets: "3", actualReps: "15,14,12" },
    { exerciseName: "Pallof Press", section: "acc", plannedSets: "3", plannedReps: "10-15/lado", actualSets: "3", actualReps: "12/lado" },
  ];

  for (const ex of day2Actual) {
    await prisma.checkinTrainingExercise.create({ data: { logId: log2.id, ...ex } });
  }

  // Day 3 log
  const log3 = await prisma.checkinTrainingLog.create({
    data: { checkinId: checkinTraining.id, dayNumber: 3, dayName: "Banca énfasis + Pierna" },
  });

  const day3Actual = [
    { exerciseName: "Banca comp. pausa", section: "main", plannedSets: "1+3-5", plannedReps: "6", plannedLoad: "~90kg", plannedRPE: 7, actualWeight: 90, actualRPE: 7, actualSets: "1+4", actualReps: "6" },
    { exerciseName: "Hack Squat", section: "acc", plannedSets: "4", plannedReps: "8-12", actualWeight: 120, actualRPE: 7, actualSets: "4", actualReps: "12,11,10,10" },
    { exerciseName: "Elevaciones Laterales", section: "acc", plannedSets: "4", plannedReps: "12-20", actualWeight: 10, actualRPE: 8, actualSets: "4", actualReps: "18,16,15,14" },
    { exerciseName: "Tríceps Polea (cuerda)", section: "acc", plannedSets: "3-4", plannedReps: "10-15", actualWeight: 25, actualRPE: 8, actualSets: "4", actualReps: "14,12,11,10" },
    { exerciseName: "Face Pull", section: "acc", plannedSets: "3", plannedReps: "15-25", actualWeight: 15, actualRPE: 6, actualSets: "3", actualReps: "22,20,18" },
    { exerciseName: "Cable Crunch", section: "acc", plannedSets: "3-4", plannedReps: "12-20", actualWeight: 40, actualRPE: 7, actualSets: "3", actualReps: "18,15,14" },
  ];

  for (const ex of day3Actual) {
    await prisma.checkinTrainingExercise.create({ data: { logId: log3.id, ...ex } });
  }

  // Day 4 log
  const log4 = await prisma.checkinTrainingLog.create({
    data: { checkinId: checkinTraining.id, dayNumber: 4, dayName: "Posterior + Torso" },
  });

  const day4Actual = [
    { exerciseName: "RDL Barra", section: "main", plannedSets: "4", plannedReps: "8-10", plannedLoad: "~97.5kg", actualWeight: 97.5, actualRPE: 7, actualSets: "4", actualReps: "9,8,8,8" },
    { exerciseName: "Curl Femoral Sentado", section: "acc", plannedSets: "3", plannedReps: "8-12", actualWeight: 55, actualRPE: 7, actualSets: "3", actualReps: "12,10,9" },
    { exerciseName: "Press máquina inclinado", section: "acc", plannedSets: "3-4", plannedReps: "10-15", actualWeight: 60, actualRPE: 7.5, actualSets: "4", actualReps: "14,12,11,10" },
    { exerciseName: "Remo polea baja", section: "acc", plannedSets: "4", plannedReps: "10-15", actualWeight: 65, actualRPE: 7, actualSets: "4", actualReps: "13,12,11,11" },
    { exerciseName: "Elevación de Gemelos", section: "acc", plannedSets: "3-4", plannedReps: "10-20", actualWeight: 80, actualRPE: 8, actualSets: "4", actualReps: "16,14,12,11" },
    { exerciseName: "Farmer Walk", section: "acc", plannedSets: "1", plannedReps: "6-10 min", actualWeight: 36, actualSets: "1", actualReps: "8 min" },
  ];

  for (const ex of day4Actual) {
    await prisma.checkinTrainingExercise.create({ data: { logId: log4.id, ...ex } });
  }

  console.log("✅ Check-ins seeded (2 nutrition + 1 training with 4 day logs)");

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
