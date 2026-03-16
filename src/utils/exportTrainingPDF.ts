import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { QuestionnaireEntry } from "@/data/useQuestionnaireStore";
import type { QuestionDefinition } from "@/data/questionnaireDefs";
import { nutritionTemplates } from "@/data/questionnaireDefs";
import { loadLogoBase64, addLogoToDoc } from "@/utils/pdfLogo";

// Brand palette — dark premium + neon green
const BG_BLACK: [number, number, number] = [0, 0, 0];
const PANEL_DARK: [number, number, number] = [17, 17, 17];
const PANEL_MID: [number, number, number] = [30, 30, 30];
const NEON_GREEN: [number, number, number] = [57, 255, 20];
const WHITE: [number, number, number] = [255, 255, 255];
const TEXT_MUTED: [number, number, number] = [140, 140, 140];
const TEXT_LIGHT: [number, number, number] = [210, 210, 210];
const BORDER_DARK: [number, number, number] = [50, 50, 50];
const ALT_ROW: [number, number, number] = [22, 22, 22];
const RPE_HIGH: [number, number, number] = [255, 80, 80];
const RPE_LOW: [number, number, number] = [57, 255, 20];

const fillBackground = (doc: jsPDF) => {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  doc.setFillColor(...BG_BLACK);
  doc.rect(0, 0, pw, ph, "F");
};

