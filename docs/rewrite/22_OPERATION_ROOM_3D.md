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
main table width           4.8
main table depth       9.2
main tabletop Y        1.16
radio desk width       3.7
hanging board width    4.1
hanging board height   0.78
```

These values are anchors. Preserve approved screen-space composition rather than independently beautifying objects.

## Camera — free orbit around the saved view

The default shot is the approved saved view: the observer stands left of
centre, broadly opposite the wall map.

```text
home position  [-4.08, 4.47, 10.34]
home target    [-2.15, 2.7, -4.75]
FOV            54deg
```

The camera is free to move (explicit product decision overriding the
earlier fixed-camera rule):

- drag orbits, wheel / pinch dollies, right-drag / two-finger drag pans;
- distance clamped to 5–22, polar angle to 0.5–1.53 rad, azimuth to
  −0.98–0.72 rad, pan target clamped to the room volume — the camera can
  never leave the room or go under the floor;
- FOV never changes; resizing updates the projection **aspect ratio only**;
- selecting Work/Writing/Speaking/About/Contact changes only hotspot
  highlighting and the hanging-board label — never the camera;
- click vs drag is distinguished by a 6px threshold so orbiting never
  opens a route by accident;
- `Reset view` button and the `0` / `R` key restore the saved home shot;
- `prefers-reduced-motion` disables damping (camera jumps instead of
  gliding).

## Geometry strategy

Initial implementation is procedural and low-poly: room shell/beam boxes, map plane + generated texture, box tables/chairs, low-segment phone/projector/lamp cylinders, primitive radio units, thin paper meshes. Do not replace these with high-detail marketplace assets without an explicit later ticket.

## Interaction

Desktop: drag to orbit, wheel to zoom, right-drag to pan; raycast on move highlights hotspots and updates the board; click (no drag) opens the route. **Hover never moves the camera.**

Touch: drag orbits, pinch zooms; tap selects, second tap on the same hotspot opens.

Keyboard: left/right cycles; Enter opens; `+`/`-` zoom; `WASD` pans; `0`/`R` resets; semantic fallback nav remains available. Default selection is `WORK`.

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

Photorealism, PBR material libraries, floating HTML labels, a multi-row menu board, or rendering long-form content inside WebGL.
