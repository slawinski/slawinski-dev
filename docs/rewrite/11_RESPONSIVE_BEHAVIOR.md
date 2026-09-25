# Responsive Behavior

## 1. Philosophy

The design has distinct desktop and mobile compositions.

Do not merely shrink absolute-positioned desktop art.

Use:
- normal document flow first;
- grid/flex for structure;
- absolute positioning only inside bounded decorative composition containers;
- container/media queries for controlled changes.

---

## 2. Breakpoints

Reference breakpoints:

```css
--bp-sm: 480px;
--bp-md: 768px;
--bp-lg: 1024px;
--bp-xl: 1280px;
--bp-2xl: 1600px;
```

Implementation may use media queries directly; CSS custom properties cannot be used as media query conditions in standard CSS.

Key layout transitions:
- `<768`: mobile
- `768–1023`: tablet/compact
- `>=1024`: desktop composition
- `>=1600`: cap content width, increase whitespace rather than endlessly scaling objects

---

## 3. Mobile global rules

At 320–767px:

- 16px page gutter;
- header collapses to logo + menu;
- no horizontal page scrolling;
- display type clamps down sharply;
- cards become one column;
- large decorative objects move into flow;
- small stamps/scribbles may disappear;
- touch targets >=44px;
- hover effects cannot be required;
- body text >=16px default.

---

## 4. Tablet rules

At 768–1023px:
- header may remain mobile-style if nav would crowd;
- hero may use 2 columns but with fewer decorations;
- project grids may become 2 columns;
- article reading width stays constrained;
- reduce large rotations/overlap.

Do not force desktop nav at 768px if labels collide.

---

## 5. Desktop rules

At >=1024px:
- full nav;
- collage zones can use layered placement;
- 12-column grid;
- asymmetric Work layouts;
- project metadata can use side rail;
- decorative margin elements allowed.

---

## 6. Very large screens

At >1600px:
- page content remains max ~1440px;
- paper/background can span viewport;
- do not scale hero title beyond its defined clamp;
- avoid huge empty central gaps;
- decorative edge bleed can occupy extra outer space.

---

## 7. Homepage responsive order

Desktop visual order may differ from DOM placement, but DOM must be logical:

1. identity;
2. hero copy;
3. primary CTAs;
4. portrait;
5. currently;
6. supplementary CRT links;
7. featured work.

On mobile, render largely in that sequence.

Use CSS grid areas rather than DOM reordering if possible.

---

## 8. Decorative simplification matrix

| Element | Desktop | Tablet | Mobile |
|---|---|---|---|
| Portrait print | full | full | full |
| CRT quick nav | full | compact | optional compact |
| Retro dialog | yes | optional | hidden/moved |
| Sticky note | floating | in-flow-ish | in flow |
| Stamps | 2–3 | 1–2 | 0–1 |
| Scribbles | several | few | minimal |
| Paper texture | full | full | lighter |
| Card rotation | up to ~2° | up to ~1° | <=1° |

---

## 9. Images

Use responsive `srcset`/Astro image tooling where possible.

Rules:
- never ship desktop hero source dimensions to a 320px device unnecessarily;
- define `width`/`height` or aspect ratio;
- object-position tuned per image if crop changes;
- CMS supports focal point if needed.

---

## 10. Typography clamps

Display type:
```css
font-size: clamp(2.75rem, 8vw, 8rem);
```

Section heading:
```css
font-size: clamp(2.1rem, 5vw, 5rem);
```

Article title:
```css
font-size: clamp(2rem, 4.5vw, 4.5rem);
```

Do not scale body copy using viewport units.

---

## 11. Absolute-positioned decoration

Allowed only within a parent with:
- predictable min/max height;
- `position: relative`;
- explicit overflow behavior.

Every decorative element needs breakpoint overrides.

Never position important text at viewport coordinates.

---

## 12. Test widths

Mandatory screenshot QA:
- 320×568
- 375×812
- 390×844
- 430×932
- 768×1024
- 1024×768
- 1280×800
- 1440×900
- 1920×1080

Also resize continuously between breakpoints to catch collision states.
