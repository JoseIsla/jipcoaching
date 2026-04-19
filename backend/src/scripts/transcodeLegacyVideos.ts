/**
 * One-shot CLI script: transcode all legacy videos to H.264/MP4.
 *
 * Usage (from /backend):
 *   npm run transcode:legacy
 *   npm run transcode:legacy -- --dry-run    # only report, don't convert
 *   npm run transcode:legacy -- --force      # re-encode even already-H264 mp4s
 *
 * Behaviour:
 *  - Walks /uploads/videos
 *  - Skips files already H.264/MP4 (idempotent — safe to re-run)
 *  - Transcodes others to <basename>.mp4 and removes the original if extension differs
 *  - Updates DB rows in TechniqueVideo and CheckinVideo whose `url` matches the old path
 *  - Prints a progress line per file and a summary at the end
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { PrismaClient } from "@prisma/client";

// Resolve ffmpeg/ffprobe paths WITHOUT importing from ../server (which would start the HTTP server).
const getFfmpegPath = (): string => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const installer = require("@ffmpeg-installer/ffmpeg");
    if (installer?.path) return installer.path;
  } catch { /* fallback */ }
  return "ffmpeg";
};
const getFfprobePath = (): string => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const installer = require("@ffprobe-installer/ffprobe");
    if (installer?.path) return installer.path;
  } catch { /* fallback */ }
  return "ffprobe";
};

const prisma = new PrismaClient();

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const VIDEO_DIR = path.resolve(UPLOAD_DIR, "videos");
const PUBLIC_PREFIX = "/uploads/videos/";

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const FORCE = args.has("--force");

const VIDEO_EXTS = new Set([".mp4", ".mov", ".m4v", ".avi", ".mkv", ".webm", ".3gp", ".hevc"]);

interface Stats {
  total: number;
  skipped: number;
  converted: number;
  failed: number;
  dbUpdated: number;
}
const stats: Stats = { total: 0, skipped: 0, converted: 0, failed: 0, dbUpdated: 0 };

const probeCodec = (file: string): Promise<string> =>
  new Promise((resolve) => {
    const proc = spawn(getFfprobePath(), [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=codec_name",
      "-of", "default=noprint_wrappers=1:nokey=1",
      file,
    ]);
    let out = "";
    proc.stdout.on("data", (d) => { out += d.toString(); });
    proc.on("error", () => resolve(""));
    proc.on("close", () => resolve(out.trim().toLowerCase()));
  });

const runFfmpeg = (input: string, output: string, attempt: 1 | 2 = 1): Promise<void> =>
  new Promise((resolve, reject) => {
    // Attempt 1: standard re-encode with audio
    // Attempt 2 (fallback): force pixel format conversion + drop problematic audio metadata,
    //   handle videos without audio, rotated videos, variable framerate, HDR HEVC tone-mapping…
    const baseArgs = [
      "-y",
      "-fflags", "+genpts+igndts",
      "-err_detect", "ignore_err",
      "-i", input,
    ];
    const videoArgs = [
      "-map", "0:v:0",
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "23",
      "-pix_fmt", "yuv420p",
      "-vf", "scale='min(1280,iw)':-2,format=yuv420p",
      "-r", "30",
      "-movflags", "+faststart",
      "-max_muxing_queue_size", "9999",
    ];
    const audioArgs = attempt === 1
      ? ["-map", "0:a:0?", "-c:a", "aac", "-b:a", "128k", "-ac", "2", "-ar", "44100"]
      : ["-an"]; // fallback: drop audio entirely if first attempt fails
    const args = [...baseArgs, ...videoArgs, ...audioArgs, output];
    const proc = spawn(getFfmpegPath(), args);
    let stderr = "";
    proc.stderr.on("data", (d) => { stderr += d.toString(); });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else if (attempt === 1) {
        // retry without audio — many failures come from corrupt/exotic audio tracks
        console.log(`    ↻ Retrying without audio (first attempt failed: code ${code})`);
        runFfmpeg(input, output, 2).then(resolve).catch(reject);
      } else {
        reject(new Error(`ffmpeg exit ${code}: ${stderr.slice(-500)}`));
      }
    });
  });

const updateDbUrls = async (oldUrl: string, newUrl: string): Promise<number> => {
  if (oldUrl === newUrl) return 0;
  let count = 0;
  try {
    const r1 = await prisma.techniqueVideo.updateMany({
      where: { url: oldUrl },
      data: { url: newUrl },
    });
    count += r1.count;
  } catch (e) {
    console.warn(`  ⚠ techniqueVideo update failed: ${(e as Error).message}`);
  }
  try {
    const r2 = await prisma.checkinVideo.updateMany({
      where: { url: oldUrl },
      data: { url: newUrl },
    });
    count += r2.count;
  } catch (e) {
    console.warn(`  ⚠ checkinVideo update failed: ${(e as Error).message}`);
  }
  return count;
};

