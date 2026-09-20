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
"""const createProjectionScreen = (scene: THREE.Scene) => {
  const width = WORLD.map.width + 0.42
  const height = WORLD.map.height + 0.38
  const topY = Math.min(WORLD.wallHeight - 0.55, WORLD.map.y + WORLD.map.height / 2 + 0.55)
  const z = WORLD.map.z + 0.32
  const group = new THREE.Group()
  group.position.set(WORLD.map.x, topY, z)
""",
"""const createProjectionScreen = (scene: THREE.Scene) => {
  // The projector screen covers only the right half of the map. Its right edge
  // stays aligned with the map while the left edge is pulled inward, matching
  // the requested 'shorten from the left' behavior.
  const width = WORLD.map.width * 0.5
  const height = WORLD.map.height + 0.38
  const topY = Math.min(WORLD.wallHeight - 0.55, WORLD.map.y + WORLD.map.height / 2 + 0.55)
  const z = WORLD.map.z + 0.32
  const rightEdgeX = WORLD.map.x + WORLD.map.width / 2
  const screenX = rightEdgeX - width / 2
  const group = new THREE.Group()
  group.position.set(screenX, topY, z)
""",
'projection screen width and anchor',
)

replace_once(
"""  const HOME_POSITION = new THREE.Vector3(-5.08, 4.14, 8.58)
  const HOME_TARGET = new THREE.Vector3(-2.15, 2.7, -4.75)
""",
"""  const HOME_POSITION = new THREE.Vector3(-5.08, 4.14, 8.58)
  const HOME_TARGET = new THREE.Vector3(-2.15, 2.7, -4.75)
  const HOME_UP = new THREE.Vector3(0, 1, 0)
  // Looking straight down while keeping +X at the top of the image is the same
  // orientation the viewer gets by facing the brown-door wall and tilting down.
  const TRAYS_UP = new THREE.Vector3(1, 0, 0)
""",
'camera up vectors',
)

replace_once(
"""  controls.target.copy(HOME_TARGET)
  camera.position.copy(HOME_POSITION)
  controls.enabled = true
""",
"""  controls.target.copy(HOME_TARGET)
  camera.position.copy(HOME_POSITION)
  camera.up.copy(HOME_UP)
  controls.enabled = true
""",
'initial camera up',
)

replace_once(
"""    startTarget: THREE.Vector3
    endTarget: THREE.Vector3
    destination: 'home' | 'map' | 'radio' | 'trays' | 'closet'
""",
"""    startTarget: THREE.Vector3
    endTarget: THREE.Vector3
    startUp: THREE.Vector3
    endUp: THREE.Vector3
    destination: 'home' | 'map' | 'radio' | 'trays' | 'closet'
""",
'transition up state',
)

replace_once(
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
"""  const getTraysViewPosition = () => {
    // True top-down WRITING view. The camera roll is handled separately with
    // TRAYS_UP so the top of the image points toward the brown-door wall (+X).
    const frameWidth = 1.95
    const frameDepth = 1.55
    const verticalHalfFov = THREE.MathUtils.degToRad(camera.fov * 0.5)
    const verticalDistance = (frameDepth * 0.5) / Math.tan(verticalHalfFov)
    const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * camera.aspect)
    const horizontalDistance = (frameWidth * 0.5) / Math.tan(horizontalHalfFov)
    const distance = Math.max(verticalDistance, horizontalDistance) * 1.24
    return new THREE.Vector3(TRAYS_TARGET.x, TRAYS_TARGET.y + distance, TRAYS_TARGET.z)
  }
""",
'trays top-down position',
)

replace_once(
"""    if (viewMode === 'map') {
      camera.position.copy(getMapViewPosition())
      cameraTarget.copy(MAP_TARGET)
      controls.target.copy(MAP_TARGET)
    } else if (viewMode === 'radio') {
      camera.position.copy(getRadioViewPosition())
      cameraTarget.copy(RADIO_TARGET)
      controls.target.copy(RADIO_TARGET)
    } else if (viewMode === 'trays') {
      camera.position.copy(getTraysViewPosition())
      cameraTarget.copy(TRAYS_TARGET)
      controls.target.copy(TRAYS_TARGET)
    } else if (viewMode === 'closet') {
      camera.position.copy(getClosetViewPosition())
      cameraTarget.copy(CLOSET_TARGET)
      controls.target.copy(CLOSET_TARGET)
    }
""",
"""    if (viewMode === 'map') {
      camera.position.copy(getMapViewPosition())
      cameraTarget.copy(MAP_TARGET)
      camera.up.copy(HOME_UP)
      controls.target.copy(MAP_TARGET)
    } else if (viewMode === 'radio') {
      camera.position.copy(getRadioViewPosition())
      cameraTarget.copy(RADIO_TARGET)
      camera.up.copy(HOME_UP)
      controls.target.copy(RADIO_TARGET)
    } else if (viewMode === 'trays') {
      camera.position.copy(getTraysViewPosition())
      cameraTarget.copy(TRAYS_TARGET)
      camera.up.copy(TRAYS_UP)
      controls.target.copy(TRAYS_TARGET)
    } else if (viewMode === 'closet') {
      camera.position.copy(getClosetViewPosition())
      cameraTarget.copy(CLOSET_TARGET)
      camera.up.copy(HOME_UP)
      controls.target.copy(CLOSET_TARGET)
    }
""",
'resize focused up vectors',
)

