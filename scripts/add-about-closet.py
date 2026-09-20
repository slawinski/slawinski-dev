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
"""  board: { x: -5.25, y: 5.55, z: -1.4, width: 4.1, height: 0.78 },
}""",
"""  board: { x: -5.25, y: 5.55, z: -1.4, width: 4.1, height: 0.78 },
  closet: { x: 2.75, width: 1.7, height: 4.9, depth: 1.65 },
}""",
'world closet config',
)

replace_once(
"""  scene.add(box([WORLD.roomWidth, WORLD.wallHeight, 0.18], [0, WORLD.wallHeight / 2, WORLD.backWallZ], materials.wall))
  scene.add(box([0.18, WORLD.wallHeight, WORLD.roomDepth], [-8.8, WORLD.wallHeight / 2, 0], materials.wallShadow))
  scene.add(box([0.18, WORLD.wallHeight, WORLD.roomDepth], [6.8, WORLD.wallHeight / 2, 0], materials.wallShadow))""",
"""  // The ABOUT doorway is a real opening in the back wall. Split the wall into
  // left/right/top sections so the camera can actually see into the closet once
  // the door swings inward instead of revealing another wall behind it.
  const backWallMinX = -WORLD.roomWidth / 2
  const backWallMaxX = WORLD.roomWidth / 2
  const closetMinX = WORLD.closet.x - WORLD.closet.width / 2
  const closetMaxX = WORLD.closet.x + WORLD.closet.width / 2
  const leftBackWidth = closetMinX - backWallMinX
  const rightBackWidth = backWallMaxX - closetMaxX
  scene.add(box([leftBackWidth, WORLD.wallHeight, 0.18], [(backWallMinX + closetMinX) / 2, WORLD.wallHeight / 2, WORLD.backWallZ], materials.wall))
  scene.add(box([rightBackWidth, WORLD.wallHeight, 0.18], [(closetMaxX + backWallMaxX) / 2, WORLD.wallHeight / 2, WORLD.backWallZ], materials.wall))
  scene.add(box([WORLD.closet.width, WORLD.wallHeight - WORLD.closet.height, 0.18], [WORLD.closet.x, WORLD.closet.height + (WORLD.wallHeight - WORLD.closet.height) / 2, WORLD.backWallZ], materials.wall))
  scene.add(box([0.18, WORLD.wallHeight, WORLD.roomDepth], [-8.8, WORLD.wallHeight / 2, 0], materials.wallShadow))
  scene.add(box([0.18, WORLD.wallHeight, WORLD.roomDepth], [6.8, WORLD.wallHeight / 2, 0], materials.wallShadow))""",
'back wall split',
)

replace_once(
"""  const backDoorMinX = 2.75 - 1.7 / 2
  const backDoorMaxX = 2.75 + 1.7 / 2""",
"""  const backDoorMinX = WORLD.closet.x - WORLD.closet.width / 2
  const backDoorMaxX = WORLD.closet.x + WORLD.closet.width / 2""",
'baseboard closet bounds',
)

replace_once(
"""  scene.add(box([1.7, 4.9, 0.28], [2.75, 2.45, WORLD.backWallZ + 0.02], materials.black))
  scene.add(box([0.26, 4.9, 1.65], [6.82, 2.45, -2.95], materials.wood))""",
"""  scene.add(box([0.26, 4.9, 1.65], [6.82, 2.45, -2.95], materials.wood))""",
'remove fake back door',
)

