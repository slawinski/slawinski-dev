# Radio entry repro recipe
> verify radio form without a display

No test infra in repo (`tests/`, `e2e/` empty; no vitest/playwright). Recipe that caught both bugs:

1. Ensure dev server: `pnpm --dir apps/web dev` → http://localhost:4321/
2. Launch a SEPARATE Chrome (not the user's profile) with `--remote-debugging-port=0 --enable-experimental-web-platform-features --enable-features=CanvasDrawElement --window-size=1440,900` (temp `--user-data-dir`)
3. Minimal CDP client over WebSocket: `Page.navigate`, `Runtime.evaluate`, `Input.dispatchMouseEvent`, `Page.captureScreenshot`, plus listeners for `Runtime.exceptionThrown` / `consoleAPICalled` / `Log.entryAdded` — **failing on runtime errors, not just DOM assertions, is what caught the texture failure**
4. Wait for `[data-operation-room-loading][data-ready="true"]`
5. Entry: scan canvas rect, x 0.1→0.6 step 0.04, y 0.25→<0.8 step 0.04: dispatch synthetic `pointermove`, read `[data-operation-room-live]` until it contains CONTACT, then dispatch `pointerdown`/`pointerup` at that point (works at 1440×900, hit ≈ (316.8, 513)); wait ~3s for the dolly (Return button appears)
6. Field test: get real bounding rects of `[data-radio-contact] input[name=email]` / `textarea[name=message]`, click centers via `Input.dispatchMouseEvent`, type, verify values + focus + no camera movement. WASD/+- must not pan
7. Return: click `[data-operation-room-zoom-out]`, re-enter, draft must survive. Dispose removes `[data-html-in-canvas-host]` and restores prototypes
8. Unsupported mode: block `requestPaint` via non-configurable defineProperty before app scripts → expect `[data-radio-contact="fallback"]`, link text "Contact via the contact page" → `/contact`, shown only in settled radio view

Screenshot must be inspected visually — DOM-level `visible`/`inert` checks pass even when the texture upload fails.

Working harness was kept at `/var/folders/zl/fkgnlthd363175f4ffymzcjh0000gn/T/opencode/repro-native-radio.mjs` (temp — may be cleaned; supports `--no-native-flags`, native + unsupported runs).

Updated: 2026-10-10
