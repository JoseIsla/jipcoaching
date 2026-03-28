

## Plan: Modo Claro/Oscuro persistente en base de datos

### Resumen
Añadir un campo `theme` a `AdminProfile` y `Client` en la base de datos para que la preferencia de tema (dark/light/system) se persista entre sesiones y dispositivos. Selector de apariencia en Configuracion de admin y cliente.

### Cambios

**1. Schema Prisma + Migración**
- Añadir campo `theme String @default("dark") @db.VarChar(10)` a `AdminProfile` y `Client`
- Crear migración SQL

**2. Backend API**
- En `GET /api/profile/admin` y `PATCH /api/profile/admin`: incluir `theme` en lectura/escritura
- En `GET /api/profile/client` y `PATCH /api/profile/client`: incluir `theme` en lectura/escritura

**3. Store de tema (`src/stores/useThemeStore.ts`)**
- Zustand store con estado `theme: "dark" | "light" | "system"`
- Método `setTheme(theme)` que:
  - Aplica/quita clase `light` en `<html>`
  - Escucha `prefers-color-scheme` para modo system
- Método `initTheme(themeFromApi)` para cargar desde perfil
- NO usa localStorage como fuente de verdad; el backend es la fuente

**4. Variables CSS modo claro (`src/index.css`)**
- Bloque `.light` dentro de `@layer base` con:
  - Fondo blanco/gris claro, texto oscuro
  - Cards blancas con bordes sutiles
  - Primary verde adaptado para legibilidad sobre fondo claro (hsl(110 80% 35%))
  - Sidebar, muted, accent, destructive adaptados

**5. UI en AdminSettings**
- Nueva card "Apariencia" con icono Sun/Moon
- Selector con 3 opciones: Oscuro, Claro, Sistema
- Al cambiar, llama a PATCH del perfil + actualiza store

**6. UI en ClientSettings**
- Misma card "Apariencia" con selector idéntico
- Al cambiar, llama a PATCH del perfil de cliente + actualiza store

**7. Inicialización al login**
- En `AdminLayout`: al cargar perfil, llamar `initTheme(profile.theme)`
- En `ClientLayout`: al cargar perfil del cliente, llamar `initTheme(profile.theme)`

**8. Traducciones i18n**
- `es.ts` y `en.ts`: claves `settings.appearance`, `settings.lightMode`, `settings.darkMode`, `settings.systemMode`

### Archivos
- **Crear**: `src/stores/useThemeStore.ts`
- **Crear**: migración Prisma (add theme field)
- **Modificar**: `backend/prisma/schema.prisma`
- **Modificar**: `backend/src/routes/profile.ts`
- **Modificar**: `src/index.css`
- **Modificar**: `src/pages/AdminSettings.tsx`
- **Modificar**: `src/pages/client/ClientSettings.tsx`
- **Modificar**: `src/components/admin/AdminLayout.tsx`
- **Modificar**: `src/components/client/ClientLayout.tsx`
- **Modificar**: `src/i18n/es.ts`, `src/i18n/en.ts`
- **Modificar**: `src/contexts/AdminProfileContext.tsx`, `src/contexts/ClientProfileContext.tsx` (incluir theme en tipos)

