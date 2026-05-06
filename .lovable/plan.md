
# Soporte para Opositores: Pruebas Físicas

## Resumen

Extender la app para soportar un nuevo tipo de atleta: **opositores** (Policía Nacional, Policía Local, Bomberos, Tropa y Marinería). Se añaden modalidades de entrenamiento, baremos oficiales de puntuación, y adaptaciones en check-ins y panel de cliente. Todo lo existente (Powerlifting/Powerbuilding) permanece intacto.

## Cambios principales

### 1. Nuevas modalidades de entrenamiento

Ampliar `TrainingModality` para incluir:
- `Oposiciones - Policía Nacional`
- `Oposiciones - Policía Local`
- `Oposiciones - Bomberos`
- `Oposiciones - Tropa y Marinería`

Los bloques para opositores serán diferentes a los de PL/PB:
- `Fuerza Base`, `Resistencia`, `Velocidad/Agilidad`, `Específico Pruebas`, `Simulacro`

### 2. Baremos de pruebas físicas (nueva tabla + seed)

Crear tabla `PhysicalTestScale` para almacenar los baremos oficiales:

```
PhysicalTestScale:
  id, oppositionType, testName, gender, minValue, maxValue, unit, score, createdAt
```

**Policía Nacional** (baremos exactos de la web):
- Circuito de agilidad (segundos, H/M)
- Dominadas hombres (repeticiones)  
- Suspensión mujeres (segundos)
- Carrera 1000m (segundos, H/M)

**Bomberos** (baremos de referencia):
- Carrera 60m / 100m, Carrera 1000m / 2000m
- Natación 50m, Salto vertical
- Press de banca, Dominadas
- Circuito de agilidad

**Policía Local** (baremos de referencia similares a Policía Nacional)

**Tropa y Marinería**:
- Salto vertical, Flexiones de brazos, Course Navette

### 3. Evaluador de marcas en panel de cliente

Nueva sección en la vista de entrenamiento del cliente opositor que muestre:
- Sus últimas marcas por prueba
- Puntuación según baremo oficial
- Progreso visual

### 4. Check-ins de entrenamiento adaptados

Cuando el plan es de tipo oposiciones, los check-ins de entrenamiento incluirán preguntas específicas:
- Tiempos en pruebas de velocidad/resistencia
- Repeticiones en dominadas/flexiones
- Marcas en natación, salto, etc.

### 5. Intake de entrenamiento ampliado

Añadir campos opcionales al `TrainingIntake`:
- `oppositionType` (tipo de oposición)
- `examDate` (fecha prevista del examen)
- `currentMarks` (JSON con marcas actuales por prueba)

### 6. Seed de baremos

Nuevo script de seed que SOLO añade los datos de baremos sin tocar nada existente.

---

## Detalles técnicos

### Prisma Schema — nuevos tipos y tablas

```prisma
enum OppositionType {
  POLICIA_NACIONAL
  POLICIA_LOCAL
  BOMBEROS
  TROPA_MARINERIA
}

model PhysicalTestScale {
  id              String         @id @default(uuid())
  oppositionType  OppositionType
  testName        String         @db.VarChar(100)
  gender          String         @db.VarChar(10) // MALE, FEMALE
  minValue        Float
  maxValue        Float
  unit            String         @db.VarChar(20) // "seconds", "reps", "cm", "kg"
  score           Int            // 0-10
  createdAt       DateTime       @default(now())
  @@map("physical_test_scales")
}

model ClientPhysicalMark {
  id              String         @id @default(uuid())
  clientId        String
  testName        String         @db.VarChar(100)
  value           Float
  recordedAt      DateTime       @default(now())
  notes           String?        @db.Text

  client Client @relation(...)
  @@map("client_physical_marks")
}
```

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `backend/prisma/schema.prisma` | Añadir enum, modelos, campos |
| `backend/prisma/seed.ts` | Función `seedPhysicalTestScales()` al final |
| Migración nueva | ALTER tables + nuevas tablas |
| `src/data/useTrainingPlanStore.ts` | Ampliar tipos TrainingModality |
| `src/components/admin/CreateTrainingPlanSheet.tsx` | Nuevas modalidades y bloques condicionales |
| `src/types/api.ts` | Nuevos tipos para oposiciones |
| `src/data/oppositionScales.ts` | Datos de baremos para el frontend |
| `src/components/client/PhysicalTestTracker.tsx` | Nuevo componente de seguimiento |
| `src/pages/client/ClientTraining.tsx` | Integrar tracker para opositores |
| `backend/src/routes/training.ts` | Endpoints para marcas físicas |
| `src/i18n/es.ts` + `en.ts` | Traducciones |

### Archivos que NO se tocan
- Lógica de powerlifting/powerbuilding existente
- Planes de nutrición
- Sistema de check-ins de nutrición
- Sistema de billing
- Landing page

## Flujo de uso

1. Admin crea cliente con pack TRAINING o FULL
2. Admin crea plan de entrenamiento → selecciona modalidad "Oposiciones - Policía Nacional"
3. Los bloques se adaptan automáticamente (Fuerza Base, Resistencia, etc.)
4. El cliente ve su plan + una sección de "Mis Marcas" con puntuación según baremo
5. En los check-ins semanales, puede registrar tiempos/marcas de pruebas específicas
