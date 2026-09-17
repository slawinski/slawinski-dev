# Implementation Decisions and References

This file records the architectural decisions behind the package so a developer does not re-litigate them mid-build without a concrete reason.

## D1 — Full rewrite, not incremental Gridsome upgrade

The legacy repository is based on Gridsome/Vue with older Tailwind/PostCSS-era dependencies. Its project configuration also uses a filesystem Markdown source, a Hasura GraphQL project source, RSS plugin, and other Gridsome-specific integrations.

Decision:
- preserve useful content and routes;
- do not preserve frontend architecture.

---

## D2 — Astro frontend

Reason:
- content-heavy personal site;
- static generation is the default fit;
- Astro components allow scoped CSS;
- client-side code can be added selectively;
- remote CMS content can be consumed during builds.

Official reference:
- https://docs.astro.build/

---

## D3 — Payload as a separate app

Payload is a Next.js-based backend/CMS with Admin UI and APIs.

Decision:
- `apps/cms` owns Payload;
- `apps/web` is Astro;
- connect over API at build time.

Do not attempt to install the Payload Admin directly inside Astro.

Official reference:
- https://payloadcms.com/docs/getting-started/installation

---

## D4 — CSS strategy

Astro component styles are scoped by default.

Decision:
- normal global CSS for tokens/base;
- scoped `.astro` styles for most components;
- CSS Modules where module imports make sense, particularly client/framework components.

No Tailwind.

Official reference:
- https://docs.astro.build/en/guides/styling/

---

## D5 — SQLite first

Payload supports SQLite, Postgres and MongoDB adapters.

For this personal site, expected write volume and relational complexity do not justify operating Postgres by default.

Decision:
- start with Payload SQLite/libSQL;
- production storage must be persistent;
- switch adapter if hosting/operational constraints favor Postgres.

Official references:
- https://payloadcms.com/docs/database/overview
- https://payloadcms.com/docs/database/sqlite

---

## D6 — Build-time CMS reads

The public website does not need live CMS data on every request.

Decision:
- fetch published Payload content at build time;
- publishing triggers static rebuild;
- CMS outage does not take already-deployed public site offline.

This also avoids turning a portfolio into a server-rendered application without a product reason.

---

## D7 — No page builder

Decision:
- structured collections + small controlled rich-text blocks;
- page composition stays in code.

Reason:
- one site;
- one primary editor;
- strong visual direction;
- unrestricted layout fields would erode consistency.

---

## D8 — Preserve `/blog/[slug]`

Existing article routes use `/blog/...`.

Decision:
- navigation label may say Writing;
- canonical article path remains `/blog/[slug]` where possible.

This minimizes link/SEO churn.

---

## D9 — Static-first interaction

Decision:
- no frontend framework by default;
- use Astro + browser APIs;
- only add an island when the feature is meaningfully stateful.

Examples not requiring React:
- mobile menu;
- tag filter;
- code copy button;
- small reveal animation.

---

## D10 — Generated design image is a reference only

The file:
`reference/design-direction.webp`

is a mood/composition reference.

It may contain placeholder copy and invented visual details.

Implementation source of truth:
1. specification;
2. content model;
3. accessibility/performance constraints;
4. visual reference.

## D11 — Legacy Netlify functions are not part of the new architecture by default

The repository currently contains `functions/sendmail` and `functions/subscribe`, and the old package uses `netlify-lambda`.

Decision:
- audit whether their associated product features are still wanted;
- default to retirement because the v1 Contact specification uses a direct email link and does not require newsletter signup;
- if either workflow is retained, implement it as an explicit modern server-side integration rather than porting the Lambda folders wholesale.

---

## D12 — Do not carry Web Monetization forward implicitly

The old Gridsome config uses `gridsome-plugin-monetization` and a `PAYMENT_POINTER` environment variable.

Decision:
- treat it as a legacy feature requiring an explicit keep/remove decision;
- the default rewrite scope removes it.
