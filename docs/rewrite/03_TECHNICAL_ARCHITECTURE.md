# Technical Architecture

## 1. Architecture decision

Use a pnpm monorepo with two deployable applications:

- `apps/web`: Astro frontend
- `apps/cms`: Payload CMS running inside its supported Next.js runtime

Payload must not be embedded into the Astro application.

```text
Browser
   |
   v
Astro static site
   ^
   | build-time content fetch
   |
Payload REST API / SDK
   |
   v
SQLite/libSQL + media storage
```

Publishing content triggers a new Astro build.

---

## 2. Repository structure

```text
/
├── apps/
│   ├── web/
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── assets/
│   │   │   ├── components/
│   │   │   │   ├── chrome/
│   │   │   │   ├── content/
│   │   │   │   ├── decorative/
│   │   │   │   ├── primitives/
│   │   │   │   └── sections/
│   │   │   ├── layouts/
│   │   │   ├── lib/
│   │   │   │   ├── content/
│   │   │   │   ├── seo/
│   │   │   │   └── utils/
│   │   │   ├── pages/
│   │   │   ├── styles/
│   │   │   └── env.d.ts
│   │   ├── astro.config.mjs
│   │   └── package.json
│   │
│   └── cms/
│       ├── src/
│       │   ├── app/
│       │   ├── collections/
│       │   ├── globals/
│       │   ├── blocks/
│       │   ├── hooks/
│       │   ├── migrations/
│       │   ├── payload.config.ts
│       │   └── payload-types.ts
│       └── package.json
│
├── packages/
│   └── contracts/
│       ├── src/
│       │   ├── content.ts
│       │   └── index.ts
│       └── package.json
│
├── scripts/
│   └── migration/
├── pnpm-workspace.yaml
└── package.json
```

---

## 3. Frontend: Astro

### Rendering mode

Default to static output.

Reasons:
- content changes only when editorial content is published;
- pages are highly cacheable;
- excellent startup and crawl behavior;
- no need to pay runtime cost for every reader;
- the design can be expressed almost entirely in HTML/CSS.

Dynamic runtime rendering should be introduced only for a concrete feature that requires it.

### Component preference

Order of preference:

1. `.astro` component;
2. semantic HTML + scoped Astro CSS;
3. small client-side TypeScript;
4. custom element if encapsulated interactive behavior is useful;
5. framework island only when a real stateful UI justifies it.

Do not install React merely to implement a menu toggle, tag filter or card hover.

### CSS

Use:
- global reset/tokens/utilities in `src/styles`;
- scoped `<style>` blocks in `.astro` components;
- `.module.css` for reusable framework/client components or places where explicit module imports improve maintainability.

Do not use Tailwind.

### TypeScript

Use strict TypeScript.

Avoid `any` in content/data interfaces.

---

## 4. CMS: Payload

Payload runs in its own supported Next.js app and owns:

- Admin UI;
- editorial authentication;
- collections;
- media;
- content API;
- database schema/migrations;
- publish hooks.

Use:
- Lexical rich text;
- draft/version support for posts/projects when appropriate;
- generated Payload types internally;
- REST API / official SDK for frontend build integration.

The Astro frontend must not import Payload server internals.

---

## 5. Database

Initial recommendation: SQLite/libSQL.

This site has:
- one primary editor;
- low write volume;
- modest content volume;
- no complex transactional domain;
- few relationships.

Use Payload's official SQLite adapter.

Production requirements:
- persistent storage;
- database backups;
- tested restore path;
- schema migrations committed to git.

Do not use an ephemeral local filesystem database in a platform where deployments replace the filesystem.

If hosting constraints make persistent SQLite awkward, switch to Postgres without changing the content model.

---

## 6. Shared contracts

`packages/contracts` defines frontend-safe content DTOs.

Do **not** share the entire Payload generated type surface with rendering components.

Example:

```ts
export interface ProjectCardDTO {
  slug: string
  title: string
  summary: string
  year?: number
  status?: 'live' | 'archived' | 'prototype'
  role?: string
  tags: string[]
  cover: ImageDTO
}
```

The content client maps Payload responses to these DTOs.

Benefits:
- frontend is decoupled from CMS implementation fields;
- no leaking access-control/admin fields;
- easier testing;
- migration to another CMS does not require rewriting every component.

---

## 7. Data flow

Build flow:

```text
Payload published content
        |
        v
publish hook
        |
        v
deploy/build webhook
        |
        v
Astro build
        |
        +--> fetch published content
        +--> validate/map DTOs
        +--> generate pages
        +--> generate RSS/sitemap
        |
        v
static deployment
```

If the CMS is unavailable:
- production build must fail with a clear error;
- never silently deploy an empty archive.

---

## 8. Media

CMS owns source editorial media.

Frontend:
- uses image dimensions and alt text from CMS;
- generates responsive output when supported by deployment/image integration;
- avoids loading decorative high-resolution textures on small screens.

Separate:
- editorial media (CMS)
- fixed design assets/textures (repo `src/assets`)
- generated decorative SVG components (repo)

Do not upload core UI textures to CMS unless editors need to replace them.

---

## 9. Environment variables

Web:

```text
PUBLIC_SITE_URL=
PAYLOAD_API_URL=
PAYLOAD_BUILD_TOKEN=      # only if needed for authenticated build reads
```

CMS:

```text
PAYLOAD_SECRET=
DATABASE_URL=
DATABASE_AUTH_TOKEN=      # if provider requires
PUBLIC_CMS_URL=
WEB_DEPLOY_HOOK_URL=
WEB_ORIGIN=
```

Never expose secrets through `PUBLIC_*`.

Provide `.env.example` in both apps.

---

## 10. Deployment

Deployment targets may vary, but the topology must remain:

- static web deployment;
- long-running/serverless-compatible Payload deployment;
- persistent database/media.

Recommended operational shape:

```text
www.slawinski.dev     -> Astro
cms.slawinski.dev     -> Payload Admin/API
```

CMS must:
- be HTTPS-only;
- not be indexed;
- have secure admin authentication;
- restrict CORS as needed;
- use backups.

---

## 11. Logging and error handling

Build:
- log failing collection/slug;
- include HTTP status from CMS;
- distinguish schema-validation error from network error;
- exit non-zero.

CMS:
- log publish-hook failures;
- do not block content save if a deploy webhook temporarily fails unless explicitly chosen;
- surface a clear admin-visible error/log path.

---

## 12. Dependency philosophy

Prefer platform/native features.

Before adding a package, ask:
- is this possible in Astro/CSS/browser APIs?
- does the package materially reduce correctness risk?
- is the package larger/more complex than the feature?

Examples:
- menu toggle: no library;
- focus trap: small proven accessible primitive or carefully implemented native dialog;
- syntax highlighting: Astro/Shiki integration;
- reading time: small local utility;
- date formatting: `Intl.DateTimeFormat`;
- animations: CSS/Web Animations API before an animation framework.
