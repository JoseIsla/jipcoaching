import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { QuestionnaireEntry } from "@/data/mockData";
import { trainingTemplate, nutritionTemplates } from "@/data/mockData";

export const exportTrainingLogPDF = (entry: QuestionnaireEntry) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 20;

  // ── Header ──
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("JIP Coaching", margin, y);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text("Registro de Entrenamiento", pageWidth - margin, y, { align: "right" });
  y += 10;

  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ── Client info ──
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(entry.clientName, margin, y);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`${entry.templateName}  ·  ${entry.weekLabel}  ·  ${entry.date}`, margin, y + 5);
  y += 14;

  // ── Training log tables ──
  if (entry.trainingLog && entry.trainingLog.length > 0) {
    entry.trainingLog.forEach((day) => {
      // Day title
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
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
          ],
          ["", "Series×Reps", "Carga", "RPE", "Series×Reps", "Peso", "RPE"],
        ],
        body: tableBody,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
          lineColor: [220, 220, 220],
          lineWidth: 0.3,
        },
        headStyles: {
          fillColor: [40, 40, 40],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 7.5,
          halign: "center",
        },
        columnStyles: {
          0: { fontStyle: "bold", halign: "left", cellWidth: 38 },
          1: { halign: "center" },
          2: { halign: "center" },
          3: { halign: "center" },
          4: { halign: "center" },
          5: { halign: "center", fontStyle: "bold" },
          6: { halign: "center", fontStyle: "bold" },
        },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        didParseCell: (data) => {
          // Color RPE diff in actual RPE column
          if (data.section === "body" && data.column.index === 6) {
            const text = String(data.cell.raw || "");
            if (text.includes("(+")) {
              data.cell.styles.textColor = [220, 50, 50];
            } else if (text.includes("(-")) {
              data.cell.styles.textColor = [50, 150, 50];
            }
          }
        },
      });

      y = (doc as any).lastAutoTable.finalY + 8;

      // Check if we need a new page
      if (y > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        y = 20;
      }
    });
  }

  // ── Legacy lift logs ──
  if ((!entry.trainingLog || entry.trainingLog.length === 0) && entry.liftLogs && entry.liftLogs.length > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
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
      styles: { fontSize: 8, cellPadding: 2.5, lineColor: [220, 220, 220], lineWidth: 0.3 },
      headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: "bold" },
      columnStyles: {
        0: { fontStyle: "bold" },
        2: { halign: "right", fontStyle: "bold" },
        3: { halign: "right" },
      },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── General responses ──
  if (entry.responses && Object.keys(entry.responses).length > 0) {
    if (y > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("Respuestas Generales", margin, y);
    y += 2;

    const template = entry.category === "nutrition"
      ? nutritionTemplates.find((tp) => tp.id === entry.templateId)
      : null;

    const responseRows = Object.entries(entry.responses).map(([key, val]) => {
      const questionDef = template
        ? template.questions.find((q) => q.id === key)
        : trainingTemplate.questions.find((q) => q.id === key);
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
      styles: { fontSize: 8, cellPadding: 2.5, lineColor: [220, 220, 220], lineWidth: 0.3 },
      headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { fontStyle: "bold", halign: "right" },
      },
    });
  }

  // ── Footer ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 160, 160);
    const footerY = doc.internal.pageSize.getHeight() - 10;
    doc.text(`JIP Coaching — ${entry.clientName} — ${entry.date}`, margin, footerY);
    doc.text(`${i}/${pageCount}`, pageWidth - margin, footerY, { align: "right" });
  }

  // Download
  const fileName = `${entry.clientName.replace(/\s+/g, "_")}_${entry.templateName.replace(/\s+/g, "_")}_${entry.date}.pdf`;
  doc.save(fileName);
};
