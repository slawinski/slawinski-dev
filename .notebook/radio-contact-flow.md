# Radio contact flow
> HTML-in-canvas contact form on the radio bench

Entry: `apps/web/src/components/experience/OperationRoom.astro:14` (`[data-radio-contact]` panel authored inside the `<canvas layoutsubtree>`)
Panel impl: `apps/web/src/experience/operation-room-radio-contact.ts:createRadioContactPanel()`
Caller: `apps/web/src/experience/operation-room.ts:2832-2840` (query + fallback marker), per-frame gate at `:2768-2778`

Flow:
- Room mounts → `createRadioContactPanel()` installs polyfill, bridges gl arity, builds `THREE.HTMLTexture` + `PlaneGeometry(1.5,0.9)` mesh + `InteractionManager`
- Activation is **pointer click on the radio bench** (raycast mesh id `radio`), NOT scroll zoom. Hover shows `CONTACT selected` in `[data-operation-room-live]`
- Camera dolly (~2.35s) → `viewMode === 'radio' && !cameraTransition` → `setActive(true)` flips `inert`/`visibility` + `mesh.visible`
- `InteractionManager.update()` stamps CSS `matrix3d` on the panel each frame; hit-testing is real DOM
- Submit → POST `/api/contact.json` (`apps/web/src/pages/api/contact.json.ts`)

Visibility state markers:
- `[data-operation-room][data-radio-contact="fallback"]` — unsupported, link `[data-radio-contact-fallback]` shown only in settled radio view
- Panel hidden by default (`visibility:hidden`, `inert` in markup); CSS at `OperationRoom.astro:381`

Updated: 2026-10-10
