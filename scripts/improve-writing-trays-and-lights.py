from pathlib import Path

path = Path('apps/web/src/experience/operation-room.ts')
text = path.read_text()

text = text.replace(
"""type HoverTarget = {
  id: string
  label: string
  mesh: THREE.Mesh
  material: THREE.MeshBasicMaterial
  light: THREE.SpotLight | null
}
""",
"""type HoverTarget = {
  id: string
  label: string
  mesh: THREE.Mesh
  material: THREE.MeshBasicMaterial
  lights: THREE.SpotLight[]
}
""",
1,
)

start = text.index('const createDeskLamp = (scene: THREE.Scene')
end = text.index('\nconst createRadioDesk =', start)
new_desk_lamp = """const createDeskLamp = (scene: THREE.Scene, x: number, z: number, scale = 1, rotationY = 0) => {
  const group = new THREE.Group(); group.position.set(x, 0.3, z); group.rotation.y = rotationY
  const brass = new THREE.MeshStandardMaterial({ color: 0xa87925, roughness: 0.5, metalness: 0.42, flatShading: true })
  const brassDark = new THREE.MeshStandardMaterial({ color: 0x6f4f1d, roughness: 0.62, metalness: 0.34, flatShading: true })
  const shadeGreen = new THREE.MeshStandardMaterial({ color: 0x1f4e3d, roughness: 0.72, metalness: 0.02, flatShading: true })
  const warmUnderside = new THREE.MeshStandardMaterial({
    color: 0xd8c992,
    roughness: 0.86,
    metalness: 0,
    emissive: 0xb08a48,
    emissiveIntensity: 0.22,
    side: THREE.DoubleSide,
  })

  group.add(cylinder(0.285 * scale, 0.055 * scale, [0, 1.00, 0], brassDark, 14))
  group.add(cylinder(0.225 * scale, 0.070 * scale, [0, 1.055, 0], brass, 14))
  group.add(cylinder(0.145 * scale, 0.070 * scale, [0, 1.115, 0], brassDark, 12))
  group.add(cylinder(0.065 * scale, 0.055 * scale, [0, 1.175, 0], brass, 10))

  group.add(cylinder(0.026 * scale, 0.48 * scale, [0, 1.42, 0], brass, 10))
  group.add(cylinder(0.052 * scale, 0.055 * scale, [0, 1.64, 0], brassDark, 10))
  const neckCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.64, 0),
    new THREE.Vector3(0, 1.70, 0.015),
    new THREE.Vector3(0, 1.73, 0.075),
    new THREE.Vector3(0, 1.74, 0.13),
  ])
  const neck = new THREE.Mesh(new THREE.TubeGeometry(neckCurve, 8, 0.024 * scale, 7, false), brass)
  neck.castShadow = true; neck.receiveShadow = true; group.add(neck)

  const halfBottomW = 0.43 * scale
  const halfBottomD = 0.19 * scale
  const halfTopW = 0.34 * scale
  const halfTopD = 0.125 * scale
  const shadeBottomY = 1.70
  const shadeTopY = 1.86
  const shadeZ = 0.13
  const shadeGeometry = new THREE.BufferGeometry()
  shadeGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
    -halfBottomW, shadeBottomY, shadeZ - halfBottomD,
     halfBottomW, shadeBottomY, shadeZ - halfBottomD,
     halfBottomW, shadeBottomY, shadeZ + halfBottomD,
    -halfBottomW, shadeBottomY, shadeZ + halfBottomD,
    -halfTopW, shadeTopY, shadeZ - halfTopD,
     halfTopW, shadeTopY, shadeZ - halfTopD,
     halfTopW, shadeTopY, shadeZ + halfTopD,
    -halfTopW, shadeTopY, shadeZ + halfTopD,
  ], 3))
  shadeGeometry.setIndex([
    0, 1, 5, 0, 5, 4,
    1, 2, 6, 1, 6, 5,
    2, 3, 7, 2, 7, 6,
    3, 0, 4, 3, 4, 7,
    4, 5, 6, 4, 6, 7,
  ])
  shadeGeometry.computeVertexNormals()
  const shade = new THREE.Mesh(shadeGeometry, shadeGreen)
  shade.castShadow = true; shade.receiveShadow = true; group.add(shade)

  const underside = new THREE.Mesh(new THREE.PlaneGeometry(0.76 * scale, 0.30 * scale), warmUnderside)
  underside.position.set(0, shadeBottomY + 0.006, shadeZ)
  underside.rotation.x = -Math.PI / 2
  group.add(underside)

  group.add(box([0.88 * scale, 0.025 * scale, 0.025 * scale], [0, shadeBottomY - 0.005, shadeZ + halfBottomD], brass))
  group.add(box([0.88 * scale, 0.025 * scale, 0.025 * scale], [0, shadeBottomY - 0.005, shadeZ - halfBottomD], brassDark))
  group.add(box([0.025 * scale, 0.025 * scale, 0.38 * scale], [-halfBottomW, shadeBottomY - 0.005, shadeZ], brassDark))
  group.add(box([0.025 * scale, 0.025 * scale, 0.38 * scale], [halfBottomW, shadeBottomY - 0.005, shadeZ], brassDark))

  const chainX = 0.34 * scale
  group.add(cylinder(0.009 * scale, 0.18 * scale, [chainX, 1.60, shadeZ + 0.10], brassDark, 6))
  group.add(cylinder(0.026 * scale, 0.035 * scale, [chainX, 1.50, shadeZ + 0.10], brass, 8))

  scene.add(group)

  // Return the physical opening of the shade so hover lighting can originate
  // from the lamp model itself rather than from an unrelated ceiling point.
  const lightSource = new THREE.Vector3(0, shadeBottomY - 0.035, shadeZ + 0.015)
  lightSource.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY)
  lightSource.add(group.position)
  return lightSource
}
"""
text = text[:start] + new_desk_lamp + text[end:]

