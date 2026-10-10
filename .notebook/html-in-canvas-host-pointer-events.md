# Polyfill host intercepts clicks
> `[data-html-in-canvas-host]` overlay must be pointer-transparent

The polyfill creates a full-canvas overlay div (`three-html-render/dist/polyfill.mjs:827-829`) with inline `pointer-events:auto` and mirrors the panel into it. Real mouse clicks on the room (radio entry/reentry) hit the overlay instead of the canvas — `elementsFromPoint` at the radio hotspot returns the HOST first.

Fix (`operation-room-radio-contact.ts` create):
- Force host creation synchronously via `canvas.requestPaint()` (repaints deferred, host is created sync)
- `panel.closest('[data-html-in-canvas-host]')` — works despite the polyfill's patched `parentNode` getter (`polyfill.mjs:713-719`)
- Host `pointer-events:none`, panel `pointer-events:auto` — overlay space hits the canvas, form still receives input
- Original inline values + priority stored and restored in `releaseCompatibility()`; restored AFTER uninstall because uninstall deletes the panel's inline `pointer-events`

Synthetic `dispatchEvent` on the canvas does NOT catch this (event target is the canvas) — real `Input.dispatchMouseEvent` via CDP is required to catch it.

Updated: 2026-10-10
