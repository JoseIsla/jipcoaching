# Carga de la semana anterior + peso flexible en accesorios

## Objetivo
1. En los check-ins de entrenamiento, el atleta puede registrar el peso de los accesorios (y de toda la plani: básicos, accesorios, carrera, técnica, pruebas) de dos formas a su elección:
   - **Un peso global** del ejercicio en la semana (rápido).
   - **Un peso por serie** (granular, igual que un Top Set + back-offs).
2. Al actualizar una semana del plan, tanto el editor del admin como la vista del atleta muestran junto al ejercicio un **badge "Sem. anterior: 80×5"** con el último peso/reps que el atleta registró para ese ejercicio.

## Cambios backend

**Schema (`backend/prisma/schema.prisma`)**
- `CheckinTrainingExercise`: añadir `weightMode String? @db.VarChar(20) @default("single")` (`"single"` | `"per_set"`) y `perSetWeights String? @db.VarChar(200)` (CSV, p.ej. `"80,75,72"`). `actualWeight` se conserva para modo `single`.
- Migración nueva en `backend/prisma/migrations/20260610_checkin_accessory_per_set/`.

**Endpoint nuevo `GET /api/training/plans/:planId/previous-loads`** en `backend/src/routes/training.ts`
- Devuelve, por cada `exerciseName` único del plan, el último registro (`actualWeight`, `perSetWeights`, `actualReps`, `weightMode`, `createdAt`) tomado del `CheckinTrainingExercise` más reciente del cliente.
- Implementación: query a `prisma.checkinTrainingExercise.findMany` filtrando por `log.checkin.clientId = plan.clientId`, agrupando en memoria por `exerciseName` y quedándose con el más reciente.

**`POST /checkins/submit`** (`backend/src/routes/checkins.ts`)
- Aceptar y persistir `weightMode` y `perSetWeights` en `CheckinTrainingExercise` (junto a los campos existentes).

## Cambios frontend

**Store / tipos**
- `src/data/useQuestionnaireStore.ts`: añadir `weightMode?: "single" | "per_set"` y `perSetWeights?: string` al tipo de ejercicio en check-in de entrenamiento.
- `src/data/useTrainingPlanStore.ts`: nuevo método `fetchPreviousLoads(planId)` que cachea el resultado por `planId` en estado (`previousLoadsByPlan: Record<string, Record<string, PreviousLoad>>`).

**Check-in del cliente (`src/pages/client/ClientCheckins.tsx`)**
- Para cada ejercicio (cualquier sección) añadir un pequeño toggle "Peso global / Por serie" (icono + texto, claro para no técnicos):
  - Modo **global**: el `DecimalInput` actual de `actualWeight`.
  - Modo **por serie**: aparece una fila de inputs pequeños, uno por serie (según `plannedSets` o `actualSets`), que se serializa a `perSetWeights` CSV.
- Mostrar al lado del nombre un badge `Sem. anterior: 80×5` (en color `muted`) usando `previousLoads[exerciseName]`.

**Editor de planes admin (`src/pages/AdminTrainingPlanDetail.tsx`)**
- Al cargar el plan, llamar `fetchPreviousLoads(planId)`.
- En cada fila/tarjeta de ejercicio, mostrar el mismo badge `Sem. anterior: 80×5` junto al nombre. Si no hay registro previo, no se muestra nada.

**Vista del atleta de la plani (`src/pages/client/ClientTraining.tsx`)**
- Cargar `previousLoads` del plan activo y renderizar el mismo badge al lado del nombre del ejercicio.

**Componente nuevo** `src/components/training/PreviousLoadBadge.tsx`
- Render reutilizable: chip pequeño `bg-muted/40 text-[10px]` con icono `History`, texto `Anterior: {kg}kg × {reps}` o, en modo `per_set`, `Anterior: 80/75/72`.
- Tooltip con la fecha del registro.

## Detalles técnicos

- El modo `weightMode` se guarda **por ejercicio del check-in**, no en la prescripción del plan: cada semana el atleta decide cómo registrarlo.
- `perSetWeights` se valida en cliente con la misma regex de `DecimalInput` (acepta coma o punto, separador entre series es `,`). Backend lo guarda como string opaco para conservar exactamente lo introducido.
- El nuevo endpoint se llama solo desde admin/editor y desde vista cliente del plan; no se polea — refresca cuando se monta la página o tras submit de un check-in (invalidar caché `previousLoadsByPlan[planId]`).
- Adherence/PDF exports no cambian: siguen usando `actualWeight`. Para modo `per_set` se computa `actualWeight = max(perSetWeights)` al guardar, para no romper métricas existentes.
- UI: el toggle se etiqueta "¿Cómo registras el peso?" con dos chips: "Mismo peso" / "Por serie" — sin jerga técnica.

## Pasos manuales tras desplegar
1. `npx prisma migrate deploy && npx prisma generate` en Plesk.
2. `pm2 restart jip-backend`.
