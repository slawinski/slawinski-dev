from pathlib import Path

path = Path('apps/web/src/experience/operation-room.ts')
text = path.read_text()

# Track the two reel groups so the runtime can animate them when the projector is on.
old = """  const addReel = (x: number, y: number, radius: number, rotation = 0) => {
    const reel = new THREE.Group(); reel.position.set(x, y, 0.44); reel.rotation.z = rotation
"""
new = """  const reels: THREE.Group[] = []
  const addReel = (x: number, y: number, radius: number, rotation = 0) => {
    const reel = new THREE.Group(); reel.position.set(x, y, 0.44); reel.rotation.z = rotation
"""
if old not in text:
    raise SystemExit('projector reel helper start not found')
text = text.replace(old, new, 1)

old = """    reel.add(cylinder(radius * 0.15, 0.12, [0, 0, 0], enamelDark, 10, [Math.PI / 2, 0, 0]))
    reel.add(cylinder(radius * 0.06, 0.15, [0, 0, 0.015], rubber, 8, [Math.PI / 2, 0, 0]))
    group.add(reel)
  }
"""
new = """    reel.add(cylinder(radius * 0.15, 0.12, [0, 0, 0], enamelDark, 10, [Math.PI / 2, 0, 0]))
    reel.add(cylinder(radius * 0.06, 0.15, [0, 0, 0.015], rubber, 8, [Math.PI / 2, 0, 0]))
    reels.push(reel)
    group.add(reel)
  }
"""
if old not in text:
    raise SystemExit('projector reel helper end not found')
text = text.replace(old, new, 1)

# Keep a handle to the lens material so it can visibly warm up/cool down.
old = """  const lensGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.105, 0.105, 0.025, 12),
    new THREE.MeshStandardMaterial({ color: 0x17232b, roughness: 0.18, metalness: 0.18, emissive: 0xe6b975, emissiveIntensity: 0.32 }),
  )
"""
new = """  const lensMaterial = new THREE.MeshStandardMaterial({
    color: 0x17232b,
    roughness: 0.18,
    metalness: 0.18,
    emissive: 0xffd58c,
    emissiveIntensity: 0.08,
  })
  const lensGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.105, 0.105, 0.025, 12),
    lensMaterial,
  )
"""
if old not in text:
    raise SystemExit('projector lens block not found')
text = text.replace(old, new, 1)

