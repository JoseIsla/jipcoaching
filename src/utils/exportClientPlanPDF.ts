import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { NutritionPlanDetail, Meal, Supplement } from "@/data/nutritionPlanStore";
import type { TrainingPlanFull, TrainingWeek } from "@/data/trainingPlanStore";

const MARGIN = 15;
const GREEN = [30, 200, 80] as const;
const DARK = [25, 25, 25] as const;
const GRAY = [120, 120, 120] as const;
const LIGHT_GRAY = [220, 220, 220] as const;

const addHeader = (doc: jsPDF, title: string, subtitle: string) => {
  const pw = doc.internal.pageSize.getWidth();
  let y = 20;
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("JIP Coaching", MARGIN, y);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text(title, pw - MARGIN, y, { align: "right" });
  y += 10;
  doc.setDrawColor(...LIGHT_GRAY);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, pw - MARGIN, y);
  y += 8;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(subtitle, MARGIN, y);
  y += 6;
  return y;
};

const addFooter = (doc: jsPDF, clientName: string) => {
  const pw = doc.internal.pageSize.getWidth();
  const pages = doc.getNumberOfPages();
  const date = new Date().toLocaleDateString("es-ES");
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 160, 160);
    const fy = doc.internal.pageSize.getHeight() - 10;
    doc.text(`JIP Coaching — ${clientName} — ${date}`, MARGIN, fy);
    doc.text(`${i}/${pages}`, pw - MARGIN, fy, { align: "right" });
  }
};

const checkPage = (doc: jsPDF, y: number, needed = 40): number => {
  if (y > doc.internal.pageSize.getHeight() - needed) {
    doc.addPage();
    return 20;
  }
  return y;
};

// ─── NUTRITION PLAN PDF ───

export const exportNutritionPlanPDF = (
  plan: NutritionPlanDetail,
  planName: string,
  clientName: string,
  supplements: Supplement[] = [],
) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = addHeader(doc, "Plan Nutricional", planName);

  // Client
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text(`Cliente: ${clientName}`, MARGIN, y);
  y += 6;

  // Objective
  if (plan.objective) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(80, 80, 80);
    const lines = doc.splitTextToSize(plan.objective, doc.internal.pageSize.getWidth() - MARGIN * 2);
    doc.text(lines, MARGIN, y);
    y += lines.length * 4 + 4;
  }

  // Macros table
  const macroData = [
    [
      String(plan.calories || "—"),
      `${plan.protein || "—"}g`,
      `${plan.carbs || "—"}g`,
      `${plan.fats || "—"}g`,
    ],
  ];
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Kcal", "Proteínas", "Carbohidratos", "Grasas"]],
    body: macroData,
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 4, halign: "center", lineColor: [...LIGHT_GRAY], lineWidth: 0.3 },
    headStyles: { fillColor: [...DARK], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontStyle: "bold", fontSize: 11 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // Meals
  plan.meals.forEach((meal) => {
    y = checkPage(doc, y, 30);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text(`🍽 ${meal.name}`, MARGIN, y);
    y += 2;

    if (meal.description) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(...GRAY);
      doc.text(meal.description, MARGIN, y + 3);
      y += 6;
    }

    meal.options.forEach((opt, optIdx) => {
      y = checkPage(doc, y, 20);

      const tableBody = opt.rows.map((row) => {
        const cat = row.macroCategory
          ? ({ PROTEIN: "🥩 Prot", CARB: "🍚 CH", FAT: "🥑 Grasas", FRUIT: "🍎 Fruta", VEG: "🥦 Verd" } as Record<string, string>)[row.macroCategory] || row.macroCategory
          : "";
        const alts = row.alternatives.length > 0 ? `Alt: ${row.alternatives.join(", ")}` : "";
        return [cat, row.mainIngredient, alts];
      });

      autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: [[{ content: `Opción ${optIdx + 1}${opt.notes ? ` — ${opt.notes}` : ""}`, colSpan: 3 }]],
        body: tableBody,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2.5, lineColor: [...LIGHT_GRAY], lineWidth: 0.3 },
        headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 25, halign: "center", fontSize: 7 },
          1: { fontStyle: "bold" },
          2: { fontSize: 7, textColor: [...GRAY] },
        },
      });
      y = (doc as any).lastAutoTable.finalY + 4;
    });
    y += 2;
  });

  // Supplements
  if (supplements.length > 0) {
    y = checkPage(doc, y, 30);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text("💊 Suplementación", MARGIN, y);
    y += 2;
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [["Suplemento", "Dosis", "Momento"]],
      body: supplements.map((s) => [s.name, s.dose, s.timing]),
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2.5, lineColor: [...LIGHT_GRAY], lineWidth: 0.3 },
      headStyles: { fillColor: [...DARK], textColor: [255, 255, 255], fontStyle: "bold" },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Recommendations
  if (plan.recommendations.length > 0) {
    y = checkPage(doc, y, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text("📌 Recomendaciones", MARGIN, y);
    y += 5;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    plan.recommendations.forEach((r) => {
      y = checkPage(doc, y, 8);
      const lines = doc.splitTextToSize(`• ${r}`, doc.internal.pageSize.getWidth() - MARGIN * 2);
      doc.text(lines, MARGIN, y);
      y += lines.length * 3.5 + 2;
    });
  }

  addFooter(doc, clientName);
  doc.save(`Plan_Nutricional_${clientName.replace(/\s+/g, "_")}.pdf`);
};

