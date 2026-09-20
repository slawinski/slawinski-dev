from pathlib import Path

path = Path('apps/web/src/experience/operation-room.ts')
text = path.read_text()

def replace_once(old: str, new: str, label: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one match, found {count}')
    text = text.replace(old, new, 1)

replace_once(
"""const MAP_SCONCE_MOUNT = new THREE.Vector3(WORLD.map.x, 6.55, WORLD.backWallZ + 0.18)
const MAP_SCONCE_SOURCE = new THREE.Vector3(WORLD.map.x, 6.08, WORLD.map.z + 0.55)
""",
"""const MAP_SCONCE_MOUNT = new THREE.Vector3(WORLD.map.x, 6.55, WORLD.backWallZ + 0.18)
const MAP_SCONCE_SOURCE = new THREE.Vector3(WORLD.map.x, 6.08, WORLD.map.z + 0.55)
const CLOSET_SCONCE_MOUNT = new THREE.Vector3(WORLD.closet.x, 5.48, WORLD.backWallZ + 0.18)
const CLOSET_SCONCE_SOURCE = new THREE.Vector3(WORLD.closet.x, 5.10, WORLD.backWallZ + 0.55)
""",
'closet sconce constants',
)

map_sconce_tail = """  const glow = new THREE.PointLight(0xffd38a, 0.20, 1.25, 2)
  glow.position.copy(source)
  scene.add(glow)
}

const createHoverTarget = (
"""
closet_sconce = """  const glow = new THREE.PointLight(0xffd38a, 0.20, 1.25, 2)
  glow.position.copy(source)
  scene.add(glow)
}

const createClosetSconce = (scene: THREE.Scene) => {
  const mount = CLOSET_SCONCE_MOUNT.clone()
  const source = CLOSET_SCONCE_SOURCE.clone()
  const target = new THREE.Vector3(WORLD.closet.x, 2.55, WORLD.backWallZ + 0.12)
  const aim = target.clone().sub(source).normalize()
  const darkMetal = makeMaterial(0x252b27, 0.80); darkMetal.flatShading = true
  const greenEnamel = new THREE.MeshStandardMaterial({
    color: 0x354d27,
    roughness: 0.74,
    metalness: 0.10,
    flatShading: true,
    side: THREE.DoubleSide,
  })
  const warmInterior = new THREE.MeshStandardMaterial({
    color: 0xe2d7ad,
    roughness: 0.88,
    emissive: 0xc9994e,
    emissiveIntensity: 0.24,
    side: THREE.DoubleSide,
  })

  scene.add(cylinder(0.15, 0.07, [mount.x, mount.y, mount.z], darkMetal, 12, [Math.PI / 2, 0, 0]))
  const armCurve = new THREE.CatmullRomCurve3([
    mount.clone().add(new THREE.Vector3(0, 0, 0.04)),
    mount.clone().add(new THREE.Vector3(0, 0, 0.32)),
    new THREE.Vector3(source.x, source.y + 0.16, source.z - 0.12),
    source.clone().addScaledVector(aim, -0.10),
  ])
  const arm = new THREE.Mesh(new THREE.TubeGeometry(armCurve, 10, 0.032, 7, false), darkMetal)
  arm.castShadow = true; arm.receiveShadow = true; scene.add(arm)

  const shadeLength = 0.31
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.28, shadeLength, 10, 1, true), greenEnamel)
  shade.position.copy(source).addScaledVector(aim, -shadeLength / 2)
  shade.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), aim)
  shade.castShadow = true; shade.receiveShadow = true; scene.add(shade)

  const reflector = new THREE.Mesh(new THREE.CircleGeometry(0.23, 12), warmInterior)
  reflector.position.copy(source).addScaledVector(aim, -0.010)
  reflector.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), aim)
  scene.add(reflector)

  const bulbMaterial = new THREE.MeshStandardMaterial({
    color: 0xffe7ad,
    roughness: 0.34,
    emissive: 0xffc96c,
    emissiveIntensity: 0.64,
  })
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 9, 7), bulbMaterial)
  bulb.position.copy(source).addScaledVector(aim, -0.045)
  scene.add(bulb)

  const glow = new THREE.PointLight(0xffd38a, 0.16, 1.0, 2)
  glow.position.copy(source)
  scene.add(glow)
  return source
}

const createHoverTarget = (
"""
replace_once(map_sconce_tail, closet_sconce, 'closet sconce function')

replace_once(
"""  // Retained only for the back-door cover, which is intentionally still the
  // old treatment until that interaction gets its own design pass.
  const material = new THREE.MeshBasicMaterial({
""",
"""  // Kept only as part of the HoverTarget shape; visible hover feedback is
  // produced exclusively by real spotlights so it respects scene depth.
  const material = new THREE.MeshBasicMaterial({
""",
'hover material comment',
)

replace_once(
"""  if (id === 'back-door') {
    const cover = box(size, position, material, rotation)
    cover.castShadow = false
    cover.receiveShadow = false
    cover.renderOrder = 18
    scene.add(cover)
    return { id, label, mesh, material, lights: [] }
  }

""",
"",
'remove door highlight box',
)

replace_once(
"""  } else if (id === 'map') {
    sources = [MAP_SCONCE_SOURCE.clone()]
    targets = [new THREE.Vector3(WORLD.map.x, WORLD.map.y + 0.10, WORLD.map.z + 0.06)]
    radius = 2.05
    intensity = 28
  }
""",
"""  } else if (id === 'map') {
    sources = [MAP_SCONCE_SOURCE.clone()]
    targets = [new THREE.Vector3(WORLD.map.x, WORLD.map.y + 0.10, WORLD.map.z + 0.06)]
    radius = 2.05
    intensity = 28
  } else if (id === 'back-door') {
    sources = lightSources.length > 0 ? lightSources.map((source) => source.clone()) : [CLOSET_SCONCE_SOURCE.clone()]
    targets = [new THREE.Vector3(WORLD.closet.x, 2.45, WORLD.backWallZ + 0.10)]
    radius = 1.05
    intensity = 16
  }
""",
'door hover spotlight',
)

replace_once(
"""  createMapSconce(scene)
  const boardDraw = createHangingBoard(scene)
""",
"""  createMapSconce(scene)
  const closetLampSource = createClosetSconce(scene)
  const boardDraw = createHangingBoard(scene)
""",
'create closet sconce',
)

replace_once(
"""  createHoverTarget(scene, 'back-door', 'ABOUT', [1.8, 4.85, 0.12], [2.75, 2.45, WORLD.backWallZ + 0.20]),
""",
"""  createHoverTarget(scene, 'back-door', 'ABOUT', [1.8, 4.85, 0.12], [2.75, 2.45, WORLD.backWallZ + 0.20], [0, 0, 0], [closetLampSource]),
""",
'door hover source',
)

replace_once(
"""  const TRAYS_TARGET = new THREE.Vector3(-1.95, 1.61, -0.15)
""",
"""  const TRAYS_TARGET = new THREE.Vector3(-1.95, 1.50, -0.15)
""",
'trays target',
)

replace_once(
"""  const setHoverHighlight = (target: HoverTarget, active: boolean) => {
    target.lights.forEach((light) => {
      light.intensity = active ? Number(light.userData.hoverIntensity ?? 12) : 0
    })
    // Only the back door still uses a mesh cover. The light-driven targets keep
    // this material at zero opacity so nothing can paint over foreground props.
    target.material.opacity = target.id === 'back-door' && active ? 0.18 : 0
  }
""",
"""  const setHoverHighlight = (target: HoverTarget, active: boolean) => {
    target.lights.forEach((light) => {
      light.intensity = active ? Number(light.userData.hoverIntensity ?? 12) : 0
    })
    target.material.opacity = 0
  }
""",
'remove door box highlight behavior',
)

replace_once(
"""  const getTraysViewPosition = () => {
    // Near-vertical framing of the writing trays. A tiny forward offset keeps
    // THREE.Camera.lookAt away from the singular perfectly-vertical case while
    // remaining visually top-down.
    const frameWidth = 1.95
    const frameDepth = 1.50
    const verticalHalfFov = THREE.MathUtils.degToRad(camera.fov * 0.5)
    const verticalDistance = (frameDepth * 0.5) / Math.tan(verticalHalfFov)
    const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * camera.aspect)
    const horizontalDistance = (frameWidth * 0.5) / Math.tan(horizontalHalfFov)
    const distance = Math.max(verticalDistance, horizontalDistance) * 1.18
    return new THREE.Vector3(TRAYS_TARGET.x + 0.03, TRAYS_TARGET.y + distance, TRAYS_TARGET.z + 0.16)
  }
""",
"""  const getTraysViewPosition = () => {
    // Human-height inspection shot: the viewer is standing in front of the desk
    // and looking naturally down at the trays, rather than hovering above them.
    const aspectCompensation = THREE.MathUtils.clamp(1.15 / Math.max(camera.aspect, 0.72), 0.82, 1.18)
    return new THREE.Vector3(
      TRAYS_TARGET.x + 0.12,
      TRAYS_TARGET.y + 1.28,
      TRAYS_TARGET.z + 2.70 * aspectCompensation,
    )
  }
""",
'trays standing view',
)

replace_once(
"""  const easeMotionControl = (value: number) => value * value * value * (value * (value * 6 - 15) + 10)
""",
"""  const easeMotionControl = (value: number) => value * value * value * (value * (value * 6 - 15) + 10)
  const settleControls = (enabled: boolean) => {
    // OrbitControls keeps internal damping deltas. Flushing them at a camera
    // hand-off prevents the one-frame snap that used to happen at the end of a dolly.
    controls.target.copy(cameraTarget)
    const damping = controls.enableDamping
    controls.enableDamping = false
    controls.update()
    controls.enableDamping = damping
    controls.enabled = enabled
  }
""",
'settle controls helper',
)

needle = """    if (viewMode !== 'home') return

    clearHoverHighlights()
"""
count = text.count(needle)
if count != 4:
    raise SystemExit(f'disable controls at dolly start: expected 4 matches, found {count}')
text = text.replace(needle, """    if (viewMode !== 'home') return
    controls.enabled = false

    clearHoverHighlights()
""", 4)

for target, mode in [('MAP_TARGET', 'map'), ('RADIO_TARGET', 'radio'), ('TRAYS_TARGET', 'trays')]:
    replace_once(
        f"""      controls.target.copy({target})
      viewMode = '{mode}'
      setZoomOutVisible(true)
""",
        f"""      controls.target.copy({target})
      viewMode = '{mode}'
      settleControls(false)
      setZoomOutVisible(true)
""",
        f'{mode} reduced motion settle',
    )

replace_once(
"""      controls.target.copy(CLOSET_TARGET)
      viewMode = 'closet'
      setZoomOutVisible(true)
""",
"""      controls.target.copy(CLOSET_TARGET)
      viewMode = 'closet'
      settleControls(false)
      setZoomOutVisible(true)
""",
'closet reduced motion settle',
)

count = text.count('startTarget: cameraTarget.clone(),')
if count != 5:
    raise SystemExit(f'transition start targets: expected 5 matches, found {count}')
text = text.replace('startTarget: cameraTarget.clone(),', 'startTarget: controls.target.clone(),', 5)

replace_once(
"""    camera.position.copy(HOME_POSITION)
    cameraTarget.copy(HOME_TARGET)
    controls.target.copy(HOME_TARGET)
    controls.update()
""",
"""    camera.position.copy(HOME_POSITION)
    cameraTarget.copy(HOME_TARGET)
    settleControls(true)
""",
'reset controls smoothly',
)

replace_once(
"""        cameraTarget.copy(cameraTransition.endTarget)
        controls.target.copy(cameraTransition.endTarget)
        cameraTransition = null
        viewMode = destination
        setZoomOutVisible(destination === 'map' || destination === 'radio' || destination === 'trays' || destination === 'closet')
        if (destination === 'home') selectDefault()
""",
"""        cameraTarget.copy(cameraTransition.endTarget)
        controls.target.copy(cameraTransition.endTarget)
        cameraTransition = null
        viewMode = destination
        settleControls(destination === 'home')
        setZoomOutVisible(destination === 'map' || destination === 'radio' || destination === 'trays' || destination === 'closet')
        if (destination === 'home') selectDefault()
""",
'final camera handoff',
)

replace_once(
"""    if (cameraTransition) {
      camera.lookAt(cameraTarget)
    } else {
      controls.update()
    }
""",
"""    if (cameraTransition || viewMode !== 'home') {
      camera.lookAt(cameraTarget)
    } else {
      controls.update()
    }
""",
'focused view camera stability',
)

if 'context.beginPath(); context.moveTo(0, y); context.lineTo(canvas.width, y); context.stroke()' not in text:
    raise SystemExit('map horizontal grid regression detected')

path.write_text(text)
