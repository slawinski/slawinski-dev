from pathlib import Path

path = Path('apps/web/src/experience/operation-room.ts')
text = path.read_text()

# Shared dimensions: both visible room doors are the exact same model.
old = """const WORLD = {\n"""
new = """const ROOM_DOOR = {\n  width: 1.65,\n  height: 4.90,\n  depth: 0.26,\n} as const\n\nconst WORLD = {\n"""
assert old in text
text = text.replace(old, new, 1)
text = text.replace(
    "closet: { x: 2.75, width: 1.65, height: 4.90, depth: 1.65 },",
    "closet: { x: 2.75, width: ROOM_DOOR.width, height: ROOM_DOOR.height, depth: 1.65 },",
    1,
)
text = text.replace("const doorMinZ = -2.95 - 1.65 / 2", "const doorMinZ = -2.95 - ROOM_DOOR.width / 2", 1)
text = text.replace("const doorMaxZ = -2.95 + 1.65 / 2", "const doorMaxZ = -2.95 + ROOM_DOOR.width / 2", 1)

# One shared leaf and casing builder for both doors. Only materials, placement,
# orientation and animation are allowed to differ.
anchor = """const strut = (\n"""
assert anchor in text
insert_at = text.index(anchor)
# Insert after the full strut helper, immediately before createCanvasTexture.
canvas_anchor = """const createCanvasTexture = (\n"""
assert canvas_anchor in text
helper = r"""
type PanelDoorMaterials = {
  leaf: THREE.Material
  panel: THREE.Material
  trim: THREE.Material
}

const createPanelDoorLeaf = ({ leaf, panel, trim }: PanelDoorMaterials) => {
  const group = new THREE.Group()
  const { width, height, depth } = ROOM_DOOR
  const faceZ = depth / 2

  // Shared leaf shell. Local +Z is the room-facing side; local X runs from the
  // hinge edge at 0 to the latch edge at width. This lets the same exact model
  // serve the back-wall black door and the rotated right-wall brown door.
  group.add(box([width, height, depth], [width / 2, height / 2, 0], leaf))
  group.add(box([width + 0.05, height + 0.05, 0.035], [width / 2, height / 2, faceZ + 0.006], trim))
  group.add(box([width - 0.10, height - 0.10, 0.040], [width / 2, height / 2, faceZ + 0.030], leaf))

  const addPanel = (panelY: number, panelHeight: number) => {
    const panelWidth = 1.18
    const panelZ = faceZ + 0.056
    group.add(box([panelWidth, panelHeight, 0.026], [width / 2, panelY, panelZ], panel))
    const railZ = panelZ + 0.022
    group.add(box([panelWidth + 0.10, 0.065, 0.030], [width / 2, panelY + panelHeight / 2, railZ], trim))
    group.add(box([panelWidth + 0.10, 0.065, 0.030], [width / 2, panelY - panelHeight / 2, railZ], trim))
    group.add(box([0.065, panelHeight, 0.030], [width / 2 - panelWidth / 2, panelY, railZ], trim))
    group.add(box([0.065, panelHeight, 0.030], [width / 2 + panelWidth / 2, panelY, railZ], trim))
  }
  addPanel(3.62, 1.55)
  addPanel(1.55, 1.62)

  // Identical visible hinge hardware on the hinge edge.
  for (const hingeY of [0.78, 2.45, 4.12]) {
    group.add(box([0.13, 0.24, 0.050], [0.055, hingeY, faceZ + 0.082], materials.metalDark))
    group.add(cylinder(0.030, 0.28, [0.020, hingeY, faceZ + 0.112], materials.metalDark, 8))
  }

  // Identical brass rosette, spindle and ball knob on the latch side.
  const handleX = width - 0.28
  const handleY = 2.36
  group.add(cylinder(0.095, 0.035, [handleX, handleY, faceZ + 0.086], materials.brass, 12, [Math.PI / 2, 0, 0]))
  group.add(cylinder(0.035, 0.070, [handleX, handleY, faceZ + 0.128], materials.brass, 10, [Math.PI / 2, 0, 0]))
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), materials.brass)
  knob.position.set(handleX, handleY, faceZ + 0.195)
  knob.castShadow = true
  knob.receiveShadow = true
  group.add(knob)

  return group
}

const createPanelDoorCasing = (trim: THREE.Material) => {
  const group = new THREE.Group()
  const { width, height } = ROOM_DOOR
  const casingZ = ROOM_DOOR.depth / 2 + 0.11
  const sideX = width / 2 + 0.095

  group.add(box([0.16, height + 0.22, 0.18], [-0.095, height / 2, casingZ], materials.woodDark))
  group.add(box([0.16, height + 0.22, 0.18], [width + 0.095, height / 2, casingZ], materials.woodDark))
  group.add(box([width + 0.35, 0.16, 0.18], [width / 2, height + 0.08, casingZ], materials.woodDark))
  group.add(box([width + 0.23, 0.07, 0.15], [width / 2, 0.035, casingZ + 0.01], trim))

  return group
}

"""
text = text.replace(canvas_anchor, helper + canvas_anchor, 1)