// ─── TRAINING WEEK PDF ───

export const exportTrainingWeekPDF = (
  plan: TrainingPlanFull,
  week: TrainingWeek,
  clientName: string,
) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = addHeader(doc, "Plan de Entrenamiento", plan.planName);

  // Subtitle
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text(`${clientName}  ·  ${plan.modality} · ${week.block || plan.block}  ·  Semana ${week.weekNumber}`, MARGIN, y);
  y += 8;

  // General notes
  if (week.generalNotes) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(80, 80, 80);
    const lines = doc.splitTextToSize(week.generalNotes, doc.internal.pageSize.getWidth() - MARGIN * 2);
    doc.text(lines, MARGIN, y);
    y += lines.length * 3.5 + 4;
  }

  // Days
  week.days.forEach((day) => {
    y = checkPage(doc, y, 35);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text(`Día ${day.dayNumber} — ${day.name}`, MARGIN, y);
    y += 2;

    if (day.warmup) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(...GRAY);
      doc.text(`🔥 ${day.warmup}`, MARGIN, y + 3);
      y += 6;
    }

    const basics = day.exercises.filter((e) => e.section === "basic");
    const accessories = day.exercises.filter((e) => e.section === "accessory");

    // Basics table
    if (basics.length > 0) {
      const basicRows = basics.map((ex) => {
        const method = ex.method || "";
        const prescription: string[] = [];
        if (ex.topSetReps) prescription.push(`Top: ${ex.topSetReps} reps`);
        if (ex.topSetRPE) prescription.push(`@${ex.topSetRPE}`);
        if (ex.sets) prescription.push(`${ex.sets} series`);
        if (ex.reps) prescription.push(`× ${ex.reps}`);
        if (ex.plannedLoad) prescription.push(`Carga: ${ex.plannedLoad}`);
        return [
          ex.exerciseName || "—",
          method,
          prescription.join("  ") || "—",
          ex.technicalNotes || "",
        ];
      });

      autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: [["Ejercicio", "Método", "Prescripción", "Notas"]],
        body: basicRows,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2.5, lineColor: [...LIGHT_GRAY], lineWidth: 0.3 },
        headStyles: { fillColor: [...DARK], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 40 },
          1: { cellWidth: 28, fontSize: 7 },
          2: { cellWidth: 50 },
          3: { fontSize: 7, textColor: [...GRAY] },
        },
      });
      y = (doc as any).lastAutoTable.finalY + 3;
    }

    // Accessories table
    if (accessories.length > 0) {
      y = checkPage(doc, y, 15);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...GRAY);
      doc.text("Accesorios", MARGIN, y + 2);
      y += 3;

      const accRows = accessories.map((ex) => {
        const vol: string[] = [];
        if (ex.sets) vol.push(`${ex.sets} series`);
        if (ex.reps) vol.push(`× ${ex.reps}`);
        if (ex.intensityType && ex.intensityValue != null) vol.push(`${ex.intensityType} ${ex.intensityValue}`);
        return [ex.exerciseName || "—", vol.join("  ") || "—", ex.technicalNotes || ""];
      });

      autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: [["Accesorio", "Volumen", "Notas"]],
        body: accRows,
        theme: "grid",
        styles: { fontSize: 7.5, cellPadding: 2, lineColor: [...LIGHT_GRAY], lineWidth: 0.3 },
        headStyles: { fillColor: [80, 80, 80], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7 },
        columnStyles: {
          0: { fontStyle: "bold" },
          2: { fontSize: 7, textColor: [...GRAY] },
        },
      });
      y = (doc as any).lastAutoTable.finalY + 3;
    }

    if (day.exercises.length === 0) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(...GRAY);
      doc.text("Sin ejercicios asignados", MARGIN, y + 3);
      y += 8;
    }

    y += 4;
  });

  addFooter(doc, clientName);
  doc.save(`Entreno_S${week.weekNumber}_${clientName.replace(/\s+/g, "_")}.pdf`);
};
