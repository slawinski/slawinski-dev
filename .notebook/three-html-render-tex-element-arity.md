# three ↔ polyfill texElementImage2D arity
> gl instance-level bridge required

three 0.186 branches on `gl.texElementImage2D.length === 3` (`three/src/renderers/webgl/WebGLTextures.js:1298`):
- length 3 → Chrome 150+ 3-arg form `(target, internalformat, element)`
- else → Chrome 138-149 6-arg form `(target, level, internalformat, format, type, element)`

three-html-render@0.1.2 declares its polyfill `function V(target, level, internalformat, ...rest)` (`polyfill.mjs:539-550`) → `.length === 3`, but it only accepts 6/8/10/12 total args and throws `TypeError: unexpected argument count 3` for the 3-arg call three issues.

Bridge (`operation-room-radio-contact.ts:bridgePolyfillTexElementArity()`): defineProperty own property on the renderer's gl instance advertising `.length === 6` + translating any 3-arg call into the 6-arg form. Instance-level only — prototypes untouched. Cleaned up via unbridge on dispose.

Note: native Chrome 154 also reports `.length === 3` for its own 3-arg implementation, so the arity check alone cannot distinguish native from polyfill.

Updated: 2026-10-10
