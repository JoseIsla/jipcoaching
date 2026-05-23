## Objetivo

Integrar **Claude (Anthropic)** en el flujo de check-ins nutricionales para:
- **A) Auto-análisis** del check-in enviado (resumen para el admin con tendencias: peso, adherencia, energía, hambre, sueño, alertas).
- **B) Borrador de respuesta** personalizada al cliente, que tú revisas y editas antes de enviar.
- Disparo **doble**: automático al enviar el check-in + botón "Regenerar con IA" en el panel admin.

## Pre-requisito: API Key de Anthropic

El backend (Express en Plesk) necesita la variable de entorno `ANTHROPIC_API_KEY`. Después de aprobar el plan, te pediré que la añadas al `.env` del backend en Plesk y reinicies PM2. La obtienes en: https://console.anthropic.com/settings/keys

Modelo recomendado por coste/calidad: **claude-haiku-4-5** (rápido y barato, perfecto para resúmenes).

## Cambios en backend

### 1. Schema Prisma (nueva migración)
Añadir a `Checkin`:
- `aiAnalysis String? @db.Text` — análisis para el admin (markdown).
- `aiDraftResponse String? @db.Text` — borrador editable del feedback al cliente.
- `aiAnalyzedAt DateTime?`
- `adminFeedback String? @db.Text` — feedback final aprobado por admin.
- `feedbackSentAt DateTime?`

### 2. Nuevo módulo `backend/src/utils/claudeClient.ts`
- Wrapper `fetch` directo a `https://api.anthropic.com/v1/messages` (sin SDK extra).
- Función `analyzeNutritionCheckin(checkin, historicalContext)`:
  - Recibe respuestas del check-in actual + últimos 4 check-ins del cliente para detectar tendencias.
  - Devuelve `{ analysis, draftResponse }` usando tool-calling para JSON estructurado.

### 3. Endpoint `POST /api/checkins/:id/analyze`
- Solo admin. Carga check-in con respuestas + histórico.
- Llama a Claude, persiste `aiAnalysis`, `aiDraftResponse`, `aiAnalyzedAt`.
- Devuelve el resultado.

### 4. Endpoint `PUT /api/checkins/:id/feedback`
- Admin guarda `adminFeedback` (editable) sin enviar todavía.

### 5. Endpoint `POST /api/checkins/:id/feedback/send`
- Marca `feedbackSentAt`, crea `Notification` para el cliente con link al check-in.

### 6. Auto-disparo en submit
En `POST /api/checkins/:id/submit` (categoría `NUTRITION`), al final, lanzar análisis **no bloqueante** (fire-and-forget con try/catch) si hay `ANTHROPIC_API_KEY`.

## Cambios en frontend

### 7. `AdminCheckins.tsx` (detalle de check-in nutricional)
- Card nueva "Análisis IA" con:
  - Markdown del `aiAnalysis` (usar `react-markdown` ya o renderer simple).
  - Botón **"Regenerar"** → llama `/analyze`.
  - Estado vacío con botón **"Analizar con IA"**.
- Card "Feedback al cliente":
  - Textarea pre-rellenada con `adminFeedback || aiDraftResponse`.
  - Botón **"Guardar borrador"** + **"Enviar al cliente"**.
  - Badge "Enviado el {fecha}" si ya enviado.

### 8. `ClientCheckins.tsx`
- Si `adminFeedback && feedbackSentAt`, mostrar card "Feedback de tu coach" en el check-in correspondiente.

### 9. Notificación
- Al enviar, el cliente recibe push: "💬 Tu coach ha revisado tu check-in".

## Detalles técnicos del prompt a Claude

Sistema:
> Eres asistente de José Isla, coach nutricional. Analiza el check-in del cliente y devuelve (1) análisis técnico breve para el coach con tendencias y alertas, (2) borrador de respuesta empática y motivadora en 1ª persona del coach para el cliente, en español, tono cercano pero profesional.

Tool-call con schema:
```json
{
  "analysis": "string (markdown, 4-8 líneas)",
  "alerts": ["string"],
  "draftResponse": "string (2-4 párrafos)"
}
```

Contexto enviado: respuestas actuales + últimos 4 pesos + adherencia media + cambios significativos.

## Fuera de alcance (acordado)

- **C) Análisis check-ins entrenamiento** — postpuesto hasta tener plantillas diferenciadas.
- **D/E) Resúmenes semanales y detección de patrones globales** — no en esta iteración.

## Resumen de archivos a tocar

```
backend/prisma/migrations/<timestamp>_checkin_ai_fields/migration.sql   (nuevo)
backend/prisma/schema.prisma                                            (editar Checkin)
backend/src/utils/claudeClient.ts                                       (nuevo)
backend/src/routes/checkins.ts                                          (3 endpoints + auto-trigger)
src/services/api.ts                                                     (3 helpers)
src/pages/AdminCheckins.tsx                                             (UI análisis + feedback)
src/pages/client/ClientCheckins.tsx                                     (card feedback recibido)
```

## Próximo paso tras aprobar

Te pediré la `ANTHROPIC_API_KEY` para añadirla al `.env` de tu backend en Plesk, e implementaré todo lo anterior.
