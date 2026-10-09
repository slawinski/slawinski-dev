# Home Page Specification

Route: `/`

## 1. Goal

The homepage is an interactive low-poly 3D operation room rendered into a `<canvas>`.

It should recreate the approved room composition rather than present a conventional hero + card layout.

Primary success criterion:

> At the default desktop camera position, the room should clearly match the proportions and composition of the approved low-poly 2D visualization.

See `22_OPERATION_ROOM_3D.md` for geometry, camera and interaction details.

## 2. Room as navigation

- wall map → Work;
- papers / field notes → Writing;
- radio desk → Speaking;
- rotary telephones → Contact;
- film projector → About.

There are **no floating labels next to these objects**. Hover/focus/touch uses a subtle physical highlight plus the one-line hanging green board.

## 3. Hanging board

The board is physically part of the 3D scene and approximately one text row high. It displays only one section name at a time, e.g. `▶ WORK`, `▶ WRITING`, or `▶ CONTACT`.

Do not add other menu rows, descriptions or secondary metadata. Default content is `WORK`.

## 4. Desktop behavior

Pointer hover raycasts against invisible hotspot volumes, updates the board and physical highlight, and click navigates to the semantic route. No free camera orbit/walk controls. Tiny camera parallax is allowed if it does not disturb scene matching.

## 5. Touch behavior

First tap highlights/selects and updates the board. Second tap on the same zone navigates.

## 6. Keyboard/accessibility

Canvas is focusable; left/right arrows cycle sections; Enter opens; live region announces selection changes. Semantic fallback navigation remains in the DOM and WebGL is not required to navigate.

## 7. Content

The homepage is navigation, not a dashboard. Detailed information lives on `/work`, `/blog`, `/speaking`, `/about`, and `/contact`.

## 8. Visual character

Required: visibly low-poly, simple geometry, restrained materials, warm map/desk lighting, muted green/ochre/wood/gray/cream palette, fixed room proportions.

Avoid: photoreal material scans, bloom-heavy rendering, huge textures, modern glass UI, decorative text overlays, or cards floating in 3D space.

## 9. Acceptance criteria

- real WebGL canvas scene;
- one-line hanging board;
- only current section on board;
- no floating area labels;
- five working hotspots;
- Work/map is default;
- desktop, touch and keyboard navigation work;
- WebGL/JS fallback exposes normal navigation;
- no React dependency for the scene.