export const exportTrainingLogPDF = async (entry: QuestionnaireEntry, trainingQuestions?: QuestionDefinition[]) => {
  const logoBase64 = await loadLogoBase64();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Black background
  fillBackground(doc);

  let y = 20;

  // ── Header with logo ──
  const textX = addLogoToDoc(doc, logoBase64, margin, y);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NEON_GREEN);
  doc.text("JIP Coaching", textX, y);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_MUTED);
  doc.text("Registro de Entrenamiento", pageWidth - margin, y, { align: "right" });
  y += 10;

  // Neon accent line
  doc.setDrawColor(...NEON_GREEN);
  doc.setLineWidth(0.7);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ── Client info ──
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  doc.text(entry.clientName, margin, y);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`${entry.templateName}  ·  ${entry.weekLabel}  ·  ${entry.date}`, margin, y + 5);
  y += 14;

  // Common styles
  const baseStyles = {
    fontSize: 8,
    cellPadding: 2.5,
    lineColor: [...BORDER_DARK] as [number, number, number],
    lineWidth: 0.3,
    textColor: [...TEXT_LIGHT] as [number, number, number],
    fillColor: [...PANEL_DARK] as [number, number, number],
  };

  const headStyles = {
    fillColor: [...PANEL_MID] as [number, number, number],
    textColor: [...NEON_GREEN] as [number, number, number],
    fontStyle: "bold" as const,
    fontSize: 7.5,
    halign: "center" as const,
  };

  // ── Training log tables ──
  if (entry.trainingLog && entry.trainingLog.length > 0) {
    entry.trainingLog.forEach((day) => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...NEON_GREEN);
      doc.text(`Día ${day.dayNumber}: ${day.dayName}`, margin, y);
      y += 2;

      const filteredExercises = day.exercises.filter((ex) => ex.section !== "accessory");
      const tableBody = filteredExercises.map((ex) => {
        const rpeDiff =
          ex.actualRPE && ex.plannedRPE
            ? ex.actualRPE - ex.plannedRPE
            : null;
        const rpeDiffStr = rpeDiff !== null
          ? rpeDiff > 0 ? `(+${rpeDiff})` : rpeDiff < 0 ? `(${rpeDiff})` : "(=)"
          : "";

        return [
          ex.exerciseName,
          `${ex.plannedSets} × ${ex.plannedReps}`,
          ex.plannedLoad || "—",
          ex.plannedRPE != null ? String(ex.plannedRPE) : "—",
          ex.actualSets ? `${ex.actualSets} × ${ex.actualReps || "?"}` : "—",
          ex.actualWeight != null ? `${ex.actualWeight} kg` : "—",
          ex.actualRPE != null ? `${ex.actualRPE} ${rpeDiffStr}` : "—",
          ex.comment || "",
        ];
      });

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [
          [
            { content: "Ejercicio", colSpan: 1 },
            { content: "PAUTADO", colSpan: 3 },
            { content: "REAL", colSpan: 3 },
            { content: "Notas", colSpan: 1 },
          ],
          ["", "Series×Reps", "Carga", "RPE", "Series×Reps", "Peso", "RPE", ""],
        ],
        body: tableBody,
        theme: "grid",
        styles: baseStyles,
        headStyles,
        alternateRowStyles: { fillColor: [...ALT_ROW] },
        columnStyles: {
          0: { fontStyle: "bold", halign: "left", cellWidth: 30, textColor: [...WHITE] },
          1: { halign: "center" },
          2: { halign: "center", fontSize: 6, cellWidth: 32 },
          3: { halign: "center" },
          4: { halign: "center" },
          5: { halign: "center", fontStyle: "bold", textColor: [...WHITE] },
          6: { halign: "center", fontStyle: "bold" },
          7: { halign: "left", cellWidth: 30, fontSize: 6.5, textColor: [...TEXT_MUTED] },
        },
        willDrawPage: (data) => {
          if (data.pageNumber > 1) fillBackground(doc);
        },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 6) {
            const text = String(data.cell.raw || "");
            if (text.includes("(+")) {
              data.cell.styles.textColor = [...RPE_HIGH];
            } else if (text.includes("(-")) {
              data.cell.styles.textColor = [...RPE_LOW];
            }
          }
        },
      });

      y = (doc as any).lastAutoTable.finalY + 8;

      if (y > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        fillBackground(doc);
        y = 20;
      }
    });
  }

  // ── Legacy lift logs ──
  if ((!entry.trainingLog || entry.trainingLog.length === 0) && entry.liftLogs && entry.liftLogs.length > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NEON_GREEN);
    doc.text("Registro de Pesos", margin, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Ejercicio", "Series", "Peso (kg)", "RPE"]],
      body: entry.liftLogs.map((log) => [
        log.exerciseName,
        log.sets,
        String(log.weight),
        log.rpe != null ? String(log.rpe) : "—",
      ]),
      theme: "grid",
      styles: baseStyles,
      headStyles,
      alternateRowStyles: { fillColor: [...ALT_ROW] },
      columnStyles: {
        0: { fontStyle: "bold", textColor: [...WHITE] },
        2: { halign: "right", fontStyle: "bold", textColor: [...WHITE] },
        3: { halign: "right" },
      },
      willDrawPage: (data) => {
        if (data.pageNumber > 1) fillBackground(doc);
      },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── General responses ──
  if (entry.responses && Object.keys(entry.responses).length > 0) {
    if (y > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      fillBackground(doc);
      y = 20;
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NEON_GREEN);
    doc.text("Respuestas Generales", margin, y);
    y += 2;

    const template = entry.category === "nutrition"
      ? nutritionTemplates.find((tp) => tp.id === entry.templateId)
      : null;

    const responseRows = Object.entries(entry.responses).map(([key, val]) => {
      const questionDef = template
        ? template.questions.find((q) => q.id === key)
        : trainingQuestions?.find((q) => q.id === key);
      const label = questionDef?.label || key;
      const display = typeof val === "boolean" ? (val ? "Sí" : "No") : String(val);
      return [label, display];
    });

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Pregunta", "Respuesta"]],
      body: responseRows,
      theme: "grid",
      styles: baseStyles,
      headStyles,
      alternateRowStyles: { fillColor: [...ALT_ROW] },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { fontStyle: "bold", halign: "right", textColor: [...WHITE] },
      },
      willDrawPage: (data) => {
        if (data.pageNumber > 1) fillBackground(doc);
      },
    });
  }

  // ── Footer ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const footerY = doc.internal.pageSize.getHeight() - 10;

    doc.setDrawColor(...BORDER_DARK);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_MUTED);
    doc.text(`JIP Coaching — ${entry.clientName} — ${entry.date}`, margin, footerY);
    doc.setTextColor(...NEON_GREEN);
    doc.text(`${i}/${pageCount}`, pageWidth - margin, footerY, { align: "right" });
  }

  const fileName = `${entry.clientName.replace(/\s+/g, "_")}_${entry.templateName.replace(/\s+/g, "_")}_${entry.date}.pdf`;
  doc.save(fileName);
};
