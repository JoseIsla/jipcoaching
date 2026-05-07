import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { loadLogoBase64, addLogoToDoc } from "@/utils/pdfLogo";
import type { OppositionTestDef } from "@/data/oppositionScales";
import type { PhysicalTestScaleEntry, ClientPhysicalMark } from "@/types/api";

const BG_BLACK: [number, number, number] = [0, 0, 0];
const PANEL_DARK: [number, number, number] = [17, 17, 17];
const NEON_GREEN: [number, number, number] = [57, 255, 20];
const WHITE: [number, number, number] = [255, 255, 255];
const TEXT_MUTED: [number, number, number] = [140, 140, 140];
const TEXT_LIGHT: [number, number, number] = [210, 210, 210];
const ALT_ROW: [number, number, number] = [22, 22, 22];

const fillBackground = (doc: jsPDF) => {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  doc.setFillColor(...BG_BLACK);
  doc.rect(0, 0, pw, ph, "F");
};

const scoreColor = (score: number): [number, number, number] => {
  if (score >= 8) return [57, 255, 20];
  if (score >= 5) return [255, 200, 50];
  if (score >= 1) return [255, 140, 50];
  return [255, 80, 80];
};

const formatTime = (seconds: number): string => {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}'${s.toString().padStart(2, "0")}''`;
  }
  return `${seconds.toFixed(1)}''`;
};

interface ExportParams {
  clientName: string;
  oppositionLabel: string;
  gender: string;
  tests: OppositionTestDef[];
  scales: PhysicalTestScaleEntry[];
  marks: ClientPhysicalMark[];
}

const getScore = (scales: PhysicalTestScaleEntry[], testName: string, value: number): number => {
  for (const s of scales.filter((sc) => sc.testName === testName)) {
    if (value >= s.minValue && value <= s.maxValue) return s.score;
  }
  return 0;
};

export const exportPhysicalMarksPDF = async (params: ExportParams) => {
  const { clientName, oppositionLabel, gender, tests, scales, marks } = params;
  const logoBase64 = await loadLogoBase64();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  fillBackground(doc);

  let y = 20;
  addLogoToDoc(doc, logoBase64, margin, y);
  y += 18;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...WHITE);
  doc.text("Informe de Marcas Físicas", margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`${clientName} — ${oppositionLabel} (${gender === "MALE" ? "Hombre" : "Mujer"})`, margin, y);
  y += 5;
  doc.text(`Fecha: ${new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`, margin, y);
  y += 10;

  // Total score
  let totalScore = 0;
  const maxScore = tests.length * 10;
  const tableData: string[][] = [];

  for (const test of tests) {
    const latest = marks.find((m) => m.testName === test.testName);
    const value = latest ? latest.value : null;
    const score = value !== null ? getScore(scales, test.testName, value) : 0;
    totalScore += score;

    const valueStr = value !== null
      ? test.unit === "seconds" ? formatTime(value) : `${value} ${test.unitLabel}`
      : "—";

    tableData.push([test.testName, valueStr, `${score}/10`, test.unitLabel]);
  }

  // Total score box
  doc.setFillColor(...PANEL_DARK);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 14, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...NEON_GREEN);
  doc.text(`Puntuación Total: ${totalScore} / ${maxScore}`, margin + 6, y + 9);
  y += 20;

  // Table
  autoTable(doc, {
    startY: y,
    head: [["Prueba", "Última marca", "Puntuación"]],
    body: tableData.map((row) => [row[0], row[1], row[2]]),
    margin: { left: margin, right: margin },
    styles: {
      fillColor: BG_BLACK,
      textColor: TEXT_LIGHT,
      fontSize: 10,
      cellPadding: 4,
      lineColor: [50, 50, 50],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: PANEL_DARK,
      textColor: NEON_GREEN,
      fontStyle: "bold",
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: ALT_ROW,
    },
    willDrawPage: () => fillBackground(doc),
    didParseCell: (data) => {
      // Color the score column
      if (data.section === "body" && data.column.index === 2) {
        const scoreText = data.cell.raw as string;
        const scoreNum = parseInt(scoreText);
        if (!isNaN(scoreNum)) {
          data.cell.styles.textColor = scoreColor(scoreNum);
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  doc.save(`marcas_${clientName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);
};