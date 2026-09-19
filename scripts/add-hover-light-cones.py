from pathlib import Path


path = Path('apps/web/src/experience/operation-room.ts')
text = path.read_text()

old = '''const createHoverTarget = (
  scene: THREE.Scene,
  id: string,
  label: string,
  size: [number, number, number],
  position: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0],
): HoverTarget => {
  const material = new THREE.MeshBasicMaterial({
    color: 0xd8b15a,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  })
  const mesh = box(size, position, material, rotation)
  // Keep the mesh visible to Three.js raycasting. Highlighting is controlled
  // through opacity; invisible objects are skipped by intersectObjects().
  mesh.visible = true
  mesh.userData.hoverTarget = id
  mesh.renderOrder = 20
  scene.add(mesh)
  return { id, label, mesh, material }
}
'''

new = '''const createHoverTarget = (
  scene: THREE.Scene,
  id: string,
  label: string,
  size: [number, number, number],
  position: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0],
): HoverTarget => {
  // Raycasting keeps the original cuboid coverage, but that volume is now
  // completely invisible. The visible hover treatment is a separate light
  // beam, so the interaction area does not dictate the highlight shape.
  const hitMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, depthTest: false })
  const mesh = box(size, position, hitMaterial, rotation)
  mesh.visible = true
  mesh.userData.hoverTarget = id
  mesh.castShadow = false
  mesh.receiveShadow = false
  mesh.renderOrder = 20
  scene.add(mesh)

  const material = new THREE.MeshBasicMaterial({
    color: 0xffd77a,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  })

  // The door intentionally keeps its existing cuboid treatment for now. Its
  // final hover language will be designed separately.
  if (id === 'back-door') {
    const cover = box(size, position, material, rotation)
    cover.castShadow = false
    cover.receiveShadow = false
    cover.renderOrder = 18
    scene.add(cover)
    return { id, label, mesh, material }
  }

  const target = new THREE.Vector3(...position)
  let source = new THREE.Vector3(position[0], 6.45, position[2])
  let radius = Math.max(size[0], size[2]) * 0.58
  let footprintX = 1
  let footprintZ = 0.72

  if (id === 'radio') {
    source = new THREE.Vector3(WORLD.radioDesk.x, 6.35, WORLD.radioDesk.z - 0.05)
    radius = 2.05
    footprintX = 1.05
    footprintZ = 0.48
  } else if (id === 'trays') {
    source = new THREE.Vector3(position[0] + 0.08, 6.20, position[2] + 0.04)
    radius = 1.05
    footprintX = 0.92
    footprintZ = 0.72
  } else if (id === 'projector') {
    source = new THREE.Vector3(position[0] + 0.05, 6.30, position[2] - 0.06)
    radius = 1.05
    footprintX = 0.95
    footprintZ = 0.90
  } else if (id === 'map') {
    // The map is wall-mounted, so its beam comes from a ceiling lamp position
    // in front/right of the board rather than dropping vertically. This makes
    // the volume read like an angled spotlight sweeping onto the wall.
    source = new THREE.Vector3(2.35, 6.25, -1.80)
    radius = 3.15
    footprintX = 1.35
    footprintZ = 0.78
  }

  const direction = source.clone().sub(target)
  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(radius, direction.length(), 18, 1, false),
    material,
  )
  beam.position.copy(target).add(source).multiplyScalar(0.5)
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize())
  beam.scale.set(footprintX, 1, footprintZ)
  beam.castShadow = false
  beam.receiveShadow = false
  beam.renderOrder = 18
  scene.add(beam)

  return { id, label, mesh, material }
}
'''

if old not in text:
    raise SystemExit('createHoverTarget pattern not found')
text = text.replace(old, new, 1)

old_active = '''  activeId = id; boardDraw(SECTIONS[id].label); if (live) live.textContent = `${SECTIONS[id].label} selected`
  hotspots.forEach((hotspot) => { hotspot.highlight.visible = hotspot.id === id })
'''
new_active = '''  activeId = id; boardDraw(SECTIONS[id].label); if (live) live.textContent = `${SECTIONS[id].label} selected`
  // Legacy hotspot boxes remain raycast/navigation metadata only. The visible
  // hover feedback now comes exclusively from the light-cone meshes.
  hotspots.forEach((hotspot) => { hotspot.highlight.visible = false })
'''
if old_active not in text:
    raise SystemExit('setActive highlight pattern not found')
text = text.replace(old_active, new_active, 1)

path.write_text(text)
