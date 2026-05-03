
## Plan: Pantalla de cuenta desactivada + email de despedida

### Resumen
Cuando un cliente tenga estado `PAUSED`, verá una pantalla de bloqueo en su panel con instrucciones para reactivar vía WhatsApp. Además, al desactivar desde el admin, se enviará automáticamente un email de despedida.

### Verificación previa
El botón "Desactivar cliente" en la vista de detalle del admin llama a `PATCH /clients/:id/status` con `{ status: "PAUSED" }` -- esto ya funciona correctamente y es coherente con el flujo.

---

### 1. Pantalla de bloqueo del cliente (Frontend)

**Crear `src/components/client/ClientDeactivatedScreen.tsx`**
- Pantalla completa con icono de candado, mensaje "Tu cuenta está desactivada"
- Instrucciones: contactar por WhatsApp al +34 676188961 para pagar y reactivar
- Botón directo de WhatsApp (`wa.me/34676188961` con mensaje predefinido)
- Botón de cerrar sesión
- Respeta el tema claro/oscuro del cliente

**Modificar `src/contexts/ClientContext.tsx`**
- Exponer `clientStatus` en el contexto (ya se recibe `status` del endpoint `/api/clients/me`)

**Modificar `src/components/client/ClientLayout.tsx`**
- Si el `clientStatus` no es `ACTIVE`: renderizar `ClientDeactivatedScreen` en lugar del contenido (header, tabs, children)
- Mantener la inicialización del tema para que la pantalla de bloqueo se vea con el tema configurado del cliente

**Traducciones (`src/i18n/es.ts`, `src/i18n/en.ts`)**
- Claves: `deactivated.title`, `deactivated.message`, `deactivated.whatsappButton`, `deactivated.logoutButton`

---

### 2. Email de despedida al desactivar (Backend)

**Modificar `backend/src/utils/emailBuilder.ts`**
- Añadir template `ACCOUNT_DEACTIVATED` en los defaults:
  - Subject: "Tu cuenta ha sido desactivada – JIP Coaching"
  - Heading: "Gracias por confiar en nosotros, {{nombre}}"
  - BodyText: mensaje de agradecimiento + instrucciones para volver contactando por WhatsApp
  - Sin CTA

**Modificar `backend/src/routes/clients.ts`**
- En `PATCH /:id/status` (línea 472): antes del update, leer el estado actual del cliente
- Si cambia de `ACTIVE` a `PAUSED`: enviar email de despedida asíncrono usando `buildEmail('ACCOUNT_DEACTIVATED', ...)` + nodemailer (ya configurado en ese archivo)
- Obtener el email del cliente a través de su User asociado

---

### Archivos
- **Crear**: `src/components/client/ClientDeactivatedScreen.tsx`
- **Modificar**: `src/contexts/ClientContext.tsx`
- **Modificar**: `src/components/client/ClientLayout.tsx`
- **Modificar**: `src/i18n/es.ts`, `src/i18n/en.ts`
- **Modificar**: `backend/src/utils/emailBuilder.ts`
- **Modificar**: `backend/src/routes/clients.ts`
