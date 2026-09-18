from pathlib import Path
import re


room = Path('apps/web/src/experience/operation-room.ts')
text = room.read_text()


def replace_once(old: str, new: str, label: str) -> None:
    global text
    if text.count(old) != 1:
        raise SystemExit(f'{label}: expected exactly one match, found {text.count(old)}')
    text = text.replace(old, new, 1)


replace_once(
    """  const MAP_TARGET = new THREE.Vector3(WORLD.map.x, WORLD.map.y, WORLD.map.z + 0.06)
  const RADIO_TARGET = new THREE.Vector3(WORLD.radioDesk.x, 1.92, WORLD.radioDesk.z + 0.04)
  const TARGET_BOUNDS = { minX: -6, maxX: 4, minY: 0.8, maxY: 5.2, minZ: -5.8, maxZ: 4 }
""",
    """  const MAP_TARGET = new THREE.Vector3(WORLD.map.x, WORLD.map.y, WORLD.map.z + 0.06)
  const RADIO_TARGET = new THREE.Vector3(WORLD.radioDesk.x, 1.92, WORLD.radioDesk.z + 0.04)
  const TRAYS_TARGET = new THREE.Vector3(-1.95, 1.61, -0.15)
  const TARGET_BOUNDS = { minX: -6, maxX: 4, minY: 0.8, maxY: 5.2, minZ: -5.8, maxZ: 4 }
""",
    'camera targets',
)

replace_once(
    "let viewMode: 'home' | 'transition' | 'map' | 'radio' = 'home'",
    "let viewMode: 'home' | 'transition' | 'map' | 'radio' | 'trays' = 'home'",
    'view mode union',
)
replace_once(
    '    path: THREE.CatmullRomCurve3\n',
    '    path: THREE.Curve<THREE.Vector3>\n',
    'camera transition path type',
)
replace_once(
    "    destination: 'home' | 'map' | 'radio'\n",
    "    destination: 'home' | 'map' | 'radio' | 'trays'\n",
    'camera transition destination union',
)

replace_once(
    """  const getRadioViewPosition = () => {
    // Keep the whole communications bench in frame while moving the camera
    // physically through the room. This is a real dolly move, not a CSS/FOV fake.
    const frameWidth = WORLD.radioDesk.width + 0.45
    const frameHeight = 2.55
    const verticalHalfFov = THREE.MathUtils.degToRad(camera.fov * 0.5)
    const verticalDistance = (frameHeight * 0.5) / Math.tan(verticalHalfFov)
    const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * camera.aspect)
    const horizontalDistance = (frameWidth * 0.5) / Math.tan(horizontalHalfFov)
    const distance = Math.max(verticalDistance, horizontalDistance) * 1.06
    return new THREE.Vector3(RADIO_TARGET.x, RADIO_TARGET.y + 0.12, RADIO_TARGET.z + distance)
  }
""",
    """  const getRadioViewPosition = () => {
    // Keep the whole communications bench in frame while moving the camera
    // physically through the room. This is a real dolly move, not a CSS/FOV fake.
    const frameWidth = WORLD.radioDesk.width + 0.45
    const frameHeight = 2.55
    const verticalHalfFov = THREE.MathUtils.degToRad(camera.fov * 0.5)
    const verticalDistance = (frameHeight * 0.5) / Math.tan(verticalHalfFov)
    const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * camera.aspect)
    const horizontalDistance = (frameWidth * 0.5) / Math.tan(horizontalHalfFov)
    const distance = Math.max(verticalDistance, horizontalDistance) * 1.10
    return new THREE.Vector3(RADIO_TARGET.x + 0.04, RADIO_TARGET.y + 0.10, RADIO_TARGET.z + distance)
  }
  const getTraysViewPosition = () => {
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
    'radio and tray view positions',
)

replace_once(
    """    } else if (viewMode === 'radio') {
      camera.position.copy(getRadioViewPosition())
      cameraTarget.copy(RADIO_TARGET)
      controls.target.copy(RADIO_TARGET)
    }
""",
    """    } else if (viewMode === 'radio') {
      camera.position.copy(getRadioViewPosition())
      cameraTarget.copy(RADIO_TARGET)
      controls.target.copy(RADIO_TARGET)
    } else if (viewMode === 'trays') {
      camera.position.copy(getTraysViewPosition())
      cameraTarget.copy(TRAYS_TARGET)
      controls.target.copy(TRAYS_TARGET)
    }
