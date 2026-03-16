import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { NutritionPlanDetail, Meal, Supplement } from "@/data/nutritionPlanStore";
import type { TrainingPlanFull, TrainingWeek } from "@/data/trainingPlanStore";
import { TRAINING_METHOD_LABELS } from "@/data/trainingPlanStore";
import { loadLogoBase64 } from "@/utils/pdfLogo";

const MARGIN = 15;

// Brand palette — dark premium + neon green
const BG_BLACK: [number, number, number] = [0, 0, 0];
const PANEL_DARK: [number, number, number] = [17, 17, 17];
const PANEL_MID: [number, number, number] = [30, 30, 30];
const NEON_GREEN: [number, number, number] = [57, 255, 20];
const WHITE: [number, number, number] = [255, 255, 255];
const TEXT_MUTED: [number, number, number] = [140, 140, 140];
const TEXT_LIGHT: [number, number, number] = [210, 210, 210];
const BORDER_DARK: [number, number, number] = [50, 50, 50];

const fillBackground = (doc: jsPDF) => {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  doc.setFillColor(...BG_BLACK);
  doc.rect(0, 0, pw, ph, "F");
};

const addHeader = (doc: jsPDF, title: string, subtitle: string, logoBase64?: string | null) => {
  fillBackground(doc);
  const pw = doc.internal.pageSize.getWidth();
  let y = 20;

  // Logo + Brand name in neon green
  const logoSize = 14;
  let textX = MARGIN;
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", MARGIN, y - logoSize + 3, logoSize, logoSize);
      textX = MARGIN + logoSize + 3;
    } catch { /* skip logo on error */ }
  }
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NEON_GREEN);
  doc.text("JIP Coaching", textX, y);

  // Section title
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_MUTED);
  doc.text(title, pw - MARGIN, y, { align: "right" });

  y += 10;
  // Neon accent line
  doc.setDrawColor(...NEON_GREEN);
  doc.setLineWidth(0.7);
  doc.line(MARGIN, y, pw - MARGIN, y);

  y += 8;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
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
    const fy = doc.internal.pageSize.getHeight() - 10;

    // Subtle separator
    doc.setDrawColor(...BORDER_DARK);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, fy - 4, pw - MARGIN, fy - 4);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_MUTED);
    doc.text(`JIP Coaching - ${clientName} - ${date}`, MARGIN, fy);
    doc.setTextColor(...NEON_GREEN);
    doc.text(`${i}/${pages}`, pw - MARGIN, fy, { align: "right" });
  }
};

/** Wrap doc so any addPage() call automatically paints the black background */
const patchAddPage = (doc: jsPDF) => {
  const originalAddPage = doc.addPage.bind(doc);
  doc.addPage = (...args: any[]) => {
    const result = originalAddPage(...args);
    fillBackground(doc);
    return result;
  };
};

const checkPage = (doc: jsPDF, y: number, needed = 40): number => {
  if (y > doc.internal.pageSize.getHeight() - needed) {
    doc.addPage();
    fillBackground(doc);
    return 20;
  }
  return y;
};

// Common table styles matching brand
const baseStyles = {
  fontSize: 8,
  cellPadding: 3,
  lineColor: [...BORDER_DARK] as [number, number, number],
  lineWidth: 0.3,
  textColor: [...TEXT_LIGHT] as [number, number, number],
  fillColor: [...PANEL_DARK] as [number, number, number],
};

const headStylesPrimary = {
  fillColor: [...PANEL_MID] as [number, number, number],
  textColor: [...NEON_GREEN] as [number, number, number],
  fontStyle: "bold" as const,
  fontSize: 8,
};

const headStylesSecondary = {
  fillColor: [...PANEL_DARK] as [number, number, number],
  textColor: [...TEXT_MUTED] as [number, number, number],
  fontStyle: "bold" as const,
  fontSize: 7.5,
};

const altRowColor: [number, number, number] = [22, 22, 22];

// ─── NUTRITION PLAN PDF ───

