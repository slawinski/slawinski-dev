# Accessibility, SEO and Performance

# Part A — Accessibility

## 1. Target

Meet WCAG 2.2 AA for normal public interactions/content as a practical baseline.

---

## 2. Semantic structure

Requirements:
- one main `<h1>` per page;
- logical heading hierarchy;
- real `<nav>`, `<main>`, `<article>`, `<footer>`;
- links for navigation;
- buttons for actions;
- lists for repeated list content.

Do not reproduce the visual scrapbook with meaningless nested divs.

---

## 3. Color

Text contrast:
- body/UI meets AA;
- decorative faded text that conveys meaning also meets contrast;
- highlighter behind text cannot reduce readability.

Do not use color alone for:
- current nav;
- project status;
- selected filter.

---

## 4. Keyboard

Everything interactive:
- reachable;
- visible focus;
- logical order;
- no keyboard trap except intentional modal/dialog containment.

Visual absolute positioning must not create nonsensical DOM order.

---

## 5. Images

Editorial image:
- meaningful alt.

Decorative texture/tape/stamp:
- `aria-hidden`;
- empty alt if rendered as `<img>`.

Screenshots:
- alt describes what matters, not every pixel.

---

## 6. Mobile menu

Must support:
- focus trap/dialog semantics;
- Escape;
- focus return;
- scroll lock;
- screen reader expanded state.

---

## 7. Motion

Respect `prefers-reduced-motion`.

Avoid strong flicker entirely.

---

# Part B — SEO

## 8. Metadata

Every public page:
- unique `<title>`;
- meta description;
- canonical;
- OpenGraph title/description/image/url;
- social card metadata.

Fallback social image from Site Settings.

---

## 9. Structured data

Use only accurate schema.

Likely:
- `Person` on About/Home if desired;
- `BlogPosting` for posts;
- `WebSite` basic metadata.

Do not overstuff structured data.

---

## 10. Sitemap/robots

Generate sitemap.

Robots:
- public site indexable;
- CMS/admin disallowed/non-indexed at server/meta level;
- dev routes excluded.

---

## 11. Legacy SEO

Preserve article URLs.

Permanent redirect for changed project/index URLs.

No redirect chains.

---

# Part C — Performance

## 12. Performance budgets

Targets on representative mobile run:

- LCP: <= 2.5s target
- CLS: <= 0.1
- INP: <= 200ms target

Asset/bundle goals:
- page JS: ideally <50KB compressed for most pages, excluding optional third-party media;
- no JS required for article reading;
- avoid homepage raster payload explosion;
- font files subset/minimized.

These are engineering targets, not excuses to hide content.

---

## 13. Images

- explicit dimensions;
- modern formats through image pipeline;
- responsive sizes;
- lazy-load below fold;
- LCP image eager/high priority;
- decorative raster textures heavily compressed.

No giant 4K texture as CSS background.

---

## 14. Fonts

Self-host preferred.

Reduce:
- number of families;
- number of weights;
- character sets if appropriate.

Use `font-display: swap`.

Preload only genuinely critical font resources.

---

## 15. Third-party scripts

Default: none.

Any analytics:
- privacy-conscious;
- deferred;
- minimal.

YouTube/social embeds:
- lazy.

No tag-manager container unless there is a concrete need.

---

## 16. CSS

Do not recreate Tailwind utilities manually.

Keep:
- global tokens;
- local scoped styles;
- small number of shared utility rules.

Avoid enormous global stylesheet produced by abandoned variants.

---

## 17. CLS risk checklist

Reserve space for:
- hero portrait;
- project covers;
- talk thumbnails;
- video embeds;
- font fallback differences as practical.

Sticky header height constant.

---

## 18. Performance test pages

At minimum:
- homepage;
- work detail with gallery;
- writing index;
- longest/code-heavy article;
- mobile menu interaction.

Test production build, not dev server.