# Add the working projection lamp and return animation handles from createProjector.
old = """  group.add(cylinder(0.055, 0.09, [0.62, 0.335, 0.45], rubber, 8, [Math.PI / 2, 0, 0]))

  scene.add(group)
}

const createPendant ="""
new = """  group.add(cylinder(0.055, 0.09, [0.62, 0.335, 0.45], rubber, 8, [Math.PI / 2, 0, 0]))

  // Projection light follows the physical lens direction. The projector group
  // is rotated toward the map, so a local -X spotlight lands on the pull-down
  // screen without hard-coding a second world-space aiming calculation.
  const projectionLight = new THREE.SpotLight(0xffefbd, 0, 18, 0.22, 0.42, 1.25)
  projectionLight.position.set(-1.08, 0.49, 0.01)
  projectionLight.target.position.set(-8, 0.49, 0.01)
  projectionLight.castShadow = true
  projectionLight.shadow.mapSize.set(512, 512)
  projectionLight.shadow.bias = -0.0003
  group.add(projectionLight, projectionLight.target)

  const lensFill = new THREE.PointLight(0xffd58c, 0, 1.8, 2)
  lensFill.position.set(-1.08, 0.49, 0.01)
  group.add(lensFill)

  scene.add(group)
  return { reels, projectionLight, lensFill, lensMaterial }
}

const createProjectionScreen = (scene: THREE.Scene) => {
  const width = WORLD.map.width + 0.42
  const height = WORLD.map.height + 0.38
  const topY = Math.min(WORLD.wallHeight - 0.55, WORLD.map.y + WORLD.map.height / 2 + 0.55)
  const z = WORLD.map.z + 0.32
  const group = new THREE.Group()
  group.position.set(WORLD.map.x, topY, z)

  const housingMaterial = makeMaterial(0x6f716b, 0.74); housingMaterial.flatShading = true
  const screenMaterial = new THREE.MeshStandardMaterial({
    color: 0xf0eee3,
    roughness: 0.96,
    metalness: 0,
    side: THREE.DoubleSide,
  })

  // Permanent ceiling roller/cassette. The cloth itself is translated so its
  // local origin sits at the top edge; scaling Y therefore unrolls it downward
  // rather than expanding from the centre.
  group.add(cylinder(0.13, width + 0.34, [0, 0, 0], housingMaterial, 12, [0, 0, Math.PI / 2]))
  group.add(cylinder(0.17, 0.08, [-width / 2 - 0.17, 0, 0], materials.metalDark, 10, [0, 0, Math.PI / 2]))
  group.add(cylinder(0.17, 0.08, [width / 2 + 0.17, 0, 0], materials.metalDark, 10, [0, 0, Math.PI / 2]))

  const panelGeometry = new THREE.PlaneGeometry(width, height)
  panelGeometry.translate(0, -height / 2, 0)
  const panel = new THREE.Mesh(panelGeometry, screenMaterial)
  panel.position.z = 0.035
  panel.scale.y = 0.001
  panel.castShadow = true
  panel.receiveShadow = true
  group.add(panel)

  const bottomBar = box([width + 0.08, 0.075, 0.075], [0, -0.04, 0.055], housingMaterial)
  bottomBar.visible = false
  group.add(bottomBar)
  scene.add(group)

  const setProgress = (value: number) => {
    const progress = THREE.MathUtils.clamp(value, 0, 1)
    panel.scale.y = Math.max(progress, 0.001)
    bottomBar.position.y = -height * progress
    bottomBar.visible = progress > 0.015
  }

  return { setProgress }
}

const createPendant ="""
if old not in text:
    raise SystemExit('projector return insertion point not found')
text = text.replace(old, new, 1)

# Create both interactive projector pieces and expose them to the main loop.
old = """const createScene = (scene: THREE.Scene, camera: THREE.PerspectiveCamera) => {
  const updateClock = createRoomShell(scene); createTable(scene); createRadioDesk(scene); createMapBoard(scene); createProjector(scene); createPaperCluster(scene); createFolders(scene); const fanSpinner = createWallFan(scene)
"""
new = """const createScene = (scene: THREE.Scene, camera: THREE.PerspectiveCamera) => {
  const updateClock = createRoomShell(scene); createTable(scene); createRadioDesk(scene); createMapBoard(scene); const projector = createProjector(scene); const projectionScreen = createProjectionScreen(scene); createPaperCluster(scene); createFolders(scene); const fanSpinner = createWallFan(scene)
"""
if old not in text:
    raise SystemExit('createScene projector line not found')
text = text.replace(old, new, 1)

old = """  return { hotspots, hoverTargets, boardDraw, fanSpinner, updateClock }
}
"""
new = """  return { hotspots, hoverTargets, boardDraw, fanSpinner, updateClock, projector, projectionScreen }
}
"""
if old not in text:
    raise SystemExit('createScene return block not found')
text = text.replace(old, new, 1)

old = """  const { hotspots, hoverTargets, boardDraw, fanSpinner, updateClock } = createScene(scene, camera)
"""
new = """  const { hotspots, hoverTargets, boardDraw, fanSpinner, updateClock, projector, projectionScreen } = createScene(scene, camera)
"""
if old not in text:
    raise SystemExit('mount createScene destructure not found')
text = text.replace(old, new, 1)

# Add projector/screen runtime state.
old = """  let activeId: SectionId = 'work'; let frame = 0; let disposed = false
  let lastTime = performance.now()
  let viewMode: 'home' | 'transition' | 'map' = 'home'
"""
new = """  let activeId: SectionId = 'work'; let frame = 0; let disposed = false
  let lastTime = performance.now()
  let projectorActive = false
  let projectorScreenProgress = 0
  let viewMode: 'home' | 'transition' | 'map' = 'home'
"""
if old not in text:
    raise SystemExit('runtime state block not found')