const processFile = async (filename: string, idx: number, total: number): Promise<void> => {
  const fullPath = path.join(VIDEO_DIR, filename);
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, ext);
  const prefix = `[${idx}/${total}]`;

  stats.total++;

  if (!VIDEO_EXTS.has(ext)) {
    console.log(`${prefix} ⊘ Skip (not a video): ${filename}`);
    stats.skipped++;
    return;
  }

  // Probe codec. We treat ONLY h264/avc1 inside .mp4 as browser-safe.
  // Anything else (hevc/h265, prores, vp9, av1, empty/unknown) → re-encode,
  // because Chrome/Firefox on Windows/Android don't ship HEVC by default
  // and many phones produce HEVC-in-MP4 containers (the file has .mp4
  // extension but the video stream is hevc → black frame, audio only).
  const codec = await probeCodec(fullPath);
  const SAFE_CODECS = new Set(["h264", "avc1"]);
  const isH264Mp4 = ext === ".mp4" && SAFE_CODECS.has(codec);

  if (isH264Mp4 && !FORCE) {
    console.log(`${prefix} ✓ Already H.264/MP4 (codec=${codec}): ${filename}`);
    stats.skipped++;
    return;
  }

  const oldUrl = PUBLIC_PREFIX + filename;
  const targetFilename = `${base}.mp4`;
  const targetPath = path.join(VIDEO_DIR, targetFilename);
  const tempPath = path.join(VIDEO_DIR, `${base}.transcoding.mp4`);
  const newUrl = PUBLIC_PREFIX + targetFilename;

  if (DRY_RUN) {
    console.log(`${prefix} → Would transcode: ${filename} (codec=${codec || "?"}) → ${targetFilename}`);
    stats.converted++;
    return;
  }

  console.log(`${prefix} ⚙ Transcoding ${filename} (codec=${codec || "?"}) → ${targetFilename}…`);
  const startedAt = Date.now();

  try {
    await runFfmpeg(fullPath, tempPath);

    // Verify the produced file is actually H.264 — otherwise abort & keep original.
    const newCodec = await probeCodec(tempPath);
    if (!SAFE_CODECS.has(newCodec)) {
      throw new Error(`output codec is "${newCodec || "unknown"}", expected h264`);
    }

    fs.renameSync(tempPath, targetPath);

    // If source had a different extension, remove it (replaced by .mp4)
    if (fullPath !== targetPath && fs.existsSync(fullPath)) {
      try { fs.unlinkSync(fullPath); } catch { /* ignore */ }
    }

    const updated = await updateDbUrls(oldUrl, newUrl);
    stats.dbUpdated += updated;
    stats.converted++;
    const secs = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(`${prefix} ✓ Done in ${secs}s (codec=${newCodec}, DB rows updated: ${updated})`);
  } catch (err) {
    stats.failed++;
    console.error(`${prefix} ✗ Failed: ${(err as Error).message}`);
    if (fs.existsSync(tempPath)) {
      try { fs.unlinkSync(tempPath); } catch { /* ignore */ }
    }
  }
};

const main = async () => {
  console.log("─".repeat(60));
  console.log(" Legacy video transcoder → H.264/MP4");
  console.log("─".repeat(60));
  console.log(` Source dir : ${VIDEO_DIR}`);
  console.log(` ffmpeg     : ${getFfmpegPath()}`);
  console.log(` ffprobe    : ${getFfprobePath()}`);
  console.log(` Mode       : ${DRY_RUN ? "DRY-RUN (no changes)" : "LIVE"}${FORCE ? " + FORCE" : ""}`);
  console.log("─".repeat(60));

  if (!fs.existsSync(VIDEO_DIR)) {
    console.error(`✗ Video directory does not exist: ${VIDEO_DIR}`);
    process.exit(1);
  }

  // Quick ffmpeg sanity check
  const ok = await new Promise<boolean>((resolve) => {
    const p = spawn(getFfmpegPath(), ["-version"]);
    p.on("error", () => resolve(false));
    p.on("close", (c) => resolve(c === 0));
  });
  if (!ok) {
    console.error("✗ ffmpeg binary not usable. Run `npm install` to fetch @ffmpeg-installer/ffmpeg.");
    process.exit(1);
  }

  const allFiles = fs
    .readdirSync(VIDEO_DIR)
    .filter((f) => !f.startsWith(".") && !f.includes(".transcoding.")); // ignore in-progress files

  console.log(`Found ${allFiles.length} file(s) in /uploads/videos\n`);

  for (let i = 0; i < allFiles.length; i++) {
    await processFile(allFiles[i], i + 1, allFiles.length);
  }

  console.log("\n" + "─".repeat(60));
  console.log(" Summary");
  console.log("─".repeat(60));
  console.log(` Total scanned   : ${stats.total}`);
  console.log(` Already OK      : ${stats.skipped}`);
  console.log(` Converted       : ${stats.converted}${DRY_RUN ? " (dry-run)" : ""}`);
  console.log(` Failed          : ${stats.failed}`);
  console.log(` DB rows updated : ${stats.dbUpdated}`);
  console.log("─".repeat(60));

  await prisma.$disconnect();
  process.exit(stats.failed > 0 ? 1 : 0);
};

main().catch(async (err) => {
  console.error("Fatal error:", err);
  await prisma.$disconnect();
  process.exit(1);
});
