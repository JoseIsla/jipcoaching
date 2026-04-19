# JIP Coaching — Backend API

## Stack
- **Node.js** + **Express** + **TypeScript**
- **Prisma ORM** → MariaDB
- **JWT** para autenticación
- **Multer** para subida de archivos
- **FFmpeg** (binario del sistema) para transcodificar vídeos a H.264/MP4

## Requisitos del sistema

### FFmpeg (obligatorio para vídeos de técnica)

El backend transcodifica automáticamente cada vídeo subido a **H.264 + AAC en contenedor MP4** para que se reproduzca correctamente en todos los navegadores (sin esto, vídeos grabados con iPhone en HEVC/H.265 se ven en negro en Chrome/Firefox/Android).

Instalar en el VPS (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install -y ffmpeg
ffmpeg -version   # verificar instalación
```

Si `ffmpeg` no está disponible, las subidas seguirán funcionando pero los vídeos no se transcodificarán (se guardarán en su formato original).

## Configuración

1. Copiar `.env.example` → `.env` y rellenar con tus credenciales:
```bash
cp .env.example .env
```

2. Instalar dependencias:
```bash
cd backend
npm install
```

3. Generar Prisma Client:
```bash
npm run prisma:generate
```

4. Aplicar migraciones a la base de datos:
```bash
npm run prisma:migrate
# o para push directo sin migraciones:
npm run prisma:push
```

5. (Opcional) Ejecutar seed con datos iniciales:
```bash
npm run prisma:seed
```

6. Arrancar en desarrollo:
```bash
npm run dev
```

7. Para producción:
```bash
npm run build
npm start
```

## Estructura

```
backend/
├── prisma/
│   ├── schema.prisma    # Esquema completo de la BD
│   └── seed.ts          # Datos iniciales
├── src/
│   ├── server.ts        # Entry point Express
│   ├── middleware/
│   │   ├── auth.ts      # JWT + roles
│   │   └── upload.ts    # Multer config
│   └── routes/
│       ├── auth.ts      # /api/auth/*
│       ├── clients.ts   # /api/clients/*
│       ├── exercises.ts # /api/exercises/*
│       ├── training.ts  # /api/training/*
│       ├── nutrition.ts # /api/nutrition/*
│       ├── checkins.ts  # /api/checkins/*
│       ├── media.ts     # /api/media/*
│       ├── notifications.ts
│       ├── leads.ts     # /api/leads/*
│       ├── testimonials.ts
│       ├── profile.ts   # /api/profile/*
│       ├── billing.ts   # /api/billing/*
│       └── supplements.ts
├── package.json
├── tsconfig.json
└── .env.example
```

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro |
| POST | `/api/auth/login` | Login → `{ access_token }` |
| GET | `/api/me` | Usuario autenticado |
| GET/POST | `/api/clients` | CRUD clientes (admin) |
| GET/POST | `/api/training/plans` | Planes de entrenamiento |
| GET/POST | `/api/nutrition/plans` | Planes de nutrición |
| GET/POST | `/api/checkins` | Check-ins semanales |
| POST | `/api/media/photos/:clientId` | Subir foto progreso |
| POST | `/api/media/videos/:clientId` | Subir vídeo técnica |
| GET/POST | `/api/notifications` | Notificaciones |
| POST | `/api/leads` | Formulario contacto (público) |
| GET/POST | `/api/testimonials` | Testimonios |
| GET/PUT | `/api/profile/admin` | Perfil admin |
| GET/PUT | `/api/profile/client` | Perfil cliente |
| POST | `/api/profile/avatar` | Subir avatar |

## Despliegue en Plesk

1. Subir la carpeta `backend/` al subdominio `api.jipcoaching.com`
2. Configurar la aplicación Node.js en Plesk con:
   - Document root: `/`
   - Application root: `/`
   - Application startup file: `dist/server.js`
3. Configurar variables de entorno en Plesk
4. Ejecutar `npm install && npm run prisma:generate && npm run build`
5. Reiniciar la aplicación
