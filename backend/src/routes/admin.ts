/**
 * Admin-only operational endpoints.
 *
 * - POST /api/admin/transcode-legacy
 *     Runs the legacy video transcoder in the background and returns immediately.
 *     The script lives at backend/src/scripts/transcodeLegacyVideos.ts and is
 *     idempotent (skips files already in H.264/MP4).
 */
import { Router, Request, Response } from "express";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

// In-memory job tracking — single concurrent job at a time
interface JobState {
  running: boolean;
  startedAt: string | null;
  finishedAt: string | null;
  exitCode: number | null;
  log: string[];          // tail of last lines (max 500)
  summary: string | null; // last summary block
}

const job: JobState = {
  running: false,
  startedAt: null,
  finishedAt: null,
  exitCode: null,
  log: [],
  summary: null,
};

const MAX_LOG_LINES = 500;

const pushLog = (chunk: string) => {
  const lines = chunk.split(/\r?\n/).filter((l) => l.length > 0);
  for (const line of lines) {
    job.log.push(line);
    if (job.log.length > MAX_LOG_LINES) job.log.shift();
  }
};

const resolveScriptPath = (): string | null => {
  // When running from compiled dist/, source script lives at ../src/scripts/...
  const candidates = [
    path.resolve(__dirname, "../scripts/transcodeLegacyVideos.ts"),
    path.resolve(__dirname, "../../src/scripts/transcodeLegacyVideos.ts"),
    path.resolve(process.cwd(), "src/scripts/transcodeLegacyVideos.ts"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
};

/**
 * Locate tsx's CLI JS entry so we can run it with the *current* Node binary.
 * This avoids relying on the `#!/usr/bin/env node` shebang of node_modules/.bin/tsx,
 * which fails on Plesk/Passenger with "env: 'node': No such file or directory" (exit 127).
 */
const resolveTsxCliJs = (): string | null => {
  const candidates = [
    path.resolve(process.cwd(), "node_modules/tsx/dist/cli.mjs"),
    path.resolve(__dirname, "../../node_modules/tsx/dist/cli.mjs"),
    path.resolve(process.cwd(), "node_modules/tsx/dist/cli.js"),
    path.resolve(__dirname, "../../node_modules/tsx/dist/cli.js"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
};

// POST /api/admin/transcode-legacy?dryRun=1&force=1
router.post(
  "/transcode-legacy",
  authenticate,
  requireRole("ADMIN"),
  (req: Request, res: Response): void => {
    if (job.running) {
      res.status(409).json({
        message: "Ya hay una migración en curso",
        startedAt: job.startedAt,
      });
      return;
    }

    const scriptPath = resolveScriptPath();
    if (!scriptPath) {
      res.status(500).json({ message: "No se encontró el script de migración en el servidor" });
      return;
    }

    const dryRun = req.query.dryRun === "1" || req.query.dryRun === "true";
    const force = req.query.force === "1" || req.query.force === "true";
    const args: string[] = [scriptPath];
    if (dryRun) args.push("--dry-run");
    if (force) args.push("--force");

    // Reset state
    job.running = true;
    job.startedAt = new Date().toISOString();
    job.finishedAt = null;
    job.exitCode = null;
    job.log = [];
    job.summary = null;

    const tsxBin = resolveTsxBin();
    pushLog(`▶ Lanzando: ${tsxBin} ${args.join(" ")}`);

    const child = spawn(tsxBin, args, {
      cwd: path.resolve(__dirname, "../.."),
      env: { ...process.env },
      detached: false,
    });

    child.stdout.on("data", (d) => pushLog(d.toString()));
    child.stderr.on("data", (d) => pushLog(d.toString()));

    child.on("error", (err) => {
      pushLog(`✗ Error al lanzar el proceso: ${err.message}`);
      job.running = false;
      job.finishedAt = new Date().toISOString();
      job.exitCode = -1;
    });

    child.on("close", (code) => {
      job.running = false;
      job.finishedAt = new Date().toISOString();
      job.exitCode = code;
      // Capture last "Summary" block if present
      const idx = job.log.findIndex((l) => l.includes("Summary"));
      if (idx >= 0) {
        job.summary = job.log.slice(idx).join("\n");
      }
      pushLog(`■ Proceso terminado (code=${code})`);
    });

    res.status(202).json({
      message: "Migración iniciada en segundo plano",
      startedAt: job.startedAt,
      dryRun,
      force,
    });
  }
);

// GET /api/admin/transcode-legacy/status
router.get(
  "/transcode-legacy/status",
  authenticate,
  requireRole("ADMIN"),
  (_req: Request, res: Response): void => {
    res.json({
      running: job.running,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
      exitCode: job.exitCode,
      summary: job.summary,
      // return only the last 80 lines for UI display
      logTail: job.log.slice(-80),
      logLines: job.log.length,
    });
  }
);

export default router;