marker = """const createMapBoard = (scene: THREE.Scene) => {"""
closet_function = r"""const createBackCloset = (scene: THREE.Scene) => {
  const { x, width, height, depth } = WORLD.closet
  const frontZ = WORLD.backWallZ + 0.10
  const backZ = WORLD.backWallZ - depth
  const interiorCenterZ = (WORLD.backWallZ + backZ) / 2
  const closetWall = makeMaterial(0x69716c, 0.98); closetWall.flatShading = true
  const closetDark = makeMaterial(0x363b37, 0.96); closetDark.flatShading = true
  const doorMaterial = makeMaterial(0x25221e, 0.90); doorMaterial.flatShading = true
  const doorInset = makeMaterial(0x35312b, 0.92); doorInset.flatShading = true
  const shelfMaterial = makeMaterial(0x5b4228, 0.92); shelfMaterial.flatShading = true
  const coatMaterial = makeMaterial(0x313b34, 0.96); coatMaterial.flatShading = true

  // Recessed closet shell behind the wall opening.
  scene.add(box([width + 0.10, height, 0.12], [x, height / 2, backZ], closetDark))
  scene.add(box([0.12, height, depth], [x - width / 2 - 0.01, height / 2, interiorCenterZ], closetWall))
  scene.add(box([0.12, height, depth], [x + width / 2 + 0.01, height / 2, interiorCenterZ], closetWall))
  scene.add(box([width + 0.10, 0.12, depth], [x, height - 0.06, interiorCenterZ], closetWall))
  scene.add(box([width + 0.10, 0.10, depth], [x, 0.05, interiorCenterZ], materials.floor))

  // Heavy jamb/frame on the room side makes the recess read as a closet rather
  // than a black rectangle cut into the wall.
  const frameDepth = 0.20
  scene.add(box([0.13, height + 0.12, frameDepth], [x - width / 2 - 0.07, height / 2, frontZ], materials.woodDark))
  scene.add(box([0.13, height + 0.12, frameDepth], [x + width / 2 + 0.07, height / 2, frontZ], materials.woodDark))
  scene.add(box([width + 0.27, 0.13, frameDepth], [x, height + 0.065, frontZ], materials.woodDark))

  // A shelf, rail and a couple of low-poly coats give the close-up something
  // recognisably closet-like to inspect without over-detailing the scene.
  scene.add(box([width - 0.24, 0.10, 0.52], [x, 3.72, backZ + 0.40], shelfMaterial))
  scene.add(cylinder((width - 0.40) / 2, 0.045, [x, 3.35, backZ + 0.58], materials.metalDark, 10, [0, 0, Math.PI / 2]))
  scene.add(box([0.52, 1.30, 0.18], [x - 0.36, 2.54, backZ + 0.55], coatMaterial, [0, 0, -0.05]))
  scene.add(box([0.54, 1.16, 0.18], [x + 0.34, 2.61, backZ + 0.57], makeMaterial(0x51483b, 0.96), [0, 0, 0.06]))
  scene.add(box([0.72, 0.42, 0.52], [x, 0.28, backZ + 0.44], shelfMaterial))

  // Door pivots at its left jamb. Positive Y rotation sends the free edge into
  // negative Z, so it genuinely opens inward into the closet during the dolly.
  const doorPivot = new THREE.Group()
  doorPivot.position.set(x - width / 2 + 0.06, 0.08, frontZ + 0.015)
  const doorWidth = width - 0.12
  const doorHeight = height - 0.16
  const door = box([doorWidth, doorHeight, 0.12], [doorWidth / 2, doorHeight / 2, 0], doorMaterial)
  doorPivot.add(door)
  doorPivot.add(box([doorWidth - 0.24, 1.62, 0.035], [doorWidth / 2, 3.63, 0.075], doorInset))
  doorPivot.add(box([doorWidth - 0.24, 1.62, 0.035], [doorWidth / 2, 1.57, 0.075], doorInset))
  doorPivot.add(cylinder(0.065, 0.10, [doorWidth - 0.18, 2.36, 0.105], materials.brass, 10, [Math.PI / 2, 0, 0]))
  scene.add(doorPivot)

  // Soft practical light at the closet ceiling. Its intensity follows the door
  // opening so the light does not leak through the closed door in the home view.
  const fixtureMaterial = new THREE.MeshStandardMaterial({
    color: 0xe5dbb9,
    roughness: 0.80,
    emissive: 0xffd797,
    emissiveIntensity: 0.05,
  })
  const fixture = cylinder(0.18, 0.055, [x, height - 0.16, WORLD.backWallZ - depth * 0.45], fixtureMaterial, 12)
  scene.add(fixture)
  const light = new THREE.SpotLight(0xffdda5, 0, 5.2, 0.88, 0.78, 1.35)
  light.position.set(x, height - 0.22, WORLD.backWallZ - depth * 0.45)
  light.target.position.set(x, 1.55, backZ + 0.42)
  light.castShadow = true
  light.shadow.mapSize.set(512, 512)
  light.shadow.bias = -0.00025
  light.shadow.normalBias = 0.025
  scene.add(light, light.target)

  const setProgress = (value: number) => {
    const progress = THREE.MathUtils.clamp(value, 0, 1)
    doorPivot.rotation.y = progress * 1.36
    light.intensity = progress * 4.2
    fixtureMaterial.emissiveIntensity = 0.05 + progress * 0.72
  }
  setProgress(0)

  return { setProgress }
}

"""
if marker not in text:
    raise SystemExit('createMapBoard marker missing')
