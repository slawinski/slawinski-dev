# HTML-in-canvas: native vs polyfill
> Chrome 154 native path is broken; polyfill is force-installed

Symptom: with `chrome://flags/#enable-experimental-web-platform-features` + `#canvas-draw-element` enabled, native `requestPaint` + `gl.texElementImage2D` both exist, but entering the radio view throws:
`InvalidStateError: Failed to execute 'texElementImage2D' on 'WebGL2RenderingContext': No cached paint record for element.`

Cause chain (all verified in headed Chrome 154.0.8037.99):
- Panel is authored INSIDE the canvas (`OperationRoom.astro:13-24`) → `image.parentNode === canvas` at first upload
- three's deferral branch `three/src/renderers/webgl/WebGLTextures.js:1270` (`if (image.parentNode !== canvas)`) is skipped → no `requestPaint()` + early return → direct upload
- The only `requestPaint()` happens in `HTMLTexture.js:52` while the panel is still `visibility:hidden` → no valid paint record
- Throw escapes `renderer.render()` at `operation-room.ts:2779`; the next rAF is scheduled AFTER the render call → room animation loop dies

Dead end: pre-painting the panel before activation removes the exception but the texture uploads **black**. Still unverified why (transform-at-capture suspected).

Workaround (current code): `operation-room-radio-contact.ts:ensureHtmlInCanvas()` calls `installHtmlInCanvasPolyfill({ force: true })` unconditionally. The polyfill skips itself when it detects native `requestPaint`+`drawElementImage`+`onpaint` (`three-html-render/dist/polyfill.mjs:478-482`) — `force: true` bypasses that. SVG foreignObject rasterization renders the form correctly in both modes. This does NOT fix the native implementation; revisit if Chrome fixes the first-paint path.

Detection remains presence-only (`supportsHtmlInCanvas()`), so `supported` cannot foresee the missing paint record — there is no runtime downgrade from the throw.

Updated: 2026-10-10
