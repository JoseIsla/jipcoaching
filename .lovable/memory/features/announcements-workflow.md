---
name: Announcements workflow
description: After every user-facing change, propose a changelog .md draft for backend/changelog/ to sync into the client modal.
type: preference
---
After completing any change that the end-client would notice (UI, plan logic, check-ins, training, nutrition, BOE, mobile UX, etc.), append at the end of the response a ready-to-paste markdown block for `backend/changelog/YYYY-MM-DD-<slug>.md`.

**How to apply:**
- Filename: `YYYY-MM-DD-<short-slug>.md` (kebab-case).
- Frontmatter MUST include `title`, `audience` (NUTRITION | TRAINING | ALL), and `publishedAt`. Add `version` when relevant.
- Audience rule:
  - Change touches nutrition only → `NUTRITION`
  - Change touches training/BOE/check-ins only → `TRAINING`
  - Cross-cutting (login, payments, settings, theme, PWA, etc.) → `ALL`
- Body = 1-2 short sentences explaining the benefit to the client (NOT technical detail).
- Bullets = 2-5 concrete user-visible improvements (`- ...`).
- Skip when the change is purely internal (admin-only, refactors, bug fixes invisible to clients, infra). When skipped, say "(sin novedad para clientes)".
- Sync command for the user: `npm run sync:announcements` (run after `prisma migrate deploy`).

**Why:** José wants release notes auto-fed into the client modal without manual writing. The combo (1) AI proposes the draft + (2) git-versioned changelog + sync script gives zero-cost automation with full review control.