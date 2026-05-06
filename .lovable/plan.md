
# Oposiciones: Bomberos, PN, PL, Militar — Sistema de entrenamiento

Todo es **aditivo**. Los planes, ejercicios y flujos de Powerlifting/Powerbuilding no se tocan.

---

## Pruebas físicas oficiales incluidas

### Policía Nacional (baremos verificados)
- Circuito de agilidad (H: 0pts ≥11.7s → 10pts ≤8.2s | M: 0pts ≥12.8s → 10pts ≤9.3s)
- Dominadas H (0pts ≤4 reps → 10pts ≥17) / Suspensión M (0pts ≤35s → 10pts ≥95s)
- Carrera 1000m (H: 0pts ≥3:49 → 10pts ≤2:54 | M: 0pts ≥4:46 → 10pts ≤3:24)

### Bomberos
- Velocidad 60-200m, resistencia 1000-3000m, natación 50-100m, trepa cuerda, press banca, salto V/H, course navette, subida torre, lanzamiento balón medicinal

### Policía Local
- Circuito agilidad, velocidad 50-60m, resistencia 1000-2000m, dominadas/flexiones, salto H/V, natación

### Militar (Tropa y Marinería)
- Sprint 50m, resistencia 1000-2000m, flexiones, abdominales, dominadas, natación

---

## Cambios a implementar

### 1. Tipos y constantes frontend

**`src/data/trainingPlanStore.ts`** — Ampliar tipos (sin eliminar los existentes):
- `TrainingModality`: añadir `"Opos_Bomberos" | "Opos_PN" | "Opos_PL" | "Opos_Militar"`
- `TrainingBlock`: añadir `"Base General" | "Fuerza Específica" | "Resistencia" | "Velocidad/Agilidad" | "Pruebas Específicas" | "Simulacro"`
- Nuevo mapa `MODALITY_LABELS` con nombres legibles
- Nuevo mapa `BLOCKS_BY_MODALITY` para filtrar bloques según modalidad
- Añadir campos opcionales a `TrainingExerciseEntry`: `targetTime?`, `targetDistance?`, `targetMark?`

**`src/data/useTrainingPlanStore.ts`** — Mismos tipos ampliados.

### 2. Migración de base de datos

Nueva migración SQL para añadir 5 columnas opcionales:
- `exercise_prescriptions`: `target_time VARCHAR(30)`, `target_distance VARCHAR(30)`, `target_mark VARCHAR(30)`
- `exercise_logs`: `actual_time VARCHAR(30)`, `actual_mark VARCHAR(30)`

**`backend/prisma/schema.prisma`**: Añadir los 5 campos a los modelos correspondientes.

### 3. Seed — Solo ejercicios de oposiciones (sin tocar lo existente)

**`backend/prisma/seed.ts`**: Añadir una función `seedOppositionExercises()` que use `upsert` por nombre para no duplicar. Categorías:
- **BASIC**: Carrera 1000m, 2000m, 3000m, Sprint 50m, 60m, 100m, 200m, Circuito agilidad PN, Circuito INEF, Trepa cuerda, Press banca (marcas), Salto vertical, Salto horizontal, Natación 50m, 100m, Suspensión en barra, Course Navette, Lanzamiento balón medicinal, Subida de torre
- **ACCESSORY**: Dominadas (opos), Flexiones (opos), Abdominales (opos), Buceo 25m

NO se ejecuta `deleteMany` sobre ejercicios. Se usa `upsert` para ser idempotente.
Los suplementos, frutas, verduras y cuentas de test se mantienen exactamente como están.

### 4. Creación de planes (Admin)

**`src/components/admin/CreateTrainingPlanSheet.tsx`**:
- Selector de modalidad muestra las 6 opciones (PL, PB + 4 opos) con nombres legibles
- Al elegir una modalidad de opos, los bloques disponibles se filtran automáticamente a los de oposiciones
- Campo opcional "Convocatoria" (texto libre) visible solo en modalidades de opos

### 5. Editor de ejercicios del plan

**`src/pages/AdminTrainingPlanDetail.tsx`**:
- Si la modalidad es de oposiciones y el ejercicio es BASIC: mostrar inputs de "Tiempo objetivo", "Distancia", "Marca" además de los campos habituales
- PL/PB: sin cambios

### 6. Vista del cliente

**`src/pages/client/ClientTraining.tsx`** (`DayView`):
- Si un ejercicio tiene `targetTime`/`targetDistance`/`targetMark`: renderizar esos campos con iconos (cronómetro, regla)
- Los campos tradicionales (series/reps/RPE) siguen funcionando igual
- Badge de modalidad con nombre legible

### 7. Colores de bloque para oposiciones

**`src/pages/AdminTraining.tsx`**: Añadir colores para los 6 nuevos bloques sin modificar los existentes.

### 8. Backend — Rutas de training

**`backend/src/routes/training.ts`**: Parsear `targetTime`, `targetDistance`, `targetMark` en create/update de prescripciones. Parsear `actualTime`, `actualMark` en logs.

### 9. Check-ins de entrenamiento

El sistema de `ExerciseLog` ya está vinculado a `ExercisePrescription`. Con los campos `actualTime`/`actualMark` añadidos, la UI de check-in mostrará inputs de tiempo/marca para ejercicios cronometrados.

### 10. PDF de exportación

**`src/utils/exportClientPlanPDF.ts`**: Si el plan es de oposiciones, añadir columnas de Tiempo/Distancia/Marca.

### 11. Traducciones

**`src/i18n/es.ts`** y **`src/i18n/en.ts`**: Labels para modalidades, bloques, campos nuevos.

### 12. Tipos API

**`src/types/api.ts`**: Añadir `targetTime?`, `targetDistance?`, `targetMark?` a `ApiExercisePrescription`.

---

## Archivos afectados

| Archivo | Acción |
|---|---|
| `backend/prisma/schema.prisma` | Añadir 5 campos opcionales |
| Nueva migración SQL | ALTER TABLE (5 columnas) |
| `backend/prisma/seed.ts` | Añadir `seedOppositionExercises()` con upsert |
| `backend/src/routes/training.ts` | Parsear campos nuevos |
| `src/data/trainingPlanStore.ts` | Ampliar tipos + constantes |
| `src/data/useTrainingPlanStore.ts` | Ampliar tipos |
| `src/types/api.ts` | Campos nuevos |
| `src/components/admin/CreateTrainingPlanSheet.tsx` | Bloques dinámicos |
| `src/pages/AdminTraining.tsx` | Colores de bloque |
| `src/pages/AdminTrainingPlanDetail.tsx` | Campos tiempo/marca |
| `src/pages/client/ClientTraining.tsx` | Render condicional |
| `src/utils/exportClientPlanPDF.ts` | Columnas adaptadas |
| `src/i18n/es.ts`, `src/i18n/en.ts` | Traducciones |

**Nada existente se elimina ni se sobrescribe.**