# Replace the bespoke brown door geometry with the shared model.
brown_start = text.index("  // Proper right-wall timber door.")
brown_end = text.index("  // The clock is mounted on the visible face of the front strut.", brown_start)
brown_new = r"""  // Right-wall brown door. It uses the exact same shared geometry as the
  // black ABOUT door; only its materials, placement and orientation differ.
  const rightDoorWood = makeMaterial(0x80502d, 0.88); rightDoorWood.flatShading = true
  const rightDoorPanel = makeMaterial(0x63391f, 0.92); rightDoorPanel.flatShading = true
  const rightDoorTrim = makeMaterial(0x4f301c, 0.90); rightDoorTrim.flatShading = true
  const rightDoorX = 6.82
  const rightDoorZ = -2.95
  const rightDoorOrigin = new THREE.Vector3(rightDoorX, 0, rightDoorZ - ROOM_DOOR.width / 2)

  const brownDoor = createPanelDoorLeaf({ leaf: rightDoorWood, panel: rightDoorPanel, trim: rightDoorTrim })
  brownDoor.position.copy(rightDoorOrigin)
  brownDoor.rotation.y = -Math.PI / 2
  scene.add(brownDoor)

  const brownDoorCasing = createPanelDoorCasing(rightDoorTrim)
  brownDoorCasing.position.copy(rightDoorOrigin)
  brownDoorCasing.rotation.y = -Math.PI / 2
  scene.add(brownDoorCasing)

"""
text = text[:brown_start] + brown_new + text[brown_end:]

# Add a black trim material used by the same shared door geometry.
text = text.replace(
    "  const doorInset = makeMaterial(0x35312b, 0.92); doorInset.flatShading = true\n",
    "  const doorInset = makeMaterial(0x35312b, 0.92); doorInset.flatShading = true\n  const doorTrim = makeMaterial(0x171916, 0.94); doorTrim.flatShading = true\n",
    1,
)

# Replace the closet's bespoke frame with the exact shared casing.
frame_start = text.index("  // Heavy jamb/frame on the room side")
frame_end = text.index("  // A shelf, rail and a couple of low-poly coats", frame_start)
frame_new = r"""  // The black doorway uses the exact same casing geometry as the brown door.
  // Its local origin matches the animated leaf hinge so there is no size drift.
  const blackDoorOrigin = new THREE.Vector3(x - width / 2, 0, frontZ + 0.015)
  const blackDoorCasing = createPanelDoorCasing(doorTrim)
  blackDoorCasing.position.copy(blackDoorOrigin)
  scene.add(blackDoorCasing)

"""
text = text[:frame_start] + frame_new + text[frame_end:]

# Replace the black leaf with the exact same shared leaf model. It remains the
# animated pivot because the helper's origin is the hinge edge.
door_start = text.index("  // Door pivots at its left jamb.")
door_end = text.index("  // Soft practical light at the closet ceiling.", door_start)
door_new = r"""  // The animated black leaf is the same shared door model as the brown one.
  // The helper's origin is the hinge edge, so rotating the group opens it inward
  // without introducing any dimensional or proportion differences.
  const doorPivot = createPanelDoorLeaf({ leaf: doorMaterial, panel: doorInset, trim: doorTrim })
  doorPivot.position.copy(blackDoorOrigin)
  scene.add(doorPivot)

"""
text = text[:door_start] + door_new + text[door_end:]

# Guard unrelated approved behavior.
assert "for (let y = 0; y < canvas.height; y += 54)" in text
assert "camera.position.copy(cameraTransition.path.getPointAt(routeProgress))" in text
assert "reverse: true" in text
assert "const createPanelDoorLeaf" in text
assert text.count("createPanelDoorLeaf({") == 2
assert "const rightDoorHeight =" not in text
assert "const doorWidth = width" not in text

path.write_text(text)
