# slawinski.dev

Full rewrite of the personal site using **Astro + TypeScript + CSS Modules + Payload CMS**.

The rewrite is being built alongside the legacy Gridsome source until content migration and parity checks are complete. The implementation source of truth lives in [`docs/rewrite`](./docs/rewrite/00_README.md).

## Architecture

- `apps/web` — Astro static frontend
- `apps/cms` — Payload CMS / Next.js admin and content API
- `packages/contracts` — frontend-safe content DTOs
- `scripts/migration` — legacy Markdown / Hasura migration tools
- `docs/rewrite` — product, UX and technical specifications

## Requirements

Payload's current requirements drive the repo baseline:

- Node.js 24.15+
- pnpm 10 or 11
- TypeScript 6+

## Start locally

```bash
cp .env.example .env
pnpm install
pnpm dev
```

- Astro: http://localhost:4321
- Payload: http://localhost:3001/admin

## Rewrite strategy

The old Gridsome app remains in the repository during the migration phase. It is not part of the new workspace build. Once migrated content, redirects and SEO parity are verified, the legacy application files can be removed in a dedicated cleanup change.
