# Plan: ejercicios de oposiciones en planes y check-ins

## 1. Catálogo fijo de tipos de prueba (seed)

Amplío el seed con un catálogo cerrado de **pruebas oficiales** por oposición. Marcadas como `isOfficialTest: true` (no editables desde la biblioteca). Cobertura investigada:

- **Resistencia aeróbica**: Course-Navette (PN, GC, PL, Bomberos, Mossos), 1000 m, 2000 m, 6 min Cooper (Ejército/Tropa), 50 m natación.
- **Velocidad**: 50 m lisos, 60 m, agilidad (circuito 9-3-6-3-9 Bomberos, slalom PL).
- **Fuerza tren superior**: dominadas (PN/GC/Ejército/Bomberos), flexiones máximas en X tiempo, press banca (PN femenino y GC: 40 kg).
- **Fuerza tren inferior / potencia**: salto vertical (PL, Mossos), salto horizontal a pies juntos (PN, GC, Ejército).
- **Fuerza-resistencia abdominal**: abdominales en 1 min / 2 min (Ejército, Bomberos).
- **Trepa de cuerda** (Bomberos: 5 m, con/sin presa de piernas).
- **Natación**: 50 m crol (PN, GC, Bomberos, Armada).
- **Pruebas específicas Bomberos**: press banca tendido, dominadas, course-navette, agilidad, natación, trepa cuerda, prueba de altura.

Esto se añade al seed como `GlobalExerciseItem` con campos `category` (`OFFICIAL_TEST` | `RUNNING` | `RUNNING_TECHNIQUE` | `GYM`) y `oppositionTypes[]`. **Idempotente** vía `upsert` por `(name, category)` — no rompe ni duplica nada del seed actual de suplementos/alimentos.

## 2. Categorías nuevas en la biblioteca de ejercicios

Añado a `GlobalExerciseItem` (schema Prisma) un campo:

```
category  ExerciseCategory  @default(GYM)
// enum: GYM, RUNNING, RUNNING_TECHNIQUE, OFFICIAL_TEST
oppositionTypes  Json?  // ["POLICIA_NACIONAL", "BOMBEROS", ...]
```

Migración aditiva (default `GYM`) → los ejercicios actuales quedan como gym, sin romper nada.

En el admin (`AdminExerciseLibrary`) → filtro por categoría y badge visual. El opositor puede crear sus propios ejercicios de carrera/técnica; las pruebas oficiales solo se ven, no se editan.

## 3. Secciones extra en el plan de entrenamiento

En `TrainingExerciseEntry.section` (hoy `"basic" | "accessory"`) amplío a:

```
section: "basic" | "accessory" | "running" | "running_technique" | "official_test"
```

Cuando el plan es de modalidad oposición (`isOppositionModality`), el editor `CreateTrainingPlanSheet` muestra 3 secciones colapsables extra debajo de Accesorios:
- **Carrera** (rodajes, series): campos = distancia, tiempo objetivo, ritmo, RPE, FC.
- **Técnica de carrera**: campos = ejercicio, series×reps, descanso, notas.
- **Prueba oficial**: selector limitado a `OFFICIAL_TEST` filtrado por `oppositionType`; campos = marca objetivo + unidad heredada del baremo.

El cliente las ve en `ClientTraining` con el mismo patrón colapsable. Si la sección está vacía no se renderiza.

## 4. Check-in híbrido

En `ExerciseLog` añado columnas opcionales (todas nullable, no rompen logs existentes):

```
distanceMeters  Float?
durationSeconds Int?
pace            String?     // "4:30/km"
heartRateAvg    Int?
markValue       Float?      // marca obtenida en prueba
markUnit        String?
scoreObtained   Int?        // calculado desde baremo
```

Flujo en `ClientCheckins`:
- **basic / accessory**: campos actuales (series/reps/RPE/carga).
- **running**: distancia + tiempo + ritmo + FC.
- **running_technique**: series/reps + notas.
- **official_test**: marca + unidad → al guardar, backend cruza con `PhysicalTestScale` (oppositionType + testName + gender + valor) y rellena `scoreObtained` automáticamente, además de crear un `ClientPhysicalMark` (reutilizamos lo que ya hay).

Admin ve la revisión con cada bloque renderizado según `section`.

## 5. Migraciones (nuevas, aditivas)

1. `20260508_add_exercise_category` → enum + columnas en `global_exercise_items`.
2. `20260508_add_section_running_official` — solo string, sin enum DB (el campo `section` ya es VARCHAR).
3. `20260508_add_exercise_log_metrics` → columnas nullable en `exercise_logs`.

Ninguna toca tablas de clientes/planes existentes ni borra datos.

## 6. Detalles técnicos

- `isOppositionModality()` ya existe en `useTrainingPlanStore` → reutilizar para condicionar UI.
- Cálculo de puntuación: helper `scoreFromMark(oppositionType, testName, gender, value)` en backend `utils/oppositionScoring.ts`, consultado en `POST /api/checkins/exercise-logs`.
- Seed: bloque nuevo `seedOfficialTests()` con `upsert by (name, category)` — convive con el seed actual sin sobrescribir suplementos ni alimentos.
- i18n: claves nuevas en `es.ts`/`en.ts` para las 3 secciones.
- PDF export (`exportTrainingWeekPDF`): añadir las 3 secciones al render.

## 7. Lo que NO toco

- Schema de clientes, planes activos, nutrición, baremos ya cargados.
- Lógica del notificador, billing, cron de check-ins (siguen igual; el check-in semanal ya incluye todos los `ExerciseLog` del plan).
- Plans no-oposición: la UI extra está oculta por `isOppositionModality()`.

---

¿Confirmas y lo implemento, o quieres ajustar algo (por ejemplo, separar también nado en su propia sección, o que las pruebas oficiales aparezcan como un check-in mensual aparte en vez de dentro del semanal)?
