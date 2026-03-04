

## Añadir animaciones a la pantalla de progreso

Usar Framer Motion (ya disponible en el proyecto y usado en `AnimatedPage`, `PullToRefresh`, etc.) para añadir animaciones staggered de entrada a todos los elementos de la página de progreso.

### Cambios por archivo

**1. `src/pages/client/ClientProgress.tsx`**
- Envolver el contenido en `motion.div` con animación staggered container
- Animar el header, AdherenceCard y Tabs como children con fade-in + slide-up escalonado

**2. `src/components/client/progress/AdherenceCard.tsx`**
- Envolver la tarjeta en `motion.div` con `initial={{ opacity: 0, y: 12 }}` y `animate={{ opacity: 1, y: 0 }}`

**3. `src/components/client/progress/NutritionProgressTab.tsx`**
- Usar un `motion.div` container con `staggerChildren` para las stat cards (3 tarjetas de peso)
- Animar cada stat card y cada chart card con fade-in + scale-in escalonado
- Cada tarjeta entra con un delay incremental (0.05s entre elementos)

**4. `src/components/client/progress/TrainingProgressTab.tsx`**
- Mismo patrón staggered para el total SBD, los récords personales y el reporte de estado
- Cada tarjeta de RM entra escalonada con slide-up

### Patrón de animación consistente

```typescript
// Container
const stagger = { animate: { transition: { staggerChildren: 0.06 } } };
// Children
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};
```

Se elimina el `animate-fade-in` CSS existente del container en `ClientProgress.tsx` ya que Framer Motion se encarga de todo.

