# Changelog → Anuncios cliente

Cada archivo `.md` de esta carpeta se convierte en **una novedad emergente** en la app
del cliente al ejecutar:

```bash
npm run sync:announcements
```

## Formato del archivo

El nombre del archivo es el `slug` único (identifica el anuncio entre deploys).
Recomendado: `YYYY-MM-DD-titulo-corto.md` — por ejemplo `2026-06-10-cargas-en-sesion.md`.

```md
---
title: Registro de cargas en sesión
audience: TRAINING        # NUTRITION | TRAINING | ALL
version: v1.5             # opcional, se muestra en el modal
active: true              # opcional, por defecto true
publishedAt: 2026-06-10   # opcional (YYYY-MM-DD), por defecto la fecha del primer sync
---
Texto principal de la novedad. Lo que aparece como descripción en el modal.
Puede tener varios párrafos.

- Punto 1 (los `-` y `*` se convierten en bullets con check verde)
- Punto 2
- Punto 3
```

## Comportamiento del sync

- **Upsert por `slug`**: si el archivo es nuevo → crea; si ya existía → actualiza.
- **Idempotente**: ejecutar dos veces no duplica nada.
- **`active: false`** lo oculta sin borrarlo.
- **Borrar el archivo NO borra el anuncio** en la BD (para no eliminar el historial de
  lecturas). Para retirarlo, pon `active: false` y vuelve a sincronizar.
- Si cambias el `slug` (renombras el archivo), se creará uno nuevo y los clientes lo
  verán como si fuese inédito.

## Cuándo ejecutar

Tras cada `git pull` en producción, junto a las migraciones:

```bash
npx prisma migrate deploy
npx prisma generate
npm run sync:announcements
pm2 restart jip-backend
```