""",
    'resize focused views',
)

pattern = re.compile(
    r"  const easeInOutCubic = \(value: number\) => value < 0\.5\n"
    r"    \? 4 \* value \* value \* value\n"
    r"    : 1 - Math\.pow\(-2 \* value \+ 2, 3\) / 2\n"
)
text, count = pattern.subn(
    "  // Fifth-order smoothstep gives zero velocity and zero acceleration at both\n"
    "  // ends, closer to a programmed motion-control camera move.\n"
    "  const easeMotionControl = (value: number) => value * value * value * (value * (value * 6 - 15) + 10)\n",
    text,
    count=1,
)
if count != 1:
    raise SystemExit(f'motion easing: expected one replacement, got {count}')

radio_pattern = re.compile(
    r"  const startRadioDolly = \(\) => \{.*?\n  \}\n  const setProjectorActive =",
    re.S,
)
radio_replacement = """  const startRadioDolly = () => {
    if (viewMode !== 'home') return

    hoverTargets.forEach((target) => { target.material.opacity = 0 })
    hotspots.forEach((hotspot) => { hotspot.highlight.visible = false })
    boardDraw('CONTACT')

    const end = getRadioViewPosition()
    if (reducedMotion.matches) {
      camera.position.copy(end)
      cameraTarget.copy(RADIO_TARGET)
      controls.target.copy(RADIO_TARGET)
      viewMode = 'radio'
      setZoomOutVisible(true)
      return
    }

    const start = camera.position.clone()
    const direction = end.clone().sub(start)
    // A single cubic Bezier avoids the small Catmull-Rom overshoot that made
    // the old radio move wobble near the desk. The controls preserve forward
    // momentum and only introduce a restrained lateral settle at the end.
    const controlA = start.clone().addScaledVector(direction, 0.30).add(new THREE.Vector3(-0.05, 0.06, 0.12))
    const controlB = start.clone().addScaledVector(direction, 0.72).add(new THREE.Vector3(-0.04, 0.03, 0.06))
    cameraTransition = {
      startTime: performance.now(),
      duration: 2350,
      path: new THREE.CubicBezierCurve3(start, controlA, controlB, end),
      startTarget: cameraTarget.clone(),
      endTarget: RADIO_TARGET.clone(),
      destination: 'radio',
    }
    setZoomOutVisible(false)
    viewMode = 'transition'
  }
  const startTraysDolly = () => {
    if (viewMode !== 'home') return

    hoverTargets.forEach((target) => { target.material.opacity = 0 })
    hotspots.forEach((hotspot) => { hotspot.highlight.visible = false })
    boardDraw('WRITING')

    const end = getTraysViewPosition()
    if (reducedMotion.matches) {
      camera.position.copy(end)
      cameraTarget.copy(TRAYS_TARGET)
      controls.target.copy(TRAYS_TARGET)
      viewMode = 'trays'
      setZoomOutVisible(true)
      return
    }

    const start = camera.position.clone()
    const direction = end.clone().sub(start)
    // Motion-control style move: glide toward the desk, arc over the trays,
    // then settle into a near-perfect top-down inspection shot.
    const controlA = start.clone().addScaledVector(direction, 0.28).add(new THREE.Vector3(0.12, 0.55, 0.38))
    const controlB = start.clone().addScaledVector(direction, 0.74).add(new THREE.Vector3(0.08, 0.52, 0.10))
    cameraTransition = {
      startTime: performance.now(),
      duration: 2700,
      path: new THREE.CubicBezierCurve3(start, controlA, controlB, end),
      startTarget: cameraTarget.clone(),
      endTarget: TRAYS_TARGET.clone(),
      destination: 'trays',
    }
    setZoomOutVisible(false)
    viewMode = 'transition'
  }
  const setProjectorActive ="""
text, count = radio_pattern.subn(radio_replacement, text, count=1)
if count != 1:
    raise SystemExit(f'radio/tray dolly functions: expected one replacement, got {count}')

replace_once(
    """    if (target.id === 'map') startMapDolly()
    if (target.id === 'radio') startRadioDolly()
""",
    """    if (target.id === 'map') startMapDolly()
    if (target.id === 'radio') startRadioDolly()
    if (target.id === 'trays') startTraysDolly()
""",
    'tray click handler',
)

replace_once(
    "if (viewMode !== 'map' && viewMode !== 'radio') return",
    "if (viewMode !== 'map' && viewMode !== 'radio' && viewMode !== 'trays') return",
    'zoom-out focused modes',
)

replace_once(
    "setZoomOutVisible(destination === 'map' || destination === 'radio')",
    "setZoomOutVisible(destination === 'map' || destination === 'radio' || destination === 'trays')",
    'zoom-out visibility after transition',
)

replace_once(
    'const eased = easeInOutCubic(progress)',
    'const eased = easeMotionControl(progress)',
    'transition easing usage',
)

# The return-to-room move benefits from the same no-overshoot motion profile.
old_zoom_path = "path: new THREE.CatmullRomCurve3([start, firstGuide, secondGuide, HOME_POSITION.clone()], false, 'catmullrom', 0.42),"
new_zoom_path = "path: new THREE.CubicBezierCurve3(start, firstGuide, secondGuide, HOME_POSITION.clone()),"
replace_once(old_zoom_path, new_zoom_path, 'zoom-out curve')

room.write_text(text)
