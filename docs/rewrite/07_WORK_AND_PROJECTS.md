# Work and Projects

Routes:
- `/work`
- `/work/[slug]`

## 1. Work index goal

Present selected software/product work as credible case studies, not as a gallery of logos or screenshots.

The index should answer:
- what was built;
- what role the author played;
- what kind of problem/work it represents;
- whether a deeper case study exists.

---

## 2. Work index intro

Desktop:
- large `WORK` heading;
- short intro;
- case-file stamp/scribble;
- optional count (`06 case files`) as decoration.

Mobile:
- large title but not hero-sized;
- intro below;
- stamp can sit in margin or disappear.

---

## 3. Featured project cards

Card data:
- `title`
- `slug`
- `shortDescription`
- `cover`
- `year`
- `role`
- `status`
- `tags`
- `featured`

Card style:
- case file / technical specimen;
- paper or dark-panel variant;
- strong cover area;
- visible title;
- short metadata.

Avoid:
- equal 3-column SaaS cards with identical white rounded containers;
- hover-only critical text.

Desktop layout:
- editorial asymmetric grid;
- 2 columns is preferred;
- occasional full-width featured card.

Mobile:
- one column.

---

## 4. Status vocabulary

CMS enum:

```text
live
ongoing
archived
prototype
private
```

UI labels may be:
- Live
- Ongoing
- Archived
- Prototype
- Private

Status is factual, not a quality rating.

---

## 5. Project detail hero

Structure:

```text
Back to all projects

[CASE FILE 03]

PROJECT TITLE
one-sentence summary

[tag] [tag] [tag]

[large hero media]

[short project introduction]     [facts panel]
                                 role
                                 year
                                 status
                                 links
```

Desktop:
- split intro/facts after media or alongside depending on content.

Mobile:
- title, tags, media, intro, facts stacked.

---

## 6. Facts panel

Fields:
- Role
- Timeframe/year
- Status
- Team context (optional)
- Stack (optional)
- Links

Do not display empty labels.

Links:
- live site;
- GitHub;
- article;
- store/listing
as available.

External links must indicate external destination accessibly where needed.

---

## 7. Case study body

Recommended sections, all optional except Overview:

### Overview
What the product/project is and why it exists.

### Context / Problem
The constraint or product/engineering problem.

### My contribution
What the author was responsible for.

### Decisions
2–5 substantive implementation/product decisions.

### Selected implementation
Technical detail where useful:
- architecture;
- rendering;
- state/data;
- UX tradeoffs;
- performance;
- tooling.

### Outcome / Current state
What happened or what exists now.

### What I learned
Optional, honest retrospective.

Do not fabricate numeric impact.

---

## 8. Case study content model philosophy

Case study body can be rich text + controlled blocks.

Allowed blocks:
- full-width image;
- image pair;
- captioned image;
- pull quote;
- code block;
- technical facts panel;
- link card;
- video embed.

Do not create a generic page-builder with arbitrary nested layout controls.

The frontend decides how each block looks.

---

## 9. Media gallery

Images:
- need alt text;
- optional caption;
- optional `presentation` field: `browser`, `device`, `raw`, `photo`.

Do not force every screenshot into a fake laptop.

For mobile screenshots:
- use a narrow frame/card;
- allow 2-up on desktop where appropriate.

---

## 10. Decorative project identity

Projects may optionally define:
- accent color from a controlled palette;
- case number;
- short handwritten annotation.

Do not let editors choose arbitrary CSS colors.

Example CMS field:

```text
accent:
  neutral | acid | blue | orange | yellow
```

---

## 11. Related navigation

At bottom:
- next project OR
- 1–2 related projects;
- `Back to Work`.

Avoid carousels.

---

## 12. Private/confidential projects

If a project cannot show screenshots:
- use an abstract/project-specific graphic;
- provide safe descriptive content;
- mark `Private` if useful.

Never expose confidential client information just to make a case study feel complete.

---

## 13. SEO

Every project:
- title;
- description;
- canonical;
- social image;
- project structured metadata where appropriate but do not invent unsupported schema properties.

Featured image should have a stable social crop or dedicated OG image.

---

## 14. Acceptance criteria

- project cards remain understandable without hover;
- project detail works if no live URL exists;
- detail works if only one image exists;
- detail works if no "outcome metrics" exist;
- images do not cause layout shift;
- content sections are generated from CMS with stable component mappings;
- no arbitrary layout controls are exposed in CMS.
