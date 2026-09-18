# slawinski.dev Rewrite Specification

Version: 2.0  
Status: implementation baseline  
Primary concept: **3D Operation Room**  
Target stack: **Astro + TypeScript + Three.js + CSS / CSS Modules + Payload CMS**

## Purpose

This package is the source of truth for the full rewrite of `slawinski.dev`.

The current production website remains a content source and URL/SEO legacy to preserve where useful. The old Gridsome/Vue frontend is not an architecture to incrementally refactor.

The new site has two deliberately different presentation layers:

1. **Homepage:** an interactive low-poly 3D operation room rendered into an HTML Canvas with Three.js.
2. **Content pages:** conventional semantic Astro pages for Work, Writing, Speaking, About and Contact.

The 3D homepage is progressive enhancement. It must never be the only way to navigate the website.

## Product statement

> A personal developer portfolio whose homepage behaves like an early-2000s operation-room game menu: one fixed low-poly room, physical objects as navigation targets, and a compact hanging green board that displays only the currently selected section name.

The approved homepage is no longer the previous tactile collage / Developer Workbench hero. That direction is superseded by `22_OPERATION_ROOM_3D.md` and the approved low-poly visualization from the design conversation; `reference/README.md` records the interpretation rules.

## Core homepage rules

- The room geometry and camera proportions matter more than decorative detail.
- Low-poly is intentional; higher fidelity is not inherently better.
- The wall map represents Work.
- Papers/field notes represent Writing.
- Radio/communications equipment represents Speaking.
- Rotary telephones represent Contact.
- Film projector represents About.
- The hanging green board is **one row high** and shows **one section name only**.
- No floating labels are placed over interactive room areas.
- Hover/focus/touch highlights the physical area and updates the board.
- Long-form/project content remains normal HTML outside WebGL.

## Package contents

| File | Purpose |
|---|---|
| `01_PRODUCT_PRINCIPLES.md` | Product goals, non-goals, UX rules |
| `02_INFORMATION_ARCHITECTURE.md` | Routes, navigation, content hierarchy |
| `03_TECHNICAL_ARCHITECTURE.md` | Monorepo, Astro, Three.js, Payload, data flow, deployment |
| `04_DESIGN_SYSTEM.md` | Visual tokens for semantic content pages |
| `05_GLOBAL_LAYOUT_AND_NAVIGATION.md` | Global navigation outside the 3D homepage |
| `06_HOME_PAGE.md` | Homepage behavior summary |
| `07_WORK_AND_PROJECTS.md` | Work index and project detail case-study UX |
| `08_WRITING_AND_ARTICLES.md` | Writing index, article layout, code, embeds |
| `09_SPEAKING.md` | Speaking/talks page |
| `10_ABOUT_AND_CONTACT.md` | About and contact experiences |
| `11_RESPONSIVE_BEHAVIOR.md` | Breakpoints and desktop/mobile adaptation |
| `12_COMPONENT_LIBRARY.md` | Component inventory and contracts |
| `13_PAYLOAD_CMS_MODEL.md` | Collections, globals, fields, publishing rules |
| `14_DATA_ACCESS_AND_BUILD.md` | Astro/Payload integration, caching, errors, webhooks |
| `15_CONTENT_MIGRATION.md` | Legacy content import, routes, redirects, validation |
| `16_MOTION_AND_INTERACTION.md` | Motion, focus and reduced-motion behavior |
| `17_ACCESSIBILITY_SEO_PERFORMANCE.md` | Quality constraints and budgets |
| `18_TESTING_AND_QA.md` | Testing strategy and browser/device matrix |
| `19_IMPLEMENTATION_PLAN.md` | Delivery slices and ticket-sized work |
| `20_DEFINITION_OF_DONE.md` | Final acceptance checklist |
| `21_IMPLEMENTATION_DECISIONS_AND_REFERENCES.md` | Recorded architectural decisions |
| `22_OPERATION_ROOM_3D.md` | Geometry, camera, hotspots and canvas behavior |
| `reference/README.md` | Approved-composition notes for the 3D room |

## Recommended defaults

- Package manager: `pnpm`
- TypeScript: strict
- Frontend: Astro static generation
- Homepage 3D: Three.js directly; no React Three Fiber
- CMS: Payload in a separate Next.js application
- Database: SQLite/libSQL initially
- Rich text: Payload Lexical
- CSS: normal CSS + Astro scoped styles; CSS Modules where useful
- No Tailwind
- No SPA shell
- No React on the frontend unless a later feature genuinely requires it
- Existing article URLs preserved whenever practical
- RSS preserved

## Implementation philosophy

Prefer solutions that keep the room geometry explicit, use primitives before imported assets, preserve semantic HTML outside canvas, keep the 3D homepage progressive, and preserve the approved screen-space composition rather than independently redesigning the room.
