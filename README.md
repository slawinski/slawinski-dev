# slawinski.dev

Personal site built as an **Astro + TypeScript + Three.js + Payload CMS** monorepo.

## Architecture

- `apps/web` — Astro frontend
  - `/` — low-poly Three.js operation-room navigation experience
  - content routes — semantic Astro pages
- `apps/cms` — Payload CMS / Next.js admin and content API
- `packages/contracts` — frontend-safe content DTOs shared between applications
- `blog` — Markdown source content retained for Payload import/reference
- `docs/rewrite` — product, UX and technical specifications for the current implementation

The homepage reference and 3D interaction rules are documented in [`docs/rewrite/22_OPERATION_ROOM_3D.md`](./docs/rewrite/22_OPERATION_ROOM_3D.md).

## Requirements

- Node.js 24.15+
- pnpm 10 or 11
- TypeScript 6+

## Start locally

```bash
cp apps/cms/.env.example apps/cms/.env
cp apps/web/.env.example apps/web/.env
# Replace PAYLOAD_SECRET in apps/cms/.env with: openssl rand -hex 32
pnpm install
pnpm dev
```

- Astro: http://localhost:4321
- Payload: http://localhost:3001/admin

## Validation

```bash
pnpm typecheck
pnpm build
```

The legacy Gridsome/Vue application and Netlify CMS implementation have been removed. Astro and Payload are the only active application stack in this repository.
