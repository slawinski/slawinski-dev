from pathlib import Path

path = Path('apps/web/src/experience/operation-room.ts')
text = path.read_text()

old_type = """type HoverTarget = {
  id: string
  label: string
  mesh: THREE.Mesh
  material: THREE.MeshBasicMaterial
}
"""
new_type = """type HoverTarget = {
  id: string
  label: string
  mesh: THREE.Mesh
  material: THREE.MeshBasicMaterial
  light: THREE.SpotLight | null
}
"""
if old_type not in text:
    raise SystemExit('HoverTarget type not found')
text = text.replace(old_type, new_type, 1)

start = text.index('const createHoverTarget = (')
end = text.index('\nconst createScene = ', start)
new_function = r'''const createHoverTarget = (
  scene: THREE.Scene,
  id: string,
  label: string,
  size: [number, number, number],
  position: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0],
): HoverTarget => {
  // Keep the generous cuboid solely for pointer raycasting. Hover light is now
  // produced by a real SpotLight, so geometry in the room can occlude it and
  // the beam naturally terminates on the first receiving surface.
  const hitMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, depthTest: false })
  const mesh = box(size, position, hitMaterial, rotation)
  mesh.visible = true
  mesh.userData.hoverTarget = id
  mesh.castShadow = false
  mesh.receiveShadow = false
  mesh.renderOrder = 20
  scene.add(mesh)

  // Retained only for the back-door cover, which is intentionally still the
  // old treatment until that interaction gets its own design pass.
  const material = new THREE.MeshBasicMaterial({
    color: 0xffd77a,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  })

  if (id === 'back-door') {
    const cover = box(size, position, material, rotation)
    cover.castShadow = false
    cover.receiveShadow = false
    cover.renderOrder = 18
    scene.add(cover)
    return { id, label, mesh, material, light: null }
  }

  let source = new THREE.Vector3(position[0], 6.45, position[2])
  let target = new THREE.Vector3(...position)
  let radius = Math.max(size[0], size[2]) * 0.58
  let intensity = 12

  if (id === 'radio') {
    source = new THREE.Vector3(WORLD.radioDesk.x, 6.35, WORLD.radioDesk.z - 0.05)
    target = new THREE.Vector3(WORLD.radioDesk.x, 1.72, WORLD.radioDesk.z)
    radius = 2.05
    intensity = 13
  } else if (id === 'trays') {
    source = new THREE.Vector3(position[0] + 0.08, 6.20, position[2] + 0.04)
    target = new THREE.Vector3(position[0], 1.72, position[2])
    radius = 1.05
    intensity = 11
  } else if (id === 'projector') {
    source = new THREE.Vector3(position[0] + 0.05, 6.30, position[2] - 0.06)
    target = new THREE.Vector3(position[0], 2.35, position[2])
    radius = 1.05
    intensity = 11
  } else if (id === 'map') {
    source = MAP_SCONCE_SOURCE.clone()
    // Aim at the actual map plane, not an arbitrary point in front of it. The
    // near-vertical incidence produces the reference-like pool while the map,
    // pinned notes and frame participate in normal depth/shadow occlusion.
    target = new THREE.Vector3(WORLD.map.x, WORLD.map.y + 0.10, WORLD.map.z + 0.06)
    radius = 2.05
    intensity = 28
  }

  const distance = source.distanceTo(target)
  const angle = THREE.MathUtils.clamp(Math.atan(radius / distance), 0.18, 0.72)
  const light = new THREE.SpotLight(0xffd27a, 0, distance + 4, angle, 0.48, 1.45)
  light.position.copy(source)
  light.target.position.copy(target)
  light.castShadow = true
  light.shadow.mapSize.set(1024, 1024)
  light.shadow.camera.near = 0.08
  light.shadow.camera.far = distance + 4
  light.shadow.bias = -0.00025
  light.shadow.normalBias = 0.025
  light.userData.hoverIntensity = intensity
  scene.add(light, light.target)

  return { id, label, mesh, material, light }
}
'''
text = text[:start] + new_function + text[end:]

anchor = """  const setActive = (id: SectionId) => {
"""
helper = """  const setHoverHighlight = (target: HoverTarget, active: boolean) => {
    if (target.light) target.light.intensity = active ? Number(target.light.userData.hoverIntensity ?? 12) : 0
    // Only the back door still uses a mesh cover. The light-driven targets keep
    // this material at zero opacity so nothing can paint over foreground props.
    target.material.opacity = target.id === 'back-door' && active ? 0.18 : 0
  }
  const clearHoverHighlights = () => hoverTargets.forEach((target) => setHoverHighlight(target, false))

"""
if anchor not in text:
    raise SystemExit('setActive anchor not found')
text = text.replace(anchor, helper + anchor, 1)

text = text.replace("hoverTargets.forEach((target) => { target.material.opacity = 0 })", "clearHoverHighlights()")

old_hover_loop = """    hoverTargets.forEach((target) => {
      target.material.opacity = target.mesh === hoverHit ? 0.18 : 0
    })
"""
new_hover_loop = """    hoverTargets.forEach((target) => {
      setHoverHighlight(target, target.mesh === hoverHit)
    })
"""
if old_hover_loop not in text:
    raise SystemExit('pointer hover loop not found')
text = text.replace(old_hover_loop, new_hover_loop, 1)

old_reset = """    controls.update()
    selectDefault()
  }
"""
new_reset = """    controls.update()
    clearHoverHighlights()
    selectDefault()
  }
"""
if old_reset not in text:
    raise SystemExit('reset block not found')
text = text.replace(old_reset, new_reset, 1)

path.write_text(text)
