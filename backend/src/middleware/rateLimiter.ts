/**
 * Simple in-memory rate limiter for login endpoint.
 * Limits requests per IP to prevent brute-force attacks.
 *
 * For production with multiple processes, consider using
 * a Redis-backed solution instead.
 */

import { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 5 * 60 * 1000);

interface RateLimitOptions {
  /** Time window in seconds */
  windowSec: number;
  /** Max requests per window */
  max: number;
}

export const rateLimit = ({ windowSec, max }: RateLimitOptions) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now > entry.resetAt) {
      store.set(ip, { count: 1, resetAt: now + windowSec * 1000 });
      next();
      return;
    }

    entry.count++;

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set("Retry-After", String(retryAfter));
      res.status(429).json({
        message: "Demasiados intentos. Inténtalo de nuevo en unos minutos.",
      });
      return;
    }

    next();
  };
};
