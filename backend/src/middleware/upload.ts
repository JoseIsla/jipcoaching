import multer from "multer";
import path from "path";
import { v4 as uuid } from "uuid";
import fs from "fs";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const createStorage = (subdir: string) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.join(UPLOAD_DIR, subdir);
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuid()}${ext}`);
    },
  });

const imageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten imágenes JPG, PNG o WebP"));
  }
};

const videoFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten vídeos MP4, MOV, WebM o AVI"));
  }
};

export const uploadAvatar = multer({
  storage: createStorage("avatars"),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: imageFilter,
});

export const uploadProgressPhoto = multer({
  storage: createStorage("progress"),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFilter,
});

export const uploadVideo = multer({
  storage: createStorage("videos"),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: videoFilter,
});
