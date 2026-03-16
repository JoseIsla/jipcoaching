/**
 * Pre-render public routes using Puppeteer + Vite Preview.
 * Generates static HTML files for SEO crawlers.
 *
 * Usage: automatically runs after `npm run build` via the postbuild script.
 */
import { createServer } from "vite";
import puppeteer from "puppeteer";
import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { dirname, join } from "path";

const DIST = "dist";
const PORT = 4173;

// Routes to pre-render (public pages only)
const ROUTES = [
  "/",
  "/install",
  "/legal/aviso-legal",
  "/legal/privacidad",
  "/legal/cookies",
];

async function prerender() {
  console.log("\n⚡ Pre-rendering public routes...\n");

  // Start Vite preview server
  const server = await createServer({
    root: process.cwd(),
    server: { port: PORT },
    preview: { port: PORT },
  });
  const previewServer = await server.listen(PORT);
  // Vite's createServer in dev mode — use preview instead
  // Actually we need `vite preview` which serves /dist
  await previewServer.close();

  // Use a simple static server instead
  const { createServer: createHttpServer } = await import("http");
  const { readFile } = await import("fs/promises");
  const { extname } = await import("path");

  const mimeTypes = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".json": "application/json",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".ttf": "font/ttf",
    ".mp3": "audio/mpeg",
    ".webp": "image/webp",
  };

  const httpServer = createHttpServer(async (req, res) => {
    let filePath = join(DIST, req.url === "/" ? "index.html" : req.url);
    try {
      // Try the exact path first
      let data;
      try {
        data = await readFile(filePath);
      } catch {
        // SPA fallback: serve index.html for any route without extension
        if (!extname(filePath)) {
          filePath = join(DIST, "index.html");
          data = await readFile(filePath);
        } else {
          res.writeHead(404);
          res.end("Not found");
          return;
        }
      }
      const ext = extname(filePath);
      const mime = mimeTypes[ext] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": mime });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  await new Promise((resolve) => httpServer.listen(PORT, resolve));
  console.log(`  📦 Static server on http://localhost:${PORT}`);

  // Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  for (const route of ROUTES) {
    try {
      const page = await browser.newPage();

      // Block external requests (analytics, fonts, etc.) for speed
      await page.setRequestInterception(true);
      page.on("request", (req) => {
        const url = req.url();
        if (url.startsWith(`http://localhost:${PORT}`)) {
          req.continue();
        } else if (
          req.resourceType() === "font" ||
          req.resourceType() === "image"
        ) {
          req.abort();
        } else {
          req.continue();
        }
      });

      await page.goto(`http://localhost:${PORT}${route}`, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      // Wait a bit for React to render
      await page.waitForTimeout(1500);

      const html = await page.content();

      // Determine output path
      const outDir =
        route === "/"
          ? DIST
          : join(DIST, route.startsWith("/") ? route.slice(1) : route);
      const outFile = join(outDir, route === "/" ? "index.html" : "index.html");

      mkdirSync(dirname(outFile), { recursive: true });
      writeFileSync(outFile, html, "utf-8");

      console.log(`  ✅ ${route} → ${outFile}`);
      await page.close();
    } catch (err) {
      console.error(`  ❌ ${route}: ${err.message}`);
    }
  }

  await browser.close();
  httpServer.close();

  console.log("\n✨ Pre-rendering complete!\n");
}

prerender().catch((err) => {
  console.error("Pre-render failed:", err);
  process.exit(1);
});
