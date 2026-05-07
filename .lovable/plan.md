
# Completar funcionalidad de Oposiciones

4 bloques de trabajo para completar el sistema de oposiciones.

---

## 1. Check-ins de entrenamiento adaptados para opositores

Cuando el plan activo del cliente es de tipo oposiciones, el check-in de entrenamiento incluirá una sección adicional para registrar marcas de pruebas físicas.

- **`src/pages/client/ClientCheckins.tsx`** (o componente de submit de check-in): Detectar si el plan activo es de oposiciones. Si lo es, mostrar campos extra por cada prueba física (ej: "Circuito de agilidad: ___ seg", "Dominadas: ___ reps").
- **`backend/src/routes/checkins.ts`**: En el endpoint `POST /:id/submit`, si se reciben `physicalMarks` en el body, crear automáticamente registros en `ClientPhysicalMark` vinculados al cliente.
- El cliente podrá ver su puntuación inmediata tras registrar marcas en el check-in.

---

## 2. Vista admin de marcas físicas en detalle de cliente

Nueva sección en `AdminClientDetail.tsx` que se muestra solo si el cliente tiene un plan de oposiciones activo.

- Mostrar tabla con las últimas marcas por prueba, puntuación según baremo, y tendencia (mejora/empeora).
- Reutilizar `PhysicalTestTracker` con `isAdmin={true}` pasando el `clientId`.
- El admin podrá registrar marcas manualmente y eliminarlas.
- Se muestra junto a la sección de "Contexto Inicial" o como card nueva entre la info del cliente.

---

## 3. Panel admin de gestión de baremos

Nueva página `AdminBaremos.tsx` accesible desde el sidebar (bajo Entrenamiento o como sección propia).

- Listado de baremos agrupados por tipo de oposición y prueba.
- CRUD: ver escalas existentes, editar rangos/puntuaciones, añadir nuevas escalas.
- Endpoints backend: `PUT /training/physical-scales/:id`, `POST /training/physical-scales`, `DELETE /training/physical-scales/:id`.
- Filtros por oposición y género.

---

## 4. PDF de marcas/baremo del opositor

Nueva utilidad `exportPhysicalMarksPDF` que genera un PDF con:

- Nombre del cliente, tipo de oposición, fecha.
- Tabla con cada prueba: última marca, puntuación según baremo, historial reciente.
- Puntuación total.
- Botón de descarga en `PhysicalTestTracker` y en la vista admin del cliente.

---

## Archivos principales a crear/modificar

| Archivo | Acción |
|---------|--------|
| `src/pages/AdminBaremos.tsx` | Crear — página de gestión de baremos |
| `src/App.tsx` | Modificar — añadir ruta `/admin/baremos` |
| `src/components/admin/AdminSidebar.tsx` | Modificar — enlace al panel de baremos |
| `src/pages/AdminClientDetail.tsx` | Modificar — sección de marcas para opositores |
| `src/pages/client/ClientCheckins.tsx` | Modificar — campos de marcas físicas en check-in training |
| `backend/src/routes/checkins.ts` | Modificar — guardar marcas físicas al submit |
| `backend/src/routes/training.ts` | Modificar — endpoints CRUD para baremos |
| `src/utils/exportPhysicalMarksPDF.ts` | Crear — generador PDF |
| `src/components/client/PhysicalTestTracker.tsx` | Modificar — botón PDF |
| `src/i18n/es.ts` + `en.ts` | Modificar — traducciones |

## Lo que NO se toca

- Lógica de powerlifting/powerbuilding
- Nutrición, billing, landing
- Check-ins de nutrición
