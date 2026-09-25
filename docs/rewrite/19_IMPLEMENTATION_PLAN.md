# Implementation Plan

This plan is intentionally sliced so a developer or coding agent can work ticket-by-ticket with stable acceptance boundaries.

## Phase 0 — Repository preparation

### Ticket 0.1 — Archive and baseline current site
- capture production route inventory;
- capture Lighthouse baseline;
- save representative screenshots;
- record current content counts;
- ensure current branch/history is preserved.

Done when:
- baseline artifacts exist in repo/docs;
- rewrite can proceed without relying on memory of current site.

### Ticket 0.2 — Create workspace
- pnpm workspace;
- `apps/web`;
- `apps/cms`;
- `packages/contracts`;
- shared lint/format scripts;
- TypeScript strict.

Done when:
- root `pnpm dev` starts web + CMS;
- root typecheck/lint works.

---

## Phase 1 — CMS foundation

### Ticket 1.1 — Payload bootstrap
- supported Next.js/Payload setup;
- SQLite adapter;
- Users;
- Media;
- env example;
- local persistent DB.

### Ticket 1.2 — Content schema
- Posts;
- Tags;
- Projects;
- Talks;
- Site Settings;
- Home Page;
- About Page.

### Ticket 1.3 — CMS publishing workflow
- drafts where specified;
- access control;
- publish hook abstraction;
- slug validation.

### Ticket 1.4 — Seed
- development seed content;
- placeholder media.

Exit:
- editor can create representative content from admin.

---

## Phase 2 — Astro foundation

### Ticket 2.1 — Astro shell
- strict TypeScript;
- global styles;
- tokens;
- BaseLayout;
- header/footer;
- SEO helper.

### Ticket 2.2 — Content client
- Payload client;
- DTOs;
- mappers;
- validation/error behavior.

### Ticket 2.3 — Design primitives
- typography;
- buttons;
- tags;
- paper cards;
- sticky note;
- stamp;
- photo print;
- black panel;
- case-file label.

### Ticket 2.4 — Dev component gallery
- development-only `/dev/components`.

Exit:
- component primitives visually approved before full page work.

---

## Phase 3 — Global responsive navigation

### Ticket 3.1 — Desktop header/footer
### Ticket 3.2 — Mobile menu
### Ticket 3.3 — Focus/reduced-motion behavior

Exit:
- navigation works fully on keyboard/mobile.

---

## Phase 4 — Homepage

### Ticket 4.1 — Hero composition
- identity;
- portrait;
- highlight;
- annotations.

### Ticket 4.2 — Supplementary objects
- CRT quick nav;
- currently note;
- optional retro dialog.

### Ticket 4.3 — Featured Work
### Ticket 4.4 — Latest Writing / Speaking / Contact CTA
### Ticket 4.5 — Responsive composition pass

Exit:
- homepage complete desktop/mobile;
- LCP/CLS pass.

---

## Phase 5 — Work

### Ticket 5.1 — Work index
### Ticket 5.2 — Project route generation
### Ticket 5.3 — Project hero/facts
### Ticket 5.4 — Project rich content blocks
### Ticket 5.5 — Related projects
### Ticket 5.6 — responsive/visual QA

---

## Phase 6 — Writing

### Ticket 6.1 — Writing index
### Ticket 6.2 — tag filters with linkable query
### Ticket 6.3 — article layout
### Ticket 6.4 — rich-text renderer
### Ticket 6.5 — code blocks
### Ticket 6.6 — embeds
### Ticket 6.7 — RSS
### Ticket 6.8 — article SEO

---

## Phase 7 — Speaking / About / Contact

### Ticket 7.1 — Speaking
### Ticket 7.2 — About
### Ticket 7.3 — Contact
### Ticket 7.4 — 404

---

## Phase 8 — Migration

### Ticket 8.1 — inspect legacy Markdown
### Ticket 8.2 — import media
### Ticket 8.3 — Markdown -> Payload conversion
### Ticket 8.4 — project export/import
### Ticket 8.5 — redirects
### Ticket 8.6 — migration verification report

Exit:
- content count reconciled;
- no unexplained legacy URL loss.

---

## Phase 9 — Deployment

### Ticket 9.1 — CMS production deployment
- database persistence;
- media;
- backups;
- noindex/admin security.

### Ticket 9.2 — web deployment
- production env;
- CDN/static host.

### Ticket 9.3 — publish-to-build webhook
### Ticket 9.4 — domain/canonical config

---

## Phase 10 — Quality gate

### Ticket 10.1 — E2E tests
### Ticket 10.2 — accessibility review
### Ticket 10.3 — visual regression
### Ticket 10.4 — performance optimization
### Ticket 10.5 — SEO/redirect audit
### Ticket 10.6 — production smoke test

---

## Ticket execution rules

Each ticket should include:
- code;
- tests appropriate to the behavior;
- mobile state where relevant;
- accessibility consideration;
- no unrelated refactor.

Do not implement future phases preemptively if it complicates the current ticket.

---

## Visual review checkpoints

Require explicit visual review after:
1. primitives;
2. homepage hero;
3. project card + detail;
4. writing article;
5. mobile menu;
6. full mobile pass.

This prevents the whole site from being built on a misunderstood visual direction.

---

## Recommended development order rationale

CMS/data contracts are created before pages so page components consume real shapes.

Design primitives are created before pages so maximalism stays systematic.

Homepage is built before archive pages because it establishes the visual language.

Writing receives its own phase because migrated rich text/code/embed behavior is a separate technical risk from layout.

Migration comes after target renderers are stable, avoiding repeated conversion work while schemas change.
