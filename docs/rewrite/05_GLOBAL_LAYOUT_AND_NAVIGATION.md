# Global Layout and Navigation

## 1. Page shell

Every public page uses a shared `BaseLayout.astro`.

Responsibilities:
- `<html>` metadata/lang;
- font preloads;
- global styles;
- SEO metadata;
- skip link;
- header;
- main slot;
- footer;
- optional page-level decorative layer;
- reduced-motion behavior.

Structure:

```html
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <SiteHeader />
  <main id="main">
    <slot />
  </main>
  <SiteFooter />
</body>
```

---

## 2. Header — desktop

Target height: 64–76px.

Layout:
- left: `P.S.` monogram / compact logo;
- center/right: Work, Writing, Speaking, About, Contact;
- optional far-right tiny decorative theme/sun mark only if it has a real action.

Header visual:
- paper background;
- bottom ink line;
- low decorative density;
- sits above collage layers.

Behavior:
- sticky is preferred if it does not obscure anchor targets;
- use `position: sticky; top: 0`;
- assign high z-index token;
- add subtle background opacity/texture but avoid blur-heavy glassmorphism.

Active route:
- small highlighter strip or marker dot;
- also `aria-current="page"`.

---

## 3. Logo

Desktop:
- `P.S.` wordmark/monogram, textual or SVG;
- must have accessible name linking to Home.

Mobile:
- same logo, not a different brand.

Avoid animated logo intros.

---

## 4. Mobile header

Height: ~56–64px.

Contents:
- logo left;
- menu button right.

Menu button:
- 44x44 minimum;
- clear accessible label;
- uses `aria-expanded`;
- returns focus properly when menu closes.

---

## 5. Mobile menu

Visual reference: black technical-panel / chalkboard-like sheet, not a tiny dropdown.

Preferred implementation:
- native `<dialog>` where browser support and focus behavior are acceptable;
- otherwise an accessible fixed overlay with explicit focus management.

Content:
- Work
- Writing
- Speaking
- About
- Contact
- footer social icons/links

Full-height panel:
- near-black textured surface;
- large links;
- one handwritten decorative note;
- close button top right.

Interactions:
- Escape closes;
- click/tap close control closes;
- selecting route closes;
- body scrolling is locked while open;
- focus cannot disappear behind panel.

No animated "terminal typing" for menu labels.

---

## 6. Main page width

Global outer frame:

```css
.page-shell {
  width: min(100% - 2 * var(--page-gutter), 1440px);
  margin-inline: auto;
}
```

Some decorative backgrounds may span full viewport.

Content must not horizontally scroll at any supported width.

---

## 7. Page intro pattern

Most section pages use:

```text
[large title]
[short 1–3 line intro]
[small decorative label/scribble]
```

Do not reuse the exact same collage on every page.

Each page gets one identifying motif:
- Work: case files / technical labels
- Writing: marked-up notes / index cards
- Speaking: badges / tickets / stage notes
- About: photo prints / annotations
- Contact: postcard / address label

---

## 8. Footer

Target:
- visually calm;
- separated from page by heavy line or black panel;
- responsive wrap.

Desktop:
- 2–3 rows or two columns.

Mobile:
- stack logically;
- no micro-sized link grid.

Include:
- copyright with current year generated programmatically;
- RSS;
- GitHub;
- LinkedIn;
- contact/email;
- optional build-stack note.

---

## 9. Focus treatment

All links/buttons:
- visible focus state;
- focus style may use blue pen outline or acid highlighter;
- minimum 2px effective contrast;
- do not remove browser focus unless replaced.

Example:

```css
:focus-visible {
  outline: 3px solid var(--color-blue);
  outline-offset: 3px;
}
```

Decorative elements must never receive focus.

---

## 10. Z-index scale

Define named tokens:

```text
base             0
decorative       10
content          20
sticky-header    100
popover          200
mobile-menu      300
skip-link        400
```

Do not solve overlap bugs with arbitrary values like `999999`.

---

## 11. Scroll behavior

Normal browser scrolling only.

Allowed:
- `scroll-behavior: smooth` only when reduced motion is not requested.

Disallowed:
- scroll snapping for pages;
- hijacked wheel/touch events;
- custom inertial scrolling;
- section-by-section forced viewport scrolling.
