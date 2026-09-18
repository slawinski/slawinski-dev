# 3D Operation Room Homepage

Status: source of truth for the homepage experience.

## Product decision

The previous `Developer Workbench` collage homepage is replaced by a real low-poly 3D room rendered to an HTML `<canvas>` with Three.js. The room itself is the primary navigation.

## Visual reference

Approved composition: wide operation-room camera; large rear-left wall map; long green-topped table; communications equipment on the left; rotary phones; papers/folders; front-right projector/reels; exposed beams; hanging lamps; compact green board upper-left.

The **green board is one row high** and displays only the current section name. It must never show the complete menu list or explanatory text. No floating labels are rendered over interactive areas.

## Spatial information architecture

| Section | Physical hotspot | Route |
|---|---|---|
| Work | large wall map | `/work` |
| Writing | papers / field notes on central table | `/blog` |
| Speaking | radio / communications desk | `/speaking` |
| Contact | bank of rotary telephones | `/contact` |
| About | film projector | `/about` |

Selection gives the physical area a subtle highlight and updates only the hanging board.

## Coordinate system

Three.js world units are treated as metres.

```text
X = left/right
Y = vertical
Z = depth
floor Y = 0
back wall Z = -6.1
```

Reference dimensions:

```text
room width           18.0
room depth           13.0
wall height           7.0
map width              8.4
map height             4.45
main table width       6.2
main table depth       9.2
main tabletop Y        0.86
radio desk width       3.7
hanging board width    4.1
hanging board height   0.78
```

These values are anchors. Preserve approved screen-space composition rather than independently beautifying objects.

## Camera — fixed, immutable menu view

The camera reproduces the original menu behavior: it is a fixed observer, not a controllable part of the experience.

The observer stands broadly opposite the wall map and slightly to the **left of the projector**. The map should read close to front-on, while the projector remains in the right foreground of the frame.

```text
position  [4.9, 4.95, 10.2]
target    [-2.15, 2.7, -4.75]
FOV       54deg
```

Rules:

- position never changes after scene creation;
- target never changes;
- FOV never changes in response to pointer, selection, motion preferences or breakpoint;
- no pointer parallax;
- no orbit, pan, dolly, zoom, camera tween or hotspot focus animation;
- selecting Work/Writing/Speaking/About/Contact changes only hotspot highlighting and the hanging-board label;
- resizing may update the projection **aspect ratio only** so the same physical camera pose is preserved;
- narrow screens therefore see a naturally narrower crop of the same room rather than a different camera composition.

This fixed shot is an acceptance criterion. Do not add cinematic camera movement later without an explicit product decision.

## Geometry strategy

Initial implementation is procedural and low-poly: room shell/beam boxes, map plane + generated texture, box tables/chairs, low-segment phone/projector/lamp cylinders, primitive radio units, thin paper meshes. Do not replace these with high-detail marketplace assets without an explicit later ticket.

## Interaction

Desktop: raycast on move, subtle hotspot highlight, board update, click opens route. **Hover never moves the camera.**

Touch: first tap selects; second tap on same hotspot opens.

Keyboard: left/right cycles; Enter opens; semantic fallback nav remains available. Default selection is `WORK`.

## Hanging board

Physical 3D object: wooden frame, green textured plane, one-row CanvasTexture and two ceiling rods. Texture contains only `▶ WORK` or equivalent selected section name. Never descriptions or extra rows.

## Accessibility fallback

Skip link and semantic links to Work, Writing, Speaking, About and Contact remain available if JavaScript/WebGL is unavailable.

## Performance target

```text
procedural scene geometry < 120k triangles
renderer pixel ratio      <= 1.5
shadow maps               <= 1024 for key light
external 3D assets         0 initially
```

Low-poly is intentional; polygon count is not a quality metric.

## Non-goals

Photorealism, PBR material libraries, free movement, camera parallax, camera animation, floating HTML labels, a multi-row menu board, or rendering long-form content inside WebGL.