text = text.replace(marker, closet_function + marker, 1)

replace_once(
"""const createScene = (scene: THREE.Scene, camera: THREE.PerspectiveCamera) => {
  const updateClock = createRoomShell(scene); createTable(scene); createRadioDesk(scene); createMapBoard(scene); const projector = createProjector(scene); const projectionScreen = createProjectionScreen(scene); createPaperCluster(scene); createFolders(scene); const fanSpinner = createWallFan(scene)""",
"""const createScene = (scene: THREE.Scene, camera: THREE.PerspectiveCamera) => {
  const updateClock = createRoomShell(scene); const closet = createBackCloset(scene); createTable(scene); createRadioDesk(scene); createMapBoard(scene); const projector = createProjector(scene); const projectionScreen = createProjectionScreen(scene); createPaperCluster(scene); createFolders(scene); const fanSpinner = createWallFan(scene)""",
'create closet in scene',
)

replace_once(
"""  return { hotspots, hoverTargets, boardDraw, fanSpinner, updateClock, projector, projectionScreen }""",
"""  return { hotspots, hoverTargets, boardDraw, fanSpinner, updateClock, projector, projectionScreen, closet }""",
'return closet',
)

replace_once(
"""  const { hotspots, hoverTargets, boardDraw, fanSpinner, updateClock, projector, projectionScreen } = createScene(scene, camera)""",
"""  const { hotspots, hoverTargets, boardDraw, fanSpinner, updateClock, projector, projectionScreen, closet } = createScene(scene, camera)""",
'destructure closet',
)

replace_once(
"""  const TRAYS_TARGET = new THREE.Vector3(-1.95, 1.61, -0.15)
  const TARGET_BOUNDS""",
"""  const TRAYS_TARGET = new THREE.Vector3(-1.95, 1.61, -0.15)
  const CLOSET_TARGET = new THREE.Vector3(WORLD.closet.x, 2.42, WORLD.backWallZ - WORLD.closet.depth * 0.72)
  const TARGET_BOUNDS""",
'closet target',
)

replace_once(
"""  let projectorScreenProgress = 0
  let viewMode: 'home' | 'transition' | 'map' | 'radio' | 'trays' = 'home'
  let cameraTransition: {
    startTime: number
    duration: number
    path: THREE.Curve<THREE.Vector3>
    startTarget: THREE.Vector3
    endTarget: THREE.Vector3
    destination: 'home' | 'map' | 'radio' | 'trays'
  } | null = null""",
"""  let projectorScreenProgress = 0
  let closetProgress = 0
  let closetTargetProgress = 0
  let viewMode: 'home' | 'transition' | 'map' | 'radio' | 'trays' | 'closet' = 'home'
  let cameraTransition: {
    startTime: number
    duration: number
    path: THREE.Curve<THREE.Vector3>
    startTarget: THREE.Vector3
    endTarget: THREE.Vector3
    destination: 'home' | 'map' | 'radio' | 'trays' | 'closet'
  } | null = null""",
'closet transition state',
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
  const setZoomOutVisible""",
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
  const getClosetViewPosition = () => {
    // Frame almost the entire doorway while aiming slightly into the recess so
    // the final shot reads as looking into a small room rather than at a door.
    const verticalHalfFov = THREE.MathUtils.degToRad(camera.fov * 0.5)
    const verticalDistance = (WORLD.closet.height * 0.5) / Math.tan(verticalHalfFov)
    const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * camera.aspect)
    const horizontalDistance = (WORLD.closet.width * 0.5) / Math.tan(horizontalHalfFov)
    const distance = Math.max(verticalDistance, horizontalDistance) * 1.14
    return new THREE.Vector3(CLOSET_TARGET.x + 0.12, CLOSET_TARGET.y + 0.04, CLOSET_TARGET.z + distance)
  }
  const setZoomOutVisible""",
'closet view position',
)