start = text.index('const createFolders = (scene: THREE.Scene) => {')
end = text.index('\nconst createHotspot =', start)
new_folders = """const createFolders = (scene: THREE.Scene) => {
  // Two-tier wartime office letter tray, matching the reference more closely
  // than the previous stack of solid boxes. The open fronts keep the papers
  // readable from both the home camera and the top-down WRITING view.
  const group = new THREE.Group(); group.position.set(-1.95, 1.30, -0.15)
  const trayGreen = makeMaterial(0x173b30, 0.82); trayGreen.flatShading = true
  const trayEdge = makeMaterial(0x0f2a22, 0.88); trayEdge.flatShading = true

  const addTray = (y: number) => {
    group.add(box([1.58, 0.045, 1.06], [0, y, 0], trayGreen))
    group.add(box([1.58, 0.16, 0.055], [0, y + 0.08, -0.50], trayGreen))
    group.add(box([0.055, 0.16, 1.00], [-0.76, y + 0.08, 0], trayGreen))
    group.add(box([0.055, 0.16, 1.00], [0.76, y + 0.08, 0], trayGreen))
    group.add(box([1.58, 0.075, 0.045], [0, y + 0.04, 0.50], trayEdge))
  }

  const lowerY = 0.035
  const upperY = 0.39
  addTray(lowerY)
  addTray(upperY)

  for (const x of [-0.73, 0.73]) {
    for (const z of [-0.45, 0.45]) {
      group.add(box([0.045, upperY - lowerY, 0.045], [x, (lowerY + upperY) / 2, z], trayEdge))
    }
  }

  const addPaperStack = (baseY: number, count: number, zOffset: number, skew: number) => {
    for (let i = 0; i < count; i += 1) {
      const paperMaterial = i % 3 === 1 ? materials.paper : materials.paperLight
      group.add(box(
        [1.22 - i * 0.012, 0.012, 0.76 - i * 0.006],
        [0.02 + i * 0.006, baseY + i * 0.013, zOffset + i * 0.004],
        paperMaterial,
        [0, skew + (i - count / 2) * 0.006, 0],
      ))
    }
  }

  addPaperStack(lowerY + 0.045, 7, 0.01, -0.025)
  addPaperStack(upperY + 0.045, 9, 0.00, 0.018)
  scene.add(group)

  // A substantial working pile sits on the desk in front of the trays, plus a
  // couple of loose sheets. This gives the WRITING area the busy, used-in-work
  // look of the supplied scene instead of an empty prop display.
  const deskPapers = new THREE.Group(); deskPapers.position.set(-1.70, 1.305, 0.92)
  for (let i = 0; i < 11; i += 1) {
    deskPapers.add(box(
      [1.34 - i * 0.008, 0.011, 0.90 - i * 0.005],
      [i * 0.006, i * 0.012, i * -0.003],
      i % 4 === 0 ? materials.paper : materials.paperLight,
      [0, -0.055 + i * 0.008, 0],
    ))
  }
  deskPapers.add(box([0.92, 0.010, 0.68], [-0.62, 0.018, -0.30], materials.paper, [0, 0.14, 0]))
  deskPapers.add(box([1.02, 0.010, 0.72], [0.64, 0.022, -0.18], materials.paperLight, [0, -0.10, 0]))
  scene.add(deskPapers)
}
"""
text = text[:start] + new_folders + text[end:]