text = text.replace(old, new, 1)

# Insert activation helper before pointer click handling.
old = """  const onPointerUp = (event: PointerEvent) => {
    if (viewMode !== 'home') return
    updatePointer(event)
    hoverRaycaster.setFromCamera(pointer, camera)
    const hit = hoverRaycaster.intersectObjects(hoverTargets.map((target) => target.mesh), false)[0]?.object
    const target = hoverTargets.find((candidate) => candidate.mesh === hit)
    if (target?.id === 'map') startMapDolly()
  }
"""
new = """  const setProjectorActive = (active: boolean) => {
    projectorActive = active
    if (reducedMotion.matches) {
      projectorScreenProgress = active ? 1 : 0
      projectionScreen.setProgress(projectorScreenProgress)
      projector.projectionLight.intensity = active ? 7.5 : 0
      projector.lensFill.intensity = active ? 1.6 : 0
      projector.lensMaterial.emissiveIntensity = active ? 3.6 : 0.08
    }
  }
  const onPointerUp = (event: PointerEvent) => {
    if (viewMode !== 'home') return
    updatePointer(event)
    hoverRaycaster.setFromCamera(pointer, camera)
    const hit = hoverRaycaster.intersectObjects(hoverTargets.map((target) => target.mesh), false)[0]?.object
    const target = hoverTargets.find((candidate) => candidate.mesh === hit)
    if (!target) return

    if (target.id === 'projector') {
      setProjectorActive(true)
      return
    }

    // Any other menu selection retracts the screen and powers the projector off.
    setProjectorActive(false)
    if (target.id === 'map') startMapDolly()
  }
"""
if old not in text:
    raise SystemExit('pointerup block not found')
text = text.replace(old, new, 1)

# Reset also powers the projector down.
old = """  const resetView = () => {
    cameraTransition = null
    viewMode = 'home'
"""
new = """  const resetView = () => {
    cameraTransition = null
    viewMode = 'home'
    setProjectorActive(false)
"""
if old not in text:
    raise SystemExit('resetView block not found')
text = text.replace(old, new, 1)

# Animate screen, lamp and reel motion every frame.
old = """    if (!reducedMotion.matches) fanSpinner.rotation.z -= dt * FAN_SPEED
    updateClock()

    if (cameraTransition) {
"""
new = """    if (!reducedMotion.matches) fanSpinner.rotation.z -= dt * FAN_SPEED
    updateClock()

    const projectorTarget = projectorActive ? 1 : 0
    if (reducedMotion.matches) {
      projectorScreenProgress = projectorTarget
    } else {
      const response = projectorActive ? 4.3 : 5.6
      projectorScreenProgress = THREE.MathUtils.damp(projectorScreenProgress, projectorTarget, response, dt)
      if (Math.abs(projectorScreenProgress - projectorTarget) < 0.001) projectorScreenProgress = projectorTarget
    }
    projectionScreen.setProgress(projectorScreenProgress)

    projector.projectionLight.intensity = THREE.MathUtils.damp(
      projector.projectionLight.intensity,
      projectorActive ? 7.5 : 0,
      projectorActive ? 8 : 12,
      dt,
    )
    projector.lensFill.intensity = THREE.MathUtils.damp(
      projector.lensFill.intensity,
      projectorActive ? 1.6 : 0,
      projectorActive ? 9 : 13,
      dt,
    )
    projector.lensMaterial.emissiveIntensity = THREE.MathUtils.damp(
      projector.lensMaterial.emissiveIntensity,
      projectorActive ? 3.6 : 0.08,
      projectorActive ? 9 : 12,
      dt,
    )
    if (projectorActive && !reducedMotion.matches) {
      projector.reels[0].rotation.z -= dt * 4.5
      projector.reels[1].rotation.z += dt * 3.9
    }

    if (cameraTransition) {
"""
if old not in text:
    raise SystemExit('render animation insertion point not found')
text = text.replace(old, new, 1)

path.write_text(text)