replace_once(
"""    } else if (viewMode === 'trays') {
      camera.position.copy(getTraysViewPosition())
      cameraTarget.copy(TRAYS_TARGET)
      controls.target.copy(TRAYS_TARGET)
    }
  }""",
"""    } else if (viewMode === 'trays') {
      camera.position.copy(getTraysViewPosition())
      cameraTarget.copy(TRAYS_TARGET)
      controls.target.copy(TRAYS_TARGET)
    } else if (viewMode === 'closet') {
      camera.position.copy(getClosetViewPosition())
      cameraTarget.copy(CLOSET_TARGET)
      controls.target.copy(CLOSET_TARGET)
    }
  }""",
'closet resize handling',
)

anchor = """  const setProjectorActive = (active: boolean) => {"""
closet_dolly = r"""  const startClosetDolly = () => {
    if (viewMode !== 'home') return

    clearHoverHighlights()
    hotspots.forEach((hotspot) => { hotspot.highlight.visible = false })
    boardDraw('ABOUT')
    closetTargetProgress = 1

    const end = getClosetViewPosition()
    if (reducedMotion.matches) {
      closetProgress = 1
      closet.setProgress(1)
      camera.position.copy(end)
      cameraTarget.copy(CLOSET_TARGET)
      controls.target.copy(CLOSET_TARGET)
      viewMode = 'closet'
      setZoomOutVisible(true)
      return
    }

    const start = camera.position.clone()
    const direction = end.clone().sub(start)
    // Glide toward the doorway with a small lateral settle. The door begins to
    // open as the camera approaches and swings fully inward before the close-up.
    const controlA = start.clone().addScaledVector(direction, 0.30).add(new THREE.Vector3(0.16, 0.04, 0.16))
    const controlB = start.clone().addScaledVector(direction, 0.76).add(new THREE.Vector3(0.22, -0.03, 0.04))
    cameraTransition = {
      startTime: performance.now(),
      duration: 2650,
      path: new THREE.CubicBezierCurve3(start, controlA, controlB, end),
      startTarget: cameraTarget.clone(),
      endTarget: CLOSET_TARGET.clone(),
      destination: 'closet',
    }
    setZoomOutVisible(false)
    viewMode = 'transition'
  }
"""
if anchor not in text:
    raise SystemExit('setProjectorActive anchor missing')
text = text.replace(anchor, closet_dolly + anchor, 1)

replace_once(
"""    if (target.id === 'trays') startTraysDolly()
  }""",
"""    if (target.id === 'trays') startTraysDolly()
    if (target.id === 'back-door') startClosetDolly()
  }""",
'back door click dolly',
)

replace_once(
"""    viewMode = 'home'
    setProjectorActive(false)
    setZoomOutVisible(false)""",
"""    viewMode = 'home'
    setProjectorActive(false)
    closetTargetProgress = 0
    if (reducedMotion.matches) {
      closetProgress = 0
      closet.setProgress(0)
    }
    setZoomOutVisible(false)""",
'reset closet',
)

replace_once(
"""    if (viewMode !== 'map' && viewMode !== 'radio' && viewMode !== 'trays') return
    setZoomOutVisible(false)""",
"""    if (viewMode !== 'map' && viewMode !== 'radio' && viewMode !== 'trays' && viewMode !== 'closet') return
    setZoomOutVisible(false)
    closetTargetProgress = 0""",
'zoom out closet',
)

replace_once(
"""    updateClock()

    const projectorTarget = projectorActive ? 1 : 0""",
"""    updateClock()

    if (reducedMotion.matches) {
      closetProgress = closetTargetProgress
    } else {
      closetProgress = THREE.MathUtils.damp(closetProgress, closetTargetProgress, closetTargetProgress > closetProgress ? 3.2 : 4.2, dt)
      if (Math.abs(closetProgress - closetTargetProgress) < 0.001) closetProgress = closetTargetProgress
    }
    closet.setProgress(closetProgress)

    const projectorTarget = projectorActive ? 1 : 0""",
'animate closet door',
)

replace_once(
"""        setZoomOutVisible(destination === 'map' || destination === 'radio' || destination === 'trays')""",
"""        setZoomOutVisible(destination === 'map' || destination === 'radio' || destination === 'trays' || destination === 'closet')""",
'closet zoom out visibility',
)

# Guard the historically fragile map grid while this patch touches the same file.
expected_grid = "context.beginPath(); context.moveTo(0, y); context.lineTo(canvas.width, y); context.stroke()"
if expected_grid not in text:
    raise SystemExit('map horizontal grid regression detected')

path.write_text(text)
