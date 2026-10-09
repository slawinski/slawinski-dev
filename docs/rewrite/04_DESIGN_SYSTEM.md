# Design System

## 1. Visual concept

Working name: **Developer Workbench**.

The UI should feel like physical and digital objects collected over years:
- annotated printouts;
- conference badges;
- old interfaces;
- sticky notes;
- CRT/LCD devices;
- label-maker strips;
- black technical panels;
- taped photographs;
- highlighter marks;
- stamped case-file labels.

It should not become:
- generic Y2K;
- vaporwave;
- skeuomorphic realism;
- kawaii overload;
- cyberpunk;
- faux Windows 95 everywhere.

---

## 2. Color tokens

Starting palette:

```css
:root {
  --color-paper: #f1eadc;
  --color-paper-2: #e7ddcc;
  --color-ink: #111111;
  --color-ink-muted: #45413b;
  --color-line: #1b1b1b;
  --color-acid: #c7ff36;
  --color-yellow: #ffd64a;
  --color-orange: #ef5b2a;
  --color-blue: #2457d6;
  --color-red: #d94838;
  --color-green-screen: #b8ff73;
  --color-black-panel: #151515;
  --color-white: #fffdf7;
}
```

These values are implementation defaults, not branding law. Fine-tuning is allowed during visual QA if contrast remains compliant.

### Usage

Paper:
- main page background;
- cards;
- article body.

Ink:
- primary text;
- thick borders;
- icons.

Acid:
- key highlight;
- active marker;
- small label strip;
- never a large full-page background.

Yellow:
- sticky note;
- secondary marker.

Blue:
- stamp/pen annotation;
- interactive accent.

Orange/red:
- occasional attention accent.

Avoid using all accent colors in every component.

---

## 3. Typography

Recommended open-font stack:

- Display: `Archivo Black` or equivalent heavy grotesk
- UI/body: `IBM Plex Sans` or equivalent
- Code/labels: `IBM Plex Mono`
- Handwriting: `Caveat` or a purpose-built handwritten SVG set

Self-host fonts where practical.

### Weight discipline

Display:
- 800/900

Body:
- 400/500

UI:
- 500/600

Mono:
- 400/600

Handwriting:
- one weight only

### Scale

Desktop reference:

```css
--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-md: 1rem;
--text-lg: 1.25rem;
--text-xl: 1.5rem;
--text-2xl: clamp(2rem, 3vw, 3rem);
--text-hero: clamp(3.5rem, 8vw, 8.5rem);
```

Article body:
- 1.05–1.15rem depending on final font
- line-height 1.65–1.75
- max measure ~68–74 characters

### Display treatment

Large headings may:
- use very tight line-height;
- overlap a highlight strip;
- use slight negative tracking;
- include one deliberate line break.

Do not use distorted text for body/UI.

---

## 4. Spacing system

Base unit: 4px.

Tokens:

```text
4, 8, 12, 16, 24, 32, 48, 64, 96, 128
```

Body page gutters:
- mobile: 16px
- small tablet: 24px
- desktop: 32–48px
- large desktop: 64px max

Reading content must not inherit collage spacing.

---

## 5. Grid

Desktop page frame:
- max content width: 1440px
- 12-column conceptual grid
- 24px gutters
- decorative elements may bleed outside columns but not outside safe viewport area

Article:
- central reading column
- optional metadata/TOC rail only if it does not reduce reading measure

Mobile:
- 4-column conceptual grid
- most content spans full width
- decorative offset max roughly 8–16px from normal flow

---

## 6. Borders

Primary border:
- 1.5–2px solid ink

Heavy object border:
- 3px

Stamp border:
- 2px, uneven effect may be achieved with background/SVG texture, not randomly varying CSS widths.

Rounded corners:
- paper: 2–6px
- UI/plastic controls: 8–14px
- pills/tags: 999px only where semantically a tag/chip
- avoid "everything is a 24px rounded SaaS card"

---

## 7. Shadows

Use physical shadows, not glassmorphism.

Examples:

```css
--shadow-paper: 3px 5px 0 rgb(17 17 17 / 0.18);
--shadow-card: 5px 7px 0 rgb(17 17 17 / 0.24);
--shadow-float: 0 14px 30px rgb(17 17 17 / 0.18);
```

Some objects can use hard offset shadows.

Do not combine strong blur + thick hard shadow + border on every element.

---

## 8. Texture

Allowed:
- subtle paper grain;
- halftone;
- photocopy noise;
- printer misregistration;
- CRT scanline;
- ink distress;
- torn-paper edge.

Rules:
- textures are low contrast;
- texture must not reduce text contrast;
- article body background is calmer than homepage;
- mobile receives lower-resolution/lighter texture assets;
- avoid full-screen animated grain.

Prefer CSS gradients/SVG filters/small repeatable assets over huge raster textures.

---

## 9. Rotation and imperfection

Define explicit variants:

```text
rotate-none   0deg
rotate-left   -1.25deg
rotate-right  1deg
rotate-more   2.25deg
```

Do not generate random rotation at runtime.

The same content must render deterministically to prevent layout movement and snapshot-test instability.

Never rotate body paragraphs or form controls.

---

## 10. Material components

### Paper card
- off-white/paper fill;
- ink border;
- small hard shadow;
- optional tape/staple decoration.

### Sticky note
- yellow or paper tint;
- handwritten secondary text;
- slight rotation;
- no more than ~120 characters.

### Case-file label
- mono uppercase;
- blue/ink outline;
- slightly stamped/distressed visual;
- project number/status.

### Black technical panel
- near-black background;
- off-white/green-screen text;
- mono labels;
- used for terminal/LCD/project technical facts.

### Browser fragment
- decorative framed region inspired by old browser/dialog chrome;
- controls need not function unless clearly interactive;
- never mimic a real security warning.

### Photo print
- media framed like printed photo;
- optional caption;
- small rotation/tape.

---

## 11. Icons

Prefer:
- simple line icons;
- 2px stroke;
- small custom SVG set or a consistent library.

Do not mix:
- emoji;
- filled Material icons;
- thin Lucide;
- pixel icons

inside the same control family.

Decorative smiley/stamp icons may be bespoke and do not define UI icon style.

---

## 12. Buttons and links

Primary button:
- ink or black-panel fill;
- light text;
- 2px border;
- hard shadow optional;
- clear hover/active displacement.

Secondary:
- paper background;
- ink border.

Text link:
- underline or visible arrow/marker;
- not dependent on color alone.

Pressed interaction:
- transform by max 1–2px;
- shadow compresses.

Minimum target:
- 44 × 44 CSS px for touch actions.

---

## 13. Tags

Tags are content metadata, not primary CTAs.

Style:
- small mono or sans;
- quiet paper/gray fill;
- 1px border;
- rounded pill allowed.

Active filter:
- ink background / paper text OR acid highlight + strong border.

---

## 14. Decorative density

Set density by page region:

- homepage hero: high
- homepage lower sections: medium
- work index: medium
- project hero: medium-high
- project body: low-medium
- writing index: low-medium
- article body: low
- speaking: medium
- about: medium
- contact: low

This rule should be visible in code composition, not just design review.
