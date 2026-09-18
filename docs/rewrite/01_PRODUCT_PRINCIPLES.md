# Product Principles

## 1. Goals

The rewrite must accomplish five things simultaneously.

### 1.1 Present a recognizable personal identity

The site must not resemble a generic developer portfolio template. A screenshot of the homepage should be recognizable even if the logo/name is removed.

The identity should come from:

- tactile materials;
- bold editorial typography;
- physical-looking labels, paper cards, sticky notes and stamps;
- selectively nostalgic browser/terminal/CRT elements;
- handwritten annotations;
- playful but disciplined copy;
- visible traces of "work in progress" without appearing unfinished.

### 1.2 Make the user's work easier to evaluate

Visitors should understand within seconds:

- who this site belongs to;
- what kind of work the author does;
- where to see selected projects;
- where to read technical writing;
- whether speaking/community work exists;
- how to make contact.

The site is not an interactive art experiment that requires exploration before information appears.

### 1.3 Make long-form writing excellent

The existing site has a meaningful article archive. Reading must remain first-class.

Articles must be:

- comfortable at 320–1920+ px;
- readable without decorative collisions;
- accessible with normal document semantics;
- excellent for code-heavy technical content;
- linkable at stable URLs;
- indexable;
- available in RSS.

### 1.4 Make content administration boring

The frontend may look extravagant. CMS workflows should not.

An editor should be able to create/publish:

- a post;
- a project;
- a talk;
- media;
- homepage featured selections

without understanding Astro or committing code.

### 1.5 Keep the site cheap and maintainable

This is a personal site. Architecture must remain proportionate.

Avoid:

- distributed systems;
- a page-builder schema;
- a frontend state framework for static content;
- PostgreSQL solely because it is fashionable;
- complex image transformation infrastructure if Payload/Astro can already handle the requirement;
- runtime fetching for content that changes only when published.

---

## 2. Non-goals

The following are explicitly out of scope for v1:

- user accounts;
- comments;
- likes/reactions;
- ecommerce;
- a public API product;
- multilingual content;
- full-text server search;
- a visual page builder;
- draggable desktop/window-manager UI;
- WebGL;
- canvas-rendered content;
- a persistent "desktop state";
- theme editor;
- custom cursor;
- ambient audio;
- fake terminal that is required for navigation;
- public CMS login;
- analytics dashboards in the public UI.

A feature may be added later only if it improves the portfolio rather than simply increasing novelty.

---

## 3. Experience principles

### P1 — conventional structure, unconventional surface

Navigation follows familiar patterns. Routes are ordinary. Links look clickable. The unusual part is visual treatment.

### P2 — decoration never carries unique meaning

A scribble may emphasize a heading, but the heading still makes sense without it.

A CRT may contain navigation links, but equivalent navigation must exist in the global header/menu.

A sticky note may say "currently", but important status information must not exist only as handwriting inside an image.

### P3 — density is composed, not random

Overlap is allowed in hero/composition zones. Body content uses clear rhythm.

Maximum overlap is primarily allowed in:
- homepage hero;
- section intros;
- project hero;
- decorative page endings.

Do not overlap primary reading content.

### P4 — every decorative object belongs to a material family

Do not introduce arbitrary visual styles per page.

Allowed material families:
- paper;
- label/sticker;
- plastic control;
- CRT/LCD;
- stamped ink;
- marker/highlighter;
- black technical panel;
- photographic print.

### P5 — authored imperfection

Rotations, torn edges and handwritten marks are deterministic and limited. They should look designed, not like random CSS.

### P6 — performance is part of the aesthetic

A nostalgic/physical website should still feel instantaneous. The site must not emulate old internet performance.

### P7 — mobile is a designed composition

Mobile is not "desktop but stacked". It has its own hierarchy and deliberate cropping/reordering.

---

## 4. Audience

Primary:
- engineering/product hiring managers;
- recruiters;
- peers evaluating technical depth;
- people arriving from an article, talk, GitHub or social profile.

Secondary:
- community/event organizers;
- readers returning for articles;
- collaborators and prospective clients.

No audience-specific personalization is required.

---

## 5. Success signals

The rewrite is successful when:

- a first-time visitor can reach Work, Writing, Speaking, About and Contact without learning the interface;
- the homepage communicates identity and selected work within the first viewport on desktop and first ~2 mobile screens;
- an article is at least as readable as a conventional editorial blog;
- page transitions and interactions feel fast on mid-range mobile devices;
- content updates do not require frontend code changes;
- the visual system is consistent enough that new cards/pages can be generated from documented variants;
- Lighthouse/performance testing is not sacrificed for decorative assets.

---

## 6. Copy voice

The UI copy should be concise, self-aware and human.

Good:
- "Things I built"
- "Notes from the web"
- "Case file 03"
- "Currently tinkering with…"
- "Open the project"
- "Read the whole thing"

Avoid:
- corporate portfolio clichés ("innovative solutions", "passionate developer");
- forced meme language;
- excessive retro jargon;
- jokes that make a CTA unclear.

Every CTA must describe its action even if the surrounding label is playful.