start = text.index('const createHoverTarget = (')
end = text.index('\nconst createScene =', start)
new_hover = """const createHoverTarget = (
  scene: THREE.Scene,
  id: string,
  label: string,
  size: [number, number, number],
  position: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0],
  lightSources: THREE.Vector3[] = [],
): HoverTarget => {
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
    return { id, label, mesh, material, lights: [] }
  }

  let sources = [new THREE.Vector3(position[0], 6.45, position[2])]
  let targets = [new THREE.Vector3(...position)]
  let radius = Math.max(size[0], size[2]) * 0.58
  let intensity = 12

  if (id === 'radio') {
    sources = [new THREE.Vector3(WORLD.radioDesk.x, 6.35, WORLD.radioDesk.z - 0.05)]
    targets = [new THREE.Vector3(WORLD.radioDesk.x, 1.72, WORLD.radioDesk.z)]
    radius = 2.05
    intensity = 13
  } else if (id === 'trays') {
    // WRITING is lit by the two physical banker's lamps flanking the trays.
    // Each lamp gets its own pool so papers, tray rails and nearby desk props
    // cast proper shadows instead of being painted by an overlay cone.
    sources = lightSources.length > 0
      ? lightSources.map((source) => source.clone())
      : [new THREE.Vector3(position[0], 2.0, position[2] - 0.8), new THREE.Vector3(position[0], 2.0, position[2] + 0.8)]
    targets = [
      new THREE.Vector3(position[0] - 0.05, 1.42, position[2] - 0.26),
      new THREE.Vector3(position[0] + 0.12, 1.38, position[2] + 0.46),
    ]
    radius = 0.74
    intensity = 8.5
  } else if (id === 'projector') {
    sources = [new THREE.Vector3(position[0] + 0.05, 6.30, position[2] - 0.06)]
    targets = [new THREE.Vector3(position[0], 2.35, position[2])]
    radius = 1.05
    intensity = 11
  } else if (id === 'map') {
    sources = [MAP_SCONCE_SOURCE.clone()]
    targets = [new THREE.Vector3(WORLD.map.x, WORLD.map.y + 0.10, WORLD.map.z + 0.06)]
    radius = 2.05
    intensity = 28
  }

  const lights = sources.map((source, index) => {
    const target = targets[Math.min(index, targets.length - 1)]
    const distance = source.distanceTo(target)
    const angle = THREE.MathUtils.clamp(Math.atan(radius / distance), 0.18, 0.72)
    const light = new THREE.SpotLight(0xffd27a, 0, distance + 4, angle, 0.48, 1.45)
    light.position.copy(source)
    light.target.position.copy(target)
    light.castShadow = true
    light.shadow.mapSize.set(1024, 1024)
    light.shadow.camera.near = 0.04
    light.shadow.camera.far = distance + 4
    light.shadow.bias = -0.00025
    light.shadow.normalBias = 0.025
    light.userData.hoverIntensity = intensity
    scene.add(light, light.target)
    return light
  })

  return { id, label, mesh, material, lights }
}
"""
text = text[:start] + new_hover + text[end:]

old_lamps = """  createDeskLamp(scene, -2.25, -1.15, 0.9, -0.04); createDeskLamp(scene, -2.25, 0.85, 0.92, 0.03); createDeskLamp(scene, 0.9, -3.0, 0.82, 0.06)
"""
new_lamps = """  const trayLampRear = createDeskLamp(scene, -2.25, -1.15, 0.9, -0.04)
  const trayLampFront = createDeskLamp(scene, -2.25, 0.85, 0.92, 0.03)
  createDeskLamp(scene, 0.9, -3.0, 0.82, 0.06)
"""
if old_lamps not in text:
    raise SystemExit('desk lamp callsite not found')
text = text.replace(old_lamps, new_lamps, 1)

old_trays = """  createHoverTarget(scene, 'trays', 'WRITING', [1.65, 0.75, 1.25], [-1.95, 1.65, -0.15]),
"""
new_trays = """  createHoverTarget(scene, 'trays', 'WRITING', [1.65, 0.75, 1.25], [-1.95, 1.65, -0.15], [0, 0, 0], [trayLampRear, trayLampFront]),
"""
if old_trays not in text:
    raise SystemExit('trays hover callsite not found')
text = text.replace(old_trays, new_trays, 1)

old_setter = """  const setHoverHighlight = (target: HoverTarget, active: boolean) => {
    if (target.light) target.light.intensity = active ? Number(target.light.userData.hoverIntensity ?? 12) : 0
    // Only the back door still uses a mesh cover. The light-driven targets keep
    // this material at zero opacity so nothing can paint over foreground props.
    target.material.opacity = target.id === 'back-door' && active ? 0.18 : 0
  }
"""
new_setter = """  const setHoverHighlight = (target: HoverTarget, active: boolean) => {
    target.lights.forEach((light) => {
      light.intensity = active ? Number(light.userData.hoverIntensity ?? 12) : 0
    })
    // Only the back door still uses a mesh cover. The light-driven targets keep
    // this material at zero opacity so nothing can paint over foreground props.
    target.material.opacity = target.id === 'back-door' && active ? 0.18 : 0
  }
"""
if old_setter not in text:
    raise SystemExit('hover setter not found')
text = text.replace(old_setter, new_setter, 1)

text = text.replace('hover feedback now comes exclusively from the light-cone meshes.', 'hover feedback now comes exclusively from the scene spotlights.', 1)

path.write_text(text)