export const exportNutritionPlanPDF = async (
  plan: NutritionPlanDetail,
  planName: string,
  clientName: string,
  supplements: Supplement[] = [],
) => {
  const logoBase64 = await loadLogoBase64();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  patchAddPage(doc);
  let y = addHeader(doc, "Plan Nutricional", planName, logoBase64);

  // Client
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`Cliente: ${clientName}`, MARGIN, y);
  y += 6;

  // Objective
  if (plan.objective) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...TEXT_LIGHT);
    const lines = doc.splitTextToSize(plan.objective, doc.internal.pageSize.getWidth() - MARGIN * 2);
    doc.text(lines, MARGIN, y);
    y += lines.length * 4 + 4;
  }

  // Macros table — highlight with neon green headers
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Kcal", "Proteínas", "Carbohidratos", "Grasas"]],
    body: [[
      String(plan.calories || "—"),
      `${plan.protein || "—"}g`,
      `${plan.carbs || "—"}g`,
      `${plan.fats || "—"}g`,
    ]],
    theme: "grid",
    styles: { ...baseStyles, fontSize: 10, cellPadding: 4, halign: "center" },
    headStyles: { ...headStylesPrimary, fontSize: 9 },
    bodyStyles: { fontStyle: "bold", fontSize: 12, textColor: [...WHITE] as [number, number, number] },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // Meals
  plan.meals.forEach((meal) => {
    y = checkPage(doc, y, 30);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NEON_GREEN);
    doc.text(meal.name.toUpperCase(), MARGIN, y);
    y += 2;

    if (meal.description) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(...TEXT_MUTED);
      doc.text(meal.description, MARGIN, y + 3);
      y += 6;
    }

    meal.options.forEach((opt, optIdx) => {
      y = checkPage(doc, y, 20);

      const CATEGORY_LABELS: Record<string, string> = {
        PROTEIN: "Proteina",
        CARB: "Carbohidrato",
        FAT: "Grasa",
        FRUIT: "Fruta",
        VEG: "Verdura",
      };

      const tableBody = opt.rows.map((row) => {
        const cat = row.macroCategory ? CATEGORY_LABELS[row.macroCategory] || row.macroCategory : "";
        const alts = row.alternatives.length > 0 ? row.alternatives.join(" | ") : "";
        return [cat, row.mainIngredient, alts];
      });

      autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: [[{ content: `Opcion ${optIdx + 1}${opt.notes ? ` - ${opt.notes}` : ""}`, colSpan: 3 }]],
        body: tableBody,
        theme: "grid",
        styles: { ...baseStyles, cellPadding: 2.5 },
        headStyles: headStylesSecondary,
        alternateRowStyles: { fillColor: [...altRowColor] },
        columnStyles: {
          0: { cellWidth: 28, halign: "center", fontSize: 7, textColor: [...NEON_GREEN] },
          1: { fontStyle: "bold", textColor: [...WHITE] },
          2: { fontSize: 7, textColor: [...TEXT_MUTED] },
        },
      });
      y = (doc as any).lastAutoTable.finalY + 4;
    });
    y += 2;
  });

  // Supplements (global + plan-specific extras)
  const allSupplements = [
    ...supplements,
    ...(plan.planSupplements ?? []),
  ];
  if (allSupplements.length > 0) {
    y = checkPage(doc, y, 30);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NEON_GREEN);
    doc.text("SUPLEMENTACION", MARGIN, y);
    y += 2;
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [["Suplemento", "Dosis", "Momento"]],
      body: allSupplements.map((s) => [s.name, s.dose, s.timing]),
      theme: "grid",
      styles: baseStyles,
      headStyles: headStylesPrimary,
      alternateRowStyles: { fillColor: [...altRowColor] },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Recommendations
  if (plan.recommendations.length > 0) {
    y = checkPage(doc, y, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NEON_GREEN);
    doc.text("RECOMENDACIONES", MARGIN, y);
    y += 5;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_LIGHT);
    plan.recommendations.forEach((r) => {
      y = checkPage(doc, y, 8);
      const lines = doc.splitTextToSize(`- ${r}`, doc.internal.pageSize.getWidth() - MARGIN * 2);
      doc.text(lines, MARGIN, y);
      y += lines.length * 3.5 + 2;
    });
  }

  addFooter(doc, clientName);
  doc.save(`Plan_Nutricional_${clientName.replace(/\s+/g, "_")}.pdf`);
};

// ─── TRAINING WEEK PDF ───

