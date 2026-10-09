# Motion and Interaction

## 1. Principle

Motion should make tactile objects feel responsive, not turn the site into an animation showcase.

Most of the design should be understandable in a static screenshot.

---

## 2. Motion tokens

Suggested:

```css
--duration-fast: 120ms;
--duration-ui: 180ms;
--duration-medium: 280ms;

--ease-out: cubic-bezier(.2,.8,.2,1);
--ease-press: cubic-bezier(.2,.7,.3,1);
```

Avoid >500ms UI animations.

---

## 3. Button interaction

Hover:
- hard shadow shifts slightly;
- object may translate `-1px -1px`.

Active:
- translate toward shadow by 1–2px;
- shadow compresses.

Focus:
- focus outline independent of hover motion.

Reduced motion:
- no transform required;
- style/color/shadow state may change instantly.

---

## 4. Project card hover

Desktop pointer devices:
- optional 1–2px lift;
- optional rotation correction by <1 degree;
- title underline/arrow movement.

No 3D perspective tilt based on cursor position in v1.

Reason:
- extra JS;
- distracting in a dense visual system;
- accessibility/motion cost.

---

## 5. Image reveal

Allowed:
- simple opacity/translate entrance for below-the-fold sections if desired.

Rules:
- no content hidden indefinitely waiting for JS;
- use CSS when possible;
- IntersectionObserver only if effect adds clear value;
- content should render visible by default if script fails.

---

## 6. Page navigation

Normal browser navigation.

Optional View Transitions can be considered after v1 base is complete.

If used:
- subtle;
- no dramatic zooming between cards/pages;
- respects reduced motion;
- does not delay navigation.

---

## 7. Mobile menu motion

Open:
- fade backdrop;
- panel translate/scale minimally.

Close:
- reverse quickly.

Total ~180–250ms.

Focus management is more important than animation.

---

## 8. CRT effects

Allowed:
- static scanlines;
- very subtle one-time flicker on hover/focus if safe.

Disallowed:
- continuous strong flicker;
- flashing text;
- noise animation covering screen;
- effects that reduce readability.

---

## 9. Scribbles

Do not animate handwriting drawing by default.

A tiny underline reveal may be used once on page load, but it is nonessential.

---

## 10. Reduced motion

Global:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
  }
}
```

Do not blindly set `animation-duration: 0.01ms` if it breaks dialog/menu state transitions. Disable decorative animation explicitly.

---

## 11. Pointer capability

Use:
```css
@media (hover: hover) and (pointer: fine) { ... }
```

for hover-specific transforms.

Mobile/touch cannot depend on hover.

---

## 12. JavaScript budget for interactions

Core navigation/menu/filter behavior should remain small.

Do not ship a general animation framework in v1.

If an animation library is proposed later, record:
- feature requiring it;
- bundle cost;
- no-library alternative;
- reduced-motion behavior.
