# Registro de carga en sesión + prefill en check-in

## Objetivo
Que cada atleta pueda apuntar la carga (modo único o por serie) directamente en cada ejercicio de su plan diario, para no depender del check-in del sábado. Cuando se genere/abra el check-in semanal, los pesos ya estarán prerellenados a partir de lo que registró en la sesión, y el atleta podrá editarlos.

## Alcance confirmado
- **Ejercicios**: todos (básicos, variantes, accesorios, carrera, técnica, prueba oficial).
- **Modos**: peso único o por serie (mismo toggle que en el check-in).
- **Persistencia**: por día concreto (un registro por prescripción/ejercicio del plan).
- **Check-in**: el prefill es editable; cualquier cambio en el check-in se guarda en el check-in (no sobreescribe la sesión).

## Flujo del atleta
1. En `Mi entrenamiento` (ClientTraining), cada ejercicio muestra un mini-formulario inline (colapsado por defecto):
   - Toggle `Mismo / Por serie`.
   - Input(s) de peso (kg) + opcionales reps reales / RPE / nota.
   - Para carrera/oposición se muestran los campos relevantes (distancia, tiempo, marca, etc.).
2. Al guardar (auto-save al perder foco, con toast discreto), se hace `PUT /api/training/prescriptions/:id/log`.
3. La fila muestra un pequeño badge "Registrado: 80kg" debajo del PreviousLoadBadge para diferenciar lo que llevas hecho esta semana de lo que hiciste la semana pasada.

## Flujo del check-in
- Cuando el cron crea el check-in del sábado, después de crear las `CheckinTrainingExercise`, se buscan los `ExerciseLog` existentes de las prescripciones de esa semana activa y se vuelcan los valores (`actualWeight`, `weightMode`, `perSetWeights`, `actualReps`, métricas opo, etc.).
- Si el atleta ya creó su check-in y luego añade datos en la sesión: al hacer `GET /api/checkins`, los rows con campos vacíos se hidratan al vuelo desde el log más reciente del prescriptionId (lookup por `exerciseId`).
- El atleta puede editar los campos prerellenados en la UI del check-in; al enviar (`POST /checkins/:id/submit`) se persisten los valores del check-in tal cual (no se reescribe el log de sesión).

## Cambios técnicos

### Backend
- **Migración Prisma** `20260610_exercise_log_weight_mode/migration.sql`:
  ```sql
  ALTER TABLE `exercise_logs`
    ADD COLUMN `weightMode` VARCHAR(20) NULL,
    ADD COLUMN `perSetWeights` VARCHAR(200) NULL,
    ADD COLUMN `loggedAt` DATETIME NULL;
  ```
- **schema.prisma**: añadir `weightMode`, `perSetWeights` y `loggedAt` (== fecha de la sesión) al modelo `ExerciseLog`. Mantener compatibilidad con campos existentes (`topKg`, `topReps`, etc.).
- **`backend/src/routes/training.ts`**:
  - `GET /api/training/plans/:planId/session-logs` → devuelve `{ prescriptionId: ExerciseLog }` para la semana activa del cliente (uso en ClientTraining).
  - `PUT /api/training/prescriptions/:prescriptionId/log` → upsert. Valida que la prescripción pertenece al cliente autenticado (o admin). Acepta payload unificado (kg, mode, perSetWeights, reps, rpe, nota, métricas opo).
  - Las plans GET siguen igual.
- **`backend/src/cron/checkinScheduler.ts`** (`generateTrainingCheckins`): tras `createMany` de exercises, recorrer las prescripciones de la semana activa, buscar `ExerciseLog` y hacer `updateMany` por `exerciseId` (o un `update` por fila) volcando los valores.
- **`backend/src/routes/checkins.ts`** (GET): al construir el `trainingLog`, si una fila tiene `actualWeight==null && perSetWeights==null` y existe `exerciseId`, buscar el último `ExerciseLog` de esa prescripción y exponerlo como valores prerellenados (sin persistir todavía). Marcar `prefilled: true` para que el front lo muestre suavemente.

### Frontend
- **`src/data/useTrainingPlanStore.ts`**:
  - Nuevo tipo `SessionLog` con los campos comunes.
  - `sessionLogsByPlan: Record<planId, Record<prescriptionId, SessionLog>>`.
  - `fetchSessionLogs(planId)` y `upsertSessionLog(planId, prescriptionId, payload)` (optimista).
- **`src/pages/client/ClientTraining.tsx`** (`DayView`):
  - Nuevo subcomponente `InSessionLogForm` por ejercicio: toggle modo, inputs, autosave on blur.
  - Botón discreto "Registrar carga" que despliega el formulario.
  - Muestra "Registrado hoy: X" cuando hay datos.
- **`src/pages/client/ClientCheckins.tsx`**: aceptar campos prerellenados que vienen del backend; mostrar un pequeño chip "Auto" junto a los inputs prerellenados para que el atleta sepa de dónde viene; el resto del comportamiento de edición se mantiene.
- **`src/pages/AdminTrainingPlanDetail.tsx`**: el badge "Anterior" ya existe; se añade un segundo badge "Sesión actual: X" si hay log de la semana activa para que el admin lo vea al actualizar la plani.

## Aspectos a no romper
- El `PreviousLoadBadge` y el flujo existente del check-in semanal (con `weightMode`/`perSetWeights`) siguen funcionando igual.
- Los logs de sesión y los del check-in conviven (el check-in es la fuente "oficial" tras el envío; la sesión es ayuda continua).
- Validación de seguridad: la prescripción solo puede ser registrada por el cliente dueño del plan o por un admin.

## Acción manual tras desplegar
1. `npx prisma migrate deploy && npx prisma generate`
2. `pm2 restart jip-backend`
