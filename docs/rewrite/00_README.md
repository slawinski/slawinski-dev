# slawinski.dev Rewrite Specification

Version: 1.1  
Status: implementation-ready baseline  
Primary concept: **Developer Workbench**  
Target stack: **Astro + TypeScript + CSS / CSS Modules + Payload CMS**

## Purpose

This package is the source of truth for a full rewrite of `slawinski.dev`.

The current website is treated as a content source and URL/SEO legacy to preserve where useful, not as an architecture to incrementally refactor. The existing implementation is based on Gridsome/Vue, local Markdown posts, Tailwind/PostCSS, a Hasura-backed projects source, Netlify functions, RSS, and Netlify-era CMS tooling. The rewrite replaces those application-level decisions.

The new site must feel highly personal and visually memorable while remaining structurally conventional, fast, accessible, and easy to maintain.

## Product statement

> A senior developer's personal site presented as a tactile, slightly chaotic developer workbench: paper, plastic, CRT/LCD surfaces, stamps, old-web interface fragments, handwritten annotations and physical-looking case files — all sitting on top of a disciplined information architecture and semantic HTML.

The visual system combines:

- ~70% tactile maximalism
- ~20% dial-up / early-web nostalgia
- ~10% human scribble / handmade annotation
- cutealism may appear as an occasional accent, never as the dominant system

## Core rule

**Maximalist visuals; minimalist UX.**

The site may look dense, layered, imperfect, tactile, retro, or playful. It must never be confusing to navigate.

Do not hide essential information behind novelty interactions. Do not make draggable windows, scroll hijacking, fake boot sequences, custom cursors, puzzle navigation, or canvas-based UI prerequisites for accessing content.

## Package contents

| File | Purpose |
|---|---|
| `01_PRODUCT_PRINCIPLES.md` | Product goals, non-goals, UX rules |
| `02_INFORMATION_ARCHITECTURE.md` | Routes, navigation, content hierarchy |
| `03_TECHNICAL_ARCHITECTURE.md` | Monorepo, Astro, Payload, data flow, deployment |
| `04_DESIGN_SYSTEM.md` | Colors, typography, materials, spacing, borders, shadows |
| `05_GLOBAL_LAYOUT_AND_NAVIGATION.md` | Header, footer, mobile menu, page frame |
| `06_HOME_PAGE.md` | Homepage layout and behavior |
| `07_WORK_AND_PROJECTS.md` | Work index and project detail case-study UX |
| `08_WRITING_AND_ARTICLES.md` | Writing index, article layout, code, embeds |
| `09_SPEAKING.md` | Speaking/talks page |
| `10_ABOUT_AND_CONTACT.md` | About and contact experiences |
| `11_RESPONSIVE_BEHAVIOR.md` | Breakpoints and desktop/mobile adaptation |
| `12_COMPONENT_LIBRARY.md` | Component inventory and contracts |
| `13_PAYLOAD_CMS_MODEL.md` | Collections, globals, fields, publishing rules |
| `14_DATA_ACCESS_AND_BUILD.md` | Astro/Payload integration, caching, errors, webhooks |
| `15_CONTENT_MIGRATION.md` | Legacy content import, routes, redirects, validation |
| `16_MOTION_AND_INTERACTION.md` | Hover, focus, motion, reduced-motion behavior |
| `17_ACCESSIBILITY_SEO_PERFORMANCE.md` | Quality constraints and budgets |
| `18_TESTING_AND_QA.md` | Testing strategy and browser/device matrix |
| `19_IMPLEMENTATION_PLAN.md` | Delivery slices and ticket-sized work |
| `20_DEFINITION_OF_DONE.md` | Final acceptance checklist |
| `reference/README.md` | Notes about the directional mockup produced during discovery |

## Visual reference disclaimer

The discovery mockup communicates mood, density, hierarchy and responsive intent. It is **not a pixel-perfect design**. The raster mockup is intentionally kept outside the codebase in this foundation PR; `reference/README.md` records how it should be interpreted.

Where the mockup conflicts with this specification, the specification wins.

The developer must implement the system described in these files rather than tracing the image literally.

## Expected repository shape

```text
slawinski-dev/
├── apps/
│   ├── web/                 # Astro frontend
│   └── cms/                 # Payload + Next.js admin/API
├── packages/
│   └── contracts/           # frontend-safe shared DTOs / schemas
├── scripts/
│   └── migration/           # one-off legacy import tools
├── docs/
│   └── ...                  # optional copy of this specification package
├── pnpm-workspace.yaml
└── package.json
```

## Recommended defaults

- Package manager: `pnpm`
- TypeScript: strict
- Frontend rendering: static generation by default
- CMS: Payload in a separate Next.js application
- Database: SQLite/libSQL for the initial personal-site workload
- Rich text: Payload Lexical
- CSS: normal CSS + Astro scoped styles; CSS Modules for reusable JS/interactive components
- No Tailwind
- No component library unless a specific accessible primitive justifies it
- No SPA shell
- No React on the frontend unless a particular island demonstrably benefits from it
- Prefer Astro components and small vanilla TypeScript custom elements/scripts
- Public content fetched from Payload during build
- Publishing triggers a web rebuild
- RSS preserved
- Existing article URLs preserved whenever practical

## Implementation philosophy

When choosing between two solutions, prefer the one that:

1. ships less JavaScript;
2. preserves semantic HTML;
3. is easy for a future developer or coding agent to reason about;
4. keeps content independent of layout;
5. does not turn decorative behavior into application state;
6. degrades gracefully if JavaScript fails;
7. makes the unusual visual language reproducible through tokens and components rather than one-off hacks.
