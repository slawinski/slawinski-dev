# Technical Architecture

## 1. Architecture decision

Use a pnpm monorepo with two deployable applications:

- `apps/web`: Astro static frontend plus one Three.js homepage experience
- `apps/cms`: Payload CMS in its supported Next.js runtime

Payload is separate from Astro.

```text
Browser
   |
   +--> / -----------------> Astro page + Three.js canvas
   |
   +--> /work, /blog, ... -> semantic Astro pages
                                ^
                                | build-time content fetch
                                |
                          Payload REST API
                                |
                                v
                         SQLite/libSQL + media
```

## 2. Frontend structure

```text
apps/web/src/
├── components/
│   ├── chrome/
│   ├── content/
│   └── experience/
│       └── OperationRoom.astro
├── experience/
│   └── operation-room.ts
├── layouts/
│   ├── BaseLayout.astro
│   └── ExperienceLayout.astro
├── lib/
├── pages/
└── styles/
```

`BaseLayout.astro` remains the semantic content-page shell. `ExperienceLayout.astro` is minimal so `/` lets the canvas own the viewport.

## 3. Three.js homepage

Three.js is the only dedicated 3D runtime. Do not add React Three Fiber, React solely for the scene, a physics engine, or a generic game-engine abstraction.

The initial room is procedural so important dimensions remain visible in code. The scene module owns camera, geometry, generated map/board textures, lighting, hotspot hit volumes, raycasting, board state, touch/keyboard behavior, route navigation and disposal.

The Canvas handles spatial navigation only. Detailed project/article content remains normal Astro HTML.

## 4. Accessibility boundary

The homepage exposes a semantic fallback nav, skip link, keyboard selection, live selection announcements, touch select-then-open behavior and no-JS fallback links. WebGL is enhancement, not the only navigation mechanism.

## 5. Performance

Initial targets:

```text
renderer pixel ratio <= 1.5
scene triangles       < 120k
external GLB files    0 initially
large raster textures 0 initially
```

Canvas textures are generated in-browser for the wall map and one-line board.

## 6. Payload CMS

Payload owns editorial content: Posts, Projects, Talks, Media and site globals. The homepage room navigation taxonomy is code-owned because its physical mapping is part of the application experience, not editorial page composition.

## 7. Database

Use Payload SQLite/libSQL initially with persistent production storage and backups. Switching to Postgres later must not affect the Astro/Three.js architecture.

## 8. Deployment

```text
www.slawinski.dev -> Astro static frontend
cms.slawinski.dev -> Payload admin/API
```

The deployed Astro bundle includes Three.js only on the homepage entry chunk. Content pages do not import the operation-room module.