export const exportTrainingWeekPDF = async (
  plan: TrainingPlanFull,
  week: TrainingWeek,
  clientName: string,
) => {
  const logoBase64 = await loadLogoBase64();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  patchAddPage(doc);
  let y = addHeader(doc, "Plan de Entrenamiento", plan.planName, logoBase64);

  // Subtitle
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`${clientName}  ·  ${plan.modality} · ${week.block || plan.block}  ·  Semana ${week.weekNumber}`, MARGIN, y);
  y += 8;

  // General notes
  if (week.generalNotes) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...TEXT_LIGHT);
    const lines = doc.splitTextToSize(week.generalNotes, doc.internal.pageSize.getWidth() - MARGIN * 2);
    doc.text(lines, MARGIN, y);
    y += lines.length * 3.5 + 4;
  }

  // Days
  [...week.days].sort((a, b) => a.dayNumber - b.dayNumber).forEach((day) => {
    y = checkPage(doc, y, 35);

    // Day header with neon green accent
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NEON_GREEN);
    doc.text(`Día ${day.dayNumber} — ${day.name}`, MARGIN, y);
    y += 2;

    if (day.warmup) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(...TEXT_MUTED);
      doc.text(`Calentamiento: ${day.warmup}`, MARGIN, y + 3);
      y += 6;
    }

    const basics = day.exercises.filter((e) => e.section === "basic");
    const accessories = day.exercises.filter((e) => e.section === "accessory");

    // Basics table
    if (basics.length > 0) {
      const basicRows = basics.map((ex) => {
        const method = ex.method ? (TRAINING_METHOD_LABELS[ex.method] || ex.method) : "";
        const prescription: string[] = [];
        if (ex.topSetReps) prescription.push(`Top: ${ex.topSetReps} reps`);
        if (ex.topSetRPE) prescription.push(`@RPE ${ex.topSetRPE}`);
        if (ex.backoffSets) prescription.push(`Back-off: ${ex.backoffSets} sets`);
        if (ex.backoffReps) prescription.push(`× ${ex.backoffReps} reps`);
        if (ex.backoffPercent) prescription.push(`@RPE ${ex.backoffPercent}`);
        if (ex.fatiguePercent) prescription.push(`Fatiga: ${ex.fatiguePercent}%`);
        if (ex.estimatedSeries) prescription.push(`Series est.: ${ex.estimatedSeries}`);
        if (ex.sets) prescription.push(`${ex.sets} series`);
        if (ex.reps) prescription.push(`× ${ex.reps}`);
        if (ex.plannedLoad) prescription.push(`Carga: ${ex.plannedLoad}`);
        if (ex.backoffRule) prescription.push(`Regla: ${ex.backoffRule}`);
        const notes = [
          ex.technicalNotes,
          ex.customMethodName ? `Método: ${ex.customMethodName}` : null,
          ex.customMethodDescription,
        ].filter(Boolean).join(" | ");
        return [
          ex.exerciseName || "—",
          method,
          prescription.join("  ") || "—",
          notes || "",
        ];
      });

      autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: [["Ejercicio", "Método", "Prescripción", "Notas"]],
        body: basicRows,
        theme: "grid",
        styles: { ...baseStyles, cellPadding: 2.5 },
        headStyles: { ...headStylesPrimary, fontSize: 7.5 },
        alternateRowStyles: { fillColor: [...altRowColor] },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 40, textColor: [...WHITE] },
          1: { cellWidth: 28, fontSize: 7 },
          2: { cellWidth: 50 },
          3: { fontSize: 7, textColor: [...TEXT_MUTED] },
        },
      });
      y = (doc as any).lastAutoTable.finalY + 3;
    }

    // Accessories table
    if (accessories.length > 0) {
      y = checkPage(doc, y, 15);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...TEXT_MUTED);
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
        styles: { ...baseStyles, fontSize: 7.5, cellPadding: 2 },
        headStyles: headStylesSecondary,
        alternateRowStyles: { fillColor: [...altRowColor] },
        columnStyles: {
          0: { fontStyle: "bold", textColor: [...WHITE] },
          2: { fontSize: 7, textColor: [...TEXT_MUTED] },
        },
      });
      y = (doc as any).lastAutoTable.finalY + 3;
    }

    if (day.exercises.length === 0) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(...TEXT_MUTED);
      doc.text("Sin ejercicios asignados", MARGIN, y + 3);
      y += 8;
    }

    y += 4;
  });

  addFooter(doc, clientName);
  doc.save(`Entreno_S${week.weekNumber}_${clientName.replace(/\s+/g, "_")}.pdf`);
};
