/**
 * Background video transcoding to H.264/MP4 (AAC audio).
 *
 * Why: iPhones record in HEVC/H.265 (.mov), which most browsers (Chrome
 * desktop/Android, Firefox) cannot decode → user sees a black frame with
 * audio only. Re-encoding to H.264 + AAC inside an MP4 container guarantees
 * universal browser compatibility.
 *
 * Strategy:
 *   1. Caller responds to the HTTP request immediately with the original
 *      .mov/.mp4 URL.
 *   2. This module spawns ffmpeg in the background.
 *   3. When ffmpeg finishes, the generated .mp4 atomically replaces the
 *      original file (same filename, .mp4 extension) and the DB row is
 *      updated to the new URL.
 *
 * Requires `ffmpeg` to be available on the host (apt install ffmpeg).
 * If ffmpeg is missing or fails, the original file is kept and an error
 * is logged — uploads never fail because of transcoding.
 */
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { prisma } from "../server";

/**
 * Resolve ffmpeg / ffprobe binaries.
 *
 * Priority:
 *   1. The npm packages @ffmpeg-installer/ffmpeg and @ffprobe-installer/ffprobe
 *      ship precompiled static binaries for every major platform → zero
 *      sysadmin work, no apt/SSH needed (this is the default in production).
 *   2. If the npm package isn't installed for some reason, fall back to the
 *      system binary on $PATH.
 */
let FFMPEG_PATH = "ffmpeg";
let FFPROBE_PATH = "ffprobe";
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const installer = require("@ffmpeg-installer/ffmpeg");
  if (installer?.path && fs.existsSync(installer.path)) FFMPEG_PATH = installer.path;
} catch { /* fall back to PATH */ }
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const probeInstaller = require("@ffprobe-installer/ffprobe");
  if (probeInstaller?.path && fs.existsSync(probeInstaller.path)) FFPROBE_PATH = probeInstaller.path;
} catch { /* fall back to PATH */ }

export const getFfmpegPath = () => FFMPEG_PATH;
export const getFfprobePath = () => FFPROBE_PATH;

/** Extensions / containers we always re-encode (likely HEVC or compatibility risk) */
const ALWAYS_TRANSCODE_EXT = new Set([".mov", ".avi", ".mkv", ".webm"]);

/** Check if ffmpeg is installed (cached) */
let ffmpegAvailable: boolean | null = null;
const isFfmpegAvailable = (): Promise<boolean> => {
  if (ffmpegAvailable !== null) return Promise.resolve(ffmpegAvailable);
  return new Promise((resolve) => {
    const proc = spawn(FFMPEG_PATH, ["-version"]);
    proc.on("error", () => { ffmpegAvailable = false; resolve(false); });
    proc.on("close", (code) => { ffmpegAvailable = code === 0; resolve(ffmpegAvailable!); });
  });
};

/**
 * Probe whether the file's video stream is already H.264 inside an MP4.
 * Returns false on any error (so we'll attempt to transcode for safety).
 */
const isAlreadyH264Mp4 = (filePath: string): Promise<boolean> => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== ".mp4") return Promise.resolve(false);

  return new Promise((resolve) => {
    const proc = spawn(FFPROBE_PATH, [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=codec_name",
      "-of", "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);
    let out = "";
    proc.stdout.on("data", (d) => { out += d.toString(); });
    proc.on("error", () => resolve(false));
    proc.on("close", () => {
      const codec = out.trim().toLowerCase();
      resolve(codec === "h264" || codec === "avc1");
    });
  });
};

interface TranscodeOptions {
  /** Absolute path to the source file on disk */
  sourcePath: string;
  /** Old public URL (e.g. /uploads/videos/abc.mov) */
  oldUrl: string;
  /** Optional: also update the related CheckinVideo row(s) by old URL */
  updateCheckinVideos?: boolean;
}

/**
 * Run ffmpeg to convert the source to H.264/AAC MP4 alongside the original,
 * then atomically replace and update DB rows.
 */
export async function transcodeVideoInBackground(opts: TranscodeOptions): Promise<void> {
  const { sourcePath, oldUrl, updateCheckinVideos } = opts;

  try {
    if (!fs.existsSync(sourcePath)) {
      console.warn(`[transcode] Source file missing, skipping: ${sourcePath}`);
      return;
    }

    if (!(await isFfmpegAvailable())) {
      console.warn("[transcode] ffmpeg not installed on host — skipping. Install with: apt install ffmpeg");
      return;
    }

    const ext = path.extname(sourcePath).toLowerCase();
    const needsForce = ALWAYS_TRANSCODE_EXT.has(ext);

    if (!needsForce && (await isAlreadyH264Mp4(sourcePath))) {
      // Already a browser-compatible MP4/H.264 — nothing to do
      return;
    }

    const dir = path.dirname(sourcePath);
    const base = path.basename(sourcePath, ext);
    const tempPath = path.join(dir, `${base}.transcoding.mp4`);
    const finalPath = path.join(dir, `${base}.mp4`);
    const newUrl = oldUrl.replace(/\.[^./]+$/, ".mp4");

    console.log(`[transcode] Starting ${path.basename(sourcePath)} → ${path.basename(finalPath)}`);

    await new Promise<void>((resolve, reject) => {
      // Re-encode video to H.264 (yuv420p for max compatibility), audio to AAC.
      // -movflags +faststart enables progressive download / HTML5 streaming.
      const proc = spawn(FFMPEG_PATH, [
        "-y",
        "-i", sourcePath,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        "-vf", "scale='min(1280,iw)':-2", // cap at 1280px width, keep aspect, even height
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        tempPath,
      ]);

      let stderr = "";
      proc.stderr.on("data", (d) => { stderr += d.toString(); });
      proc.on("error", (err) => reject(err));
      proc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-500)}`));
      });
    });

    // Atomic rename → final path
    fs.renameSync(tempPath, finalPath);

    // Delete original source if it's a different file (different extension)
    if (sourcePath !== finalPath && fs.existsSync(sourcePath)) {
      try { fs.unlinkSync(sourcePath); } catch (e) { /* ignore */ }
    }

    // Update DB rows pointing to the old URL
    if (oldUrl !== newUrl) {
      await prisma.techniqueVideo.updateMany({
        where: { url: oldUrl },
        data: { url: newUrl },
      });
      if (updateCheckinVideos) {
        await prisma.checkinVideo.updateMany({
          where: { url: oldUrl },
          data: { url: newUrl },
        });
      }
    }

    console.log(`[transcode] ✓ Completed ${path.basename(finalPath)}`);
  } catch (err) {
    console.error("[transcode] Failed:", err);
    // Cleanup temp file if any
    try {
      const ext = path.extname(sourcePath).toLowerCase();
      const dir = path.dirname(sourcePath);
      const base = path.basename(sourcePath, ext);
      const tempPath = path.join(dir, `${base}.transcoding.mp4`);
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch { /* noop */ }
    // Original file is preserved → playback may fail on some browsers,
    // but no data is lost.
  }
}
