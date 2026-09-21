from pathlib import Path

path = Path('apps/web/src/experience/operation-room.ts')
text = path.read_text()

# This is a telephone-prop-only change. Guard the established trays camera
# transition byte-for-byte so scene interaction cannot drift during the edit.
camera_start_marker = "  const getTraysViewPosition = () => {\n"
camera_end_marker = "  const setProjectorActive = (active: boolean) => {\n"
camera_start = text.index(camera_start_marker)
camera_end = text.index(camera_end_marker)
camera_before = text[camera_start:camera_end]

old = '''  // One central support carries the handset, leaving the receiver visibly
  // balanced on the case instead of disappearing into two side cheeks.
  group.add(box([0.16, 0.22, 0.18], [0, 0.37, -0.045], bakeliteDeep))
'''

new = '''  // Period-style handset cradle: one central stem rises from the crown of the
  // pyramidal case and carries a narrow transverse yoke. Each end of the yoke
  // terminates in a fork whose two prongs cup the underside of the receiver.
  // Keeping the cradle rod-built avoids the blocky support pieces used before.
  const addCradleRod = (
    from: [number, number, number],
    to: [number, number, number],
    radius: number,
  ) => {
    const start = new THREE.Vector3(...from)
    const end = new THREE.Vector3(...to)
    const direction = end.clone().sub(start)
    const rod = finish(new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius * 1.03, direction.length(), 7),
      bakeliteDeep,
    ))
    rod.position.copy(start).add(end).multiplyScalar(0.5)
    rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize())
    group.add(rod)
  }

  const cradleZ = -0.060
  const crownY = 0.386
  const yokeY = 0.470
  const forkBaseY = 0.495
  const forkTopY = 0.558

  // Single central mounting stem, planted directly on the telephone crown.
  addCradleRod([0, crownY, cradleZ], [0, yokeY, cradleZ], 0.050)

  // One compact yoke carries both handset-end forks.
  addCradleRod([-0.355, yokeY, cradleZ], [0.355, yokeY, cradleZ], 0.032)

  // Two U-shaped/fork-shaped supports. The paired prongs straddle the handset
  // depth around z = -0.06 and rise just into the receiver silhouette so the
  // handset reads as physically seated in the cradle rather than floating.
  for (const side of [-1, 1] as const) {
    const forkX = side * 0.355
    addCradleRod([forkX, yokeY, cradleZ], [forkX, forkBaseY, cradleZ], 0.028)
    addCradleRod([forkX, forkBaseY, cradleZ], [forkX, forkTopY, cradleZ - 0.075], 0.022)
    addCradleRod([forkX, forkBaseY, cradleZ], [forkX, forkTopY, cradleZ + 0.075], 0.022)
  }
'''

if old not in text:
    raise SystemExit('existing central handset support block not found')

text = text.replace(old, new, 1)

camera_start_after = text.index(camera_start_marker)
camera_end_after = text.index(camera_end_marker)
if text[camera_start_after:camera_end_after] != camera_before:
    raise SystemExit('camera/zoom transition changed unexpectedly')

checks = {
    'new central cradle stem': 'addCradleRod([0, crownY, cradleZ], [0, yokeY, cradleZ], 0.050)',
    'left-right cradle yoke': "addCradleRod([-0.355, yokeY, cradleZ], [0.355, yokeY, cradleZ], 0.032)",
    'fork loop': "for (const side of [-1, 1] as const)",
    'smooth reversible trays route': 'camera.position.copy(cameraTransition.path.getPointAt(routeProgress))',
    'reverse zoom route': 'reverse: true',
}
for label, snippet in checks.items():
    if snippet not in text:
        raise SystemExit(f'missing expected invariant: {label}')

if 'group.add(box([0.16, 0.22, 0.18], [0, 0.37, -0.045], bakeliteDeep))' in text:
    raise SystemExit('old cuboid handset support still present')

path.write_text(text)
