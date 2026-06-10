/**
 * Sync changelog markdown files in backend/changelog/ to the Announcement table.
 *
 * Usage:
 *   npm run sync:announcements
 *
 * Behaviour:
 * - Each .md file is upserted by its filename (without extension) as the unique slug.
 * - Frontmatter fields:
 *     title (required)
 *     audience (NUTRITION | TRAINING | ALL, required)
 *     version (optional)
 *     active (optional, default true)
 *     publishedAt (optional ISO date)
 * - Body = first paragraph(s); bullet lines (- or *) collected into `bullets[]`.
 * - Deleting a file does NOT delete the row — set `active: false` to retire it.
 */
import { PrismaClient, AnnouncementAudience } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const CHANGELOG_DIR = path.resolve(__dirname, "../../changelog");

type Parsed = {
  slug: string;
  title: string;
  audience: AnnouncementAudience;
  version: string | null;
  active: boolean;
  publishedAt: Date | null;
  body: string;
  bullets: string[];
};

/** Minimal frontmatter parser: --- key: value --- header followed by markdown body. */
function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const trimmed = raw.replace(/^\uFEFF/, "");
  if (!trimmed.startsWith("---")) return { meta: {}, body: trimmed };
  const end = trimmed.indexOf("\n---", 3);
  if (end === -1) return { meta: {}, body: trimmed };
  const header = trimmed.slice(3, end).trim();
  const body = trimmed.slice(end + 4).replace(/^\s*\n/, "");
  const meta: Record<string, string> = {};
  for (const line of header.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    meta[m[1].toLowerCase()] = v;
  }
  return { meta, body };
}

function splitBodyAndBullets(body: string): { body: string; bullets: string[] } {
  const lines = body.split(/\r?\n/);
  const bullets: string[] = [];
  const bodyLines: string[] = [];
  for (const line of lines) {
    const m = line.match(/^\s*[-*]\s+(.+)$/);
    if (m) bullets.push(m[1].trim());
    else bodyLines.push(line);
  }
  return {
    body: bodyLines.join("\n").trim(),
    bullets,
  };
}

function parseFile(filename: string, raw: string): Parsed {
  const slug = filename.replace(/\.md$/i, "");
  const { meta, body: rawBody } = parseFrontmatter(raw);
  const { body, bullets } = splitBodyAndBullets(rawBody);

  if (!meta.title) throw new Error(`[${filename}] Missing 'title' in frontmatter`);
  if (!meta.audience) throw new Error(`[${filename}] Missing 'audience' in frontmatter`);
  const audienceUpper = meta.audience.toUpperCase() as AnnouncementAudience;
  if (!["NUTRITION", "TRAINING", "ALL"].includes(audienceUpper)) {
    throw new Error(`[${filename}] Invalid audience '${meta.audience}'`);
  }

  let publishedAt: Date | null = null;
  if (meta.publishedat) {
    const d = new Date(meta.publishedat);
    if (!isNaN(d.getTime())) publishedAt = d;
  }

  return {
    slug,
    title: meta.title,
    audience: audienceUpper,
    version: meta.version || null,
    active: meta.active ? meta.active.toLowerCase() !== "false" : true,
    publishedAt,
    body: body || meta.title,
    bullets,
  };
}

async function main() {
  if (!fs.existsSync(CHANGELOG_DIR)) {
    console.error(`Changelog dir not found: ${CHANGELOG_DIR}`);
    process.exit(1);
  }
  const files = fs
    .readdirSync(CHANGELOG_DIR)
    .filter((f) => f.toLowerCase().endsWith(".md") && f.toLowerCase() !== "readme.md");

  if (files.length === 0) {
    console.log("No changelog .md files found. Nothing to sync.");
    return;
  }

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const f of files) {
    const raw = fs.readFileSync(path.join(CHANGELOG_DIR, f), "utf8");
    let parsed: Parsed;
    try {
      parsed = parseFile(f, raw);
    } catch (e: any) {
      errors.push(e.message);
      continue;
    }

    const existing = await prisma.announcement.findUnique({ where: { slug: parsed.slug } });
    const data = {
      slug: parsed.slug,
      title: parsed.title,
      body: parsed.body,
      bullets: parsed.bullets as any,
      audience: parsed.audience,
      version: parsed.version,
      active: parsed.active,
      publishedAt: parsed.publishedAt ?? (existing?.publishedAt ?? new Date()),
    };

    if (existing) {
      await prisma.announcement.update({ where: { slug: parsed.slug }, data });
      updated++;
      console.log(`↻ updated  ${parsed.slug}  [${parsed.audience}${parsed.active ? "" : ", INACTIVE"}]`);
    } else {
      await prisma.announcement.create({ data });
      created++;
      console.log(`+ created  ${parsed.slug}  [${parsed.audience}${parsed.active ? "" : ", INACTIVE"}]`);
    }
  }

  console.log(`\nDone. ${created} created, ${updated} updated, ${errors.length} errors.`);
  if (errors.length > 0) {
    console.error("\nErrors:");
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());