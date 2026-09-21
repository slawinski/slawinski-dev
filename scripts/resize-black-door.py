from pathlib import Path

path = Path('apps/web/src/experience/operation-room.ts')
text = path.read_text()

replacements = [
    (
        "  closet: { x: 2.75, width: 1.7, height: 4.9, depth: 1.65 },",
        "  // Keep the ABOUT door/closet opening at the same visible dimensions as the right-wall brown door.\n  closet: { x: 2.75, width: 1.65, height: 4.90, depth: 1.65 },",
    ),
    (
        "const CLOSET_SCONCE_MOUNT = new THREE.Vector3(WORLD.closet.x, 5.48, WORLD.backWallZ + 0.18)\nconst CLOSET_SCONCE_SOURCE = new THREE.Vector3(WORLD.closet.x, 5.10, WORLD.backWallZ + 0.55)",
        "// Mount the black-door lamp with the same clearance above the door as the\n// brown-door fixture, so future door-height changes keep the sconce aligned.\nconst CLOSET_SCONCE_MOUNT = new THREE.Vector3(WORLD.closet.x, WORLD.closet.height + 0.72, WORLD.backWallZ + 0.18)\nconst CLOSET_SCONCE_SOURCE = new THREE.Vector3(WORLD.closet.x, WORLD.closet.height + 0.34, WORLD.backWallZ + 0.55)",
    ),
    (
        "  // Brass backplate, lock and lever on the latch side.\n  const handleZ = rightDoorZ + rightDoorWidth / 2 - 0.28\n  scene.add(box([0.040, 0.38, 0.14], [rightDoorFaceX - 0.092, 2.36, handleZ], materials.brass))\n  scene.add(cylinder(0.075, 0.055, [rightDoorFaceX - 0.125, 2.43, handleZ], materials.brass, 12, [0, 0, Math.PI / 2]))\n  scene.add(box([0.060, 0.055, 0.30], [rightDoorFaceX - 0.158, 2.43, handleZ - 0.10], materials.brass))\n  scene.add(cylinder(0.030, 0.045, [rightDoorFaceX - 0.122, 2.22, handleZ], materials.black, 10, [0, 0, Math.PI / 2]))",
        "  // Matching period ball knob on the latch side. Both room doors now use\n  // the same brass rosette + short spindle + spherical knob language.\n  const handleZ = rightDoorZ + rightDoorWidth / 2 - 0.28\n  const doorKnobRadius = 0.085\n  scene.add(cylinder(0.095, 0.035, [rightDoorFaceX - 0.086, 2.36, handleZ], materials.brass, 12, [0, 0, Math.PI / 2]))\n  scene.add(cylinder(0.035, 0.070, [rightDoorFaceX - 0.128, 2.36, handleZ], materials.brass, 10, [0, 0, Math.PI / 2]))\n  const brownDoorKnob = new THREE.Mesh(new THREE.SphereGeometry(doorKnobRadius, 10, 8), materials.brass)\n  brownDoorKnob.position.set(rightDoorFaceX - 0.195, 2.36, handleZ)\n  brownDoorKnob.castShadow = true\n  brownDoorKnob.receiveShadow = true\n  scene.add(brownDoorKnob)",
    ),
    (
        "  // Door pivots at its left jamb. Positive Y rotation sends the free edge into\n  // negative Z, so it genuinely opens inward into the closet during the dolly.\n  const doorPivot = new THREE.Group()\n  doorPivot.position.set(x - width / 2 + 0.06, 0.08, frontZ + 0.015)\n  const doorWidth = width - 0.12\n  const doorHeight = height - 0.16",
        "  // Door pivots at its left jamb. The black leaf now uses the full closet\n  // opening dimensions (1.65 x 4.90), exactly matching the brown door. Positive\n  // Y rotation sends the free edge inward into the closet during the dolly.\n  const doorPivot = new THREE.Group()\n  doorPivot.position.set(x - width / 2, 0, frontZ + 0.015)\n  const doorWidth = width\n  const doorHeight = height",
    ),
    (
        "  doorPivot.add(cylinder(0.065, 0.10, [doorWidth - 0.18, 2.36, 0.105], materials.brass, 10, [Math.PI / 2, 0, 0]))",
        "  const blackDoorRosette = cylinder(0.095, 0.035, [doorWidth - 0.18, 2.36, 0.085], materials.brass, 12, [Math.PI / 2, 0, 0])\n  const blackDoorSpindle = cylinder(0.035, 0.070, [doorWidth - 0.18, 2.36, 0.128], materials.brass, 10, [Math.PI / 2, 0, 0])\n  const blackDoorKnob = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), materials.brass)\n  blackDoorKnob.position.set(doorWidth - 0.18, 2.36, 0.195)\n  blackDoorKnob.castShadow = true\n  blackDoorKnob.receiveShadow = true\n  doorPivot.add(blackDoorRosette, blackDoorSpindle, blackDoorKnob)",
    ),
]

for old, new in replacements:
    if old not in text:
        raise SystemExit(f'missing expected block:\n{old[:180]}')
    text = text.replace(old, new, 1)

# Preserve the camera/zoom implementation exactly: this patch must not touch it.
for required in [
    'camera.position.copy(cameraTransition.path.getPointAt(routeProgress))',
    'reverse: true',
    'for (let y = 0; y < canvas.height; y += 54) {',
]:
    if required not in text:
        raise SystemExit(f'guard failed: {required}')

path.write_text(text)
