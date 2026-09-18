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

## Camera

```text
position  [9.8, 5.45, 12.8]
target    [-0.2, 2.45, -2.15]
FOV       54deg
```

No FPS/free orbit mode. Tiny pointer parallax is allowed.

## Geometry strategy

Initial implementation is procedural and low-poly: room shell/beam boxes, map plane + generated texture, box tables/chairs, low-segment phone/projector/lamp cylinders, primitive radio units, thin paper meshes. Do not replace these with high-detail marketplace assets without an explicit later ticket.

## Interaction

Desktop: raycast on move, subtle hotspot highlight, board update, click opens route.

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

Photorealism, PBR material libraries, free movement, floating HTML labels, a multi-row menu board, or rendering long-form content inside WebGL.