# Reduced-motion focused views must use the same orientation as animated ones.
for target, up, mode in [
    ('MAP_TARGET', 'HOME_UP', 'map'),
    ('RADIO_TARGET', 'HOME_UP', 'radio'),
    ('TRAYS_TARGET', 'TRAYS_UP', 'trays'),
    ('CLOSET_TARGET', 'HOME_UP', 'closet'),
]:
    replace_once(
        f"""      cameraTarget.copy({target})
      controls.target.copy({target})
      viewMode = '{mode}'
""",
        f"""      cameraTarget.copy({target})
      controls.target.copy({target})
      camera.up.copy({up})
      viewMode = '{mode}'
""",
        f'{mode} reduced-motion camera up',
    )

# Add smooth roll/up interpolation to all five camera transitions.
transitions = [
    ('MAP_TARGET', 'HOME_UP'),
    ('RADIO_TARGET', 'HOME_UP'),
    ('TRAYS_TARGET', 'TRAYS_UP'),
    ('CLOSET_TARGET', 'HOME_UP'),
    ('HOME_TARGET', 'HOME_UP'),
]
for target, end_up in transitions:
    old = f"""      startTarget: controls.target.clone(),
      endTarget: {target}.clone(),
"""
    new = f"""      startTarget: controls.target.clone(),
      endTarget: {target}.clone(),
      startUp: camera.up.clone(),
      endUp: {end_up}.clone(),
"""
    replace_once(old, new, f'{target} transition up')

replace_once(
"""    camera.position.copy(HOME_POSITION)
    cameraTarget.copy(HOME_TARGET)
    settleControls(true)
""",
"""    camera.position.copy(HOME_POSITION)
    cameraTarget.copy(HOME_TARGET)
    camera.up.copy(HOME_UP)
    settleControls(true)
""",
'reset camera up',
)

replace_once(
"""      camera.position.copy(cameraTransition.path.getPoint(eased))
      cameraTarget.lerpVectors(cameraTransition.startTarget, cameraTransition.endTarget, eased)
      controls.target.copy(cameraTarget)
""",
"""      camera.position.copy(cameraTransition.path.getPoint(eased))
      cameraTarget.lerpVectors(cameraTransition.startTarget, cameraTransition.endTarget, eased)
      camera.up.lerpVectors(cameraTransition.startUp, cameraTransition.endUp, eased).normalize()
      controls.target.copy(cameraTarget)
""",
'animated camera up interpolation',
)

replace_once(
"""        camera.position.copy(cameraTransition.path.getPoint(1))
        cameraTarget.copy(cameraTransition.endTarget)
        controls.target.copy(cameraTransition.endTarget)
""",
"""        camera.position.copy(cameraTransition.path.getPoint(1))
        cameraTarget.copy(cameraTransition.endTarget)
        camera.up.copy(cameraTransition.endUp)
        controls.target.copy(cameraTransition.endTarget)
""",
'final camera up handoff',
)

# Update the stale tray-motion comment to match the new final shot.
replace_once(
"""    // Motion-control style move: glide toward the desk, arc over the trays,
    // then settle into a near-perfect top-down inspection shot.
""",
"""    // Motion-control style move: glide toward the desk, arc above the trays,
    // then settle into the rotated true top-down inspection shot.
""",
'tray motion comment',
)

# Regression guards for previous camera and map fixes.
if 'if (!enabled) return' not in text:
    raise SystemExit('focused-view punch-zoom fix missing')
if 'context.beginPath(); context.moveTo(0, y); context.lineTo(canvas.width, y); context.stroke()' not in text:
    raise SystemExit('map horizontal grid regression detected')

path.write_text(text)
