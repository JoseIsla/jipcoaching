import { prisma } from "../server";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

export function isClaudeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const TOOL_SCHEMA = {
  name: "submit_checkin_review",
  description:
    "Devuelve el análisis técnico para el coach y un borrador de respuesta empática para el cliente.",
  input_schema: {
    type: "object",
    properties: {
      analysis: {
        type: "string",
        description:
          "Análisis técnico breve para el coach en markdown (4-8 líneas): tendencias de peso, adherencia, energía, hambre, sueño y alertas.",
      },
      alerts: {
        type: "array",
        items: { type: "string" },
        description: "Lista corta de alertas o banderas rojas (vacía si no hay).",
      },
      draftResponse: {
        type: "string",
        description:
          "Borrador de respuesta al cliente en español, tono cercano y profesional, en 1ª persona del coach, 2-4 párrafos cortos.",
      },
    },
    required: ["analysis", "alerts", "draftResponse"],
  },
} as const;

type AnalyzeResult = {
  analysis: string;
  alerts: string[];
  draftResponse: string;
};

function fmt(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toISOString().slice(0, 10);
}

/**
 * Build a compact textual context for Claude.
 * Includes current responses + last 4 nutrition check-ins of the same client.
 */
async function buildContext(checkinId: string): Promise<string | null> {
  const checkin = await prisma.checkin.findUnique({
    where: { id: checkinId },
    include: {
      client: { select: { id: true, name: true, currentWeight: true, height: true, goal: true } },
      template: { include: { questions: { orderBy: { order: "asc" } } } },
      responses: { include: { question: true } },
    },
  });
  if (!checkin || checkin.category !== "NUTRITION") return null;

  const responseMap = new Map(checkin.responses.map((r) => [r.questionId, r.value]));
  const currentLines = (checkin.template?.questions || [])
    .map((q) => `- ${q.label}: ${responseMap.get(q.id) ?? "—"}`)
    .join("\n");

  // Last 4 prior NUTRITION check-ins of the same client (responded)
  const history = await prisma.checkin.findMany({
    where: {
      clientId: checkin.clientId,
      category: "NUTRITION",
      id: { not: checkin.id },
      status: { in: ["RESPONDED", "REVIEWED"] as any },
    },
    orderBy: { date: "desc" },
    take: 4,
    include: {
      template: { include: { questions: { orderBy: { order: "asc" } } } },
      responses: true,
    },
  });

  const historyBlocks = history
    .map((h) => {
      const rm = new Map(h.responses.map((r) => [r.questionId, r.value]));
      const lines = (h.template?.questions || [])
        .slice(0, 8)
        .map((q) => `  - ${q.label}: ${rm.get(q.id) ?? "—"}`)
        .join("\n");
      return `• ${fmt(h.date)} (${h.weekLabel || ""}):\n${lines}`;
    })
    .join("\n");

  // Last 5 weight entries
  const weights = await prisma.weightEntry.findMany({
    where: { clientId: checkin.clientId },
    orderBy: { date: "desc" },
    take: 5,
  });
  const weightLine = weights
    .reverse()
    .map((w) => `${fmt(w.date)}: ${w.weight}kg`)
    .join(" → ");

  return [
    `Cliente: ${checkin.client.name}`,
    checkin.client.goal ? `Objetivo: ${checkin.client.goal}` : "",
    checkin.client.currentWeight ? `Peso actual registrado: ${checkin.client.currentWeight}kg` : "",
    "",
    `## Check-in actual (${fmt(checkin.date)} · ${checkin.dayLabel || ""} · ${checkin.weekLabel || ""})`,
    currentLines || "(sin respuestas)",
    "",
    weightLine ? `## Evolución de peso reciente\n${weightLine}` : "",
    "",
    historyBlocks ? `## Check-ins previos\n${historyBlocks}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

const SYSTEM_PROMPT = `Eres el asistente de José Isla Pérez, coach de nutrición y entrenamiento. Tu trabajo es analizar el check-in semanal de nutrición de un cliente y devolver:
1) Un análisis técnico breve para el coach (markdown, 4-8 líneas) con tendencias clave (peso, adherencia, hambre, sueño, energía) y alertas si las hay.
2) Un borrador de respuesta en español para enviar al cliente, en 1ª persona del coach, tono cercano y profesional, motivador pero honesto, 2-4 párrafos cortos. No inventes datos.

Siempre responde llamando a la tool submit_checkin_review.`;

export async function analyzeNutritionCheckin(checkinId: string): Promise<AnalyzeResult | null> {
  if (!isClaudeConfigured()) return null;
  const context = await buildContext(checkinId);
  if (!context) return null;

  const resp = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      tools: [TOOL_SCHEMA],
      tool_choice: { type: "tool", name: "submit_checkin_review" },
      messages: [
        {
          role: "user",
          content: `Analiza este check-in nutricional:\n\n${context}`,
        },
      ],
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Claude API ${resp.status}: ${t.slice(0, 400)}`);
  }

  const data: any = await resp.json();
  const toolUse = (data.content || []).find((c: any) => c.type === "tool_use");
  if (!toolUse?.input) throw new Error("Claude no devolvió tool_use");
  const input = toolUse.input as Partial<AnalyzeResult>;

  return {
    analysis: String(input.analysis || "").trim(),
    alerts: Array.isArray(input.alerts) ? input.alerts.map(String) : [],
    draftResponse: String(input.draftResponse || "").trim(),
  };
}

/** Persists the AI result on the checkin row. */
export async function runAndPersistAnalysis(checkinId: string): Promise<AnalyzeResult | null> {
  const result = await analyzeNutritionCheckin(checkinId);
  if (!result) return null;
  const alertsLine = result.alerts.length
    ? `\n\n**Alertas:** ${result.alerts.map((a) => `\`${a}\``).join(" · ")}`
    : "";
  await prisma.checkin.update({
    where: { id: checkinId },
    data: ({
      aiAnalysis: result.analysis + alertsLine,
      aiDraftResponse: result.draftResponse,
      aiAnalyzedAt: new Date(),
    } as any),
  });
  return result;
}